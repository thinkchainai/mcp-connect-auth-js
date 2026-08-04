import type {
  HandshakeTelemetryOptions,
  InitializeTelemetryPayload,
  PublicConfig,
} from "../types.js";

function truncate(value: string | undefined, maxLength: number): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value.length <= maxLength ? value : value.slice(0, maxLength);
}

export function buildHandshakeIngestBody(
  listingSlug: string,
  payload: InitializeTelemetryPayload,
): Record<string, unknown> {
  const body: Record<string, unknown> = {
    listing_slug: listingSlug,
  };

  const clientName = truncate(payload.clientName, 200);
  const clientVersion = truncate(payload.clientVersion, 200);
  if (clientName !== undefined) {
    body.client_name = clientName;
  }
  if (clientVersion !== undefined) {
    body.client_version = clientVersion;
  }
  if (payload.protocolRequested !== undefined) {
    body.protocol_requested = payload.protocolRequested;
  }
  if (payload.protocolNegotiated !== undefined) {
    body.protocol_negotiated = payload.protocolNegotiated;
  }
  if (payload.capabilities !== undefined) {
    body.capabilities = payload.capabilities;
  }
  if (payload.extensions !== undefined) {
    body.extensions = payload.extensions;
  }

  return body;
}

export function createHandshakeTelemetryHook(
  options: HandshakeTelemetryOptions & { publicConfig?: PublicConfig },
): ((payload: InitializeTelemetryPayload) => void) | undefined {
  const ingestUrl =
    options.ingestUrl ?? options.publicConfig?.telemetry_ingest_url;
  if (!ingestUrl) {
    return undefined;
  }

  const fetchFn = options.fetch ?? globalThis.fetch;

  return (payload: InitializeTelemetryPayload) => {
    const body = buildHandshakeIngestBody(options.listingSlug, payload);
    void fetchFn(ingestUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }).catch(() => {
      // Fire-and-forget: telemetry must never block MCP handling.
    });
  };
}

export function parseInitializeTelemetryPayload(
  initializeParams: Record<string, unknown>,
  protocolNegotiated?: string,
): InitializeTelemetryPayload {
  const clientInfo =
    initializeParams.clientInfo && typeof initializeParams.clientInfo === "object"
      ? (initializeParams.clientInfo as Record<string, unknown>)
      : undefined;

  const clientName =
    clientInfo && typeof clientInfo.name === "string" ? clientInfo.name : undefined;
  const clientVersion =
    clientInfo && typeof clientInfo.version === "string"
      ? clientInfo.version
      : undefined;

  const capabilities =
    initializeParams.capabilities &&
    typeof initializeParams.capabilities === "object"
      ? (initializeParams.capabilities as Record<string, unknown>)
      : undefined;

  return {
    clientName,
    clientVersion,
    protocolRequested:
      typeof initializeParams.protocolVersion === "string"
        ? initializeParams.protocolVersion
        : undefined,
    protocolNegotiated,
    capabilities,
  };
}
