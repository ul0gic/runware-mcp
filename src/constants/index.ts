/**
 * Constants Module
 *
 * Barrel export for all constant definitions used throughout the Runware MCP server.
 * This includes model catalogs, preprocessor definitions, and related helper functions.
 */

// =============================================================================
// Video Models
// =============================================================================
export {
  VIDEO_MODELS,
  getVideoModel,
  getVideoModelsByProvider,
  getAllVideoProviders,
  getDefaultVideoModel,
  getVideoModelsByFeature,
  getVideoModelsWithAudio,
  getVideoModelsByMinDuration,
  getVideoModelsByResolution,
  isValidVideoModel,
  getAllVideoModelIds,
} from './video-models.js';

export type { VideoModel, VideoProvider, VideoModelId } from './video-models.js';

// =============================================================================
// Audio Models
// =============================================================================
export {
  AUDIO_MODELS,
  TTS_VOICES,
  TTS_VOICE_INFO,
  getAudioModel,
  getAudioModelsByCapability,
  getAudioModelsByProvider,
  getAllAudioProviders,
  getDefaultAudioModel,
  getAudioModelsWithComposition,
  getAudioModelsByMinDuration,
  isValidAudioModel,
  isValidTTSVoice,
  getTTSVoiceInfo,
  getTTSVoicesByGender,
  getAllAudioModelIds,
  getAllTTSVoices,
} from './audio-models.js';

export type {
  AudioModel,
  AudioProvider,
  AudioModelId,
  AudioCapability,
  TTSVoice,
  TTSVoiceInfo,
} from './audio-models.js';

// =============================================================================
// ControlNet Preprocessors
// =============================================================================
export {
  CONTROLNET_PREPROCESSORS,
  CONTROLNET_PREPROCESSOR_IDS,
  getPreprocessor,
  getPreprocessorsByOutputType,
  isValidPreprocessor,
  isValidApiPreprocessor,
  getPreprocessorsWithThresholds,
  getPreprocessorsWithPoseOptions,
  getRecommendedPreprocessor,
  getAllPreprocessors,
  getEdgePreprocessors,
  getDefaultPreprocessor,
} from './controlnet.js';

export type {
  ControlNetPreprocessor,
  ControlNetPreprocessorId,
  ControlNetOutputType,
} from './controlnet.js';

// =============================================================================
// Masking Models
// =============================================================================
export {
  MASKING_MODELS,
  MASKING_MODEL_IDS,
  getMaskingModel,
  getMaskingModelsByCategory,
  getDefaultMaskingModel,
  getMaskingModelsByDetection,
  getMaskingModelsForAnime,
  getMaskingModelsForRealistic,
  isValidMaskingModel,
  getFaceDetectionModels,
  getFacialFeatureModels,
  getBodyDetectionModels,
  getRecommendedMaskingModel,
  getAllMaskingModels,
  getAllMaskingModelIds,
} from './masking-models.js';

export type { MaskingModel, MaskingModelId, MaskingCategory } from './masking-models.js';
