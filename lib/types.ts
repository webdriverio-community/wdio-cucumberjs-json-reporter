import { Reporters } from '@wdio/types';

export interface CucumberJsJsonReporterInterface extends Reporters.Options {
    jsonFolder?: string;
    language?: string;
    disableHooks?: boolean;
}
