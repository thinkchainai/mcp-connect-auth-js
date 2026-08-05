import type { ConnectAuthCallbackIdentity, VerifiedAccessToken } from "./types.js";

function resourceFromAudience(
  audience: VerifiedAccessToken["audience"],
): string | null {
  if (typeof audience === "string") {
    return audience;
  }
  if (Array.isArray(audience) && audience.length > 0) {
    const first = audience[0];
    return typeof first === "string" ? first : null;
  }
  return null;
}

function rolesFromToken(token: VerifiedAccessToken): string[] {
  if (Array.isArray(token.roles)) {
    return token.roles.filter((role): role is string => typeof role === "string");
  }
  const raw = token.rawClaims.roles;
  if (!Array.isArray(raw)) {
    return [];
  }
  return raw.filter((role): role is string => typeof role === "string");
}

/**
 * Build the canonical Connect Auth tool callback shape from a verified token.
 *
 * Matches the mcp-use `get-user-info` example and FastMCP
 * `connect_auth_callback_identity()`: identity on `user`, OAuth metadata on
 * `auth`. See the MCPBundles integration guide § Tool callback identity.
 */
export function connectAuthCallbackIdentity(
  token: VerifiedAccessToken,
): ConnectAuthCallbackIdentity {
  return {
    user: {
      id: token.subject,
      organizationId: token.organizationId ?? null,
      email: token.email ?? null,
      roles: rolesFromToken(token),
    },
    auth: {
      clientId: token.clientId,
      scopes: [...token.scopes],
      expiresAt: token.expiresAt,
      resource: resourceFromAudience(token.audience),
    },
  };
}
