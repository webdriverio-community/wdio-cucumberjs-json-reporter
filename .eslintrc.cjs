module.exports = {
    env: {
        es2021: true,
        node: true,
    },
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'prettier',
        'plugin:import/errors',
        'plugin:import/typescript',
    ],
    overrides: [],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    rules: {
        'import/no-unresolved': 2,
        'import/no-commonjs': 2,
        'import/extensions': [1, 'ignorePackages'],
    },
    settings: {
        'import/parsers': {
            '@typescript-eslint/parser': ['.ts', '.tsx'],
        },
        'import/resolver': {
            typescript: {
                alwaysTryTypes: true,
                project: '/',
            },
        },
    },
};
