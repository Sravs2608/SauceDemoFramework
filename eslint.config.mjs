// Role: ESLint rules for the framework. ESLint reads the code without running it and
// flags common automation mistakes. The two that matter most here:
//   - a missing `await` in front of a Playwright call (the action is skipped silently
//     and the test becomes flaky) -> @typescript-eslint/no-floating-promises
//   - Playwright anti-patterns such as hard waits, test.only left in the code, or a
//     test with no assertion -> eslint-plugin-playwright
// Selenium Java has no equivalent of the missing-await problem because Java calls are
// synchronous; the closest tools there are Checkstyle / SonarLint for general code style.
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';

export default tseslint.config(
  { ignores: ['node_modules/', 'playwright-report/', 'test-results/', 'blob-report/', '.auth/', '.claude/'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.ts'],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    rules: {
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/await-thenable': 'error',
    },
  },
  {
    files: ['tests/**/*.ts'],
    ...playwright.configs['flat/recommended'],
    rules: {
      ...playwright.configs['flat/recommended'].rules,
      // Our page objects expose expectLoaded()/expectCartCount(); count them as assertions.
      'playwright/expect-expect': ['error', { assertFunctionNames: ['expect'], assertFunctionPatterns: ['^expect[A-Z].*'] }],
      'playwright/no-wait-for-timeout': 'error',
      'playwright/no-focused-test': 'error',
    },
  },
);
