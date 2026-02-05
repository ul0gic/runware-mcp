/**
 * ControlNet Preprocessors Constants
 *
 * Complete catalog of all 12 ControlNet preprocessors supported by Runware API.
 * These preprocessors transform input images into guide images for controlled generation.
 */

/**
 * Output type categories for preprocessors
 */
export type ControlNetOutputType = 'edge' | 'depth' | 'pose' | 'segmentation' | 'other';

/**
 * Valid preprocessor ID literals
 */
export type ControlNetPreprocessorId =
  | 'canny'
  | 'depth'
  | 'mlsd'
  | 'normalbae'
  | 'openpose'
  | 'tile'
  | 'seg'
  | 'lineart'
  | 'lineartAnime'
  | 'shuffle'
  | 'scribble'
  | 'softedge';

/**
 * ControlNet preprocessor definition
 */
export interface ControlNetPreprocessor {
  /** Preprocessor identifier */
  readonly id: ControlNetPreprocessorId;
  /** API identifier (may differ from object key) */
  readonly apiId: string;
  /** Human-readable display name */
  readonly name: string;
  /** Description of what this preprocessor does */
  readonly description: string;
  /** Best use cases for this preprocessor */
  readonly bestFor: readonly string[];
  /** Type of output this preprocessor generates */
  readonly outputType: ControlNetOutputType;
  /** Whether this preprocessor has configurable thresholds */
  readonly hasThresholds: boolean;
  /** Whether this preprocessor supports pose-specific options */
  readonly supportsPoseOptions: boolean;
  /** Recommended strength range when using with ControlNet */
  readonly recommendedStrength: {
    readonly min: number;
    readonly max: number;
    readonly default: number;
  };
  /** Additional notes about usage */
  readonly notes?: string;
}

/**
 * All 12 ControlNet preprocessors
 */
