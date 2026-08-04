# mcpbundles-mcp-connect-auth

Node.js client library for [MCP Connect Auth](https://www.mcpbundles.com/docs/integrations/mcp-connect-auth) on MCPBundles.

## Features

- HTTP middleware for MCP routes (RFC 9728 protected-resource metadata + Bearer JWT verify)
- `completeFederation()` — finish OAuth federation after your sign-in flow
- `createMcpbundlesServer()` factory — parity with Python `mcpbundles_fastmcp()` (auth + optional initialize handshake telemetry)
- Optional origin handshake telemetry hook when your listing enables it

## Install

```bash
npm install mcpbundles-mcp-connect-auth
```

## Quickstart

### Path B — bundle URL only

Publish with MCP Connect Auth, set your federation sign-in URL, and call `completeFederation()` from your web app after login. Clients connect via `https://mcp.mcpbundles.com/bundle/{slug}` — no npm package required on your MCP server.

### Path A — vendor origin (Node MCP server)

```typescript
import { createMcpbundlesServer } from "mcpbundles-mcp-connect-auth";

const server = await createMcpbundlesServer({
  listingSlug: process.env.MCPBUNDLES_LISTING_SLUG!,
  baseUrl: process.env.MCP_BASE_URL!,
  mcpPath: "/mcp",
});

// Wire server.connectAuth.handleRequest into your HTTP stack before MCP handlers.
// Call server.onInitialize?.(...) after MCP initialize when telemetry is enabled.
```

### Connect Auth middleware with `node:http`

Use `createConnectAuthMiddleware` directly when you own the HTTP server. The middleware serves RFC 9728 metadata, verifies Bearer JWTs on your MCP path, and attaches the verified token to the request for downstream handlers.

```typescript
import http from "node:http";
import {
  createConnectAuthMiddleware,
  getVerifiedAccessToken,
} from "mcpbundles-mcp-connect-auth";

const connectAuth = createConnectAuthMiddleware({
  listingSlug: process.env.MCPBUNDLES_LISTING_SLUG!,
  baseUrl: process.env.MCP_BASE_URL!,
  mcpPath: "/mcp",
});

const server = http.createServer(async (req, res) => {
  const request = new Request(`http://${req.headers.host}${req.url}`, {
    method: req.method,
    headers: req.headers as HeadersInit,
  });

  const authResponse = await connectAuth.handleRequest(request);
  if (authResponse) {
    res.writeHead(authResponse.status, Object.fromEntries(authResponse.headers));
    res.end(Buffer.from(await authResponse.arrayBuffer()));
    return;
  }

  const token = getVerifiedAccessToken(request);
  if (token && req.url?.startsWith("/mcp")) {
    // token.subject is the federated user id; handle your MCP JSON-RPC here.
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ jsonrpc: "2.0", result: {}, id: null }));
    return;
  }

  res.writeHead(404);
  res.end("Not found");
});

server.listen(3000);
```

### Federation complete (web app)

Call from your sign-in route after the user authenticates. Keep the federation secret on the server only.

```typescript
import { completeFederation } from "mcpbundles-mcp-connect-auth";

await completeFederation({
  listingSlug: process.env.MCPBUNDLES_LISTING_SLUG!,
  federationSecret: process.env.MCPBUNDLES_FEDERATION_SECRET!,
  state: req.query.state,
  subject: user.id,
  organizationId: user.organizationId,
});
```

## Documentation

Full integration reference: [MCP Connect Auth](https://www.mcpbundles.com/docs/integrations/mcp-connect-auth)

## License

MIT
