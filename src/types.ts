/** Tenant public-config returned by MCP Connect Auth (no secrets). */
export interface PublicConfig {
  contract_version: string;
  listing_slug: string;
  issuer: string;
  jwks_uri: string;
  authorization_server: string;
  origin_resource: string;
  bundle_proxy_resource: string;
  scopes_supported: string[];
  telemetry_ingest_url?: string;
}

/** Verified Connect Auth access token claims exposed to application code. */
export interface VerifiedAccessToken {
  token: string;
  clientId: string;
  subject: string;
  scopes: string[];
  organizationId?: string;
  email?: string;
  roles?: string[];
  audience: string | string[];
  issuer: string;
  expiresAt?: number;
  rawClaims: Record<string, unknown>;
}

/** Canonical Connect Auth tool callback payload (`get-user-info` shape). */
export interface ConnectAuthCallbackIdentity {
  user: {
    id: string;
    organizationId: string | null;
    email: string | null;
    roles: string[];
  };
  auth: {
    clientId: string;
    scopes: string[];
    expiresAt?: number;
    resource: string | null;
  };
}

export interface FetchPublicConfigOptions {
  listingSlug: string;
  apiBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
  signal?: AbortSignal;
}

export interface CompleteFederationOptions {
  listingSlug: string;
  federationSecret: string;
  state: string;
  subject: string;
  organizationId?: string;
  email?: string;
  roles?: string[];
  apiBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
  signal?: AbortSignal;
}

export interface CompleteFederationResult {
  ok: true;
  status: number;
}

export interface ConnectAuthMiddlewareOptions {
  listingSlug: string;
  baseUrl: string;
  mcpPath?: string;
  requiredScopes?: string[];
  apiBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
  /** Preloaded public-config; fetched on first use when omitted. */
  publicConfig?: PublicConfig;
}

export interface ConnectAuthMiddleware {
  publicConfig: Promise<PublicConfig>;
  handleRequest: (request: Request) => Promise<Response | null>;
  verifyAccessToken: (token: string) => Promise<VerifiedAccessToken | null>;
}

export interface InitializeTelemetryPayload {
  clientName?: string;
  clientVersion?: string;
  protocolRequested?: string;
  protocolNegotiated?: string;
  capabilities?: Record<string, unknown>;
  extensions?: Record<string, unknown>;
}

export interface HandshakeTelemetryOptions {
  listingSlug: string;
  ingestUrl?: string;
  fetch?: typeof globalThis.fetch;
}

export interface CreateMcpbundlesServerOptions {
  listingSlug: string;
  baseUrl: string;
  mcpPath?: string;
  requiredScopes?: string[];
  apiBaseUrl?: string;
  fetch?: typeof globalThis.fetch;
  enableHandshakeTelemetry?: boolean;
}

export interface McpbundlesServer {
  publicConfig: Promise<PublicConfig>;
  connectAuth: ConnectAuthMiddleware;
  onInitialize?: (payload: InitializeTelemetryPayload) => void;
}

export interface ProtectedResourceMetadata {
  resource: string;
  authorization_servers: string[];
  scopes_supported?: string[];
  bearer_methods_supported: string[];
  resource_name?: string;
  resource_documentation?: string;
}

export class ConnectAuthError extends Error {
  readonly code: string;
  readonly status?: number;
  readonly details?: unknown;

  constructor(
    message: string,
    options: { code: string; status?: number; details?: unknown; cause?: unknown } ,
  ) {
    super(message, { cause: options.cause });
    this.name = "ConnectAuthError";
    this.code = options.code;
    this.status = options.status;
    this.details = options.details;
  }
}
