module.exports = {
    roots: [
        "<rootDir>/lib"
    ],
    setupFiles:["<rootDir>/test-setup.js"],
    extensionsToTreatAsEsm: [".ts"],
    preset: "ts-jest/presets/default-esm",
    moduleFileExtensions: ["js", "json", "ts"],
    testEnvironment: 'node',
    testMatch: [
        '<rootDir>/lib/tests/*.spec.ts'
    ],
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/'
    ],
    coverageDirectory: './coverage/',
    collectCoverage: true,
    coverageThreshold: {
        global: {
            branches: 85,
            functions: 100,
            lines: 100,
            statements: 100
        }
    },
    coveragePathIgnorePatterns: [
        'node_modules/',
        'tests/',
        'docs/',
        ".module.ts$",
        ".spec.ts$",
        "src/database/",
        "src/server.ts"
    ],
    transform: {
        // '^.+\\.m?[tj]sx?$' to process js/ts/mjs/mts with `ts-jest`
        '^.+\\.(t|j)sx?$': [
            'ts-jest',
            {
                useESM: true,
            },
        ],
    },
    verbose: true
}
