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
            exclude: ['**/dist/**', '**/__mocks__/**', '**/__fixtures__/**', '**/*.test.ts', '**/src/types/**', '**/src/types.ts', '*.cjs', '*.conf.ts'],
            thresholds: {
                lines: 90,
                functions: 90,
                branches: 90,
                statements: 90
            }
        }
    }
})
