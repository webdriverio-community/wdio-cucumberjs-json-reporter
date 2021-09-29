module.exports = {
    roots: [
        "<rootDir>/lib"
    ],
    preset: 'ts-jest',
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
        'docs/'
    ],
    transform: {
        "^.+\\.(ts|tsx)$": "ts-jest"
    },
}
