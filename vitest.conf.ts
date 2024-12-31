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
            provider: "v8",
            ignoreEmptyLines: false,
            enabled: true,
            include: ['src/**/*.ts'],
            exclude: ['**/types.ts', '**/src/types/**'],
            thresholds: {
                lines: 90,
                functions: 90,
                branches: 90,
                statements: 90
            }
        }
    }
})
