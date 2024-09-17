import type { Options } from '@wdio/types'
import {
    type default as WDIOReporterBaseOptions,
    type Argument,
    type HookStats,
    type RunnerStats,
    type SuiteStats,
    type Tag,
    type TestStats
} from '@wdio/reporter'
import type { WriteStream } from 'fs'
import type { cjson_metadata } from '../types'
import { W3CCapabilities } from '@wdio/types/build/Capabilities'

export interface W3CCapabilitiesExtended extends W3CCapabilities {
    cjson_metadata?: cjson_metadata
    app?: string
}

export interface DesiredCapabilitiesExtended extends WebdriverIO.Capabilities {
    cjson_metadata?: cjson_metadata
    app?: string
}

export interface TestrunnerExtended extends Options.Testrunner {
    jsonFolder?: string
    language?: string
    cjson_metadata?: cjson_metadata
    logFile?: string
    stdout?: boolean
    writeStream?: WriteStream
}
export interface WebdriverIOExtended extends Options.WebdriverIO {
    app?: string
    requestedCapabilities?: {
        cjson_metadata?: cjson_metadata
        w3cCaps: {
            alwaysMatch?: {
                foo?: true
            }
        }
    }
}

export interface WDIOReporterBaseOptionsExtended extends WDIOReporterBaseOptions {
    jsonFolder: string
    language: string
}

export interface HookStatsExtended extends HookStats {
    description?: string
    tags?: string[] | Tag[] | string
    keyword?: string
    argument?: Argument
    line?: number
    name?: string
}

export interface TestStatsExtended extends TestStats {
    description?: string
    tags?: string[] | Tag[] | string
    keyword?: string
    name?: string
    id?: string
    foo?: string | boolean
    bar?: boolean
}

export interface RunnerStatsExtended extends RunnerStats {
    metadata?: {
        foo?: string
    }
}

export interface SuiteStatsExtended extends SuiteStats {
    keyword?: string
    line?: number
    name?: string
    id?: string
}

export interface ConfigCapabilities {
    browserName?: string
    'cjson:metadata'?: {
        device?: string
        browser?: {
            name?: string
            version?: string
        }
        platform?: {
            name?: string
            version?: string
        }
    }
}
