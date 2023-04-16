import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Options } from '@wdio/types'

import WdioCucumberJsJsonReporter from '../../lib/reporter.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const config: Options.Testrunner = {
    specs: [path.join(__dirname, 'e2e', '*.feature')],
    capabilities: [{
        maxInstances: 2,
        acceptInsecureCerts: true,
        browserName: 'chrome',
        'goog:chromeOptions': {
            args: ['headless', 'disable-gpu'],
        },
    }],

    logLevel: 'info',
    specFileRetries: 1,
    waitforTimeout: 10000,
    connectionRetryTimeout: 30000,
    framework: 'cucumber',
    reporters: [[WdioCucumberJsJsonReporter, { jsonFolder: '.tmp/new/', language: 'en', },
    ]],
    // If you are using Cucumber you need to specify the location of your step definitions.
    cucumberOpts: {
        require: [__dirname + '/e2e/step-definitions/steps.js'],
        backtrace: false,
        failFast: false,
        snippets: true,
        source: true,
        strict: false,
        tagExpression: '',
        timeout: 60000
    },

    services: ['selenium-standalone'],
    connectionRetryCount: 3
}
