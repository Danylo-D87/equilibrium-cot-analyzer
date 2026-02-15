import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
    // Ignore build outputs
    { ignores: ['dist/**', 'node_modules/**'] },

    // Main config for JS/JSX/TS/TSX
    {
        files: ['**/*.{js,jsx,ts,tsx}'],
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.es2021,
            },
            parserOptions: {
                ecmaFeatures: { jsx: true },
            },
        },
        plugins: {
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
        },
        rules: {
            // ESLint recommended
            ...js.configs.recommended.rules,

            // React hooks
            ...reactHooks.configs.recommended.rules,

            // React refresh — warn on non-component exports
            'react-refresh/only-export-components': [
                'warn',
                { allowConstantExport: true },
            ],

            // Relax some rules for mixed JS/TS codebase
            'no-unused-vars': ['warn', {
                argsIgnorePattern: '^_',
                varsIgnorePattern: '^_',
            }],

            // Allow console.warn and console.error
            'no-console': ['warn', { allow: ['warn', 'error'] }],
        },
    },

    // Prettier must be last to disable conflicting rules
    eslintConfigPrettier,
];
