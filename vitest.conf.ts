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
            reporter: ['text'],
            provider: "v8",
            enabled: true,
            exclude: ['**/dist/**', '**/__mocks__/**', '**/__fixtures__/**', '**/*.test.ts'],
            thresholds: {
                lines: 99,
                functions: 95,
                branches: 95,
                statements: 99
            }
        }
    }
})
