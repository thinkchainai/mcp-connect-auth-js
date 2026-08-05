import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { connectAuthCallbackIdentity } from "./identity.js";
import type { VerifiedAccessToken } from "./types.js";

describe("connectAuthCallbackIdentity", () => {
  it("maps verified tokens to the canonical get-user-info shape", () => {
    const token: VerifiedAccessToken = {
      token: "jwt",
      clientId: "mcp-client-1",
      subject: "user-1",
      scopes: ["read", "write"],
      organizationId: "org-1",
      email: "builder@example.test",
      roles: ["admin", "editor"],
      audience: "https://mcp.example.com/mcp",
      issuer: "https://api.example.com/connect-auth/tenants/demo",
      expiresAt: 1_700_000_999,
      rawClaims: {
        sub: "user-1",
        organization_id: "org-1",
        email: "builder@example.test",
        roles: ["admin", "editor"],
        aud: "https://mcp.example.com/mcp",
      },
    };

    assert.deepEqual(connectAuthCallbackIdentity(token), {
      user: {
        id: "user-1",
        organizationId: "org-1",
        email: "builder@example.test",
        roles: ["admin", "editor"],
      },
      auth: {
        clientId: "mcp-client-1",
        scopes: ["read", "write"],
        expiresAt: 1_700_000_999,
        resource: "https://mcp.example.com/mcp",
      },
    });
  });

  it("uses null for omitted profile fields and empty roles", () => {
    const token: VerifiedAccessToken = {
      token: "jwt",
      clientId: "mcp-client-1",
      subject: "user-1",
      scopes: [],
      audience: ["https://mcp.example.com/mcp", "https://mcp.mcpbundles.com/bundle/demo"],
      issuer: "https://api.example.com/connect-auth/tenants/demo",
      rawClaims: { sub: "user-1" },
    };

    assert.deepEqual(connectAuthCallbackIdentity(token), {
      user: {
        id: "user-1",
        organizationId: null,
        email: null,
        roles: [],
      },
      auth: {
        clientId: "mcp-client-1",
        scopes: [],
        expiresAt: undefined,
        resource: "https://mcp.example.com/mcp",
      },
    });
  });
});
