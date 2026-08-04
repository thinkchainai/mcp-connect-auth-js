# mcpbundles-mcp-connect-auth — Agent Context

Public npm package for MCP Connect Auth on MCPBundles. Submodule of the MCPBundles monorepo at `public_github_repos/mcp-connect-auth-js`.

**Execution checklist:** `product/mcp-connect-auth/coding-plan.md` § P1b in the parent monorepo.

## Scope

- HTTP middleware: protected-resource routes + Bearer JWT verify
- `completeFederation()` parity with Python
- Factory helper parity with `mcpbundles_fastmcp()` where applicable for Node stacks

## Release

- Tag `vX.Y.Z` → GitHub Actions npm publish (add workflow in P1b)
- Parent monorepo bumps submodule pointer after release

## Rules

- No secrets in README or examples; federation secret is server-side only
