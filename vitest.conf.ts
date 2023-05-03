/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
    test: {
        include: ['tests/**/*.test.ts'],
        /**
         * not to ESM ported packages
         */
        exclude: [
            'dist', '.idea', '.git', '.cache',
            '**/node_modules/**'
        ],
        coverage: {
            enabled: true,
            provider: 'c8',
            exclude: ['**/dist/**', '**/__mocks__/**', '**/__fixtures__/**', '**/*.test.ts'],
            lines: 99,
            functions: 95,
            branches: 97,
            statements: 99
        }
    }
})