export const CONTROLNET_PREPROCESSORS: Record<ControlNetPreprocessorId, ControlNetPreprocessor> = {
  canny: {
    id: 'canny',
    apiId: 'canny',
    name: 'Canny Edge',
    description: 'Edge detection using Canny algorithm for clean line extraction',
    bestFor: ['architecture', 'product design', 'technical drawings', 'mechanical objects'],
    outputType: 'edge',
    hasThresholds: true,
    supportsPoseOptions: false,
    recommendedStrength: {
      min: 0.3,
      max: 1,
      default: 0.7,
    },
    notes: 'Use lowThresholdCanny (0-255) and highThresholdCanny (0-255) to control edge sensitivity',
  },

  depth: {
    id: 'depth',
    apiId: 'depth',
    name: 'Depth Map',
    description: 'Depth estimation for 3D-aware generation with spatial understanding',
    bestFor: ['scenes', 'landscapes', 'interiors', 'architectural visualization'],
    outputType: 'depth',
    hasThresholds: false,
    supportsPoseOptions: false,
    recommendedStrength: {
      min: 0.4,
      max: 1,
      default: 0.8,
    },
    notes: 'Excellent for maintaining spatial relationships and perspective in generated images',
  },

  mlsd: {
    id: 'mlsd',
    apiId: 'mlsd',
    name: 'M-LSD Lines',
    description: 'Mobile Line Segment Detection for architectural and geometric structures',
    bestFor: ['interior design', 'architecture', 'furniture', 'geometric patterns'],
    outputType: 'edge',
    hasThresholds: false,
    supportsPoseOptions: false,
    recommendedStrength: {
      min: 0.3,
      max: 0.9,
      default: 0.6,
    },
    notes: 'Optimized for straight lines and geometric structures, ideal for architectural rendering',
  },

  normalbae: {
    id: 'normalbae',
    apiId: 'normalbae',
    name: 'Normal BAE',
    description: 'Surface normal estimation for 3D-aware lighting and materials',
    bestFor: ['3D rendering', 'relighting', 'material transfer', 'surface detail'],
    outputType: 'other',
    hasThresholds: false,
    supportsPoseOptions: false,
    recommendedStrength: {
      min: 0.4,
      max: 1,
      default: 0.7,
    },
    notes: 'Generates normal maps for understanding surface orientation and lighting interaction',
  },

  openpose: {
    id: 'openpose',
    apiId: 'openpose',
    name: 'OpenPose',
    description: 'Human pose estimation with skeletal keypoint detection',
    bestFor: ['characters', 'portraits', 'action poses', 'figure drawing'],
    outputType: 'pose',
    hasThresholds: false,
    supportsPoseOptions: true,
    recommendedStrength: {
      min: 0.5,
      max: 1,
      default: 0.8,
    },
    notes: 'Use includeHandsAndFaceOpenPose for detailed hand and face pose outlines',
  },

  tile: {
    id: 'tile',
    apiId: 'tile',
    name: 'Tile',
    description: 'Tile-based processing for detail enhancement and texture preservation',
    bestFor: ['textures', 'patterns', 'upscaling', 'detail enhancement'],
    outputType: 'other',
    hasThresholds: false,
    supportsPoseOptions: false,
    recommendedStrength: {
      min: 0.3,
      max: 0.8,
      default: 0.5,
    },
    notes: 'Useful for preserving fine details while allowing creative reinterpretation',
  },

  seg: {
    id: 'seg',
    apiId: 'seg',
    name: 'Segmentation',
    description: 'Semantic segmentation mapping for scene understanding',
    bestFor: ['complex scenes', 'multi-object composition', 'scene layout', 'object placement'],
    outputType: 'segmentation',
    hasThresholds: false,
    supportsPoseOptions: false,
    recommendedStrength: {
      min: 0.5,
      max: 1,
      default: 0.8,
    },
    notes: 'Creates color-coded regions for different semantic categories in the image',
  },

  lineart: {
    id: 'lineart',
    apiId: 'lineart',
    name: 'Line Art',
    description: 'Clean line art extraction for illustration-style generation',
    bestFor: ['illustrations', 'comics', 'sketches', 'coloring pages'],
    outputType: 'edge',
    hasThresholds: false,
    supportsPoseOptions: false,
    recommendedStrength: {
      min: 0.4,
      max: 1,
      default: 0.7,
    },
    notes: 'Produces clean, illustration-quality line work from photographs or artwork',
  },

  lineartAnime: {
    id: 'lineartAnime',
    apiId: 'lineart_anime',
    name: 'Anime Line Art',
    description: 'Anime-optimized line extraction for manga and anime styles',
    bestFor: ['anime', 'manga', 'cartoon', 'cel-shaded art'],
    outputType: 'edge',
    hasThresholds: false,
    supportsPoseOptions: false,
    recommendedStrength: {
      min: 0.4,
      max: 1,
      default: 0.75,
    },
    notes: 'Specialized for anime/manga art style with emphasis on character features',
  },

  shuffle: {
    id: 'shuffle',
    apiId: 'shuffle',
    name: 'Shuffle',
    description: 'Content shuffling for creative variation while preserving structure',
    bestFor: ['abstract art', 'creative variations', 'style mixing', 'experimental'],
    outputType: 'other',
    hasThresholds: false,
    supportsPoseOptions: false,
    recommendedStrength: {
      min: 0.2,
      max: 0.7,
      default: 0.4,
    },
    notes: 'Allows creative reinterpretation while maintaining general composition and color palette',
  },

  scribble: {
    id: 'scribble',
    apiId: 'scribble',
    name: 'Scribble',
    description: 'Rough sketch interpretation for concept art and ideation',
    bestFor: ['concept art', 'rough sketches', 'ideation', 'quick prototyping'],
    outputType: 'edge',
    hasThresholds: false,
    supportsPoseOptions: false,
    recommendedStrength: {
      min: 0.3,
      max: 0.9,
      default: 0.6,
    },
    notes: 'Tolerant of rough input, great for turning quick sketches into polished images',
  },

  softedge: {
    id: 'softedge',
    apiId: 'softedge',
    name: 'Soft Edge',
    description: 'Soft edge detection for smoother, more organic outlines',
    bestFor: ['soft rendering', 'dreamy aesthetics', 'portraits', 'organic shapes'],
    outputType: 'edge',
    hasThresholds: false,
    supportsPoseOptions: false,
    recommendedStrength: {
      min: 0.3,
      max: 0.9,
      default: 0.6,
    },
    notes: 'Produces softer, more gradual edge transitions than Canny or standard line art',
  },
};

/**
 * Array of all preprocessor IDs for validation
 */
