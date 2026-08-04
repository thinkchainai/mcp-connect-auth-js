import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { createMcpbundlesServer } from "./factory.js";
import {
  buildHandshakeIngestBody,
  createHandshakeTelemetryHook,
} from "./middleware/handshake.js";
import type { PublicConfig } from "./types.js";

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
  telemetry_ingest_url:
    "https://api.example.com/connect-auth/tenants/demo-listing/v1/telemetry/handshake",
};

describe("createMcpbundlesServer", () => {
  it("wires connect auth middleware and handshake telemetry", async () => {
    const fetchMock: typeof fetch = async (input) => {
      const url = String(input);
      if (url.endsWith("/public-config")) {
        return new Response(JSON.stringify(PUBLIC_CONFIG), { status: 200 });
      }
      if (url.endsWith("/v1/telemetry/handshake")) {
        return new Response(JSON.stringify({ ok: true }), { status: 202 });
      }
      return new Response("not found", { status: 404 });
    };

    const server = await createMcpbundlesServer({
      listingSlug: "demo-listing",
      baseUrl: "https://mcp.example.com",
      fetch: fetchMock,
    });

    const config = await server.publicConfig;
    assert.equal(config.listing_slug, "demo-listing");
    assert.ok(server.onInitialize);

    server.onInitialize?.({
      clientName: "Test Client",
      clientVersion: "1.0.0",
      protocolRequested: "2025-03-26",
      protocolNegotiated: "2025-03-26",
    });

    const metadataResponse = await server.connectAuth.handleRequest(
      new Request("https://mcp.example.com/mcp/.well-known/oauth-protected-resource"),
    );
    assert.equal(metadataResponse?.status, 200);
  });
});

describe("handshake telemetry", () => {
  it("builds ingest payloads and ignores network failures", async () => {
    const body = buildHandshakeIngestBody("demo-listing", {
      clientName: "x".repeat(300),
      clientVersion: "1.0.0",
    });
    assert.equal((body.client_name as string).length, 200);

    let called = false;
    const hook = createHandshakeTelemetryHook({
      listingSlug: "demo-listing",
      ingestUrl: "https://api.example.com/telemetry",
      fetch: async () => {
        called = true;
        throw new Error("network down");
      },
    });

    hook?.({ clientName: "Test Client" });
    await new Promise((resolve) => setTimeout(resolve, 10));
    assert.equal(called, true);
  });
});
