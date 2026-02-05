/**
 * Masking Models Constants
 *
 * Complete catalog of image masking/segmentation models supported by Runware API.
 * These models detect and generate masks for specific elements in images.
 * All models use the 'runware:35@N' AIR format where N is the variant number.
 *
 * @remarks
 * The object keys use the AIR format which contains colons and at-signs.
 * This is intentional as it matches the Runware API model identifiers.
 */

// =============================================================================
// Category Constants
// =============================================================================

const CATEGORY_FACE = 'face' as const;
const CATEGORY_BODY = 'body' as const;
const CATEGORY_FACIAL_FEATURE = 'facial-feature' as const;

/**
 * Masking model categories
 */
export type MaskingCategory = 'face' | 'body' | 'facial-feature' | 'general';

/**
 * Masking model definition
 */
export interface MaskingModel {
  /** AIR identifier (e.g., 'runware:35@1') */
  readonly id: string;
  /** Human-readable display name */
  readonly name: string;
  /** Technical model name */
  readonly modelName: string;
  /** Description of what this model detects */
  readonly description: string;
  /** Category of detection */
  readonly category: MaskingCategory;
  /** What elements this model detects */
  readonly detects: readonly string[];
  /** Recommended confidence threshold */
  readonly recommendedConfidence: number;
  /** Whether this model works well with realistic/2D content */
  readonly worksWithRealistic: boolean;
  /** Whether this model works well with anime/illustrated content */
  readonly worksWithAnime: boolean;
  /** Additional notes */
  readonly notes?: string;
}

/**
 * Complete catalog of masking models
 *
 * Keys use AIR format (runware:35@variant) which is required by the Runware API.
 */
