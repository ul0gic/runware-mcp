import { readFileSync } from 'node:fs';

import { describe, it, expect } from 'vitest';

describe('advertised server version', () => {
  it('is read from package.json rather than hardcoded', () => {
    const source = readFileSync(new URL('../../src/index.ts', import.meta.url), 'utf8');

    expect(source).not.toMatch(/const SERVER_VERSION = ['"][\d.]+['"]/);
  });

  it('resolves package.json from both src/ and dist/', () => {
    const packageJson: unknown = JSON.parse(
      readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
    );

    expect(packageJson).toMatchObject({ version: expect.stringMatching(/^\d+\.\d+\.\d+/) });
  });
});
