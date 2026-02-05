import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';

import {
  positivePromptSchema,
  modelIdentifierSchema,
  dimensionSchema,
  imageInputSchema,
  stepsSchema,
  cfgScaleSchema,
  seedSchema,
  strengthSchema,
  outputTypeSchema,
  outputFormatSchema,
  controlNetConfigSchema,
  loraConfigSchema,
  uuidSchema,
  MIN_DIMENSION,
  MAX_DIMENSION,
  DIMENSION_STEP,
  MIN_PROMPT_LENGTH,
  MAX_PROMPT_LENGTH,
  MIN_STEPS,
  MAX_STEPS,
  MIN_CFG_SCALE,
  MAX_CFG_SCALE,
} from '../../../src/shared/validation.js';

// ============================================================================
// Helpers
// ============================================================================

function expectZodError(fn: () => unknown): ZodError {
  try {
    fn();
    throw new Error('Expected ZodError but no error was thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
    return error as ZodError;
  }
}

// ============================================================================
// positivePromptSchema
// ============================================================================

describe('positivePromptSchema', () => {
  it('accepts valid prompt with minimum length', () => {
    const result = positivePromptSchema.parse('ab');
    expect(result).toBe('ab');
  });

  it('accepts prompt at maximum length', () => {
    const longPrompt = 'a'.repeat(MAX_PROMPT_LENGTH);
    const result = positivePromptSchema.parse(longPrompt);
    expect(result).toBe(longPrompt);
  });

  it('rejects prompt shorter than minimum', () => {
    expectZodError(() => positivePromptSchema.parse('a'));
  });

  it('rejects empty string', () => {
    expectZodError(() => positivePromptSchema.parse(''));
  });

  it('rejects prompt exceeding maximum length', () => {
    const tooLong = 'a'.repeat(MAX_PROMPT_LENGTH + 1);
    expectZodError(() => positivePromptSchema.parse(tooLong));
  });

  it('rejects non-string input', () => {
    expectZodError(() => positivePromptSchema.parse(123));
  });
});

// ============================================================================
// modelIdentifierSchema
// ============================================================================

describe('modelIdentifierSchema', () => {
  it('accepts valid AIR format', () => {
    const result = modelIdentifierSchema.parse('civitai:123@456');
    expect(result).toBe('civitai:123@456');
  });

  it('accepts format with hyphens in provider', () => {
    const result = modelIdentifierSchema.parse('my-provider:789@101');
    expect(result).toBe('my-provider:789@101');
  });

  it('rejects missing version', () => {
    expectZodError(() => modelIdentifierSchema.parse('civitai:123'));
  });

  it('rejects missing model ID', () => {
    expectZodError(() => modelIdentifierSchema.parse('civitai:@456'));
  });

  it('rejects completely invalid format', () => {
    expectZodError(() => modelIdentifierSchema.parse('just-a-string'));
  });

  it('rejects empty string', () => {
    expectZodError(() => modelIdentifierSchema.parse(''));
  });

  it('rejects model with non-numeric IDs', () => {
    expectZodError(() => modelIdentifierSchema.parse('civitai:abc@def'));
  });
});

// ============================================================================
// dimensionSchema
// ============================================================================

describe('dimensionSchema', () => {
  it('accepts minimum dimension', () => {
    const result = dimensionSchema.parse(MIN_DIMENSION);
    expect(result).toBe(MIN_DIMENSION);
  });

  it('accepts maximum dimension', () => {
    const result = dimensionSchema.parse(MAX_DIMENSION);
    expect(result).toBe(MAX_DIMENSION);
  });

  it('accepts valid multiple of 64', () => {
    const result = dimensionSchema.parse(1024);
    expect(result).toBe(1024);
  });

  it('rejects value below minimum', () => {
    expectZodError(() => dimensionSchema.parse(MIN_DIMENSION - DIMENSION_STEP));
  });

  it('rejects value above maximum', () => {
    expectZodError(() => dimensionSchema.parse(MAX_DIMENSION + DIMENSION_STEP));
  });

  it('rejects non-multiple of 64', () => {
    expectZodError(() => dimensionSchema.parse(1000));
  });

  it('rejects float value', () => {
    expectZodError(() => dimensionSchema.parse(1024.5));
  });

  it('rejects non-number', () => {
    expectZodError(() => dimensionSchema.parse('1024'));
  });
});

// ============================================================================
// imageInputSchema
// ============================================================================

describe('imageInputSchema', () => {
  it('accepts valid UUID v4', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    const result = imageInputSchema.parse(uuid);
    expect(result).toBe(uuid);
  });

  it('accepts valid HTTPS URL', () => {
    const url = 'https://example.com/image.png';
    const result = imageInputSchema.parse(url);
    expect(result).toBe(url);
  });

  it('accepts valid HTTP URL', () => {
    const url = 'http://example.com/image.jpg';
    const result = imageInputSchema.parse(url);
    expect(result).toBe(url);
  });

  it('accepts valid base64 string (long enough)', () => {
    // At least 100 chars of base64
    const base64 = 'A'.repeat(200);
    const result = imageInputSchema.parse(base64);
    expect(result).toBe(base64);
  });

  it('accepts valid data URI', () => {
    const dataUri = `data:image/png;base64,${'A'.repeat(100)}`;
    const result = imageInputSchema.parse(dataUri);
    expect(result).toBe(dataUri);
  });

  it('accepts data URI for jpeg', () => {
    const dataUri = `data:image/jpeg;base64,${'A'.repeat(100)}`;
    const result = imageInputSchema.parse(dataUri);
    expect(result).toBe(dataUri);
  });

  it('accepts data URI for webp', () => {
    const dataUri = `data:image/webp;base64,${'A'.repeat(100)}`;
    const result = imageInputSchema.parse(dataUri);
    expect(result).toBe(dataUri);
  });

  it('rejects empty string', () => {
    expectZodError(() => imageInputSchema.parse(''));
  });

  it('rejects non-string', () => {
    expectZodError(() => imageInputSchema.parse(123));
  });
});

