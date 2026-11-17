// Does:  Defines the record kept for each image generated this session.
// Holds: Type-only; the provider serializes this record as-is, so every field here is visible to clients.
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
