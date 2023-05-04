import { test, expect, vi, beforeAll, afterAll } from 'vitest'

const CucumberJsJsonReporter = require('../..')

const processEmit = process.emit.bind(process)
beforeAll(() => {
    process.emit = vi.fn() as typeof processEmit
})

test('can import CJS artifact', () => {
    expect(typeof CucumberJsJsonReporter.attach).toBe('function')
    CucumberJsJsonReporter.attach('foo', 'bar')
    expect(process.emit).toBeCalledWith(
        'wdioCucumberJsReporter:attachment',
        { data: 'foo', type: 'bar' }
    )
})

afterAll(() => {
    process.emit = processEmit
})