// ============================================================================
// stepsSchema
// ============================================================================

describe('stepsSchema', () => {
  it('accepts minimum steps', () => {
    expect(stepsSchema.parse(MIN_STEPS)).toBe(MIN_STEPS);
  });

  it('accepts maximum steps', () => {
    expect(stepsSchema.parse(MAX_STEPS)).toBe(MAX_STEPS);
  });

  it('accepts value in range', () => {
    expect(stepsSchema.parse(30)).toBe(30);
  });

  it('rejects zero', () => {
    expectZodError(() => stepsSchema.parse(0));
  });

  it('rejects value above maximum', () => {
    expectZodError(() => stepsSchema.parse(MAX_STEPS + 1));
  });

  it('rejects float', () => {
    expectZodError(() => stepsSchema.parse(10.5));
  });
});

// ============================================================================
// cfgScaleSchema
// ============================================================================

describe('cfgScaleSchema', () => {
  it('accepts minimum CFG scale', () => {
    expect(cfgScaleSchema.parse(MIN_CFG_SCALE)).toBe(MIN_CFG_SCALE);
  });

  it('accepts maximum CFG scale', () => {
    expect(cfgScaleSchema.parse(MAX_CFG_SCALE)).toBe(MAX_CFG_SCALE);
  });

  it('accepts float value in range', () => {
    expect(cfgScaleSchema.parse(7.5)).toBe(7.5);
  });

  it('rejects negative value', () => {
    expectZodError(() => cfgScaleSchema.parse(-1));
  });

  it('rejects value above maximum', () => {
    expectZodError(() => cfgScaleSchema.parse(MAX_CFG_SCALE + 1));
  });
});

// ============================================================================
// seedSchema
// ============================================================================

describe('seedSchema', () => {
  it('accepts zero', () => {
    expect(seedSchema.parse(0)).toBe(0);
  });

  it('accepts positive integer', () => {
    expect(seedSchema.parse(42)).toBe(42);
  });

  it('accepts undefined (optional)', () => {
    expect(seedSchema.parse(undefined)).toBeUndefined();
  });

  it('rejects negative value', () => {
    expectZodError(() => seedSchema.parse(-1));
  });

  it('rejects float', () => {
    expectZodError(() => seedSchema.parse(3.14));
  });
});

// ============================================================================
// strengthSchema
// ============================================================================

describe('strengthSchema', () => {
  it('accepts 0', () => {
    expect(strengthSchema.parse(0)).toBe(0);
  });

  it('accepts 1', () => {
    expect(strengthSchema.parse(1)).toBe(1);
  });

  it('accepts 0.5', () => {
    expect(strengthSchema.parse(0.5)).toBe(0.5);
  });

  it('rejects negative', () => {
    expectZodError(() => strengthSchema.parse(-0.1));
  });

  it('rejects above 1', () => {
    expectZodError(() => strengthSchema.parse(1.1));
  });
});

// ============================================================================
// outputTypeSchema
// ============================================================================

