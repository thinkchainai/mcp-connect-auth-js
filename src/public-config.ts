import { INTEGRATION_DOC_URL, PUBLIC_CONFIG_CONTRACT_VERSION } from "./constants.js";
import {
  ConnectAuthError,
  type FetchPublicConfigOptions,
  type PublicConfig,
} from "./types.js";
import { publicConfigUrl } from "./urls.js";

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

export function parsePublicConfig(payload: unknown, listingSlug: string): PublicConfig {
  if (!payload || typeof payload !== "object") {
    throw new ConnectAuthError("public-config response must be a JSON object", {
      code: "invalid_public_config",
    });
  }

  const record = payload as Record<string, unknown>;
  const requiredFields = [
    "issuer",
    "jwks_uri",
    "authorization_server",
    "origin_resource",
    "bundle_proxy_resource",
  ] as const;

  for (const field of requiredFields) {
    if (!isNonEmptyString(record[field])) {
      throw new ConnectAuthError(`public-config missing required field "${field}"`, {
        code: "invalid_public_config",
      });
    }
  }

  const scopes = record.scopes_supported;
  const scopesSupported = scopes === undefined ? [] : isStringArray(scopes) ? scopes : null;
  if (scopesSupported === null) {
    throw new ConnectAuthError("public-config scopes_supported must be a string array", {
      code: "invalid_public_config",
    });
  }

  const contractVersion = isNonEmptyString(record.contract_version)
    ? record.contract_version
    : PUBLIC_CONFIG_CONTRACT_VERSION;

  const resolvedListingSlug = isNonEmptyString(record.listing_slug)
    ? record.listing_slug
    : listingSlug;

  const config: PublicConfig = {
    contract_version: contractVersion,
    listing_slug: resolvedListingSlug,
    issuer: record.issuer as string,
    jwks_uri: record.jwks_uri as string,
    authorization_server: record.authorization_server as string,
    origin_resource: record.origin_resource as string,
    bundle_proxy_resource: record.bundle_proxy_resource as string,
    scopes_supported: scopesSupported,
  };

  if (isNonEmptyString(record.telemetry_ingest_url)) {
    config.telemetry_ingest_url = record.telemetry_ingest_url;
  }

  return config;
}

export async function fetchPublicConfig(
  options: FetchPublicConfigOptions,
): Promise<PublicConfig> {
  const fetchFn = options.fetch ?? globalThis.fetch;
  const url = publicConfigUrl(options.listingSlug, options.apiBaseUrl);

  let response: Response;
  try {
    response = await fetchFn(url, {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: options.signal,
    });
  } catch (error) {
    throw new ConnectAuthError(
      `Failed to fetch public-config for listing "${options.listingSlug}" from ${url}. See ${INTEGRATION_DOC_URL}`,
      { code: "public_config_fetch_failed", cause: error },
    );
  }

  if (!response.ok) {
    throw new ConnectAuthError(
      `public-config request failed (${response.status}) for listing "${options.listingSlug}" at ${url}. See ${INTEGRATION_DOC_URL}`,
      { code: "public_config_fetch_failed", status: response.status },
    );
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch (error) {
    throw new ConnectAuthError(
      `public-config response was not valid JSON for listing "${options.listingSlug}"`,
      { code: "invalid_public_config", cause: error },
    );
  }

  return parsePublicConfig(payload, options.listingSlug);
}
