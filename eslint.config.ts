import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import importX from 'eslint-plugin-import-x';
import promise from 'eslint-plugin-promise';
import security from 'eslint-plugin-security';
import sonarjs from 'eslint-plugin-sonarjs';
import unicorn from 'eslint-plugin-unicorn';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  // Ignore patterns
  {
    ignores: ['dist/**', 'node_modules/**', 'coverage/**', '*.js', '*.mjs', '*.cjs'],
  },

  // Base ESLint recommended rules
  eslint.configs.recommended,

  // TypeScript strict type-checked configuration
  ...tseslint.configs.strictTypeChecked,
  ...tseslint.configs.stylisticTypeChecked,

  // Plugin configurations
  security.configs.recommended,
  sonarjs.configs.recommended,
  unicorn.configs['flat/recommended'],
  promise.configs['flat/recommended'],

  // Main configuration for TypeScript files
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      '@stylistic': stylistic,
      'import-x': importX,
    },
    rules: {
      // ============================================
      // TypeScript Strict Rules (all errors)
      // ============================================

      // No explicit any - never use any type
      '@typescript-eslint/no-explicit-any': 'error',

      // No unsafe operations with any types
      '@typescript-eslint/no-unsafe-assignment': 'error',
      '@typescript-eslint/no-unsafe-member-access': 'error',
      '@typescript-eslint/no-unsafe-call': 'error',
      '@typescript-eslint/no-unsafe-return': 'error',
      '@typescript-eslint/no-unsafe-argument': 'error',

      // Promise handling
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/no-misused-promises': 'error',
      '@typescript-eslint/require-await': 'error',

      // Explicit type annotations
      '@typescript-eslint/explicit-function-return-type': 'error',
      '@typescript-eslint/explicit-module-boundary-types': 'error',

      // Consistent type imports/exports (fixable)
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/consistent-type-exports': [
        'error',
        { fixMixedExportsWithInlineTypeSpecifier: true },
      ],

      // Immutability preference
      '@typescript-eslint/prefer-readonly': 'error',

      // Strict boolean and condition checks
      '@typescript-eslint/no-unnecessary-condition': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'error',

      // Additional TypeScript strictness
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/prefer-nullish-coalescing': 'error',
      '@typescript-eslint/prefer-optional-chain': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',

      // Naming conventions
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase'],
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'property',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
        },
        {
          selector: 'import',
          format: null,
        },
      ],

      // No unused vars with exceptions for underscore-prefixed
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],

      // ============================================
      // Security Rules (eslint-plugin-security)
      // ============================================

      // Detect potential object injection vulnerabilities
      'security/detect-object-injection': 'error',

      // Prevent non-literal fs filenames (path traversal)
      'security/detect-non-literal-fs-filename': 'error',

      // Prevent non-literal require (dynamic code loading)
      'security/detect-non-literal-require': 'error',

      // Detect possible timing attacks in comparisons
      'security/detect-possible-timing-attacks': 'error',

      // ============================================
      // Code Quality (eslint-plugin-sonarjs)
      // ============================================

      // Cognitive complexity limit
      'sonarjs/cognitive-complexity': ['error', 15],

      // No duplicate strings (magic strings)
      'sonarjs/no-duplicate-string': 'error',

      // No identical functions
      'sonarjs/no-identical-functions': 'error',

      // ============================================
      // Modern JS & Performance (eslint-plugin-unicorn)
      // ============================================

      // Prefer node: protocol for built-in modules
      'unicorn/prefer-node-protocol': 'error',

      // Prefer top-level await
      'unicorn/prefer-top-level-await': 'error',

      // Allow reduce - we use it intentionally
      'unicorn/no-array-reduce': 'off',

      // Disable abbreviation prevention - too aggressive
      'unicorn/prevent-abbreviations': 'off',

      // Allow null - TypeScript handles this well
      'unicorn/no-null': 'off',

      // Allow nested ternaries when formatted properly
      'unicorn/no-nested-ternary': 'off',

      // Allow process.exit for CLI tools
      'unicorn/no-process-exit': 'off',

      // ============================================
      // Import Rules (eslint-plugin-import-x)
      // ============================================

      // Circular dependencies are architecture failures
      'import-x/no-cycle': 'error',

      // Named exports only - no default exports
      'import-x/no-default-export': 'error',

      // Import ordering with alphabetical sorting
      'import-x/order': [
        'error',
        {
          groups: [
            'builtin',
            'external',
            'internal',
            'parent',
            'sibling',
            'index',
            'type',
          ],
          'newlines-between': 'always',
          alphabetize: {
            order: 'asc',
            caseInsensitive: true,
          },
        },
      ],

      // No duplicate imports
      'import-x/no-duplicates': 'error',

      // ============================================
      // Promise Rules (eslint-plugin-promise)
      // ============================================

      // Always return in promise handlers
      'promise/always-return': 'error',

      // No wrapping values in Promise.resolve/reject unnecessarily
      'promise/no-return-wrap': 'error',

      // ============================================
      // Stylistic Rules (@stylistic/eslint-plugin)
      // ============================================

      // Consistent semicolons - always
      '@stylistic/semi': ['error', 'always'],

      // Consistent quotes - single quotes
      '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],

      // Consistent indentation - 2 spaces
      '@stylistic/indent': ['error', 2],

      // Trailing commas in multiline
      '@stylistic/comma-dangle': ['error', 'always-multiline'],

      // Spacing rules
      '@stylistic/object-curly-spacing': ['error', 'always'],
      '@stylistic/array-bracket-spacing': ['error', 'never'],
      '@stylistic/comma-spacing': ['error', { before: false, after: true }],
      '@stylistic/key-spacing': ['error', { beforeColon: false, afterColon: true }],
      '@stylistic/keyword-spacing': ['error', { before: true, after: true }],
      '@stylistic/space-before-blocks': ['error', 'always'],
      '@stylistic/space-before-function-paren': [
        'error',
        { anonymous: 'always', named: 'never', asyncArrow: 'always' },
      ],
      '@stylistic/space-infix-ops': 'error',
      '@stylistic/arrow-spacing': ['error', { before: true, after: true }],

      // Line and block formatting
      '@stylistic/brace-style': ['error', '1tbs', { allowSingleLine: false }],
      '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0, maxBOF: 0 }],
      '@stylistic/eol-last': ['error', 'always'],
      '@stylistic/no-trailing-spaces': 'error',
      '@stylistic/padded-blocks': ['error', 'never'],

      // ============================================
      // Base ESLint Rules
      // ============================================

      // No console in production code
      'no-console': 'error',

      // No debugger statements
      'no-debugger': 'error',

      // No eval - security risk
      'no-eval': 'error',

      // No implied eval - security risk
      'no-implied-eval': 'error',

      // Strict equality only
      eqeqeq: ['error', 'always'],

      // Always use braces for control statements
      curly: ['error', 'all'],

      // No var - use const/let
      'no-var': 'error',

      // Prefer const over let when not reassigned
      'prefer-const': 'error',

      // Disable base no-unused-vars (TypeScript handles this)
      'no-unused-vars': 'off',
    },
  },

  // Configuration files can use default exports
  {
    files: ['*.config.ts', '*.config.js', '*.config.mjs'],
    rules: {
      'import-x/no-default-export': 'off',
    },
  },

  // Test files have relaxed rules
  {
    files: ['**/*.test.ts', '**/*.spec.ts'],
    rules: {
      // Tests can have magic strings
      'sonarjs/no-duplicate-string': 'off',

      // Tests can be more complex
      'sonarjs/cognitive-complexity': 'off',

      // Tests may need console for debugging
      'no-console': 'off',

      // Tests may use non-null assertions for test fixtures
      '@typescript-eslint/no-non-null-assertion': 'off',
    },
  },

  // Prompt template files have special allowances for descriptor record keys
  {
    files: ['src/prompts/**/*.ts'],
    rules: {
      // Allow hyphenated object keys (e.g., 'pixel-art', 'studio-ghibli', 'zoom-in')
      // These match user-facing argument values in prompt templates
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase'],
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          // Allow any format for quoted object literal properties
          // This permits hyphenated keys like 'studio-ghibli', 'pixel-art'
          selector: 'objectLiteralProperty',
          format: null,
          modifiers: ['requiresQuotes'],
        },
        {
          selector: 'property',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
        },
        {
          selector: 'import',
          format: null,
        },
      ],

      // Allow object injection for descriptor record lookups
      // These are safe because values come from a fixed set of known keys
      'security/detect-object-injection': 'off',

      // Allow duplicate strings in prompt templates (repeated style/mood names)
      'sonarjs/no-duplicate-string': 'off',
    },
  },

  // Constants files have special allowances for AIR format model IDs
  {
    files: ['src/constants/**/*.ts'],
    rules: {
      // Allow AIR format object keys (e.g., 'klingai:1@1', 'runware:35@1')
      // These are required by the Runware API specification
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'default',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
          trailingUnderscore: 'forbid',
        },
        {
          selector: 'variable',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'function',
          format: ['camelCase'],
        },
        {
          selector: 'parameter',
          format: ['camelCase'],
          leadingUnderscore: 'allow',
        },
        {
          // Allow any format for object literal properties with quotes
          // This permits AIR format keys like 'klingai:1@1'
          selector: 'objectLiteralProperty',
          format: null,
          modifiers: ['requiresQuotes'],
        },
        {
          selector: 'property',
          format: ['camelCase', 'UPPER_CASE'],
          leadingUnderscore: 'allow',
        },
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
        {
          selector: 'enum',
          format: ['PascalCase'],
        },
        {
          selector: 'enumMember',
          format: ['UPPER_CASE', 'PascalCase'],
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false,
          },
        },
        {
          selector: 'typeAlias',
          format: ['PascalCase'],
        },
        {
          selector: 'typeParameter',
          format: ['PascalCase'],
        },
        {
          selector: 'import',
          format: null,
        },
      ],

      // Allow duplicate strings in constants files (model IDs, feature names)
      'sonarjs/no-duplicate-string': 'off',

      // Allow object injection for model lookup functions
      // These are safe because model IDs are validated before lookup
      'security/detect-object-injection': 'off',
    },
  },
);
