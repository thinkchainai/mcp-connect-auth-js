import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

import { createConnectAuthMiddleware } from "../middleware/connect-auth.js";
import type { PublicConfig } from "../types.js";

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

describe("createConnectAuthMiddleware", () => {
  it("serves protected resource metadata", async () => {
    const middleware = createConnectAuthMiddleware({
      listingSlug: "demo-listing",
      baseUrl: "https://mcp.example.com",
      mcpPath: "/mcp",
      publicConfig: PUBLIC_CONFIG,
    });

    const response = await middleware.handleRequest(
      new Request("https://mcp.example.com/mcp/.well-known/oauth-protected-resource"),
    );

    assert.ok(response);
    assert.equal(response?.status, 200);
    const body = await response?.json();
    assert.equal(body.resource, "https://mcp.example.com/mcp");
    assert.deepEqual(body.authorization_servers, [PUBLIC_CONFIG.authorization_server]);
  });

  it("returns 401 for unauthenticated MCP requests", async () => {
    const middleware = createConnectAuthMiddleware({
      listingSlug: "demo-listing",
      baseUrl: "https://mcp.example.com",
      mcpPath: "/mcp",
      publicConfig: PUBLIC_CONFIG,
    });

    const response = await middleware.handleRequest(
      new Request("https://mcp.example.com/mcp", { method: "POST" }),
    );

    assert.ok(response);
    assert.equal(response?.status, 401);
    assert.match(response?.headers.get("WWW-Authenticate") ?? "", /Bearer/);
  });

  it("allows authenticated MCP requests through", async () => {
    const { privateKey, publicKey } = await generateKeyPair("ES256");
    const publicJwk = await exportJWK(publicKey);
    publicJwk.kid = "test-key";
    publicJwk.alg = "ES256";

    const fetchMock: typeof fetch = async (input) => {
      if (String(input) === PUBLIC_CONFIG.jwks_uri) {
        return new Response(JSON.stringify({ keys: [publicJwk] }), { status: 200 });
      }
      return new Response("not found", { status: 404 });
    };

    const token = await new SignJWT({ scope: "mcp:tools", client_id: "client-1" })
      .setProtectedHeader({ alg: "ES256", kid: "test-key" })
      .setIssuer(PUBLIC_CONFIG.issuer)
      .setSubject("user-1")
      .setAudience(PUBLIC_CONFIG.origin_resource)
      .setExpirationTime("2h")
      .sign(privateKey);

    const middleware = createConnectAuthMiddleware({
      listingSlug: "demo-listing",
      baseUrl: "https://mcp.example.com",
      mcpPath: "/mcp",
      publicConfig: PUBLIC_CONFIG,
      fetch: fetchMock,
    });

    const request = new Request("https://mcp.example.com/mcp", {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const response = await middleware.handleRequest(request);
    assert.equal(response, null);
    const verified = await middleware.verifyAccessToken(token);
    assert.equal(verified?.subject, "user-1");
  });
});
