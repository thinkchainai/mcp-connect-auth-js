# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.3] - 2026-08-24

### Fixed

- `ConnectAuthJwtVerifier` accepts tenant issuer tokens with or without a trailing slash (dual-issuer list aligned with PyPI `mcpbundles-mcp-connect` 0.1.3 and upstream P7 fork).

## [0.1.2] - 2026-08-05

### Fixed

- `ConnectAuthJwtVerifier` now requires a non-empty `client_id` claim and no longer accepts `azp`-only tokens. Connect Auth always mints `client_id` separately from the federated subject.

## [0.1.1] - 2026-08-05

### Added

- `connectAuthCallbackIdentity()` — canonical `get-user-info` JSON from a verified access token (parity with FastMCP `connect_auth_callback_identity()`).
- `roles` on `completeFederation()` and typed `VerifiedAccessToken.roles` for pass-through federation profile claims.

### Fixed

- Release tags now bump `package.json` version so npm publishes distinct artifacts (v0.1.1–v0.1.5 tags had been blocked on duplicate 0.1.0).

## [0.1.0] - 2026-08-04

### Added

- Initial public release of `mcpbundles-mcp-connect-auth`
- `createConnectAuthMiddleware` — RFC 9728 protected-resource metadata and Bearer JWT verification for MCP routes
- `getVerifiedAccessToken` — read verified access token claims attached by the middleware
- `completeFederation` — finish OAuth federation after your sign-in flow
- `createMcpbundlesServer` / `mcpbundlesMcpServer` — factory with parity to Python `mcpbundles_fastmcp()`
- Optional initialize handshake telemetry hook when your listing enables it
- Client-side validation for required federation inputs (`federationSecret`, `state`, `subject`)

[0.1.3]: https://github.com/thinkchainai/mcp-connect-auth-js/releases/tag/v0.1.3
[0.1.2]: https://github.com/thinkchainai/mcp-connect-auth-js/releases/tag/v0.1.2
[0.1.1]: https://github.com/thinkchainai/mcp-connect-auth-js/releases/tag/v0.1.1
[0.1.0]: https://github.com/thinkchainai/mcp-connect-auth-js/releases/tag/v0.1.0
