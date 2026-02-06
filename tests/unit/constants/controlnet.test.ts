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
} from '../../../src/constants/controlnet.js';

// ============================================================================
// CONTROLNET_PREPROCESSORS catalog
// ============================================================================

describe('CONTROLNET_PREPROCESSORS', () => {
  it('contains exactly 12 preprocessors', () => {
    const keys = Object.keys(CONTROLNET_PREPROCESSORS);
    expect(keys.length).toBe(12);
  });

  it('CONTROLNET_PREPROCESSOR_IDS has 12 entries', () => {
    expect(CONTROLNET_PREPROCESSOR_IDS.length).toBe(12);
  });

  it('all IDs in CONTROLNET_PREPROCESSOR_IDS exist in CONTROLNET_PREPROCESSORS', () => {
    for (const id of CONTROLNET_PREPROCESSOR_IDS) {
      expect(CONTROLNET_PREPROCESSORS[id]).toBeDefined();
    }
  });

  it('every preprocessor has required fields', () => {
    for (const id of CONTROLNET_PREPROCESSOR_IDS) {
      const p = CONTROLNET_PREPROCESSORS[id];
      expect(p.id).toBe(id);
      expect(p.apiId).toBeTruthy();
      expect(p.name).toBeTruthy();
      expect(p.description).toBeTruthy();
      expect(p.bestFor).toBeInstanceOf(Array);
      expect(p.bestFor.length).toBeGreaterThan(0);
      expect(['edge', 'depth', 'pose', 'segmentation', 'other']).toContain(p.outputType);
      expect(typeof p.hasThresholds).toBe('boolean');
      expect(typeof p.supportsPoseOptions).toBe('boolean');
      expect(p.recommendedStrength).toBeDefined();
      expect(p.recommendedStrength.min).toBeGreaterThanOrEqual(0);
      expect(p.recommendedStrength.max).toBeLessThanOrEqual(1);
      expect(p.recommendedStrength.default).toBeGreaterThanOrEqual(p.recommendedStrength.min);
      expect(p.recommendedStrength.default).toBeLessThanOrEqual(p.recommendedStrength.max);
    }
  });

  it('contains all expected preprocessor IDs', () => {
    const expectedIds = [
      'canny', 'depth', 'mlsd', 'normalbae', 'openpose', 'tile',
      'seg', 'lineart', 'lineartAnime', 'shuffle', 'scribble', 'softedge',
    ];
    for (const id of expectedIds) {
      expect(CONTROLNET_PREPROCESSOR_IDS).toContain(id);
    }
  });

  it('canny has thresholds', () => {
    expect(CONTROLNET_PREPROCESSORS.canny.hasThresholds).toBe(true);
  });

  it('openpose supports pose options', () => {
    expect(CONTROLNET_PREPROCESSORS.openpose.supportsPoseOptions).toBe(true);
  });

  it('lineartAnime has different apiId from internal id', () => {
    expect(CONTROLNET_PREPROCESSORS.lineartAnime.apiId).toBe('lineart_anime');
  });
});

// ============================================================================
// getPreprocessor
// ============================================================================

describe('getPreprocessor', () => {
  it('returns preprocessor by internal ID', () => {
    const p = getPreprocessor('canny');
    expect(p).toBeDefined();
    expect(p?.id).toBe('canny');
    expect(p?.name).toBe('Canny Edge');
  });

  it('returns preprocessor by API ID (lineart_anime)', () => {
    const p = getPreprocessor('lineart_anime');
    expect(p).toBeDefined();
    expect(p?.id).toBe('lineartAnime');
  });

  it('returns undefined for invalid ID', () => {
    expect(getPreprocessor('nonexistent')).toBeUndefined();
  });

  it('returns undefined for empty string', () => {
    expect(getPreprocessor('')).toBeUndefined();
  });

  it('returns preprocessor for each valid internal ID', () => {
    for (const id of CONTROLNET_PREPROCESSOR_IDS) {
      const p = getPreprocessor(id);
      expect(p).toBeDefined();
      expect(p?.id).toBe(id);
    }
  });
});

// ============================================================================
// getPreprocessorsByOutputType
// ============================================================================

describe('getPreprocessorsByOutputType', () => {
  it('returns edge preprocessors', () => {
    const edgeProcessors = getPreprocessorsByOutputType('edge');
    expect(edgeProcessors.length).toBeGreaterThan(0);
    for (const p of edgeProcessors) {
      expect(p.outputType).toBe('edge');
    }
  });

  it('returns depth preprocessors', () => {
    const depthProcessors = getPreprocessorsByOutputType('depth');
    expect(depthProcessors.length).toBe(1);
    expect(depthProcessors[0]?.id).toBe('depth');
  });

  it('returns pose preprocessors', () => {
    const poseProcessors = getPreprocessorsByOutputType('pose');
    expect(poseProcessors.length).toBe(1);
    expect(poseProcessors[0]?.id).toBe('openpose');
  });

  it('returns segmentation preprocessors', () => {
    const segProcessors = getPreprocessorsByOutputType('segmentation');
    expect(segProcessors.length).toBe(1);
    expect(segProcessors[0]?.id).toBe('seg');
  });

  it('returns other-type preprocessors', () => {
    const otherProcessors = getPreprocessorsByOutputType('other');
    expect(otherProcessors.length).toBeGreaterThan(0);
    for (const p of otherProcessors) {
      expect(p.outputType).toBe('other');
    }
  });

  it('edge preprocessors include canny, mlsd, lineart, lineartAnime, scribble, softedge', () => {
    const edgeProcessors = getPreprocessorsByOutputType('edge');
    const ids = edgeProcessors.map((p) => p.id);
    expect(ids).toContain('canny');
    expect(ids).toContain('mlsd');
    expect(ids).toContain('lineart');
    expect(ids).toContain('lineartAnime');
    expect(ids).toContain('scribble');
    expect(ids).toContain('softedge');
  });
});

