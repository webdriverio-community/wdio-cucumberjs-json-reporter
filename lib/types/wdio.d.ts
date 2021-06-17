import '@wdio/reporter';
import 'webdriver';
import { cjson_metadata } from '../models';
import type { pickle } from 'cucumber';

declare module '@wdio/reporter'{
  export interface WDIOReporterBaseOptions {
    jsonFolder: string;
    language: string;
    cjson_metadata: cjson_metadata;
  }

  export interface HookStats{
    keyword: string;
    argument?: pickle.Argument;
    // state?: 'failed' | 'passed' | 'pending';
  }

  export interface TestStats{
    keyword?: string;
    foo?: string | boolean;
    bar?: boolean;
  }

  export interface RunnerStats{
    metadata?: {
      foo?: string;
    };
  }
}
