import type { ProtectedResourceMetadata, PublicConfig } from "./types.js";
import {
  authorizationServerMetadataUrl,
  joinResourceUrl,
  protectedResourceMetadataUrl,
  requestPathname,
} from "./urls.js";

export function buildProtectedResourceMetadata(
  publicConfig: PublicConfig,
  resourceBaseUrl: string,
  mcpPath?: string,
  options?: {
    resourceName?: string;
    resourceDocumentation?: string;
  },
): ProtectedResourceMetadata {
  const metadata: ProtectedResourceMetadata = {
    resource: joinResourceUrl(resourceBaseUrl, mcpPath),
    authorization_servers: [publicConfig.authorization_server],
    bearer_methods_supported: ["header"],
  };

  if (publicConfig.scopes_supported.length > 0) {
    metadata.scopes_supported = publicConfig.scopes_supported;
  }
  if (options?.resourceName) {
    metadata.resource_name = options.resourceName;
  }
  if (options?.resourceDocumentation) {
    metadata.resource_documentation = options.resourceDocumentation;
  }

  return metadata;
}

export function isProtectedResourceMetadataRequest(
  requestUrl: string,
  resourceBaseUrl: string,
  mcpPath?: string,
): boolean {
  const pathname = requestPathname(requestUrl);
  const canonical = new URL(
    protectedResourceMetadataUrl(resourceBaseUrl, mcpPath),
  ).pathname;

  const altPaths = [
    "/.well-known/oauth-protected-resource",
    mcpPath && mcpPath !== "/"
      ? `/.well-known/oauth-protected-resource${mcpPath.startsWith("/") ? mcpPath : `/${mcpPath}`}`
      : null,
  ].filter((value): value is string => value !== null);

  return pathname === canonical || altPaths.includes(pathname);
}

export function isAuthorizationServerMetadataRequest(
  requestUrl: string,
  listingSlug: string,
  apiBaseUrl?: string,
): boolean {
  const pathname = requestPathname(requestUrl);
  const canonical = new URL(
    authorizationServerMetadataUrl(listingSlug, apiBaseUrl),
  ).pathname;
  return (
    pathname === "/.well-known/oauth-authorization-server" ||
    pathname === canonical
  );
}

export function unauthorizedResponse(metadataUrl: string): Response {
  return new Response(
    JSON.stringify({
      error: "unauthorized",
      message: "Authentication required (Bearer token)",
      resource_metadata: metadataUrl,
    }),
    {
      status: 401,
      headers: {
        "Content-Type": "application/json",
        "WWW-Authenticate": 'Bearer realm="MCP", error="invalid_token"',
        Link: `<${metadataUrl}>; rel="oauth-protected-resource"`,
      },
    },
  );
}

export function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function extractBearerToken(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header);
  if (!match) {
    return null;
  }
  const token = match[1].trim();
  return token.length > 0 ? token : null;
}

export function isMcpPathRequest(requestUrl: string, mcpPath: string): boolean {
  const pathname = requestPathname(requestUrl);
  const normalizedPath = mcpPath.startsWith("/") ? mcpPath : `/${mcpPath}`;
  return pathname === normalizedPath || pathname.startsWith(`${normalizedPath}/`);
}
