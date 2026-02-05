import type { DocResource } from '../../types.js';

export const audioInferenceDoc: DocResource = {
  id: 'audio-inference',
  category: 'tools',
  title: 'Audio Generation',
  summary: 'Generate music, sound effects, speech, and ambient audio from text descriptions using ElevenLabs and Mirelo models',
  tags: ['audio', 'music', 'sound effects', 'speech', 'ElevenLabs', 'Mirelo', 'generation'],
  content: {
    description:
      'The audioInference tool generates audio from text descriptions. It supports four audio types: ' +
      'music (genres, moods, instruments), sfx (sound effects), speech (text-to-speech), and ambient ' +
      '(background sounds). ElevenLabs models support structured composition plans with sections, timing, ' +
      'and lyrics. Mirelo models support startOffset for video-synchronized audio. Audio generation may ' +
      'use asynchronous processing for longer durations — the MCP server handles polling automatically. ' +
      'Returns audio URLs with UUID, cost, and format information.',
    parameters: [
      {
        name: 'positivePrompt',
        type: 'string',
        required: true,
        range: '2-2000 characters',
        description: 'Text description of the desired audio. For music: genre, mood, instruments, tempo. For SFX: describe the sound. For speech: the text to synthesize.',
      },
      {
        name: 'model',
        type: 'string',
        required: true,
        description: 'Audio model in AIR format. Examples: "elevenlabs:1@1", "mirelo:1@1".',
      },
      {
        name: 'duration',
        type: 'integer',
        range: '10-300',
        default: '30',
        description: 'Audio duration in seconds.',
      },
      {
        name: 'audioType',
        type: 'string',
        description: 'Type of audio: "music", "sfx", "speech", or "ambient". Helps optimize generation.',
      },
      {
        name: 'voice',
        type: 'string',
        description: 'Voice identifier for speech synthesis. Only applicable for speech generation.',
      },
      {
        name: 'numberResults',
        type: 'integer',
        range: '1-3',
        default: '1',
        description: 'Number of audio variations to generate.',
      },
      {
        name: 'audioSettings',
        type: 'object',
        description: 'Quality settings: { sampleRate: 8000-48000, bitrate: 32-320 }.',
      },
      {
        name: 'elevenlabs',
        type: 'object',
        description: 'ElevenLabs settings: { compositionPlan: { globalStyle, sections: [{ name, startTime, endTime, prompt, lyrics }] } }.',
      },
      {
        name: 'mirelo',
        type: 'object',
        description: 'Mirelo settings: { startOffset } for video-synchronized audio generation.',
      },
      {
        name: 'outputType',
        type: 'string',
        default: 'URL',
        description: 'Output delivery: "URL", "base64Data", or "dataURI".',
      },
      {
        name: 'outputFormat',
        type: 'string',
        description: 'Audio format: "MP3", "WAV", or "OGG".',
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
        title: 'Generate background music',
        input: {
          positivePrompt: 'upbeat electronic dance music with synth leads, 128 BPM, energetic and futuristic',
          model: 'elevenlabs:1@1',
          duration: 60,
          audioType: 'music',
        },
        explanation: 'Generates a 60-second electronic music track. The prompt describes genre, instruments, tempo, and mood.',
      },
      {
        title: 'Sound effect with Mirelo',
        input: {
          positivePrompt: 'thunderstorm with heavy rain and distant thunder rumbles',
          model: 'mirelo:1@1',
          duration: 15,
          audioType: 'sfx',
          mirelo: { startOffset: 2.5 },
        },
        explanation: 'Creates a thunderstorm sound effect starting at a 2.5-second offset for video synchronization.',
      },
    ],
    tips: [
      'Be descriptive in your prompt — include genre, mood, instruments, tempo for music, and specific sound characteristics for SFX.',
      'ElevenLabs compositionPlan allows multi-section music with different lyrics and styles per section.',
      'Use audioType to hint at the generation model optimization — "music" vs "sfx" vs "speech" vs "ambient".',
      'Audio generation can take 10-60 seconds. The MCP server handles async polling automatically.',
      'For video soundtracks, use Mirelo with startOffset to synchronize audio with specific video moments.',
    ],
    relatedDocs: [
      'runware://docs/concepts/async-delivery',
      'runware://docs/concepts/air-identifiers',
      'runware://docs/tools/video-inference',
      'runware://docs/tools/transcription',
    ],
  },
  lastUpdated: '2026-02-05',
};
