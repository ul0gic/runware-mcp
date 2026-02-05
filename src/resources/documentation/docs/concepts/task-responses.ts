import type { DocResource } from '../../types.js';

export const taskResponsesDoc: DocResource = {
  id: 'task-responses',
  category: 'concepts',
  title: 'Task Response Structure',
  summary: 'How Runware API responses are structured, including taskUUID matching, status fields, cost tracking, and error handling',
  tags: ['responses', 'taskUUID', 'status', 'polling', 'errors', 'cost'],
  content: {
    description:
      'Every Runware API request includes a taskUUID (UUID v4) that uniquely identifies the task. Responses are ' +
      'returned in a `data` array where each object includes the same taskUUID for matching. For synchronous tasks, ' +
      'the response contains the result immediately. For asynchronous tasks (video, audio, long-running operations), ' +
      'the initial response confirms the task was queued, and you poll using the getResponse task type to check status. ' +
      'Status values are: "processing" (still running), "success" (completed with results), and "error" (failed). ' +
      'When includeCost is true, each response includes a cost field with the USD price of the operation.',
    parameters: [
      {
        name: 'taskUUID',
        type: 'string (UUID v4)',
        required: true,
        description: 'Unique identifier assigned to each task request. Used to match responses to requests and to poll for async results.',
      },
      {
        name: 'status',
        type: 'string',
        description: 'Task status in async polling responses: "processing", "success", or "error".',
      },
      {
        name: 'cost',
        type: 'number',
        description: 'USD cost of the operation. Only included when includeCost is true in the request.',
      },
      {
        name: 'includeCost',
        type: 'boolean',
        default: 'true',
        description: 'When true, the response includes cost information. Defaults to true in most MCP server tools.',
      },
    ],
    examples: [
      {
        title: 'Synchronous image generation response',
        input: {
          taskUUID: '550e8400-e29b-41d4-a716-446655440000',
          imageUUID: '89ab12cd-3456-7890-abcd-ef1234567890',
          imageURL: 'https://im.runware.ai/image/ws/0.5/ii/generated.jpg',
          cost: 0.004,
        },
        explanation: 'A sync response returns the result directly with taskUUID for matching and cost if requested.',
      },
      {
        title: 'Async polling with getResponse',
        input: {
          taskType: 'getResponse',
          taskUUID: '50836053-a0ee-4cf5-b9d6-ae7c5d140ada',
        },
        explanation:
          'Poll for an async task result using the original taskUUID. The response status field indicates progress: "processing", "success", or "error".',
      },
    ],
    tips: [
      'The MCP server handles polling automatically for video and audio tasks — you do not need to call getResponse manually.',
      'Use exponential backoff when polling: start with 1-2 second intervals and progressively extend delays.',
      'Always check the status field before accessing result data in async responses.',
      'Cost tracking is enabled by default (includeCost: true) in all MCP server tools to help monitor usage.',
      'Error responses include error details — check the error field for actionable information about what went wrong.',
    ],
    relatedDocs: [
      'runware://docs/concepts/async-delivery',
      'runware://docs/concepts/connection',
    ],
  },
  lastUpdated: '2026-02-05',
};
