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
