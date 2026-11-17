// Does:  Defines the record kept for each video generated this session.
// Holds: Type-only; the provider serializes this record as-is, so every field here is visible to clients.
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
