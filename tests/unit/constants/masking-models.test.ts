import { describe, it, expect, vi } from 'vitest';

vi.mock('../../../src/shared/config.js', () => ({
  config: {
    RUNWARE_API_KEY: 'test-api-key-that-is-at-least-32-characters-long',
    REQUEST_TIMEOUT_MS: 60000,
    POLL_MAX_ATTEMPTS: 150,
    MAX_FILE_SIZE_MB: 50,
    ALLOWED_FILE_ROOTS: [],
    LOG_LEVEL: 'error',
    NODE_ENV: 'test',
    RATE_LIMIT_MAX_TOKENS: 10,
    RATE_LIMIT_REFILL_RATE: 1,
    WATCH_FOLDERS: [],
    WATCH_DEBOUNCE_MS: 500,
  },
  API_BASE_URL: 'https://api.runware.ai/v1',
}));

import {
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
} from '../../../src/constants/masking-models.js';

// ============================================================================
// MASKING_MODELS catalog
// ============================================================================

describe('MASKING_MODELS', () => {
  const allKeys = Object.keys(MASKING_MODELS);
  const allModels = Object.values(MASKING_MODELS);

  it('contains 15 masking models', () => {
    expect(allKeys.length).toBe(15);
  });

  it('MASKING_MODEL_IDS has 15 entries', () => {
    expect(MASKING_MODEL_IDS.length).toBe(15);
  });

  it('all IDs in MASKING_MODEL_IDS exist in MASKING_MODELS', () => {
    for (const id of MASKING_MODEL_IDS) {
      expect(MASKING_MODELS[id]).toBeDefined();
    }
  });

  it('every model has an id that matches its key', () => {
    for (const key of allKeys) {
      const model = MASKING_MODELS[key as keyof typeof MASKING_MODELS];
      expect(model.id).toBe(key);
    }
  });

  it('every model has required fields', () => {
    for (const model of allModels) {
      expect(model.id).toBeTruthy();
      expect(model.name).toBeTruthy();
      expect(model.modelName).toBeTruthy();
      expect(model.description).toBeTruthy();
      expect(['face', 'body', 'facial-feature', 'general']).toContain(model.category);
      expect(model.detects).toBeInstanceOf(Array);
      expect(model.detects.length).toBeGreaterThan(0);
      expect(model.recommendedConfidence).toBeGreaterThan(0);
      expect(model.recommendedConfidence).toBeLessThanOrEqual(1);
      expect(typeof model.worksWithRealistic).toBe('boolean');
      expect(typeof model.worksWithAnime).toBe('boolean');
    }
  });

  it('all model IDs follow runware:35@N pattern', () => {
    for (const key of allKeys) {
      expect(key).toMatch(/^runware:35@\d+$/);
    }
  });

  it('all models work with realistic content', () => {
    for (const model of allModels) {
      expect(model.worksWithRealistic).toBe(true);
    }
  });
});

// ============================================================================
// Category counts
// ============================================================================

describe('model categories', () => {
  it('has 5 face detection models', () => {
    const faceModels = getMaskingModelsByCategory('face');
    expect(faceModels.length).toBe(5);
  });

  it('has 7 facial feature models', () => {
    const facialFeatureModels = getMaskingModelsByCategory('facial-feature');
    expect(facialFeatureModels.length).toBe(7);
  });

  it('has 3 body detection models', () => {
    const bodyModels = getMaskingModelsByCategory('body');
    expect(bodyModels.length).toBe(3);
  });

  it('categories sum to 15', () => {
    const face = getMaskingModelsByCategory('face');
    const facialFeature = getMaskingModelsByCategory('facial-feature');
    const body = getMaskingModelsByCategory('body');
    expect(face.length + facialFeature.length + body.length).toBe(15);
  });
});

// ============================================================================
// getMaskingModel
// ============================================================================

