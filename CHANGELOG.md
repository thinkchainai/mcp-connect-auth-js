# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-04

### Added

- Initial public release of `mcpbundles-mcp-connect-auth`
- `createConnectAuthMiddleware` — RFC 9728 protected-resource metadata and Bearer JWT verification for MCP routes
- `getVerifiedAccessToken` — read verified access token claims attached by the middleware
- `completeFederation` — finish OAuth federation after your sign-in flow
- `createMcpbundlesServer` / `mcpbundlesMcpServer` — factory with parity to Python `mcpbundles_fastmcp()`
- Optional initialize handshake telemetry hook when your listing enables it
- Client-side validation for required federation inputs (`federationSecret`, `state`, `subject`)

[0.1.0]: https://github.com/thinkchainai/mcp-connect-auth-js/releases/tag/v0.1.0
