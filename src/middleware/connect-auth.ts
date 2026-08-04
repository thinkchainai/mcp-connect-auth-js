import { fetchPublicConfig } from "../public-config.js";
import {
  buildProtectedResourceMetadata,
  extractBearerToken,
  isAuthorizationServerMetadataRequest,
  isMcpPathRequest,
  isProtectedResourceMetadataRequest,
  jsonResponse,
  unauthorizedResponse,
} from "../protected-resource.js";
import { createJwtVerifier } from "../jwt-verifier.js";
import type {
  ConnectAuthMiddleware,
  ConnectAuthMiddlewareOptions,
  PublicConfig,
  VerifiedAccessToken,
} from "../types.js";
import {
  authorizationServerMetadataUrl,
  normalizeBaseUrl,
  protectedResourceMetadataUrl,
} from "../urls.js";

export const CONNECT_AUTH_TOKEN_SYMBOL = Symbol.for(
  "mcpbundles.connectAuth.verifiedAccessToken",
);

export function getVerifiedAccessToken(
  request: Request,
): VerifiedAccessToken | undefined {
  return (request as Request & { [CONNECT_AUTH_TOKEN_SYMBOL]?: VerifiedAccessToken })[
    CONNECT_AUTH_TOKEN_SYMBOL
  ];
}

function attachVerifiedAccessToken(
  request: Request,
  token: VerifiedAccessToken,
): Request {
  (request as Request & { [CONNECT_AUTH_TOKEN_SYMBOL]?: VerifiedAccessToken })[
    CONNECT_AUTH_TOKEN_SYMBOL
  ] = token;
  return request;
}

export function createConnectAuthMiddleware(
  options: ConnectAuthMiddlewareOptions,
): ConnectAuthMiddleware {
  const resourceBaseUrl = normalizeBaseUrl(options.baseUrl);
  const mcpPath = options.mcpPath ?? "/mcp";
  const fetchFn = options.fetch ?? globalThis.fetch;

  let configPromise: Promise<PublicConfig> | undefined = options.publicConfig
    ? Promise.resolve(options.publicConfig)
    : undefined;

  const loadPublicConfig = (): Promise<PublicConfig> => {
    configPromise ??= fetchPublicConfig({
      listingSlug: options.listingSlug,
      apiBaseUrl: options.apiBaseUrl,
      fetch: fetchFn,
    });
    return configPromise;
  };

  let verifierPromise: ReturnType<typeof createJwtVerifier> | null = null;

  const loadVerifier = async () => {
    if (!verifierPromise) {
      const publicConfig = await loadPublicConfig();
      verifierPromise = createJwtVerifier({
        publicConfig,
        requiredScopes: options.requiredScopes,
        fetch: fetchFn,
      });
    }
    return verifierPromise;
  };

  const verifyAccessToken = async (token: string): Promise<VerifiedAccessToken | null> => {
    const verifier = await loadVerifier();
    return verifier.verifyAccessToken(token);
  };

  const handleRequest = async (request: Request): Promise<Response | null> => {
    const publicConfig = await loadPublicConfig();

    if (isProtectedResourceMetadataRequest(request.url, resourceBaseUrl, mcpPath)) {
      return jsonResponse(
        buildProtectedResourceMetadata(publicConfig, resourceBaseUrl, mcpPath),
      );
    }

    if (
      isAuthorizationServerMetadataRequest(
        request.url,
        options.listingSlug,
        options.apiBaseUrl,
      )
    ) {
      const metadataUrl = authorizationServerMetadataUrl(
        options.listingSlug,
        options.apiBaseUrl,
      );
      const response = await fetchFn(metadataUrl, {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) {
        return jsonResponse(
          {
            error: "server_error",
            error_description: `Failed to fetch authorization server metadata (${response.status})`,
          },
          500,
        );
      }
      const metadata = await response.json();
      return jsonResponse(metadata, response.status);
    }

    if (!isMcpPathRequest(request.url, mcpPath)) {
      return null;
    }

    const metadataUrl = protectedResourceMetadataUrl(resourceBaseUrl, mcpPath);
    const bearerToken = extractBearerToken(request);
    if (!bearerToken) {
      return unauthorizedResponse(metadataUrl);
    }

    const verified = await verifyAccessToken(bearerToken);
    if (!verified) {
      return unauthorizedResponse(metadataUrl);
    }

    attachVerifiedAccessToken(request, verified);
    return null;
  };

  return {
    publicConfig: loadPublicConfig(),
    handleRequest,
    verifyAccessToken,
  };
}
