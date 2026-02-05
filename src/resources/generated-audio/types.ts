/**
 * Types for the generated audio resource.
 *
 * Defines the shape of audio entries stored in the in-memory session store
 * and persisted to the database when enabled.
 */

/**
 * Valid audio generation types.
 */
export type AudioType = 'music' | 'sfx' | 'speech' | 'ambient';

/**
 * Represents a single generated audio clip in the session store.
 */
export interface GeneratedAudioEntry {
  readonly id: string;
  readonly audioUUID: string;
  readonly audioURL: string;
  readonly prompt: string;
  readonly model: string;
  readonly duration: number;
  readonly audioType: AudioType;
  readonly cost?: number;
  readonly createdAt: Date;
}