describe('outputTypeSchema', () => {
  it('accepts URL', () => {
    expect(outputTypeSchema.parse('URL')).toBe('URL');
  });

  it('accepts base64Data', () => {
    expect(outputTypeSchema.parse('base64Data')).toBe('base64Data');
  });

  it('accepts dataURI', () => {
    expect(outputTypeSchema.parse('dataURI')).toBe('dataURI');
  });

  it('rejects invalid output type', () => {
    expectZodError(() => outputTypeSchema.parse('binary'));
  });

  it('rejects case variations', () => {
    expectZodError(() => outputTypeSchema.parse('url'));
  });
});

// ============================================================================
// outputFormatSchema
// ============================================================================

describe('outputFormatSchema', () => {
  it('accepts JPG', () => {
    expect(outputFormatSchema.parse('JPG')).toBe('JPG');
  });

  it('accepts PNG', () => {
    expect(outputFormatSchema.parse('PNG')).toBe('PNG');
  });

  it('accepts WEBP', () => {
    expect(outputFormatSchema.parse('WEBP')).toBe('WEBP');
  });

  it('rejects invalid format', () => {
    expectZodError(() => outputFormatSchema.parse('BMP'));
  });

  it('rejects lowercase', () => {
    expectZodError(() => outputFormatSchema.parse('png'));
  });
});

// ============================================================================
// controlNetConfigSchema
// ============================================================================

describe('controlNetConfigSchema', () => {
  it('accepts valid config with required fields', () => {
    const config = {
      guideImage: '550e8400-e29b-41d4-a716-446655440000',
      preprocessor: 'canny',
    };
    const result = controlNetConfigSchema.parse(config);
    expect(result.preprocessor).toBe('canny');
  });

  it('accepts config with all optional fields', () => {
    const config = {
      guideImage: 'https://example.com/image.png',
      preprocessor: 'depth',
      model: 'controlnet-model',
      weight: 0.8,
      startStep: 0.0,
      endStep: 1.0,
    };
    const result = controlNetConfigSchema.parse(config);
    expect(result.weight).toBe(0.8);
    expect(result.startStep).toBe(0.0);
    expect(result.endStep).toBe(1.0);
  });

  it('rejects invalid preprocessor', () => {
    expectZodError(() =>
      controlNetConfigSchema.parse({
        guideImage: '550e8400-e29b-41d4-a716-446655440000',
        preprocessor: 'invalid_preprocessor',
      }),
    );
  });

  it('rejects weight out of range', () => {
    expectZodError(() =>
      controlNetConfigSchema.parse({
        guideImage: '550e8400-e29b-41d4-a716-446655440000',
        preprocessor: 'canny',
        weight: 1.5,
      }),
    );
  });

  it('rejects missing guideImage', () => {
    expectZodError(() =>
      controlNetConfigSchema.parse({
        preprocessor: 'canny',
      }),
    );
  });
});

// ============================================================================
// loraConfigSchema
// ============================================================================

describe('loraConfigSchema', () => {
  it('accepts valid config with model', () => {
    const result = loraConfigSchema.parse({ model: 'lora-model' });
    expect(result.model).toBe('lora-model');
    expect(result.weight).toBe(1); // default
  });

  it('accepts config with custom weight', () => {
    const result = loraConfigSchema.parse({ model: 'lora-model', weight: 0.5 });
    expect(result.weight).toBe(0.5);
  });

  it('accepts negative weight', () => {
    const result = loraConfigSchema.parse({ model: 'lora-model', weight: -1.5 });
    expect(result.weight).toBe(-1.5);
  });

  it('rejects weight below -2', () => {
    expectZodError(() =>
      loraConfigSchema.parse({ model: 'lora-model', weight: -2.5 }),
    );
  });

  it('rejects weight above 2', () => {
    expectZodError(() =>
      loraConfigSchema.parse({ model: 'lora-model', weight: 2.5 }),
    );
  });

  it('rejects missing model', () => {
    expectZodError(() => loraConfigSchema.parse({ weight: 1 }));
  });
});

// ============================================================================
// uuidSchema
// ============================================================================

describe('uuidSchema', () => {
  it('accepts valid UUID v4', () => {
    const result = uuidSchema.parse('550e8400-e29b-41d4-a716-446655440000');
    expect(result).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('accepts uppercase UUID v4', () => {
    const result = uuidSchema.parse('550E8400-E29B-41D4-A716-446655440000');
    expect(result).toBe('550E8400-E29B-41D4-A716-446655440000');
  });

  it('rejects invalid UUID', () => {
    expectZodError(() => uuidSchema.parse('not-a-uuid'));
  });

  it('rejects UUID v1 format', () => {
    // UUID v1 has version "1" in position 13
    expectZodError(() => uuidSchema.parse('550e8400-e29b-11d4-a716-446655440000'));
  });

  it('rejects empty string', () => {
    expectZodError(() => uuidSchema.parse(''));
  });
});
