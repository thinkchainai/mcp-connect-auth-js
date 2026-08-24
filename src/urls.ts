import { DEFAULT_API_BASE_URL } from "./constants.js";

export function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, "");
}

export function resolveApiBaseUrl(apiBaseUrl?: string): string {
  return normalizeBaseUrl(apiBaseUrl ?? DEFAULT_API_BASE_URL);
}

export function tenantBaseUrl(listingSlug: string, apiBaseUrl?: string): string {
  return `${resolveApiBaseUrl(apiBaseUrl)}/connect-auth/tenants/${encodeURIComponent(listingSlug)}`;
}

export function publicConfigUrl(listingSlug: string, apiBaseUrl?: string): string {
  return `${tenantBaseUrl(listingSlug, apiBaseUrl)}/public-config`;
}

export function federationCompleteUrl(listingSlug: string, apiBaseUrl?: string): string {
  return `${tenantBaseUrl(listingSlug, apiBaseUrl)}/v1/federation/complete`;
}

export function authorizationServerMetadataUrl(
  listingSlug: string,
  apiBaseUrl?: string,
): string {
  return `${tenantBaseUrl(listingSlug, apiBaseUrl)}/.well-known/oauth-authorization-server`;
}

export function protectedResourceMetadataUrl(
  resourceBaseUrl: string,
  mcpPath?: string,
): string {
  const base = normalizeBaseUrl(resourceBaseUrl);
  if (!mcpPath || mcpPath === "/") {
    return `${base}/.well-known/oauth-protected-resource`;
  }
  const path = mcpPath.startsWith("/") ? mcpPath : `/${mcpPath}`;
  return `${base}${path}/.well-known/oauth-protected-resource`;
}

export function joinResourceUrl(resourceBaseUrl: string, mcpPath?: string): string {
  const base = normalizeBaseUrl(resourceBaseUrl);
  if (!mcpPath || mcpPath === "/") {
    return base;
  }
  const path = mcpPath.startsWith("/") ? mcpPath : `/${mcpPath}`;
  return `${base}${path}`;
}

export function requestPathname(url: string): string {
  return new URL(url).pathname;
}

export function expectedConnectAuthIssuers(issuer: string): string[] {
  const normalized = issuer.replace(/\/+$/, "");
  if (normalized === issuer) {
    return [issuer, `${issuer}/`];
  }
  return [issuer, normalized];
}
