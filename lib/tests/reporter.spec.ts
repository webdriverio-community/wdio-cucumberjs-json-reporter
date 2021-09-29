import * as fs from 'fs';
import { AFTER, BEFORE, FAILED, PASSED, PENDING, TEXT_PLAIN } from '../constants';
import {
    EMPTY_FEATURE, EMPTY_SCENARIO,
    STEP_HOOK_ONSTART_STATS,
    STEP_TEST_ONSTART_ARGUMENT_STATS,
    STEP_TEST_ONSTART_STATS,
    SUITE_FEATURE_STATS,
    SUITE_FEATURE_UID,
    SUITE_SCENARIO_STATS,
    TEST_EMPTY_STATS,
    TEST_NO_KEYWORD_STATS,
    TEST_SCENARIO_STATS
} from './__mocks__/mocks';
import { HookStatsExtended, RunnerStatsExtended, SuiteStatsExtended, TestStatsExtended } from '../types/wdio';
import { copySync, readJsonSync, readdirSync, removeSync } from 'fs-extra';
import { Metadata } from '../metadata';
import { Step } from '../models';
import WdioCucumberJsJsonReporter from '../reporter';
import { fileExists } from './fileExists';
import path from 'path';

describe( 'reporter', () => {
    let tmpReporter: WdioCucumberJsJsonReporter = null;
    const logFolder = '.tmp';
    const logFileName = 'logFile.json';
    const logFolderPath = path.join( __dirname, '../../', logFolder );
    const logFilePath = path.join( logFolderPath, logFileName );
    beforeAll( () => {
        if ( !fs.existsSync( logFolderPath ) ) {
            fs.mkdirSync( logFolderPath );
            fs.closeSync( fs.openSync( logFilePath, 'w' ) );
        }
    } );

    beforeEach( () => {
        tmpReporter = new WdioCucumberJsJsonReporter( {
            jsonFolder: '.tmp/json-folder/',
            language: 'en',
            logFile: `${logFolder}/${logFileName}`
        } );
    } );

    afterEach( () => {
        jest.clearAllMocks();
        EMPTY_FEATURE.elements = [];
        EMPTY_SCENARIO.steps = [];
        delete STEP_HOOK_ONSTART_STATS.keyword;
    } );

    describe( 'on create', () => {
        it( 'should set the defaults if only the logfile option is provided', () => {
            const noOptionsReporter = new WdioCucumberJsJsonReporter( { logFile: path.join( logFolder, logFileName ) } );

            expect( noOptionsReporter.options ).toMatchSnapshot();
        } );

        it( 'should verify initial properties', () => {
            expect( tmpReporter.options ).toMatchSnapshot();
            expect( tmpReporter.instanceMetadata ).toBeNull();
            expect( tmpReporter.report ).toMatchSnapshot();
        } );
    } );

    describe( 'onRunnerStart', () => {
        it( 'should set instance data if it is not available yet', () => {
            const metadata = { foo: 'bar' };
            const metadataClassObject: Metadata = tmpReporter.metadataClassObject;
            const determineMetadataSpy: jest.SpyInstance = jest.spyOn( metadataClassObject, 'determineMetadata' ).mockReturnValue( metadata );

            expect( tmpReporter.instanceMetadata ).toBeNull();

            tmpReporter.onRunnerStart( {} as RunnerStatsExtended );

            expect( determineMetadataSpy ).toHaveBeenCalled();
            expect( tmpReporter.instanceMetadata ).toEqual( metadata );
        } );

        it( 'should set not set instance data if it is already available', () => {
            const metadata = { foo: 'bar' };
            const determineMetadataSpy: jest.SpyInstance = jest.spyOn( new Metadata(), 'determineMetadata' ).mockReturnValue( metadata );

            tmpReporter.instanceMetadata = metadata;
            expect( tmpReporter.instanceMetadata ).toEqual( metadata );

            tmpReporter.onRunnerStart( {} as RunnerStatsExtended );

            expect( determineMetadataSpy ).not.toHaveBeenCalled();
        } );
    } );

    describe( 'onSuiteStart', () => {
        it( 'should add the CucumberJS feature object if it is not available', () => {
            const featureData = { keyword: 'feature' };
            const getFeatureDataObjectSpy = jest.spyOn( tmpReporter, 'getFeatureDataObject' ).mockReturnValue( featureData );

            expect( tmpReporter.report ).toMatchSnapshot();

            tmpReporter.onSuiteStart( {} as SuiteStatsExtended );

            expect( getFeatureDataObjectSpy ).toHaveBeenCalled();
            expect( tmpReporter.report ).toMatchSnapshot();
        } );

        it( 'should add instance data to the feature if the feature is already there', () => {
            const metadata = { foo: 'bar' };
            const featureData = { keyword: 'feature' };
            const getFeatureDataObjectSpy = jest.spyOn( tmpReporter, 'getFeatureDataObject' ).mockReturnValue( featureData );
            jest.spyOn( tmpReporter, 'getScenarioDataObject' ).mockReturnValue( EMPTY_SCENARIO );

            expect( tmpReporter.report ).toMatchSnapshot();

            tmpReporter.instanceMetadata = metadata;
            tmpReporter.report.feature = EMPTY_FEATURE;
            tmpReporter.onSuiteStart( SUITE_SCENARIO_STATS );

            expect( getFeatureDataObjectSpy ).not.toHaveBeenCalled();
            expect( tmpReporter.report ).toMatchSnapshot();
        } );

        it( 'should add a scenario to the feature if the feature is already there', () => {
            const getFeatureDataObjectSpy = jest.spyOn( tmpReporter, 'getFeatureDataObject' );
            const getScenarioDataObjectSpy = jest.spyOn( tmpReporter, 'getScenarioDataObject' ).mockReturnValue( EMPTY_SCENARIO );

            tmpReporter.report.feature = EMPTY_FEATURE;

            expect( tmpReporter.report.feature.elements.length ).toEqual( 0 );

            tmpReporter.onSuiteStart( SUITE_SCENARIO_STATS );

            expect( getFeatureDataObjectSpy ).not.toHaveBeenCalled();
            expect( getScenarioDataObjectSpy ).toHaveBeenCalledWith( SUITE_SCENARIO_STATS, EMPTY_FEATURE.id );
            expect( tmpReporter.report.feature.elements ).toMatchSnapshot();
        } );
    } );

    describe( 'onHookStart', () => {
        it( 'should call `addStepData` to add a pending before step', () => {
            const getCurrentScenarioSpy = jest.spyOn( tmpReporter, 'getCurrentScenario' ).mockReturnValue( EMPTY_SCENARIO );
            const containsStepsSpy = jest.spyOn( tmpReporter.utilsObject, 'containsSteps' ).mockReturnValue( false );
            const addStepDataSpy = jest.spyOn( tmpReporter, 'addStepData' ).mockReturnValue();

            tmpReporter.onHookStart( {} as HookStatsExtended );

            expect( getCurrentScenarioSpy ).toHaveBeenCalledTimes( 1 );
            expect( containsStepsSpy ).toHaveBeenCalledTimes( 1 );
            expect( addStepDataSpy ).toHaveBeenCalledWith( { state: PASSED, keyword: BEFORE } );
        } );

        it( 'should call `addStepData` to add a pending after step', () => {
            const getCurrentScenarioSpy = jest.spyOn( tmpReporter, 'getCurrentScenario' ).mockReturnValue( EMPTY_SCENARIO );
            const containsStepsSpy = jest.spyOn( tmpReporter.utilsObject, 'containsSteps' ).mockReturnValue( true );
            const addStepDataSpy = jest.spyOn( tmpReporter, 'addStepData' ).mockReturnValue();

            tmpReporter.onHookStart( {} as HookStatsExtended );

            expect( getCurrentScenarioSpy ).toHaveBeenCalledTimes( 1 );
            expect( containsStepsSpy ).toHaveBeenCalledTimes( 1 );
            expect( addStepDataSpy ).toHaveBeenCalledWith( { state: PASSED, keyword: AFTER } );
        } );
    } );

    describe( 'onHookEnd', () => {
        it( 'should call update a hook step to passed', () => {
            const updateStepStatusSpy = jest.spyOn( tmpReporter, 'updateStepStatus' ).mockReturnValue();

            tmpReporter.onHookEnd( {} as HookStatsExtended );

            expect( updateStepStatusSpy ).toHaveBeenCalledWith( { state: PASSED } );
        } );

        it( 'should call update a hook step to the current state when there is an error', () => {

            const updateStepStatusSpy = jest.spyOn( tmpReporter, 'updateStepStatus' ).mockReturnValue();

            tmpReporter.onHookEnd( { state: FAILED, error: {} as Error } as HookStatsExtended );

            expect( updateStepStatusSpy ).toHaveBeenCalledWith( { state: FAILED, error: {} } );
        } );
    } );

    describe( 'onTestStart', () => {
        it( 'should call `addStepDataSpy` to add a step when a test is started', () => {
            const addStepDataSpy = jest.spyOn( tmpReporter, 'addStepData' ).mockReturnValue();

            tmpReporter.onTestStart( { foo: 'bar' } as TestStatsExtended );

            expect( addStepDataSpy ).toHaveBeenCalledWith( { foo: 'bar' } );
        } );
    } );

    describe( 'onTestPass', () => {
        it( 'should call update a step', () => {
            const updateStepStatusSpy = jest.spyOn( tmpReporter, 'updateStepStatus' ).mockReturnValue();

            tmpReporter.onTestPass( { foo: true } as TestStatsExtended );

            expect( updateStepStatusSpy ).toHaveBeenCalledWith( { foo: true } );
        } );
    } );

    describe( 'onTestFail', () => {
        it( 'should call update a step', () => {
            const updateStepStatusSpy = jest.spyOn( tmpReporter, 'updateStepStatus' ).mockReturnValue();

            tmpReporter.onTestFail( { bar: true } as TestStatsExtended );

            expect( updateStepStatusSpy ).toHaveBeenCalledWith( { bar: true } );
        } );
    } );

    describe( 'onTestSkip', () => {
        it( 'should call update a step', () => {
            const updateStepStatusSpy = jest.spyOn( tmpReporter, 'updateStepStatus' ).mockReturnValue();

            tmpReporter.onTestSkip( { bar: false } as TestStatsExtended );

            expect( updateStepStatusSpy ).toHaveBeenCalledWith( { bar: false } );
        } );
    } );

    describe( 'onRunnerEnd', () => {
        it( 'should store the json file on the file system', () => {
            const jsonFolder = './.tmp/ut-folder';

            tmpReporter.report.feature = { id: 'this-feature' };
            tmpReporter.options.jsonFolder = jsonFolder;

            expect( fileExists( jsonFolder ) ).toEqual( false );

            tmpReporter.onRunnerEnd();

            const files = readdirSync( jsonFolder );

            expect( files.length ).toEqual( 1 );
            expect( files[0].includes( tmpReporter.report.feature.id ) ).toEqual( true );
            expect( fileExists( jsonFolder ) ).toEqual( true );

            // Clean up
            removeSync( jsonFolder );
        } );

        it( 'should be able to add json to an existing json output', () => {
            const jsonFolder = './.tmp/ut-folder';
            const jsonFile = `${jsonFolder}/this-feature.json`;

            copySync( 'lib/tests/__mocks__/mock.json', jsonFile );

            tmpReporter.report.feature = { id: 'this-feature' };
            tmpReporter.options.jsonFolder = jsonFolder;

            expect( ( readJsonSync( jsonFile ) as any[] ).length ).toEqual( 1 );

            tmpReporter.onRunnerEnd();

            const files = readdirSync( jsonFolder );

            expect( files.length ).toEqual( 1 );
            expect( ( readJsonSync( jsonFile ) as any[] ).length ).toEqual( 2 );

            // Clean up
            removeSync( jsonFolder );
        } );
    } );

    describe( 'getFeatureDataObject', () => {
        it( 'should be able to to create a feature JSON data object', () => {
            expect( tmpReporter.getFeatureDataObject( SUITE_FEATURE_STATS ) ).toMatchSnapshot();
        } );

        it( 'should be able to to create a feature JSON data object with no line data', () => {
            expect( tmpReporter.getFeatureDataObject( SUITE_FEATURE_UID ) ).toMatchSnapshot();
        } );
    } );

    describe( 'getScenarioDataObject', () => {
        it( 'should be able to to create a scenario JSON data object', () => {

            expect( tmpReporter.getScenarioDataObject(
                TEST_SCENARIO_STATS,
                'create-passed-feature',
            ) ).toMatchSnapshot();
        } );
    } );

    describe( 'getStepDataObject', () => {
        let getFailedMessageSpy;

        beforeEach( () => {
            getFailedMessageSpy = jest.spyOn( tmpReporter.utilsObject, 'getFailedMessage' ).mockReturnValue( {} );
        } );

        it( 'should be able to to create a step JSON data object', () => {
            expect( tmpReporter.getStepDataObject( STEP_TEST_ONSTART_STATS ) ).toMatchSnapshot();
            expect( getFailedMessageSpy ).toHaveBeenCalledTimes( 1 );
        } );

        it( 'should be able to add arguments to the step if they are present', () => {
            expect( tmpReporter.getStepDataObject( STEP_TEST_ONSTART_ARGUMENT_STATS ) ).toMatchSnapshot();
            expect( getFailedMessageSpy ).toHaveBeenCalledTimes( 1 );
        } );

        it( 'should be able to to create a step JSON data object based on a hook', () => {
            STEP_HOOK_ONSTART_STATS.keyword = BEFORE;
            expect( tmpReporter.getStepDataObject( STEP_HOOK_ONSTART_STATS ) ).toMatchSnapshot();
            expect( getFailedMessageSpy ).toHaveBeenCalledTimes( 1 );
        } );

        it( 'should be able to to create a step JSON data object based on malformed data', () => {
            expect( tmpReporter.getStepDataObject( TEST_EMPTY_STATS ) ).toMatchSnapshot();
            expect( getFailedMessageSpy ).toHaveBeenCalled();
        } );

        it( 'should be able to to create a step JSON data object based on missing keyword data', () => {
            expect( tmpReporter.getStepDataObject( TEST_NO_KEYWORD_STATS ) ).toMatchSnapshot();
            expect( getFailedMessageSpy ).toHaveBeenCalled();
        } );
    } );

    describe( 'getCurrentScenario', () => {
        it( 'should return the last number of the scenario array as the current running scenario number', () => {
            tmpReporter.report.feature = {
                elements: [{ foo: 'first-scenario' }, { bar: 'second-scenario' }, { foobar: 'current-scenario' }],
            };

            expect( tmpReporter.getCurrentScenario() ).toEqual( { foobar: 'current-scenario' } );
        } );
    } );

    describe( 'getCurrentStep', () => {
        it( 'should return current running step', () => {
            const currentScenarioMock = {
                steps: [
                    { foo: 'first-step' },
                    { foo: 'second-step' },
                    { foo: 'current-step' },
                ] as Step[],
            };
            const getCurrentScenarioSpy = jest.spyOn( tmpReporter, 'getCurrentScenario' ).mockReturnValue( currentScenarioMock );

            expect( tmpReporter.getCurrentStep() ).toEqual( currentScenarioMock.steps[2] );
            expect( getCurrentScenarioSpy ).toHaveBeenCalledTimes( 1 );
        } );
    } );

    describe( 'addStepData', () => {
        it( 'should add step data to a current scenario', () => {
            const getCurrentScenarioSpy = jest.spyOn( tmpReporter, 'getCurrentScenario' );
            const getStepDataObjectSpy = jest.spyOn( tmpReporter, 'getStepDataObject' ).mockReturnValue( { foo: 'current-step' } );

            tmpReporter.report.feature = EMPTY_FEATURE;
            tmpReporter.report.feature.elements.push( EMPTY_SCENARIO );

            expect( tmpReporter.report.feature.elements[0].steps.length ).toEqual( 0 );

            tmpReporter.addStepData( {} as HookStatsExtended );

            expect( tmpReporter.report.feature.elements[0].steps.length ).toEqual( 1 );
            expect( tmpReporter.report.feature.elements[0].steps ).toMatchSnapshot();
            expect( getCurrentScenarioSpy ).toHaveBeenCalledTimes( 1 );
            expect( getStepDataObjectSpy ).toHaveBeenCalledTimes( 1 );
        } );
    } );

    describe( 'updateStepStatus', () => {
        it( 'should update step data of the current scenario step', () => {
            const pendingStep = { foo: 'current-step', status: PENDING };
            const updatedStep = { foo: 'current-step', status: PASSED, bar: false };
            const getCurrentScenarioSpy = jest.spyOn( tmpReporter, 'getCurrentScenario' );
            const getStepDataObjectSpy = jest.spyOn( tmpReporter, 'getStepDataObject' ).mockReturnValue( updatedStep );
            const getCurrentStepSpy = jest.spyOn( tmpReporter, 'getCurrentStep' ).mockReturnValue( { foo: 'current-step' } );

            tmpReporter.report.feature = EMPTY_FEATURE;
            tmpReporter.report.feature.elements.push( EMPTY_SCENARIO );
            tmpReporter.report.feature.elements[0].steps.push( pendingStep );

            expect( tmpReporter.report.feature.elements[0].steps ).toMatchSnapshot();
            expect( tmpReporter.report.feature.elements[0].steps.length ).toEqual( 1 );

            tmpReporter.updateStepStatus( {} as TestStatsExtended );

            expect( tmpReporter.report.feature.elements[0].steps ).toMatchSnapshot();
            expect( tmpReporter.report.feature.elements[0].steps.length ).toEqual( 1 );
            expect( getCurrentScenarioSpy ).toHaveBeenCalledTimes( 1 );
            expect( getStepDataObjectSpy ).toHaveBeenCalledTimes( 1 );
            expect( getCurrentStepSpy ).toHaveBeenCalledTimes( 1 );
        } );
    } );

    describe( 'attach', () => {
        let mockStdout: jest.SpyInstance;
        beforeAll( () => {
            //   process.emit = jest.fn();
            mockStdout = jest.spyOn( process, 'emit' ).mockImplementation();


        } );

        afterEach( () => {
            //   process.emit.mockClear();
            mockStdout.mockClear();
        } );

        it( 'should be able to attach default data', () => {
            WdioCucumberJsJsonReporter.attach( 'foo' );

            expect( mockStdout ).toHaveBeenCalledTimes( 1 );
            expect( mockStdout ).toHaveBeenCalledWith( 'wdioCucumberJsReporter:attachment', {
                data: 'foo',
                type: TEXT_PLAIN
            } );
        } );

        it( 'should be able to attach with all data', () => {
            WdioCucumberJsJsonReporter.attach( 'foo', 'type/string' );

            expect( mockStdout ).toHaveBeenCalledTimes( 1 );
            expect( mockStdout ).toHaveBeenCalledWith( 'wdioCucumberJsReporter:attachment', {
                data: 'foo',
                type: 'type/string'
            } );
        } );
    } );

    describe( 'cucumberJsAttachment', () => {
        it( 'should be able to add embeddings to a current step when they have not been added', () => {
            const pendingStep = { foo: 'current-step', status: PENDING };
            const getCurrentStepSpy = jest.spyOn( tmpReporter, 'getCurrentStep' ).mockReturnValue( pendingStep );

            tmpReporter.report.feature = EMPTY_FEATURE;
            tmpReporter.report.feature.elements.push( EMPTY_SCENARIO );
            tmpReporter.report.feature.elements[0].steps.push( pendingStep );

            expect( tmpReporter.report.feature.elements[0].steps[0] ).toMatchSnapshot();

            tmpReporter.cucumberJsAttachment( { data: 'data', type: 'mime_type' } );

            expect( tmpReporter.report.feature.elements[0].steps[0] ).toMatchSnapshot();
            expect( getCurrentStepSpy ).toHaveBeenCalledTimes( 1 );
        } );

        it( 'should be able to add embeddings to a current step which already has embeddings', () => {
            const pendingStep = {
                foo: 'current-step',
                status: PENDING,
                embeddings: [{ data: 'data-1', mime_type: 'mime_type-1' }]
            };
            const getCurrentStepSpy = jest.spyOn( tmpReporter, 'getCurrentStep' ).mockReturnValue( pendingStep );

            tmpReporter.report.feature = EMPTY_FEATURE;
            tmpReporter.report.feature.elements.push( EMPTY_SCENARIO );
            tmpReporter.report.feature.elements[0].steps.push( pendingStep );

            expect( tmpReporter.report.feature.elements[0].steps[0] ).toMatchSnapshot();

            tmpReporter.cucumberJsAttachment( { data: 'data-2', type: 'mime_type-2' } );

            expect( tmpReporter.report.feature.elements[0].steps[0] ).toMatchSnapshot();
            expect( getCurrentStepSpy ).toHaveBeenCalledTimes( 1 );
        } );
    } );
} );
