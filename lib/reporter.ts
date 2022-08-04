import {
    AFTER,
    BEFORE,
    DEFAULT_JSON_FOLDER,
    DEFAULT_LANGUAGE,
    DEFAULT_REPORT_FILE_PER_RETRY,
    FEATURE,
    PASSED,
    //   PENDING,
    SCENARIO,
    TEXT_PLAIN,
} from './constants';
import { AttachmentType, CucumberAttachmentData, CucumberJsAttachment, Feature, MetadataObject, Report, Scenario, Step } from './models';
import { HookStatsExtended, SuiteStatsExtended, TestStatsExtended } from './types/wdio';
import WDIOReporter, { HookStats, RunnerStats, SuiteStats, TestStats } from '@wdio/reporter';
import { existsSync, outputJsonSync, readJsonSync } from 'fs-extra';
import { CucumberJsJsonReporterInterface } from './types';
import { Metadata } from './metadata';
import Utils from './utils';
import logger from '@wdio/logger';
import { resolve } from 'path';

const log = logger( 'wdio-multiple-cucumber-html-reporter' );

export class CucumberJsJsonReporter extends WDIOReporter {
    public instanceMetadata: MetadataObject;
    public report: Report;
    public metadataClassObject: Metadata;
    public utilsObject: Utils;

    public constructor( public options: CucumberJsJsonReporterInterface ) {
        super( options );
        this.options = options;

        if ( !this.options.jsonFolder ) {
            this.options.jsonFolder = DEFAULT_JSON_FOLDER;
            log.info( `The 'jsonFolder' was not set, it has been set to the default '${DEFAULT_JSON_FOLDER}'` );
        }
        if ( !this.options.language ) {
            this.options.language = DEFAULT_LANGUAGE;
            log.info( `The 'language' was not set, it has been set to the default '${DEFAULT_LANGUAGE}'` );
        }
        if ( this.options.reportFilePerRetry === undefined ) {
            this.options.reportFilePerRetry = DEFAULT_REPORT_FILE_PER_RETRY;
            log.info(
                `The 'reportFilePerRetry' was not set, it has been set to the default '${DEFAULT_REPORT_FILE_PER_RETRY.toString()}'`,
            );
        }

        this.instanceMetadata = null;
        this.report = <Report>{};

        this.registerListeners();
        this.metadataClassObject = new Metadata();
        this.utilsObject = new Utils();
    }

    /**
     * Attach data to the report
     */
    public static attach( data: CucumberAttachmentData, type: AttachmentType = TEXT_PLAIN ): void {
        // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-unsafe-assignment
        ( process.emit as Function )( 'wdioCucumberJsReporter:attachment', { data, type } );
    }

    /**
     * Add a customer listener for the attachments
     */
    public registerListeners(): void {
        process.on( 'wdioCucumberJsReporter:attachment', this.cucumberJsAttachment.bind( this ) );
    }

    /**
     * The order of running of the `on*` is the following:
     * - onRunnerStart
     * - onSuiteStart (feature)
     * - onSuiteStart (scenario)
     * - onHookStart
     * - onHookEnd
     * - onTestStart
     * - onBeforeCommand
     * - onAfterCommand
     * - onTestPass
     * - onHookStart
     * - onHookEnd
     * - onSuiteEnd (scenario is done)
     * - onSuiteEnd (feature is done)
     * - onRunnerEnd
     */

    /**
     * This hook is used to retrieve the browser data, but this is done only once
     */
    public onRunnerStart( runnerData: RunnerStats ): void {
        if ( !this.instanceMetadata ) {
            this.instanceMetadata = this.metadataClassObject.determineMetadata( runnerData );
        }
    }

    /**
     * This hook is called twice:
     * 1. create the feature
     * 2. add the scenario to the feature
     */
    public onSuiteStart( payload: SuiteStats ): void {
        if ( !this.report.feature ) {
            this.report.feature = this.getFeatureDataObject( payload );
        }

        /* istanbul ignore else */
        if ( !this.report.feature.metadata ) {
            this.report.feature = { ...this.report.feature, metadata: { ...this.instanceMetadata } };
        }

        if ( typeof this.report.feature.elements !== 'undefined' && payload.parent ) {
            this.report.feature.elements.push( this.getScenarioDataObject( payload, this.report.feature.id ) );
        }
    }

    /**
     * This one is for the start of the hook and determines if this is a pending `before` or `after` hook.
     * The data will be equal to a step, so a hook is added as a step.
     */
    public onHookStart( payload: HookStatsExtended ): void {
        // There is always a scenario, take the last one
        if ( this.options.disableHooks ) {
            return;
        }
        const currentSteps = this.getCurrentScenario().steps;
        payload.state = PASSED;
        payload.keyword = this.utilsObject.containsSteps( currentSteps, this.options.language ) ? AFTER : BEFORE;

        this.addStepData( payload );
    }

    /**
     * This one is for the end of the hook, it directly comes after the onHookStart
     * A hook is the same  as a 'normal' step, so use the update step
     */
    public onHookEnd( payload: HookStats ): void {
        if ( this.options.disableHooks ) {
            return;
        }
        payload.state = payload.error ? payload.state : PASSED;

        return this.updateStepStatus( payload );
    }

    /**
     * This one starts the step, which will be set to pending
     */
    public onTestStart( payload: TestStats ): void {
        this.addStepData( payload );
    }

    // /**
    //  * This one starts a command
    //  *
    //  * @param payload
    //  */
    // onBeforeCommand(payload) {
    //     // console.log('\nconst onBeforeCommand= ', JSON.stringify(payload), '\n')
    // }

