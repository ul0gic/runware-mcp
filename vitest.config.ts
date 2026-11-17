// Does:  Configures Vitest for the node test suite and v8 coverage reporting.
// Holds: Coverage is reported only, never enforced; barrel, type-only and entry-point files are excluded from it.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'dist'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.ts'],
      exclude: [
        '**/*.test.ts',
        '**/*.d.ts',
        'src/tools/*/index.ts',
        'src/resources/*/index.ts',
        'src/resources/*/types.ts',
        'src/prompts/*/index.ts',
        'src/constants/index.ts',
        'src/index.ts',
      ],
    },
  },
});
