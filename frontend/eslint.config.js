import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
<<<<<<< HEAD
=======
import tseslint from 'typescript-eslint'
>>>>>>> 0445047e6fe2c2eda9dfbcf0e37f49c8eea14ade
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
<<<<<<< HEAD
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
=======
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
>>>>>>> 0445047e6fe2c2eda9dfbcf0e37f49c8eea14ade
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
<<<<<<< HEAD
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
=======
>>>>>>> 0445047e6fe2c2eda9dfbcf0e37f49c8eea14ade
    },
  },
])
