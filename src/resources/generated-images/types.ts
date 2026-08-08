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
