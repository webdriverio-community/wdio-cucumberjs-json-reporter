import { Capabilities, Options } from '@wdio/types';
import WDIOReporterBaseOptions, { Argument, HookStats, RunnerStats, SuiteStats, Tag, TestStats } from '@wdio/reporter';
import { WriteStream } from 'fs';
import { cjson_metadata } from '../models';

export interface W3CCapabilitiesExtended extends Capabilities.W3CCapabilities {
    cjson_metadata?: cjson_metadata;
    testobject_app_id?: string;
    app?: string;
}

export interface DesiredCapabilitiesExtended extends Capabilities.DesiredCapabilities {
    cjson_metadata?: cjson_metadata;
    testobject_app_id?: string;
    app?: string;
}

export interface TestrunnerExtended extends Options.Testrunner {
    jsonFolder?: string;
    language?: string;
    cjson_metadata?: cjson_metadata;
    logFile?: string;
    stdout?: boolean;
    writeStream?: WriteStream;
}
export interface WebdriverIOExtended extends Options.WebdriverIO {
    app?: string;
    requestedCapabilities?: {
        cjson_metadata?: cjson_metadata;
        w3cCaps: {
            alwaysMatch?: {
                foo?: true;
            };
        };
    };
}

export interface WDIOReporterBaseOptionsExtended extends WDIOReporterBaseOptions {
    jsonFolder: string;
    language: string;
}

export interface HookStatsExtended extends HookStats {
    description?: string;
    tags?: string[] | Tag[] | string;
    keyword?: string;
    argument?: Argument;
    line?: number;
    name?: string;
}

export interface TestStatsExtended extends TestStats {
    description?: string;
    tags?: string[] | Tag[] | string;
    keyword?: string;
    name?: string;
    id?: string;
    foo?: string | boolean;
    bar?: boolean;
}

export interface RunnerStatsExtended extends RunnerStats {
    metadata?: {
        foo?: string;
    };
}

export interface SuiteStatsExtended extends SuiteStats {
    keyword?: string;
    line?: number;
    name?: string;
    id?: string;
}
