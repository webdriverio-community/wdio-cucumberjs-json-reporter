import {
    AFTER,
    BEFORE,
    DEFAULT_JSON_FOLDER,
    DEFAULT_LANGUAGE,
    FEATURE,
    PASSED,
    //   PENDING,
    SCENARIO,
    TEXT_PLAIN,
} from './constants';
import { CucumberJsAttachment, Feature, MetadataObject, Report, Scenario, Step } from './models';
import { HookStatsExtended, SuiteStatsExtended, TestStatsExtended } from './types/wdio';
import WDIOReporter, { HookStats, RunnerStats, SuiteStats, TestStats } from '@wdio/reporter';
import { existsSync, outputJsonSync, readJsonSync } from 'fs-extra';
import { Metadata } from './metadata';
import { Reporters } from '@wdio/types';
import Utils from './utils';
import logger from '@wdio/logger';
import { resolve } from 'path';
// Set Options = Reporters.Options;

const log = logger( 'wdio-multiple-cucumber-html-reporter' );

export class CucumberJsJsonReporter extends WDIOReporter {
    public options: Partial<Reporters.Options>;
    public reporterName: string;
    public instanceMetadata: MetadataObject;
    public report: Report;
    public metadataClassObject: Metadata;
    public utilsObject: Utils;

    public constructor( options: Partial<Reporters.Options> ) {
        super( options );

        if ( !options.jsonFolder ) {
            options.jsonFolder = DEFAULT_JSON_FOLDER;
            log.info( `The 'jsonFolder' was not set, it has been set to the default '${DEFAULT_JSON_FOLDER}'` );
        }
        if ( !options.language ) {
            options.language = DEFAULT_LANGUAGE;
            log.info( `The 'language' was not set, it has been set to the default '${DEFAULT_LANGUAGE}'` );
        }

        this.options = options;
        this.instanceMetadata = null;
        this.report = <Report>{};

        this.registerListeners();
        this.metadataClassObject = new Metadata();
        this.utilsObject = new Utils();
    }

    /**
     * Attach data to the report
     *
     * @param {string|object} data
     * @param {string} type Default is `text/plain`, otherwise what people deliver as a MIME type, like `application/json`, `image/png`
     */
    public static attach ( data: string, type = TEXT_PLAIN ): void {
        // eslint-disable-next-line @typescript-eslint/ban-types
        ( process.emit as Function )( 'wdioCucumberJsReporter:attachment', { data, type } );
    }

