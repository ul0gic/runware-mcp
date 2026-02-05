import type { DocResource } from '../../types.js';

export const transcriptionDoc: DocResource = {
  id: 'transcription',
  category: 'tools',
  title: 'Audio/Video Transcription',
  summary: 'Convert audio and video content to text with timestamps and language detection',
  tags: ['transcription', 'speech-to-text', 'subtitles', 'timestamps', 'language detection'],
  content: {
    description:
      'The transcription tool converts audio or video content into text. It produces a full transcript ' +
      'with optional timestamped segments for subtitle generation or time-aligned analysis. ' +
      'Automatic language detection identifies the spoken language (ISO 639-1 code), or you can specify ' +
      'the language explicitly. The default model is memories:1@1. Transcription may use async processing ' +
      'for longer media files — the MCP server handles polling automatically. ' +
      'Returns full text, segments with start/end timestamps, and detected language.',
    parameters: [
      {
        name: 'inputMedia',
        type: 'string',
        required: true,
        description: 'Video or audio file to transcribe. Accepts UUID or URL of a video/audio file.',
      },
      {
        name: 'model',
        type: 'string',
        default: 'memories:1@1',
        description: 'Transcription model. Default: memories:1@1 (Memories Transcription Model).',
      },
      {
        name: 'language',
        type: 'string',
        description: 'ISO 639-1 language code (e.g., "en", "es", "fr", "de", "ja"). If omitted, auto-detection is used.',
      },
      {
        name: 'includeCost',
        type: 'boolean',
        default: 'true',
        description: 'Include USD cost in the response.',
      },
    ],
    examples: [
      {
        title: 'Transcribe a video',
        input: {
          inputMedia: 'abc12345-uuid-of-video',
        },
        explanation: 'Transcribes the audio track of a video. Returns full text and timestamped segments for subtitle generation.',
      },
      {
        title: 'Transcribe with explicit language',
        input: {
          inputMedia: 'https://example.com/podcast-episode.mp3',
          language: 'en',
        },
        explanation: 'Transcribes an English audio file. Specifying the language improves accuracy when you know it in advance.',
      },
    ],
    tips: [
      'Specify the language when you know it — auto-detection works well but explicit language improves accuracy.',
      'Segments include start and end timestamps in seconds — use these for subtitle generation or time-aligned editing.',
      'The detectedLanguage field in the response confirms which language was identified.',
      'For long audio/video files, transcription runs asynchronously. The MCP server handles polling.',
      'Transcription output pairs well with video-inference — transcribe existing content, then use it to guide new video generation.',
    ],
    relatedDocs: [
      'runware://docs/tools/video-inference',
      'runware://docs/tools/audio-inference',
      'runware://docs/tools/caption',
    ],
  },
  lastUpdated: '2026-02-05',
};
