import js from '@eslint/js'
import prettier from 'eslint-config-prettier'
import vue from 'eslint-plugin-vue'
import globals from 'globals'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: [
      '.output',
      '.wxt',
      'coverage',
      'test-results',
      'playwright-report',
      'tests/fixtures',
      'src/entrypoints/injected/revealPlugins/**'
    ]
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...vue.configs['flat/recommended'],
  {
    files: ['**/*.vue'],
    languageOptions: { parserOptions: { parser: tseslint.parser } }
  },
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      curly: ['warn', 'all'],
      'no-console': 'warn',
      '@typescript-eslint/no-explicit-any': 'warn'
    }
  },
  prettier
)
