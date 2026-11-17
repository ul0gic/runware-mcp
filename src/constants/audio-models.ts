// Does:  Catalogs the Runware audio models and TTS voices with their capabilities, limits, and pricing.
// Holds: Every AUDIO_MODELS and TTS_VOICE_INFO key equals its entry's id, so lookups by AIR or voice ID are direct.

type AudioCapability = 'music' | 'sfx' | 'speech' | 'ambient' | 'composition';

type AudioProvider = 'elevenlabs' | 'mirelo';

// Holds: Durations are seconds, sample rate Hz, bitrate kbps, and cost USD per second.
interface AudioModel {
  readonly id: string;
  readonly name: string;
  readonly provider: AudioProvider;
  readonly capabilities: readonly AudioCapability[];
  readonly minDuration: number;
  readonly maxDuration: number;
  readonly supportsComposition: boolean;
  readonly defaultSampleRate: number;
  readonly defaultBitrate: number;
  readonly costPerSecond?: number;
  readonly notes?: string;
}

const AUDIO_MODELS = {
  'elevenlabs:1@1': {
    id: 'elevenlabs:1@1',
    name: 'ElevenLabs Music',
    provider: 'elevenlabs',
    capabilities: ['music', 'speech', 'composition'] as const,
    minDuration: 10,
    maxDuration: 300,
    supportsComposition: true,
    defaultSampleRate: 44_100,
    defaultBitrate: 192,
    costPerSecond: 0.01,
    notes: 'Full-featured music generation with composition plans, global styles, sections, timing, and lyrics',
  },

  'elevenlabs:1@2': {
    id: 'elevenlabs:1@2',
    name: 'ElevenLabs Music HD',
    provider: 'elevenlabs',
    capabilities: ['music', 'speech', 'composition'] as const,
    minDuration: 10,
    maxDuration: 300,
    supportsComposition: true,
    defaultSampleRate: 48_000,
    defaultBitrate: 320,
    costPerSecond: 0.015,
    notes: 'High-definition audio output with enhanced fidelity',
  },

  'mirelo:1@1': {
    id: 'mirelo:1@1',
    name: 'Mirelo Audio',
    provider: 'mirelo',
    capabilities: ['sfx', 'ambient'] as const,
    minDuration: 5,
    maxDuration: 60,
    supportsComposition: false,
    defaultSampleRate: 44_100,
    defaultBitrate: 192,
    costPerSecond: 0.005,
    notes: 'Sound effects and ambient audio generation with temporal offset for video sync',
  },

  'mirelo:1@2': {
    id: 'mirelo:1@2',
    name: 'Mirelo Audio Pro',
    provider: 'mirelo',
    capabilities: ['sfx', 'ambient', 'music'] as const,
    minDuration: 5,
    maxDuration: 120,
    supportsComposition: false,
    defaultSampleRate: 48_000,
    defaultBitrate: 256,
    costPerSecond: 0.008,
    notes: 'Extended duration and music capability for longer ambient tracks',
  },
} as const satisfies Record<string, AudioModel>;

export type AudioModelId = keyof typeof AUDIO_MODELS;

const TTS_VOICES = [
  'alloy',
  'echo',
  'fable',
  'onyx',
  'nova',
  'shimmer',
  'adam',
  'bella',
  'chris',
  'dorothy',
  'emily',
  'freya',
  'george',
  'harry',
] as const;

export type TTSVoice = (typeof TTS_VOICES)[number];

export function isValidAudioModel(modelId: string): modelId is AudioModelId {
  return Object.hasOwn(AUDIO_MODELS, modelId);
}

export function isValidTTSVoice(voice: string): voice is TTSVoice {
  return TTS_VOICES.some((known) => known === voice);
}