    /**
     * Add a customer listener for the attachments
     */
    public registerListeners (): void {
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
     *
     * @param {object} runnerData
     */
    public onRunnerStart ( runnerData: RunnerStats ): void {
        if ( !this.instanceMetadata ) {
            this.instanceMetadata = this.metadataClassObject.determineMetadata( runnerData );
        }
    }

    /**
     * This hook is called twice:
     * 1. create the feature
     * 2. add the scenario to the feature
     *
     * @param {object} payload
     */
    public onSuiteStart ( payload: SuiteStats ): void {
        if ( !this.report.feature ) {
            this.report.feature = this.getFeatureDataObject( payload );
        }

        /* istanbul ignore else */
        if ( !this.report.feature.metadata ) {
            this.report.feature = { ...this.report.feature, metadata: { ...this.instanceMetadata } };
        }

        if ( typeof this.report.feature.elements !== 'undefined' ) {
            this.report.feature.elements.push( this.getScenarioDataObject( payload, this.report.feature.id ) );
        }
    }

    /**
     * This one is for the start of the hook and determines if this is a pending `before` or `after` hook.
     * The data will be equal to a step, so a hook is added as a step.
     *
     * @param payload
     */
    public onHookStart ( payload: HookStatsExtended ): void {
        // There is always a scenario, take the last one
        const currentSteps = this.getCurrentScenario().steps;
        payload.state = PASSED;
        payload.keyword = this.utilsObject.containsSteps( currentSteps, this.options.language ) ? AFTER : BEFORE;

        this.addStepData( payload );
    }

    /**
     * This one is for the end of the hook, it directly comes after the onHookStart
     * A hook is the same  as a 'normal' step, so use the update step
     *
     * @param payload
     */
    public onHookEnd ( payload: HookStats ): void {
        payload.state = payload.error ? payload.state : PASSED;

        return this.updateStepStatus( payload );
    }

    /**
     * This one starts the step, which will be set to pending
     *
     * @param {object} payload
     */
    public onTestStart ( payload: TestStats ): void {
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
     *
     * @param payload
     */
    public onTestPass ( payload: TestStats ): void {
        this.updateStepStatus( payload );
    }

    /**
     * The failed step including the logs
     *
     * @param payload
     */
    public onTestFail ( payload: TestStats ): void {
        this.updateStepStatus( payload );
    }

    /**
     * The skippe step
     *
     * @param payload
     */
    public onTestSkip ( payload: TestStats ): void {
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
    public onRunnerEnd (): void {
        const jsonFolder = resolve( process.cwd(), this.options.jsonFolder );
        const jsonFile = resolve( jsonFolder, `${this.report.feature.id}.json` );
        const json = [this.report.feature];
        // Check if there is an existing file, if so concat the data, else add the new
        const output = existsSync( jsonFile ) ? json.concat( readJsonSync( jsonFile ) ) : json;

        outputJsonSync( jsonFile, output );
    }

    /**
     * All functions
     */

    /**
     * Get the feature data object
     * ```html
     * @param {object} featureData
     *
     * @returns {
     *  {
     *      keyword: string,
     *      line: number,
     *      name: string,
     *      tags: string,
     *      uri: string,
     *      elements: Array,
     *      id: string,
     *  }
     * }
     * ```
     */
    public getFeatureDataObject ( featureData: SuiteStats ): Feature {
        const featureName = featureData.title;

        return {
            keyword: FEATURE,
            type: featureData.type,
            description: ( featureData.description || '' ),
            line: parseInt( featureData.uid.substring( featureName.length, featureData.uid.length ), 10 ),
            name: featureName,
            uri: 'Can not be determined',
            tags: featureData.tags || [],
            elements: [],
            id: featureName.replace( /[\\/?%*:|"<> ]/g, '-' ).toLowerCase(),
        };
    }

    /**
     * Get the scenario data object
     *
     * @param {object} scenarioData This is the testdata of the current scenario
     * @param {string} id scenario id
     *
     * @returns {
     *  {
     *      keyword: string,
     *      description: string,
     *      name: string,
     *      tags: string,
     *      id: string,
     *      steps: Array,
     *  }
     * }
     */
    public getScenarioDataObject ( scenarioData: TestStatsExtended | SuiteStatsExtended | HookStatsExtended, id: string ): Scenario {
        const scenarioName = scenarioData.title;

        return {
            keyword: SCENARIO,
            type: scenarioData.type,
            description: ( scenarioData.description || '' ),
            name: scenarioName,
            tags: scenarioData.tags || [],
            id: `${id};${scenarioData.title.replace( / /g, '-' ).toLowerCase()}`,
            steps: [],
        };
    }

    /**
     * Get the step data object
     * ```
     * @param {object} stepData This is the testdata of the step
     *
     * @returns {
     *  {
     *      arguments: Array,
     *      keyword: string,
     *      name: *,
     *      result: {
     *          status: string,
     *          duration: number
     *      },
     *      line: number,
     *      match: {
     *          location: string,
     *      },
     *  }
     * }
     * ```
     */
    public getStepDataObject ( stepData: TestStatsExtended | HookStatsExtended ): Step {
        const keyword = stepData?.keyword
            || this.utilsObject.keywordStartsWith( stepData.title, this.options.language )
            || '';
        const title = ( stepData.title.split( keyword ).pop() || stepData.title || '' ).trim();
        const stepResult = {
            arguments: stepData.argument ? [stepData.argument] : [],
            keyword,
            name: title,
            result: {
                status: stepData.state || '',
                duration: ( stepData._duration || 0 ) * 1000000,
                ...this.utilsObject.getFailedMessage( stepData )
            },
            line: parseInt( stepData.uid.substring( title.length, stepData.uid.length ), 10 ) || '',
            match: {
                location: 'can not be determined with webdriver.io'
            }
        };

        return stepResult;
    }

    /**
     * Get the current scenario
     *
     * @return {object}
     */
    public getCurrentScenario (): Scenario {
        return this.report.feature.elements[this.report.feature.elements.length - 1];
    }

    /**
     * Get the current step
     *
     * @return {object}
     */
    public getCurrentStep (): Step {
        const currentScenario = this.getCurrentScenario();

        return currentScenario.steps[currentScenario.steps.length - 1];
    }

    /**
     * Add step data to the current running scenario
     *
     * @param {object} test
     */
    public addStepData ( test: TestStats | HookStats ): void {
        // Always add the finished step to the end of the steps
        // of the last current scenario that is running
        this.getCurrentScenario().steps.push( this.getStepDataObject( test ) );
    }

    /**
     * Add step data to the current running scenario
     *
     * @param {object} test
     */
    public updateStepStatus ( test: TestStats | HookStats ): void {
        // There is always a scenario, take the last one
        const currentSteps = this.getCurrentScenario().steps;
        const currentStepsLength = currentSteps.length;
        const stepData = this.getStepDataObject( test );

        currentSteps[currentStepsLength - 1] = { ...this.getCurrentStep(), ...stepData };
    }



    /**
     * Add the attachment to the result
     *
     * @param {string|object} data
     * @param {string} type
     */
    public cucumberJsAttachment ( attachment: CucumberJsAttachment ): void {
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
