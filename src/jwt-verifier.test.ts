import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

import { ConnectAuthJwtVerifier } from "./jwt-verifier.js";
import type { PublicConfig } from "./types.js";
import { expectedConnectAuthIssuers } from "./urls.js";

const PUBLIC_CONFIG: PublicConfig = {
  contract_version: "2026-07-29",
  listing_slug: "demo-listing",
  issuer: "https://api.example.com/connect-auth/tenants/demo-listing",
  jwks_uri: "https://api.example.com/connect-auth/tenants/demo-listing/.well-known/jwks.json",
  authorization_server:
    "https://api.example.com/connect-auth/tenants/demo-listing",
  origin_resource: "https://mcp.example.com/mcp",
  bundle_proxy_resource: "https://mcp.mcpbundles.com/bundle/demo-listing",
  scopes_supported: ["mcp:tools"],
};

describe("ConnectAuthJwtVerifier", () => {
  it("verifies ES256 access tokens against tenant JWKS", async () => {
    const { privateKey, publicKey } = await generateKeyPair("ES256");
    const publicJwk = await exportJWK(publicKey);
    publicJwk.kid = "test-key";
    publicJwk.alg = "ES256";
    publicJwk.use = "sig";

    const fetchMock: typeof fetch = async (input) => {
      if (String(input) === PUBLIC_CONFIG.jwks_uri) {
        return new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    };

    const token = await new SignJWT({
      scope: "mcp:tools",
      client_id: "client-1",
    })
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuer(PUBLIC_CONFIG.issuer)
      .setSubject("user-1")
      .setAudience(PUBLIC_CONFIG.origin_resource)
      .setExpirationTime("2h")
      .sign(privateKey);

    const verifier = new ConnectAuthJwtVerifier({
      publicConfig: PUBLIC_CONFIG,
      fetch: fetchMock,
    });

    const verified = await verifier.verifyAccessToken(token);
    assert.ok(verified);
    assert.equal(verified?.subject, "user-1");
    assert.equal(verified?.clientId, "client-1");
    assert.deepEqual(verified?.scopes, ["mcp:tools"]);
  });

  it("rejects tokens missing required scopes", async () => {
    const { privateKey, publicKey } = await generateKeyPair("ES256");
    const publicJwk = await exportJWK(publicKey);
    publicJwk.kid = "test-key";
    publicJwk.alg = "ES256";

    const fetchMock: typeof fetch = async () =>
      new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200 });

    const token = await new SignJWT({ scope: "other", client_id: "client-1" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuer(PUBLIC_CONFIG.issuer)
      .setSubject("user-1")
      .setAudience(PUBLIC_CONFIG.origin_resource)
      .setExpirationTime("2h")
      .sign(privateKey);

    const verifier = new ConnectAuthJwtVerifier({
      publicConfig: PUBLIC_CONFIG,
      requiredScopes: ["mcp:tools"],
      fetch: fetchMock,
    });

    const verified = await verifier.verifyAccessToken(token);
    assert.equal(verified, null);
  });

  it("rejects tokens missing client_id even when azp is present", async () => {
    const { privateKey, publicKey } = await generateKeyPair("ES256");
    const publicJwk = await exportJWK(publicKey);
    publicJwk.kid = "test-key";
    publicJwk.alg = "ES256";

    const fetchMock: typeof fetch = async () =>
      new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200 });

    const token = await new SignJWT({ scope: "mcp:tools", azp: "client-1" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuer(PUBLIC_CONFIG.issuer)
      .setSubject("user-1")
      .setAudience(PUBLIC_CONFIG.origin_resource)
      .setExpirationTime("2h")
      .sign(privateKey);

    const verifier = new ConnectAuthJwtVerifier({
      publicConfig: PUBLIC_CONFIG,
      fetch: fetchMock,
    });

    const verified = await verifier.verifyAccessToken(token);
    assert.equal(verified, null);
  });

  it("accepts issuer without trailing slash when public-config issuer has one", async () => {
    const publicConfig: PublicConfig = {
      ...PUBLIC_CONFIG,
      issuer: `${PUBLIC_CONFIG.issuer}/`,
    };
    const { privateKey, publicKey } = await generateKeyPair("ES256");
    const publicJwk = await exportJWK(publicKey);
    publicJwk.kid = "test-key";
    publicJwk.alg = "ES256";
    publicJwk.use = "sig";

    const fetchMock: typeof fetch = async () =>
      new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200 });

    const token = await new SignJWT({
      scope: "mcp:tools",
      client_id: "client-1",
    })
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuer(PUBLIC_CONFIG.issuer)
      .setSubject("user-1")
      .setAudience(PUBLIC_CONFIG.origin_resource)
      .setExpirationTime("2h")
      .sign(privateKey);

    const verifier = new ConnectAuthJwtVerifier({
      publicConfig,
      fetch: fetchMock,
    });

    const verified = await verifier.verifyAccessToken(token);
    assert.ok(verified);
    assert.deepEqual(
      expectedConnectAuthIssuers(publicConfig.issuer),
      [publicConfig.issuer, PUBLIC_CONFIG.issuer],
    );
  });
});