export const MASKING_MODELS = {
  // =============================================================================
  // Face Detection Models (5 models)
  // =============================================================================

  'runware:35@1': {
    id: 'runware:35@1',
    name: 'Face Detection',
    modelName: 'face_yolov8n',
    description: 'Lightweight face detection for realistic and 2D faces',
    category: CATEGORY_FACE,
    detects: ['face'],
    recommendedConfidence: 0.25,
    worksWithRealistic: true,
    worksWithAnime: true,
    notes: 'Fast, lightweight model ideal for general face detection',
  },

  'runware:35@2': {
    id: 'runware:35@2',
    name: 'Face Detection Enhanced',
    modelName: 'face_yolov8s',
    description: 'Enhanced accuracy face detection with larger model',
    category: CATEGORY_FACE,
    detects: ['face'],
    recommendedConfidence: 0.25,
    worksWithRealistic: true,
    worksWithAnime: true,
    notes: 'Better accuracy than @1 variant, slightly slower',
  },

  'runware:35@6': {
    id: 'runware:35@6',
    name: 'MediaPipe Face Full',
    modelName: 'mediapipe_face_full',
    description: 'Specialized realistic face detection using MediaPipe',
    category: CATEGORY_FACE,
    detects: ['face'],
    recommendedConfidence: 0.3,
    worksWithRealistic: true,
    worksWithAnime: false,
    notes: 'Optimized for photorealistic content, not recommended for anime/illustrated faces',
  },

  'runware:35@7': {
    id: 'runware:35@7',
    name: 'MediaPipe Face Short',
    modelName: 'mediapipe_face_short',
    description: 'Optimized MediaPipe face detection with reduced complexity',
    category: CATEGORY_FACE,
    detects: ['face'],
    recommendedConfidence: 0.3,
    worksWithRealistic: true,
    worksWithAnime: false,
    notes: 'Faster variant of MediaPipe face detection',
  },

  'runware:35@8': {
    id: 'runware:35@8',
    name: 'MediaPipe Face Mesh',
    modelName: 'mediapipe_face_mesh',
    description: 'Advanced face detection with mesh mapping capabilities',
    category: CATEGORY_FACE,
    detects: ['face', 'facial-landmarks'],
    recommendedConfidence: 0.3,
    worksWithRealistic: true,
    worksWithAnime: false,
    notes: 'Provides detailed facial mesh for precise mask generation',
  },

  // =============================================================================
  // Facial Feature Models (7 models)
  // =============================================================================

  'runware:35@9': {
    id: 'runware:35@9',
    name: 'Eyes Only',
    modelName: 'mediapipe_face_mesh_eyes_only',
    description: 'Eye region detection using MediaPipe face mesh',
    category: CATEGORY_FACIAL_FEATURE,
    detects: ['eyes'],
    recommendedConfidence: 0.3,
    worksWithRealistic: true,
    worksWithAnime: false,
    notes: 'Isolates eye regions for targeted editing',
  },

  'runware:35@15': {
    id: 'runware:35@15',
    name: 'Eyes Mesh',
    modelName: 'eyes_mesh_mediapipe',
    description: 'Specialized eye detection with detailed mesh',
    category: CATEGORY_FACIAL_FEATURE,
    detects: ['eyes'],
    recommendedConfidence: 0.3,
    worksWithRealistic: true,
    worksWithAnime: false,
    notes: 'More precise eye detection than @9 variant',
  },

  'runware:35@13': {
    id: 'runware:35@13',
    name: 'Nose Mesh',
    modelName: 'nose_mesh_mediapipe',
    description: 'Specialized nose detection using MediaPipe mesh',
    category: CATEGORY_FACIAL_FEATURE,
    detects: ['nose'],
    recommendedConfidence: 0.3,
    worksWithRealistic: true,
    worksWithAnime: false,
    notes: 'Precise nose region isolation for targeted editing',
  },

  'runware:35@14': {
    id: 'runware:35@14',
    name: 'Lips Mesh',
    modelName: 'lips_mesh_mediapipe',
    description: 'Specialized lip detection using MediaPipe mesh',
    category: CATEGORY_FACIAL_FEATURE,
    detects: ['lips', 'mouth'],
    recommendedConfidence: 0.3,
    worksWithRealistic: true,
    worksWithAnime: false,
    notes: 'Precise lip region isolation for targeted editing',
  },

  'runware:35@10': {
    id: 'runware:35@10',
    name: 'Eyes + Lips',
    modelName: 'eyes_lips_mesh',
    description: 'Combined eyes and lips detection',
    category: CATEGORY_FACIAL_FEATURE,
    detects: ['eyes', 'lips'],
    recommendedConfidence: 0.3,
    worksWithRealistic: true,
    worksWithAnime: false,
    notes: 'Useful for makeup editing and expressive feature changes',
  },

  'runware:35@11': {
    id: 'runware:35@11',
    name: 'Nose + Eyes',
    modelName: 'nose_eyes_mesh',
    description: 'Combined nose and eyes detection',
    category: CATEGORY_FACIAL_FEATURE,
    detects: ['nose', 'eyes'],
    recommendedConfidence: 0.3,
    worksWithRealistic: true,
    worksWithAnime: false,
    notes: 'Useful for central face feature editing',
  },

  'runware:35@12': {
    id: 'runware:35@12',
    name: 'Nose + Lips',
    modelName: 'nose_lips_mesh',
    description: 'Combined nose and lips detection',
    category: CATEGORY_FACIAL_FEATURE,
    detects: ['nose', 'lips'],
    recommendedConfidence: 0.3,
    worksWithRealistic: true,
    worksWithAnime: false,
    notes: 'Useful for lower face feature editing',
  },

  // =============================================================================
  // Body Part Models (3 models)
  // =============================================================================

  'runware:35@3': {
    id: 'runware:35@3',
    name: 'Hand Detection',
    modelName: 'hand_yolov8n',
    description: 'Hand detection for realistic and 2D content',
    category: CATEGORY_BODY,
    detects: ['hands'],
    recommendedConfidence: 0.25,
    worksWithRealistic: true,
    worksWithAnime: true,
    notes: 'Detects hands for targeted editing or replacement',
  },

  'runware:35@4': {
    id: 'runware:35@4',
    name: 'Person Segmentation',
    modelName: 'person_yolov8n-seg',
    description: 'Full person segmentation using YOLOv8',
    category: CATEGORY_BODY,
    detects: ['person', 'body'],
    recommendedConfidence: 0.25,
    worksWithRealistic: true,
    worksWithAnime: true,
    notes: 'Lightweight person segmentation for background removal or editing',
  },

  'runware:35@5': {
    id: 'runware:35@5',
    name: 'Person Segmentation Enhanced',
    modelName: 'person_yolov8s-seg',
    description: 'Enhanced person segmentation with better accuracy',
    category: CATEGORY_BODY,
    detects: ['person', 'body'],
    recommendedConfidence: 0.25,
    worksWithRealistic: true,
    worksWithAnime: true,
    notes: 'More accurate than @4 variant, recommended for detailed work',
  },
} as const satisfies Record<string, MaskingModel>;

