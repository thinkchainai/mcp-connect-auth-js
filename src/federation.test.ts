import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { completeFederation } from "./federation.js";
import { ConnectAuthError } from "./types.js";
import { federationCompleteUrl } from "./urls.js";

describe("completeFederation", () => {
  it("posts federation completion with bearer secret", async () => {
    const url = federationCompleteUrl("demo-listing", "https://api.example.com");
    const calls: Array<{ url: string; init?: RequestInit }> = [];

    const fetchMock: typeof fetch = async (input, init) => {
      calls.push({ url: String(input), init });
      return new Response(JSON.stringify({ ok: true }), { status: 200 });
    };

    const result = await completeFederation({
      listingSlug: "demo-listing",
      federationSecret: "fed-secret",
      state: "state-123",
      subject: "user-456",
      organizationId: "org-789",
      email: "user@example.com",
      apiBaseUrl: "https://api.example.com",
      fetch: fetchMock,
    });

    assert.equal(result.ok, true);
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.url, url);
    assert.equal(calls[0]?.init?.method, "POST");
    const headers = new Headers(calls[0]?.init?.headers);
    assert.equal(headers.get("Authorization"), "Bearer fed-secret");

    const body = JSON.parse(String(calls[0]?.init?.body));
    assert.deepEqual(body, {
      state: "state-123",
      subject: "user-456",
      organization_id: "org-789",
      email: "user@example.com",
    });
  });

  it("maps unauthorized federation responses", async () => {
    const fetchMock: typeof fetch = async () => new Response("", { status: 401 });

    await assert.rejects(
      () =>
        completeFederation({
          listingSlug: "demo-listing",
          federationSecret: "bad-secret",
          state: "state-123",
          subject: "user-456",
          fetch: fetchMock,
        }),
      (error: unknown) =>
        error instanceof ConnectAuthError && error.code === "federation_unauthorized",
    );
  });

  it("rejects empty federationSecret, state, and subject", async () => {
    const fetchMock: typeof fetch = async () => {
      throw new Error("fetch should not be called for invalid input");
    };

    const base = {
      listingSlug: "demo-listing",
      federationSecret: "fed-secret",
      state: "state-123",
      subject: "user-456",
      fetch: fetchMock,
    };

    await assert.rejects(
      () => completeFederation({ ...base, federationSecret: "" }),
      (error: unknown) =>
        error instanceof ConnectAuthError && error.code === "federation_invalid_input",
    );

    await assert.rejects(
      () => completeFederation({ ...base, state: "" }),
      (error: unknown) =>
        error instanceof ConnectAuthError && error.code === "federation_invalid_input",
    );

    await assert.rejects(
      () => completeFederation({ ...base, subject: "" }),
      (error: unknown) =>
        error instanceof ConnectAuthError && error.code === "federation_invalid_input",
    );
  });
});
