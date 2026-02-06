/**
 * Types for the generated images resource.
 *
 * Defines the shape of image entries stored in the in-memory session store.
 */

/**
 * Represents a single generated image in the session store.
 */
export interface GeneratedImageEntry {
  readonly id: string;
  readonly imageUUID: string;
  readonly imageURL: string;
  readonly prompt: string;
  readonly model: string;
  readonly width: number;
  readonly height: number;
  readonly cost?: number;
  readonly createdAt: Date;
}
