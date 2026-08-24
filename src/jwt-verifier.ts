import {
  createRemoteJWKSet,
  customFetch,
  jwtVerify,
  type JWTVerifyGetKey,
  type JWTVerifyOptions,
} from "jose";

import {
  ConnectAuthError,
  type PublicConfig,
  type VerifiedAccessToken,
} from "./types.js";
import { expectedConnectAuthIssuers } from "./urls.js";

function parseScopes(rawScope: unknown): string[] {
  if (typeof rawScope !== "string" || rawScope.trim().length === 0) {
    return [];
  }
  return rawScope.split(/\s+/).filter(Boolean);
}

function hasRequiredScopes(tokenScopes: string[], requiredScopes: string[]): boolean {
  if (requiredScopes.length === 0) {
    return true;
  }
  const scopeSet = new Set(tokenScopes);
  return requiredScopes.every((scope) => scopeSet.has(scope));
}

export interface ConnectAuthJwtVerifierOptions {
  publicConfig: PublicConfig;
  requiredScopes?: string[];
  fetch?: typeof globalThis.fetch;
}

export class ConnectAuthJwtVerifier {
  private readonly publicConfig: PublicConfig;
  private readonly requiredScopes: string[];
  private readonly fetchFn: typeof globalThis.fetch;
  private jwks: JWTVerifyGetKey;
  private jwksUri: string;

  constructor(options: ConnectAuthJwtVerifierOptions) {
    this.publicConfig = options.publicConfig;
    this.requiredScopes = options.requiredScopes ?? [];
    this.fetchFn = options.fetch ?? globalThis.fetch;
    this.jwksUri = options.publicConfig.jwks_uri;
    this.jwks = createRemoteJWKSet(new URL(this.jwksUri), {
      [customFetch]: this.fetchFn,
    });
  }

  private verifyOptions(): JWTVerifyOptions {
    return {
      issuer: expectedConnectAuthIssuers(this.publicConfig.issuer),
      audience: [
        this.publicConfig.origin_resource,
        this.publicConfig.bundle_proxy_resource,
      ],
      algorithms: ["ES256"],
    };
  }

  private async refreshJwks(): Promise<void> {
    this.jwksUri = this.publicConfig.jwks_uri;
    this.jwks = createRemoteJWKSet(new URL(this.jwksUri), {
      [customFetch]: this.fetchFn,
    });
  }

  async verifyAccessToken(token: string): Promise<VerifiedAccessToken | null> {
    let payload;
    try {
      ({ payload } = await jwtVerify(token, this.jwks, this.verifyOptions()));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (message.includes("no applicable key") || message.includes("unknown kid")) {
        await this.refreshJwks();
        try {
          ({ payload } = await jwtVerify(token, this.jwks, this.verifyOptions()));
        } catch {
          return null;
        }
      } else {
        return null;
      }
    }

    const clientId =
      typeof payload.client_id === "string" ? payload.client_id.trim() : "";
    const subject = typeof payload.sub === "string" ? payload.sub : null;

    if (!clientId || !subject) {
      return null;
    }

    const scopes = parseScopes(payload.scope);
    if (!hasRequiredScopes(scopes, this.requiredScopes)) {
      return null;
    }

    const organizationId =
      typeof payload.organization_id === "string" ? payload.organization_id : undefined;
    const email = typeof payload.email === "string" ? payload.email : undefined;
    const roles = Array.isArray(payload.roles)
      ? payload.roles.filter(
          (role: unknown): role is string => typeof role === "string",
        )
      : undefined;

    return {
      token,
      clientId,
      subject,
      scopes,
      organizationId,
      email,
      roles,
      audience: payload.aud ?? [],
      issuer: typeof payload.iss === "string" ? payload.iss : this.publicConfig.issuer,
      expiresAt: typeof payload.exp === "number" ? payload.exp : undefined,
      rawClaims: payload as Record<string, unknown>,
    };
  }
}

export async function createJwtVerifier(
  options: ConnectAuthJwtVerifierOptions,
): Promise<ConnectAuthJwtVerifier> {
  if (!options.publicConfig.jwks_uri) {
    throw new ConnectAuthError("public-config missing jwks_uri", {
      code: "invalid_public_config",
    });
  }
  return new ConnectAuthJwtVerifier(options);
}
