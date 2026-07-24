import { describe, expect, it } from 'vitest';

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';

describe('@hono/node-server override compatibility', () => {
  it('initializes the MCP SDK Streamable HTTP transport', async () => {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    await expect(transport.start()).resolves.toBeUndefined();
    await expect(transport.close()).resolves.toBeUndefined();
  });
});
