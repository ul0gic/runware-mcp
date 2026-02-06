import type { DocResource } from '../../types.js';

export const connectionDoc: DocResource = {
  id: 'connection',
  category: 'concepts',
  title: 'API Connection & Authentication',
  summary: 'How to authenticate with the Runware API using API keys, HTTP REST endpoint, and connection setup',
  tags: ['authentication', 'API key', 'connection', 'HTTP', 'REST', 'setup'],
  content: {
    description:
      'The Runware API requires authentication via an API key. The MCP server connects over HTTP REST to ' +
      '`https://api.runware.ai/v1` using POST requests with JSON payloads. Authentication is handled via the ' +
      '`Authorization: Bearer <API_KEY>` header. The API accepts a JSON array of task objects, enabling batch ' +
      'processing of multiple operations in a single request. Responses return a JSON object with a `data` array ' +
      'containing result objects, or an `error` property if the request failed. API keys are created and managed ' +
      'through the Runware dashboard. You can create multiple keys for different environments (development, ' +
      'production, staging).',
    parameters: [
      {
        name: 'RUNWARE_API_KEY',
        type: 'string',
        required: true,
        description: 'Environment variable containing your Runware API key. Set this in your MCP client config.',
      },
    ],
    examples: [
      {
        title: 'MCP server configuration',
        input: {
          env: { RUNWARE_API_KEY: 'your-api-key-here' },
        },
        explanation:
          'Set the RUNWARE_API_KEY environment variable before starting the MCP server. The server validates this at boot and will not start without it.',
      },
      {
        title: 'HTTP REST request format',
        input: {
          method: 'POST',
          url: 'https://api.runware.ai/v1',
          headers: { contentType: 'application/json', authorization: 'Bearer <API_KEY>' },
          body: [{ taskType: 'imageInference', taskUUID: 'uuid-here', positivePrompt: 'a cat', model: 'runware:101@1', width: 1024, height: 1024 }],
        },
        explanation:
          'The MCP server constructs HTTP REST requests internally. Each request is a POST with a JSON array of task objects. You do not need to make HTTP calls directly.',
      },
    ],
    tips: [
      'Get your API key from the Runware dashboard at https://runware.ai after creating an account.',
      'Never commit API keys to version control. Use environment variables via your MCP client config.',
      'The MCP server validates the API key at startup — if it is missing or invalid, the server will not start.',
      'Create separate API keys for development and production environments to track usage independently.',
    ],
    relatedDocs: [
      'runware://docs/concepts/task-responses',
      'runware://docs/concepts/async-delivery',
    ],
  },
  lastUpdated: '2026-02-05',
};
