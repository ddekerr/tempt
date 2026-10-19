import eslint from '@eslint/js';
import boundaries from 'eslint-plugin-boundaries';
import tseslint from 'typescript-eslint';
import checkFile from 'eslint-plugin-check-file';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'server/db/migrations/**', '*.config.*', '.vscode/**', 'data/**'],
  },

  eslint.configs.recommended,
  ...tseslint.configs.recommended,

  {
    files: ['src/**/*.{ts,tsx}', 'server/**/*.ts', 'core/**/*.ts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },

    plugins: {
      boundaries,
      'check-file': checkFile,
      'react-hooks': reactHooks,
    },

    settings: {
      'import/resolver': {
        typescript: { alwaysTryTypes: true, project: ['./tsconfig.json', './tsconfig.server.json'] },
      },
      'boundaries/include': ['src/**/*', 'server/**/*', 'core/**/*'],
      'boundaries/elements': [
        { type: 'app', pattern: 'src/app', mode: 'folder' },
        { type: 'pages', pattern: 'src/pages/*', mode: 'folder', capture: ['slice'] },
        { type: 'widgets', pattern: 'src/widgets/*', mode: 'folder', capture: ['slice'] },
        { type: 'features', pattern: 'src/features/*', mode: 'folder', capture: ['slice'] },
        { type: 'entities', pattern: 'src/entities/*', mode: 'folder', capture: ['slice'] },
        { type: 'shared', pattern: 'src/shared', mode: 'folder' },
        { type: 'server', pattern: 'server', mode: 'folder' },
        { type: 'core', pattern: 'core', mode: 'folder' },
      ],
    },

    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',

      'check-file/filename-naming-convention': [
        'error',
        { '**/*.{ts,tsx}': 'KEBAB_CASE' },
        { ignoreMiddleExtensions: true },
      ],

      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'typeLike',
          format: ['PascalCase'],
        },
      ],

      'boundaries/element-types': [
        'error',
        {
          default: 'disallow',
          message: 'Модуль (${file.type}) не може імпортувати модуль (${dependency.type})',
          rules: [
            { from: 'app', allow: ['pages', 'widgets', 'features', 'entities', 'shared', 'core'] },
            { from: 'pages', allow: ['widgets', 'features', 'entities', 'shared', 'core'] },
            { from: 'widgets', allow: ['features', 'entities', 'shared', 'core'] },
            { from: 'features', allow: ['entities', 'shared', 'core'] },
            { from: 'entities', allow: ['shared', 'core'] },
            { from: 'shared', allow: ['core'] },
            { from: 'server', allow: ['core'] },
            { from: 'core', allow: [] },
          ],
        },
      ],

      'boundaries/entry-point': [
        'error',
        {
          default: 'disallow',
          message:
            'Модуль (${file.type}) повинен імпортуватися через Public API. Прямий імпорт з (${dependency.source}) заборонений',
          rules: [
            { target: 'pages', allow: ['*.page.tsx', 'index.{ts,tsx}'] },
            { target: ['widgets', 'features', 'entities'], allow: 'index.{ts,tsx}' },
            { target: ['app', 'shared', 'server', 'core'], allow: '**' },
          ],
        },
      ],
    },
  },

  prettier,
];
