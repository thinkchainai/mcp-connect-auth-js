import { createConnectAuthMiddleware } from "./middleware/connect-auth.js";
import { createHandshakeTelemetryHook } from "./middleware/handshake.js";
import type { CreateMcpbundlesServerOptions, McpbundlesServer } from "./types.js";

/**
 * Factory helper with parity to Python `mcpbundles_fastmcp()`:
 * loads public-config, wires Connect Auth HTTP middleware, and optional
 * initialize handshake telemetry when enabled in public-config.
 */
export async function createMcpbundlesServer(
  options: CreateMcpbundlesServerOptions,
): Promise<McpbundlesServer> {
  const connectAuth = createConnectAuthMiddleware({
    listingSlug: options.listingSlug,
    baseUrl: options.baseUrl,
    mcpPath: options.mcpPath,
    requiredScopes: options.requiredScopes,
    apiBaseUrl: options.apiBaseUrl,
    fetch: options.fetch,
  });

  const publicConfig = await connectAuth.publicConfig;

  const enableTelemetry = options.enableHandshakeTelemetry ?? true;
  const onInitialize =
    enableTelemetry
      ? createHandshakeTelemetryHook({
          listingSlug: options.listingSlug,
          publicConfig,
          fetch: options.fetch,
        })
      : undefined;

  return {
    publicConfig: Promise.resolve(publicConfig),
    connectAuth,
    onInitialize,
  };
}

/** Alias matching Python naming style. */
export const mcpbundlesMcpServer = createMcpbundlesServer;