describe('getMaskingModel', () => {
  it('returns model for valid ID', () => {
    const model = getMaskingModel('runware:35@1');
    expect(model).toBeDefined();
    expect(model?.name).toBe('Face Detection');
    expect(model?.category).toBe('face');
  });

  it('returns model for each valid ID in MASKING_MODEL_IDS', () => {
    for (const id of MASKING_MODEL_IDS) {
      const model = getMaskingModel(id);
      expect(model).toBeDefined();
      expect(model?.id).toBe(id);
    }
  });

  it('returns undefined for invalid ID', () => {
    expect(getMaskingModel('nonexistent')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(getMaskingModel('')).toBeUndefined();
  });

  it('returns undefined for runware:35@999', () => {
    expect(getMaskingModel('runware:35@999')).toBeUndefined();
  });
});

// ============================================================================
// getMaskingModelsByCategory
// ============================================================================

describe('getMaskingModelsByCategory', () => {
  it('returns face models', () => {
    const models = getMaskingModelsByCategory('face');
    for (const model of models) {
      expect(model.category).toBe('face');
    }
  });

  it('returns facial-feature models', () => {
    const models = getMaskingModelsByCategory('facial-feature');
    for (const model of models) {
      expect(model.category).toBe('facial-feature');
    }
  });

  it('returns body models', () => {
    const models = getMaskingModelsByCategory('body');
    for (const model of models) {
      expect(model.category).toBe('body');
    }
  });

  it('returns empty array for general category (no models have it)', () => {
    const models = getMaskingModelsByCategory('general');
    expect(models).toEqual([]);
  });
});

// ============================================================================
// getDefaultMaskingModel
// ============================================================================

describe('getDefaultMaskingModel', () => {
  it('returns Face Detection (runware:35@1) as default', () => {
    const model = getDefaultMaskingModel();
    expect(model.id).toBe('runware:35@1');
    expect(model.name).toBe('Face Detection');
  });
});

// ============================================================================
// getMaskingModelsByDetection
// ============================================================================

describe('getMaskingModelsByDetection', () => {
  it('finds models that detect face', () => {
    const models = getMaskingModelsByDetection('face');
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.detects).toContain('face');
    }
  });

  it('finds models that detect eyes', () => {
    const models = getMaskingModelsByDetection('eyes');
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.detects).toContain('eyes');
    }
  });

  it('finds models that detect lips', () => {
    const models = getMaskingModelsByDetection('lips');
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.detects).toContain('lips');
    }
  });

  it('finds models that detect nose', () => {
    const models = getMaskingModelsByDetection('nose');
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.detects).toContain('nose');
    }
  });

  it('finds models that detect hands', () => {
    const models = getMaskingModelsByDetection('hands');
    expect(models.length).toBe(1);
    expect(models[0]?.id).toBe('runware:35@3');
  });

  it('finds models that detect person', () => {
    const models = getMaskingModelsByDetection('person');
    expect(models.length).toBe(2);
  });

  it('returns empty array for non-existent detection element', () => {
    const models = getMaskingModelsByDetection('nonexistent');
    expect(models).toEqual([]);
  });
});

// ============================================================================
// getMaskingModelsForAnime
// ============================================================================

describe('getMaskingModelsForAnime', () => {
  it('returns only models that work with anime', () => {
    const models = getMaskingModelsForAnime();
    expect(models.length).toBeGreaterThan(0);
    for (const model of models) {
      expect(model.worksWithAnime).toBe(true);
    }
  });

  it('includes YOLOv8 face models', () => {
    const models = getMaskingModelsForAnime();
    const ids = models.map((m) => m.id);
    expect(ids).toContain('runware:35@1');
    expect(ids).toContain('runware:35@2');
  });

  it('includes hand and person models', () => {
    const models = getMaskingModelsForAnime();
    const ids = models.map((m) => m.id);
    expect(ids).toContain('runware:35@3');
    expect(ids).toContain('runware:35@4');
    expect(ids).toContain('runware:35@5');
  });

  it('excludes MediaPipe-based models', () => {
    const models = getMaskingModelsForAnime();
    const ids = models.map((m) => m.id);
    expect(ids).not.toContain('runware:35@6');
    expect(ids).not.toContain('runware:35@7');
    expect(ids).not.toContain('runware:35@8');
  });
});