/**
 * Type for valid masking model IDs
 */
export type MaskingModelId = keyof typeof MASKING_MODELS;

/**
 * Array of all masking model IDs
 */
export const MASKING_MODEL_IDS: readonly MaskingModelId[] = [
  'runware:35@1',
  'runware:35@2',
  'runware:35@3',
  'runware:35@4',
  'runware:35@5',
  'runware:35@6',
  'runware:35@7',
  'runware:35@8',
  'runware:35@9',
  'runware:35@10',
  'runware:35@11',
  'runware:35@12',
  'runware:35@13',
  'runware:35@14',
  'runware:35@15',
] as const;

/**
 * Get a masking model by its AIR identifier
 */
export function getMaskingModel(id: string): MaskingModel | undefined {
  if (isValidMaskingModel(id)) {
    return MASKING_MODELS[id];
  }
  return undefined;
}

/**
 * Get all masking models in a specific category
 */
export function getMaskingModelsByCategory(category: MaskingCategory): MaskingModel[] {
  return Object.values(MASKING_MODELS).filter((model) => model.category === category);
}

/**
 * Get the default masking model (Face Detection - most common use case)
 */
export function getDefaultMaskingModel(): MaskingModel {
  return MASKING_MODELS['runware:35@1'];
}

/**
 * Get masking models that detect a specific element
 */
export function getMaskingModelsByDetection(element: string): MaskingModel[] {
  return Object.values(MASKING_MODELS).filter((model: MaskingModel) =>
    (model.detects).includes(element),
  );
}

/**
 * Get masking models that work with anime/illustrated content
 */
export function getMaskingModelsForAnime(): MaskingModel[] {
  return Object.values(MASKING_MODELS).filter((model) => model.worksWithAnime);
}

/**
 * Get masking models that work with realistic/photographic content
 *
 * Note: All current masking models support realistic content.
 * This function exists for API consistency with getMaskingModelsForAnime().
 */
export function getMaskingModelsForRealistic(): MaskingModel[] {
  // All models work with realistic content
  return getAllMaskingModels();
}

/**
 * Check if a model ID is a valid masking model
 */
export function isValidMaskingModel(id: string): id is MaskingModelId {
  return MASKING_MODEL_IDS.includes(id as MaskingModelId);
}

/**
 * Get all face detection models
 */
export function getFaceDetectionModels(): MaskingModel[] {
  return getMaskingModelsByCategory(CATEGORY_FACE);
}

/**
 * Get all facial feature models
 */
export function getFacialFeatureModels(): MaskingModel[] {
  return getMaskingModelsByCategory(CATEGORY_FACIAL_FEATURE);
}

/**
 * Get all body detection models
 */
export function getBodyDetectionModels(): MaskingModel[] {
  return getMaskingModelsByCategory(CATEGORY_BODY);
}

/**
 * Use case types for masking model recommendations
 */
export type MaskingUseCase = 'face' | 'eyes' | 'lips' | 'nose' | 'hands' | 'person' | 'animeFace';

/**
 * Recommendations mapping for masking use cases
 */
const MASKING_RECOMMENDATIONS: Record<MaskingUseCase, MaskingModelId> = {
  face: 'runware:35@1',
  eyes: 'runware:35@15',
  lips: 'runware:35@14',
  nose: 'runware:35@13',
  hands: 'runware:35@3',
  person: 'runware:35@5',
  animeFace: 'runware:35@1', // YOLOv8 works with anime
};

/**
 * Get the recommended model for a specific use case
 */
export function getRecommendedMaskingModel(useCase: MaskingUseCase): MaskingModel {
  const modelId = MASKING_RECOMMENDATIONS[useCase];
  return MASKING_MODELS[modelId];
}

/**
 * Get all masking models as an array
 */
export function getAllMaskingModels(): MaskingModel[] {
  return Object.values(MASKING_MODELS);
}

/**
 * Get all masking model IDs
 */
export function getAllMaskingModelIds(): MaskingModelId[] {
  return [...MASKING_MODEL_IDS];
}
