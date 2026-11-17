// Does:  Proves shared zod schemas enforce prompt, dimension, step, CFG, seed, strength, LoRA and AIR-id bounds.
// Holds: Exercises the real schemas; nothing is mocked.

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
  controlNetConfigSchema,
  loraConfigSchema,
  uuidSchema,
  MIN_DIMENSION,
  MAX_DIMENSION,
  DIMENSION_STEP,
  MAX_PROMPT_LENGTH,
  MIN_STEPS,
  MAX_STEPS,
  MIN_CFG_SCALE,
  MAX_CFG_SCALE,
} from '../../../src/shared/validation.js';
import { VIDEO_MODELS } from '../../../src/constants/video-models.js';

function expectZodError(fn: () => unknown): ZodError {
  try {
    fn();
    throw new Error('Expected ZodError but no error was thrown');
  } catch (error) {
    expect(error).toBeInstanceOf(ZodError);
    return error as ZodError;
  }
}

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
});

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

  it.each(['klingai:1.5@1', 'sync:1.9.1@1', 'tripo:v3.1@0', 'runware:flux-2-klein-4b@style-lora-training'])(
    'accepts the real AIR id %s',
    (id) => {
      expect(modelIdentifierSchema.parse(id)).toBe(id);
    },
  );

  it('accepts every model id in the video model catalog', () => {
    for (const id of Object.keys(VIDEO_MODELS)) {
      expect(modelIdentifierSchema.parse(id)).toBe(id);
    }
  });

  it.each([
    ' civitai:123@456',
    'civitai:123@456 ',
    'civitai:1 23@456',
    'civitai:123@456\n',
    'civitai:123@456;rm -rf /',
    'civitai:../../etc@1',
    'civitai:123@456@7',
    ':123@456',
    'civitai:123@',
    '<script>:1@1',
    `civitai:${'1'.repeat(200)}@1`,
  ])('rejects malformed or injected id %j', (id) => {
    expectZodError(() => modelIdentifierSchema.parse(id));
  });
});

describe('dimensionSchema', () => {
  it('accepts minimum dimension', () => {
    const result = dimensionSchema.parse(MIN_DIMENSION);
    expect(result).toBe(MIN_DIMENSION);
  });

  it('accepts maximum dimension', () => {
    const result = dimensionSchema.parse(MAX_DIMENSION);
    expect(result).toBe(MAX_DIMENSION);
  });

  it('rejects value below minimum', () => {
    expectZodError(() => dimensionSchema.parse(MIN_DIMENSION - DIMENSION_STEP));
  });

  it('rejects value above maximum', () => {
    expectZodError(() => dimensionSchema.parse(MAX_DIMENSION + DIMENSION_STEP));
  });

  it('rejects values outside the dimension step', () => {
    expectZodError(() => dimensionSchema.parse(1001));
  });

  it('rejects float value', () => {
    expectZodError(() => dimensionSchema.parse(1024.5));
  });
});

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

  it.each([
    'http://example.com/image.jpg',
    'file:///etc/passwd',
    'javascript:alert(1)',
    'ftp://example.com/image.png',
    'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
    'data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=',
    'data:image/png,rawpixels',
  ])('rejects the unsafe image source %s', (source) => {
    expectZodError(() => imageInputSchema.parse(source));
  });

  it('accepts valid base64 string (long enough)', () => {
    const base64 = 'A'.repeat(200);
    const result = imageInputSchema.parse(base64);
    expect(result).toBe(base64);
  });

  it('accepts valid data URI', () => {
    const dataUri = `data:image/png;base64,${'A'.repeat(100)}`;
    const result = imageInputSchema.parse(dataUri);
    expect(result).toBe(dataUri);
  });

  it('rejects empty string', () => {
    expectZodError(() => imageInputSchema.parse(''));
  });
});

describe('stepsSchema', () => {
  it('accepts minimum steps', () => {
    expect(stepsSchema.parse(MIN_STEPS)).toBe(MIN_STEPS);
  });

  it('accepts maximum steps', () => {
    expect(stepsSchema.parse(MAX_STEPS)).toBe(MAX_STEPS);
  });

  it('rejects zero', () => {
    expectZodError(() => stepsSchema.parse(0));
  });

  it('rejects value above maximum', () => {
    expectZodError(() => stepsSchema.parse(MAX_STEPS + 1));
  });
});

describe('cfgScaleSchema', () => {
  it('accepts minimum CFG scale', () => {
    expect(cfgScaleSchema.parse(MIN_CFG_SCALE)).toBe(MIN_CFG_SCALE);
  });

  it('accepts maximum CFG scale', () => {
    expect(cfgScaleSchema.parse(MAX_CFG_SCALE)).toBe(MAX_CFG_SCALE);
  });

  it('rejects negative value', () => {
    expectZodError(() => cfgScaleSchema.parse(-1));
  });

  it('rejects value above maximum', () => {
    expectZodError(() => cfgScaleSchema.parse(MAX_CFG_SCALE + 1));
  });
});

describe('seedSchema', () => {
  it('accepts zero', () => {
    expect(seedSchema.parse(0)).toBe(0);
  });

  it('rejects negative value', () => {
    expectZodError(() => seedSchema.parse(-1));
  });
});

describe('strengthSchema', () => {
  it('accepts 0', () => {
    expect(strengthSchema.parse(0)).toBe(0);
  });

  it('accepts 1', () => {
    expect(strengthSchema.parse(1)).toBe(1);
  });

  it('rejects negative', () => {
    expectZodError(() => strengthSchema.parse(-0.1));
  });

  it('rejects above 1', () => {
    expectZodError(() => strengthSchema.parse(1.1));
  });
});

describe('controlNetConfigSchema', () => {
  it('rejects weight out of range', () => {
    expectZodError(() =>
      controlNetConfigSchema.parse({
        guideImage: '550e8400-e29b-41d4-a716-446655440000',
        preprocessor: 'canny',
        weight: 1.5,
      }),
    );
  });
});

describe('loraConfigSchema', () => {
  it('accepts negative weight', () => {
    const result = loraConfigSchema.parse({ model: 'lora-model', weight: -1.5 });
    expect(result.weight).toBe(-1.5);
  });

  it('rejects weight below -2', () => {
    expectZodError(() => loraConfigSchema.parse({ model: 'lora-model', weight: -2.5 }));
  });

  it('rejects weight above 2', () => {
    expectZodError(() => loraConfigSchema.parse({ model: 'lora-model', weight: 2.5 }));
  });
});

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
    expectZodError(() => uuidSchema.parse('550e8400-e29b-11d4-a716-446655440000'));
  });
});