// ============================================================================
// getMaskingModelsForRealistic
// ============================================================================

describe('getMaskingModelsForRealistic', () => {
  it('returns all models (all work with realistic)', () => {
    const models = getMaskingModelsForRealistic();
    expect(models.length).toBe(15);
  });
});

// ============================================================================
// isValidMaskingModel
// ============================================================================

describe('isValidMaskingModel', () => {
  it('returns true for all valid IDs', () => {
    for (const id of MASKING_MODEL_IDS) {
      expect(isValidMaskingModel(id)).toBe(true);
    }
  });

  it('returns false for invalid IDs', () => {
    expect(isValidMaskingModel('invalid')).toBe(false);
    expect(isValidMaskingModel('')).toBe(false);
    expect(isValidMaskingModel('runware:35@99')).toBe(false);
  });
});

// ============================================================================
// getFaceDetectionModels
// ============================================================================

describe('getFaceDetectionModels', () => {
  it('returns 5 face detection models', () => {
    const models = getFaceDetectionModels();
    expect(models.length).toBe(5);
    for (const model of models) {
      expect(model.category).toBe('face');
    }
  });
});

// ============================================================================
// getFacialFeatureModels
// ============================================================================

describe('getFacialFeatureModels', () => {
  it('returns 7 facial feature models', () => {
    const models = getFacialFeatureModels();
    expect(models.length).toBe(7);
    for (const model of models) {
      expect(model.category).toBe('facial-feature');
    }
  });
});

// ============================================================================
// getBodyDetectionModels
// ============================================================================

describe('getBodyDetectionModels', () => {
  it('returns 3 body detection models', () => {
    const models = getBodyDetectionModels();
    expect(models.length).toBe(3);
    for (const model of models) {
      expect(model.category).toBe('body');
    }
  });
});

// ============================================================================
// getRecommendedMaskingModel
// ============================================================================

describe('getRecommendedMaskingModel', () => {
  it('recommends runware:35@1 for face', () => {
    const model = getRecommendedMaskingModel('face');
    expect(model.id).toBe('runware:35@1');
  });

  it('recommends runware:35@15 for eyes', () => {
    const model = getRecommendedMaskingModel('eyes');
    expect(model.id).toBe('runware:35@15');
  });

  it('recommends runware:35@14 for lips', () => {
    const model = getRecommendedMaskingModel('lips');
    expect(model.id).toBe('runware:35@14');
  });

  it('recommends runware:35@13 for nose', () => {
    const model = getRecommendedMaskingModel('nose');
    expect(model.id).toBe('runware:35@13');
  });

  it('recommends runware:35@3 for hands', () => {
    const model = getRecommendedMaskingModel('hands');
    expect(model.id).toBe('runware:35@3');
  });

  it('recommends runware:35@5 for person', () => {
    const model = getRecommendedMaskingModel('person');
    expect(model.id).toBe('runware:35@5');
  });

  it('recommends runware:35@1 for animeFace', () => {
    const model = getRecommendedMaskingModel('animeFace');
    expect(model.id).toBe('runware:35@1');
  });
});

// ============================================================================
// getAllMaskingModels
// ============================================================================

describe('getAllMaskingModels', () => {
  it('returns all 15 models', () => {
    const models = getAllMaskingModels();
    expect(models.length).toBe(15);
  });
});

// ============================================================================
// getAllMaskingModelIds
// ============================================================================

describe('getAllMaskingModelIds', () => {
  it('returns all 15 model IDs', () => {
    const ids = getAllMaskingModelIds();
    expect(ids.length).toBe(15);
  });

  it('returns a copy (not the original array)', () => {
    const ids = getAllMaskingModelIds();
    expect(ids).toEqual([...MASKING_MODEL_IDS]);
    expect(ids).not.toBe(MASKING_MODEL_IDS);
  });

  it('includes expected IDs', () => {
    const ids = getAllMaskingModelIds();
    expect(ids).toContain('runware:35@1');
    expect(ids).toContain('runware:35@15');
  });
});