export const CONTROLNET_PREPROCESSOR_IDS: readonly ControlNetPreprocessorId[] = [
  'canny',
  'depth',
  'mlsd',
  'normalbae',
  'openpose',
  'tile',
  'seg',
  'lineart',
  'lineartAnime',
  'shuffle',
  'scribble',
  'softedge',
] as const;

/**
 * Mapping from API identifiers to internal IDs
 */
const API_ID_TO_INTERNAL_ID: Record<string, ControlNetPreprocessorId> = {
  canny: 'canny',
  depth: 'depth',
  mlsd: 'mlsd',
  normalbae: 'normalbae',
  openpose: 'openpose',
  tile: 'tile',
  seg: 'seg',
  lineart: 'lineart',
  lineartAnime: 'lineartAnime',
  shuffle: 'shuffle',
  scribble: 'scribble',
  softedge: 'softedge',
};

// Also map the underscore version for API compatibility
const LINEART_ANIME_API_KEY = 'lineart_anime';
API_ID_TO_INTERNAL_ID[LINEART_ANIME_API_KEY] = 'lineartAnime';

/**
 * Get a preprocessor by its ID (internal or API format)
 */
export function getPreprocessor(id: string): ControlNetPreprocessor | undefined {
  // Check if it's a valid internal ID
  if (isValidPreprocessor(id)) {
    return CONTROLNET_PREPROCESSORS[id];
  }
  // Check if it's an API ID that needs mapping
  const internalId = API_ID_TO_INTERNAL_ID[id];
  if (internalId !== undefined) {
    return CONTROLNET_PREPROCESSORS[internalId];
  }
  return undefined;
}

/**
 * Get all preprocessors that produce a specific output type
 */
export function getPreprocessorsByOutputType(
  outputType: ControlNetOutputType,
): ControlNetPreprocessor[] {
  return Object.values(CONTROLNET_PREPROCESSORS).filter(
    (p: ControlNetPreprocessor) => p.outputType === outputType,
  );
}

/**
 * Check if a string is a valid preprocessor ID (internal format)
 */
export function isValidPreprocessor(id: string): id is ControlNetPreprocessorId {
  return CONTROLNET_PREPROCESSOR_IDS.includes(id as ControlNetPreprocessorId);
}

/**
 * Check if a string is a valid API preprocessor ID
 */
export function isValidApiPreprocessor(id: string): boolean {
  return id in API_ID_TO_INTERNAL_ID;
}

/**
 * Get preprocessors that support threshold configuration
 */
export function getPreprocessorsWithThresholds(): ControlNetPreprocessor[] {
  return Object.values(CONTROLNET_PREPROCESSORS).filter(
    (p: ControlNetPreprocessor) => p.hasThresholds,
  );
}

/**
 * Get preprocessors that support pose-specific options
 */
export function getPreprocessorsWithPoseOptions(): ControlNetPreprocessor[] {
  return Object.values(CONTROLNET_PREPROCESSORS).filter(
    (p: ControlNetPreprocessor) => p.supportsPoseOptions,
  );
}

/**
 * Get the recommended preprocessor for a specific use case
 */
export function getRecommendedPreprocessor(
  useCase:
    | 'architecture'
    | 'portrait'
    | 'anime'
    | 'sketch'
    | 'scene'
    | 'texture'
    | 'pose',
): ControlNetPreprocessorId {
  const recommendations: Record<string, ControlNetPreprocessorId> = {
    architecture: 'mlsd',
    portrait: 'openpose',
    anime: 'lineartAnime',
    sketch: 'scribble',
    scene: 'depth',
    texture: 'tile',
    pose: 'openpose',
  };
  const result = recommendations[useCase];
  return result ?? 'canny';
}

/**
 * Get all preprocessors as an array
 */
export function getAllPreprocessors(): ControlNetPreprocessor[] {
  return Object.values(CONTROLNET_PREPROCESSORS);
}

/**
 * Get all edge-type preprocessors
 */
export function getEdgePreprocessors(): ControlNetPreprocessor[] {
  return getPreprocessorsByOutputType('edge');
}

/**
 * Get the default preprocessor (Canny - most versatile)
 */
export function getDefaultPreprocessor(): ControlNetPreprocessor {
  return CONTROLNET_PREPROCESSORS.canny;
}