    // /**
    //  * This is the result of the command
    //  *
    //  * @param payload
    //  */
    // onAfterCommand(payload) {
    //     // console.log('\nconst onAfterCommand= ', JSON.stringify(payload), '\n')
    // }

    // onScreenshot(payload) {
    //     // console.log('\nconst onScreenshot= ', JSON.stringify(payload), '\n')
    // }

    /**
     * The passed step
     */
    public onTestPass( payload: TestStats ): void {
        this.updateStepStatus( payload );
    }

    /**
     * The failed step including the logs
     */
    public onTestFail( payload: TestStats ): void {
        this.updateStepStatus( payload );
    }

    /**
     * The skippe step
     */
    public onTestSkip( payload: TestStats ): void {
        this.updateStepStatus( payload );
    }

    // onTestEnd(payload) {
    //     console.log('\nonTestEnd');
    // }

    // /**
    //  * Executed twice:
    //  * - at the end of a scenario
    //  * - at the end of all scenario's
    //  *
    //  * @param payload
    //  */
    // onSuiteEnd(payload) {}

    /**
     * Runner is done, write the file
     */
    public onRunnerEnd(): void {
        const uniqueId = String( Date.now() + Math.random() ).replace( '.', '' );
        const filename = this.options.reportFilePerRetry
            ? `${this.report.feature.id}_${uniqueId}.json`
            : `${this.report.feature.id}.json`;
        const jsonFolder = resolve( process.cwd(), this.options.jsonFolder );
        const jsonFile = resolve( jsonFolder, filename );
        const json = [this.report.feature];
        // Check if there is an existing file, if so concat the data, else add the new
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        const output = existsSync( jsonFile ) ? json.concat( readJsonSync( jsonFile ) ) : json;

        outputJsonSync( jsonFile, output );
    }

    /**
     * All functions
     */

    /**
     * Get the feature data object
     */
    public getFeatureDataObject( featureData: SuiteStats ): Feature {
        const featureName = featureData.title;

        return {
            keyword: FEATURE,
            type: featureData.type,
            description: featureData.description || '',
            // Sample  `uid: 'sample.feature:2:1'`, where:
            // - [0]: file name
            // - [1]: line in file
            // - [2]: column
            line: featureData.uid && featureData.uid.includes( ':' ) ? parseInt( featureData.uid.split( ':' )[1], 10 ) : null,
            name: featureName,
            uri: featureData.file || 'Can not be determined',
            tags: featureData.tags || [],
            elements: [],
            id: featureName.replace( /[\\/?%*:|"<> ]/g, '-' ).toLowerCase(),
        };
    }

    /**
     * Get the scenario data object
     */
    public getScenarioDataObject(
        scenarioData: TestStatsExtended | SuiteStatsExtended | HookStatsExtended,
        id: string,
    ): Scenario {
        const scenarioName = scenarioData.title;

        return {
            keyword: SCENARIO,
            type: scenarioData.type,
            description: scenarioData.description || '',
            name: scenarioName,
            tags: scenarioData.tags || [],
            id: `${id};${scenarioData.title.replace( / /g, '-' ).toLowerCase()}`,
            steps: [],
        };
    }

    /**
     * Get the step data object
     */
    public getStepDataObject( stepData: TestStatsExtended | HookStatsExtended ): Step {
        const keyword =
            stepData?.keyword || this.utilsObject.keywordStartsWith( stepData.title, this.options.language ) || '';
        const title = ( stepData.title.split( keyword ).pop() || stepData.title || '' ).trim();
        return {
            arguments: stepData.argument ? [stepData.argument] : [],
            keyword,
            name: title,
            result: {
                status: stepData.state || '',
                duration: ( stepData._duration || 0 ) * 1000000,
                ...this.utilsObject.getFailedMessage( stepData ),
            },
            line: null,
            match: {
                location: 'can not be determined with webdriver.io',
            },
        };
    }

    /**
     * Get the current scenario
     */
    public getCurrentScenario(): Scenario {
        return this.report.feature.elements[this.report.feature.elements.length - 1];
    }

    /**
     * Get the current step
     */
    public getCurrentStep(): Step {
        const currentScenario = this.getCurrentScenario();

        return currentScenario.steps[currentScenario.steps.length - 1];
    }

    /**
     * Add step data to the current running scenario
     */
    public addStepData( test: TestStats | HookStats ): void {
        // Always add the finished step to the end of the steps
        // of the last current scenario that is running
        this.getCurrentScenario().steps.push( this.getStepDataObject( test ) );
    }

    /**
     * Add step data to the current running scenario
     */
    public updateStepStatus( test: TestStats | HookStats ): void {
        // There is always a scenario, take the last one
        const currentSteps = this.getCurrentScenario().steps;
        const currentStepsLength = currentSteps.length;
        const stepData = this.getStepDataObject( test );

        currentSteps[currentStepsLength - 1] = { ...this.getCurrentStep(), ...stepData };
    }

    /**
     * Add the attachment to the result
     */
    public cucumberJsAttachment( attachment: CucumberJsAttachment ): void {
        // The attachment can be added to the current running scenario step
        const currentStep = this.getCurrentStep();
        const embeddings = {
            data: attachment?.data,
            mime_type: attachment.type,
        };

        // Check if there is an embedding, if not, add it, else push it
        if ( !currentStep.embeddings ) {
            currentStep.embeddings = [embeddings];
        } else {
            currentStep.embeddings.push( embeddings );
        }
    }
}

// CucumberJsJsonReporter.name = 'cucumberjs-json';
export default CucumberJsJsonReporter;
