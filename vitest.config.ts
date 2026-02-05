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
        'src/database/index.ts',
        'src/database/types.ts',
        'src/constants/index.ts',
        'src/index.ts',
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 65,
        statements: 80,
      },
    },
  },
});
