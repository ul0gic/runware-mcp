type AudioType = 'music' | 'sfx' | 'speech' | 'ambient';

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
