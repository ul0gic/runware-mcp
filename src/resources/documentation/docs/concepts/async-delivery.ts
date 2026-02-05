import type { DocResource } from '../../types.js';

export const asyncDeliveryDoc: DocResource = {
  id: 'async-delivery',
  category: 'concepts',
  title: 'Async Task Delivery',
  summary: 'How synchronous vs asynchronous delivery works, polling for video/audio results, and webhook support',
  tags: ['async', 'sync', 'polling', 'delivery', 'webhook', 'video', 'audio'],
  content: {
    description:
      'Runware supports two delivery methods: synchronous ("sync") and asynchronous ("async"). ' +
      'Synchronous delivery returns results immediately in the response — ideal for fast operations like ' +
      'image generation, captioning, and background removal. Asynchronous delivery queues the task and returns ' +
      'an immediate confirmation with the taskUUID. You then poll using the getResponse task type to check status ' +
      'until the result is ready. Video generation and audio generation typically require async delivery because ' +
      'they take longer to process. The MCP server handles polling automatically for video and audio tools, ' +
      'returning the final result once complete. Webhooks provide an alternative to polling — set webhookURL to ' +
      'receive a POST notification when the task finishes.',
    parameters: [
      {
        name: 'deliveryMethod',
        type: 'string',
        default: 'sync',
        description: 'Choose "sync" for immediate results or "async" for queued processing with polling.',
      },
      {
        name: 'webhookURL',
        type: 'string',
        description: 'HTTP endpoint to receive a POST request with the task result when it completes. Supports authentication tokens in query parameters.',
      },
    ],
    examples: [
      {
        title: 'Synchronous image generation',
        input: {
          positivePrompt: 'a serene mountain landscape at sunset',
          model: 'runware:101@1',
          width: 1024,
          height: 1024,
        },
        explanation:
          'Image generation is synchronous by default. The response contains the generated image URL immediately.',
      },
      {
        title: 'Async video generation with automatic polling',
        input: {
          positivePrompt: 'a drone flying over a canyon',
          model: 'klingai:1@2',
          duration: 5,
          width: 1280,
          height: 720,
        },
        explanation:
          'Video generation uses async delivery. The MCP server submits the task, then polls getResponse automatically until the video is ready, returning the final videoURL.',
      },
    ],
    tips: [
      'The MCP server manages async polling for you — video and audio tools return final results without manual polling.',
      'For webhook delivery, ensure your endpoint returns a 2xx status code to confirm receipt.',
      'Video tasks typically complete in 30-120 seconds depending on duration, resolution, and model.',
      'Audio tasks complete in 10-60 seconds depending on duration and model complexity.',
      'If a task fails during async processing, the error details are included in the polling response.',
    ],
    relatedDocs: [
      'runware://docs/concepts/task-responses',
      'runware://docs/tools/video-inference',
      'runware://docs/tools/audio-inference',
    ],
  },
  lastUpdated: '2026-02-05',
};