// ============================================================================
// isValidPreprocessor
// ============================================================================

describe('isValidPreprocessor', () => {
  it('returns true for all valid IDs', () => {
    for (const id of CONTROLNET_PREPROCESSOR_IDS) {
      expect(isValidPreprocessor(id)).toBe(true);
    }
  });

  it('returns false for invalid IDs', () => {
    expect(isValidPreprocessor('invalid')).toBe(false);
    expect(isValidPreprocessor('')).toBe(false);
    expect(isValidPreprocessor('lineart_anime')).toBe(false); // API ID, not internal
  });
});

// ============================================================================
// isValidApiPreprocessor
// ============================================================================

describe('isValidApiPreprocessor', () => {
  it('returns true for API IDs', () => {
    expect(isValidApiPreprocessor('canny')).toBe(true);
    expect(isValidApiPreprocessor('lineart_anime')).toBe(true);
    expect(isValidApiPreprocessor('openpose')).toBe(true);
  });

  it('returns true for internal IDs that also serve as API IDs', () => {
    expect(isValidApiPreprocessor('depth')).toBe(true);
    expect(isValidApiPreprocessor('tile')).toBe(true);
  });

  it('returns false for invalid IDs', () => {
    expect(isValidApiPreprocessor('nonexistent')).toBe(false);
    expect(isValidApiPreprocessor('')).toBe(false);
  });
});

// ============================================================================
// getPreprocessorsWithThresholds
// ============================================================================

describe('getPreprocessorsWithThresholds', () => {
  it('returns only canny (the only preprocessor with thresholds)', () => {
    const processors = getPreprocessorsWithThresholds();
    expect(processors.length).toBe(1);
    expect(processors[0]?.id).toBe('canny');
    expect(processors[0]?.hasThresholds).toBe(true);
  });
});

// ============================================================================
// getPreprocessorsWithPoseOptions
// ============================================================================

describe('getPreprocessorsWithPoseOptions', () => {
  it('returns only openpose', () => {
    const processors = getPreprocessorsWithPoseOptions();
    expect(processors.length).toBe(1);
    expect(processors[0]?.id).toBe('openpose');
    expect(processors[0]?.supportsPoseOptions).toBe(true);
  });
});

// ============================================================================
// getRecommendedPreprocessor
// ============================================================================

describe('getRecommendedPreprocessor', () => {
  it('recommends mlsd for architecture', () => {
    expect(getRecommendedPreprocessor('architecture')).toBe('mlsd');
  });

  it('recommends openpose for portrait', () => {
    expect(getRecommendedPreprocessor('portrait')).toBe('openpose');
  });

  it('recommends lineartAnime for anime', () => {
    expect(getRecommendedPreprocessor('anime')).toBe('lineartAnime');
  });

  it('recommends scribble for sketch', () => {
    expect(getRecommendedPreprocessor('sketch')).toBe('scribble');
  });

  it('recommends depth for scene', () => {
    expect(getRecommendedPreprocessor('scene')).toBe('depth');
  });

  it('recommends tile for texture', () => {
    expect(getRecommendedPreprocessor('texture')).toBe('tile');
  });

  it('recommends openpose for pose', () => {
    expect(getRecommendedPreprocessor('pose')).toBe('openpose');
  });
});

// ============================================================================
// getAllPreprocessors
// ============================================================================

describe('getAllPreprocessors', () => {
  it('returns all 12 preprocessors', () => {
    const all = getAllPreprocessors();
    expect(all.length).toBe(12);
  });

  it('returns preprocessor objects with id field', () => {
    const all = getAllPreprocessors();
    for (const p of all) {
      expect(p.id).toBeTruthy();
    }
  });
});

// ============================================================================
// getEdgePreprocessors
// ============================================================================

describe('getEdgePreprocessors', () => {
  it('returns only edge-type preprocessors', () => {
    const edge = getEdgePreprocessors();
    expect(edge.length).toBeGreaterThan(0);
    for (const p of edge) {
      expect(p.outputType).toBe('edge');
    }
  });

  it('returns same result as getPreprocessorsByOutputType("edge")', () => {
    const direct = getEdgePreprocessors();
    const viaType = getPreprocessorsByOutputType('edge');
    expect(direct).toEqual(viaType);
  });
});

// ============================================================================
// getDefaultPreprocessor
// ============================================================================

describe('getDefaultPreprocessor', () => {
  it('returns canny as default', () => {
    const defaultP = getDefaultPreprocessor();
    expect(defaultP.id).toBe('canny');
    expect(defaultP.name).toBe('Canny Edge');
  });
});
