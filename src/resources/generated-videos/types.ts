/**
 * Types for the generated videos resource.
 *
 * Defines the shape of video entries stored in the in-memory session store.
 */

/**
 * Represents a single generated video in the session store.
 */
export interface GeneratedVideoEntry {
  readonly id: string;
  readonly videoUUID: string;
  readonly videoURL: string;
  readonly prompt: string;
  readonly model: string;
  readonly duration: number;
  readonly width: number;
  readonly height: number;
  readonly cost?: number;
  readonly createdAt: Date;
}
