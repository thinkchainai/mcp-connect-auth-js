export { VERSION, DEFAULT_API_BASE_URL, INTEGRATION_DOC_URL } from "./constants.js";

export { completeFederation } from "./federation.js";
export { connectAuthCallbackIdentity } from "./identity.js";
export { fetchPublicConfig, parsePublicConfig } from "./public-config.js";
export { createMcpbundlesServer, mcpbundlesMcpServer } from "./factory.js";
export { ConnectAuthJwtVerifier, createJwtVerifier } from "./jwt-verifier.js";
export {
  buildProtectedResourceMetadata,
  extractBearerToken,
  isMcpPathRequest,
  isProtectedResourceMetadataRequest,
  unauthorizedResponse,
} from "./protected-resource.js";
export {
  CONNECT_AUTH_TOKEN_SYMBOL,
  createConnectAuthMiddleware,
  getVerifiedAccessToken,
} from "./middleware/connect-auth.js";
export {
  buildHandshakeIngestBody,
  createHandshakeTelemetryHook,
  parseInitializeTelemetryPayload,
} from "./middleware/handshake.js";

export type {
  CompleteFederationOptions,
  CompleteFederationResult,
  ConnectAuthCallbackIdentity,
  ConnectAuthMiddleware,
  ConnectAuthMiddlewareOptions,
  CreateMcpbundlesServerOptions,
  FetchPublicConfigOptions,
  HandshakeTelemetryOptions,
  InitializeTelemetryPayload,
  McpbundlesServer,
  ProtectedResourceMetadata,
  PublicConfig,
  VerifiedAccessToken,
} from "./types.js";
export { ConnectAuthError } from "./types.js";

export {
  authorizationServerMetadataUrl,
  federationCompleteUrl,
  joinResourceUrl,
  normalizeBaseUrl,
  protectedResourceMetadataUrl,
  publicConfigUrl,
  tenantBaseUrl,
} from "./urls.js";
