import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { parsePublicConfig } from "./public-config.js";
import { ConnectAuthError } from "./types.js";
import { expectedConnectAuthIssuers, publicConfigUrl } from "./urls.js";

const SAMPLE_PUBLIC_CONFIG = {
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

describe("public-config", () => {
  it("builds the public-config URL", () => {
    assert.equal(
      publicConfigUrl("demo-listing", "https://api.example.com"),
      "https://api.example.com/connect-auth/tenants/demo-listing/public-config",
    );
  });

  it("parses a valid public-config payload", () => {
    const config = parsePublicConfig(SAMPLE_PUBLIC_CONFIG, "demo-listing");
    assert.equal(config.listing_slug, "demo-listing");
    assert.equal(config.telemetry_ingest_url, SAMPLE_PUBLIC_CONFIG.telemetry_ingest_url);
  });

  it("rejects invalid public-config payloads", () => {
    assert.throws(
      () => parsePublicConfig({ issuer: "x" }, "demo-listing"),
      (error: unknown) =>
        error instanceof ConnectAuthError && error.code === "invalid_public_config",
    );
  });

  it("expectedConnectAuthIssuers accepts trailing-slash variants", () => {
    const issuer = "https://api.example.com/connect-auth/tenants/demo-listing";
    assert.deepEqual(expectedConnectAuthIssuers(issuer), [
      issuer,
      `${issuer}/`,
    ]);
    assert.deepEqual(expectedConnectAuthIssuers(`${issuer}/`), [`${issuer}/`, issuer]);
  });
});
