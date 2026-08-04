import {
  ConnectAuthError,
  type CompleteFederationOptions,
  type CompleteFederationResult,
} from "./types.js";
import { federationCompleteUrl } from "./urls.js";

function assertFederationInput(options: CompleteFederationOptions): void {
  if (!options.federationSecret) {
    throw new ConnectAuthError("federationSecret is required", {
      code: "federation_invalid_input",
    });
  }
  if (!options.state) {
    throw new ConnectAuthError("state is required", {
      code: "federation_invalid_input",
    });
  }
  if (!options.subject) {
    throw new ConnectAuthError("subject is required", {
      code: "federation_invalid_input",
    });
  }
}

export async function completeFederation(
  options: CompleteFederationOptions,
): Promise<CompleteFederationResult> {
  assertFederationInput(options);

  const fetchFn = options.fetch ?? globalThis.fetch;
  const url = federationCompleteUrl(options.listingSlug, options.apiBaseUrl);

  const body: Record<string, string> = {
    state: options.state,
    subject: options.subject,
  };

  if (options.organizationId !== undefined) {
    body.organization_id = options.organizationId;
  }
  if (options.email !== undefined) {
    body.email = options.email;
  }

  let response: Response;
  try {
    response = await fetchFn(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${options.federationSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: options.signal,
    });
  } catch (error) {
    throw new ConnectAuthError("Federation complete request failed", {
      code: "federation_request_failed",
      cause: error,
    });
  }

  if (response.status === 401 || response.status === 403) {
    throw new ConnectAuthError("Federation secret rejected", {
      code: "federation_unauthorized",
      status: response.status,
    });
  }

  if (response.status === 404) {
    throw new ConnectAuthError("Federation state not found or expired", {
      code: "federation_state_not_found",
      status: response.status,
    });
  }

  if (response.status === 409) {
    throw new ConnectAuthError("Federation state conflict", {
      code: "federation_state_conflict",
      status: response.status,
    });
  }

  if (!response.ok) {
    let details: unknown;
    try {
      details = await response.json();
    } catch {
      details = undefined;
    }
    throw new ConnectAuthError("Federation complete request failed", {
      code: "federation_request_failed",
      status: response.status,
      details,
    });
  }

  return { ok: true, status: response.status };
}
