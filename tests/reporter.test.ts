/* eslint-disable @typescript-eslint/no-non-null-assertion */
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import url from 'node:url'
import path from 'node:path'
import { describe, it, expect, beforeAll, beforeEach, afterEach, vi, type SpyInstance } from 'vitest'

import { containsSteps, getFailedMessage } from '../src/utils.js'
import { AFTER, BEFORE, FAILED, PASSED, PENDING, TEXT_PLAIN } from '../src/constants.js'
import {
    EMPTY_FEATURE,
    EMPTY_SCENARIO,
    STEP_HOOK_ONSTART_STATS,
    STEP_TEST_ONSTART_ARGUMENT_STATS,
    STEP_TEST_ONSTART_STATS,
    SUITE_FEATURE_STATS,
    SUITE_FEATURE_UID,
    SUITE_SCENARIO_STATS,
    TEST_EMPTY_STATS,
    TEST_NO_KEYWORD_STATS,
    TEST_SCENARIO_STATS,
} from './__mocks__/mocks.js'
import type { HookStatsExtended, RunnerStatsExtended, SuiteStatsExtended, TestStatsExtended } from '../src/types/wdio.js'
import { Metadata } from '../src/metadata.js'
import type { Step } from '../src/types.js'
import WdioCucumberJsJsonReporter from '../src/index.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const logFolderPath = path.join(__dirname, '.tmp')
const logFile = path.join(logFolderPath, 'logFile.json')
const jsonFolder = path.join(logFolderPath, 'ut-folder')

vi.mock('../src/utils', () => ({
    containsSteps: vi.fn(),
    getFailedMessage: vi.fn(),
    keywordStartsWith: vi.fn()
}))

vi.mock('@wdio/logger', () => ({
    default: vi.fn().mockReturnValue({
        info: vi.fn()
    })
}))

describe('reporter', () => {
    let tmpReporter: WdioCucumberJsJsonReporter
    beforeAll(() => {
        if (!fs.existsSync(logFolderPath)) {
            fs.mkdirSync(logFolderPath)
            fs.closeSync(fs.openSync(logFile, 'w'))
        }
    })

    beforeEach(() => {
        tmpReporter = new WdioCucumberJsJsonReporter({
            jsonFolder,
            language: 'en',
            logFile,
        })
    })

    afterEach(() => {
        vi.clearAllMocks()
        EMPTY_FEATURE.elements = []
        EMPTY_SCENARIO.steps = []
        delete STEP_HOOK_ONSTART_STATS.keyword
    })

    describe('on create', () => {
        it('should set the defaults if only the logfile option is provided', () => {
            const noOptionsReporter = new WdioCucumberJsJsonReporter({
                logFile: logFile.replace('\\', '/'),
            })

            const { logFile: logFileOption, ...options } = noOptionsReporter.options
            expect(logFileOption).toBe(logFile)
            expect(options).toMatchSnapshot()
        })

        it('should verify initial properties', () => {
            const { jsonFolder: jsonFolderOption, logFile: logFileOption, ...options } = tmpReporter.options
            expect(options).toMatchSnapshot()
            expect(jsonFolderOption).toBe(jsonFolder)
            expect(logFileOption).toBe(logFile)
            expect(tmpReporter.instanceMetadata).toBeNull()
            expect(tmpReporter.report).toMatchSnapshot()
        })
    })

    describe('onRunnerStart', () => {
        it('should set instance data if it is not available yet', () => {
            const metadata = { foo: 'bar' }
            const metadataClassObject: Metadata = tmpReporter.metadataClassObject
            const determineMetadataSpy: SpyInstance = vi
                .spyOn(metadataClassObject, 'determineMetadata')
                .mockReturnValue(metadata)

            expect(tmpReporter.instanceMetadata).toBeNull()

            tmpReporter.onRunnerStart({} as RunnerStatsExtended)

            expect(determineMetadataSpy).toHaveBeenCalled()
            expect(tmpReporter.instanceMetadata).toEqual(metadata)
        })

        it('should set not set instance data if it is already available', () => {
            const metadata = { foo: 'bar' }
            const determineMetadataSpy: SpyInstance = vi
                .spyOn(new Metadata(), 'determineMetadata')
                .mockReturnValue(metadata)

            tmpReporter.instanceMetadata = metadata
            expect(tmpReporter.instanceMetadata).toEqual(metadata)

            tmpReporter.onRunnerStart({} as RunnerStatsExtended)

            expect(determineMetadataSpy).not.toHaveBeenCalled()
        })
    })

    describe('onSuiteStart', () => {
        it('should add the CucumberJS feature object if it is not available', () => {
            const featureData = { keyword: 'feature' }
            const getFeatureDataObjectSpy = vi
                .spyOn(tmpReporter, 'getFeatureDataObject')
                .mockReturnValue(featureData)

            expect(tmpReporter.report).toMatchSnapshot()

            tmpReporter.onSuiteStart({} as SuiteStatsExtended)

            expect(getFeatureDataObjectSpy).toHaveBeenCalled()
            expect(tmpReporter.report).toMatchSnapshot()
        })

        it('should add instance data to the feature if the feature is already there', () => {
            const metadata = { foo: 'bar' }
            const featureData = { keyword: 'feature' }
            const getFeatureDataObjectSpy = vi
                .spyOn(tmpReporter, 'getFeatureDataObject')
                .mockReturnValue(featureData)
            vi.spyOn(tmpReporter, 'getScenarioDataObject').mockReturnValue(EMPTY_SCENARIO)

            expect(tmpReporter.report).toMatchSnapshot()

            tmpReporter.instanceMetadata = metadata
            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.onSuiteStart(SUITE_SCENARIO_STATS)

            expect(getFeatureDataObjectSpy).not.toHaveBeenCalled()
            expect(tmpReporter.report).toMatchSnapshot()
        })

        it('should add a scenario to the feature if the feature is already there', () => {
            const getFeatureDataObjectSpy = vi.spyOn(tmpReporter, 'getFeatureDataObject')
            const getScenarioDataObjectSpy = vi
                .spyOn(tmpReporter, 'getScenarioDataObject')
                .mockReturnValue(EMPTY_SCENARIO)

            tmpReporter.report.feature = EMPTY_FEATURE

            expect(tmpReporter.report.feature.elements!.length).toEqual(0)

            tmpReporter.onSuiteStart(SUITE_SCENARIO_STATS)

            expect(getFeatureDataObjectSpy).not.toHaveBeenCalled()
            expect(getScenarioDataObjectSpy).toHaveBeenCalledWith(SUITE_SCENARIO_STATS, EMPTY_FEATURE.id)
            expect(tmpReporter.report.feature.elements).toMatchSnapshot()
        })
    })

    describe('onHookStart', () => {
        it('should call `addStepData` to add a pending before step', () => {
            const getCurrentScenarioSpy = vi.spyOn(tmpReporter, 'getCurrentScenario').mockReturnValue(EMPTY_SCENARIO)
            const addStepDataSpy = vi.spyOn(tmpReporter, 'addStepData').mockReturnValue()

            tmpReporter.onHookStart({} as HookStatsExtended)

            expect(getCurrentScenarioSpy).toHaveBeenCalledTimes(1)
            expect(containsSteps).toHaveBeenCalledTimes(1)
            expect(addStepDataSpy).toHaveBeenCalledWith({ state: PASSED, keyword: BEFORE })
        })

        it('should call `addStepData` to add a pending after step', () => {
            const getCurrentScenarioSpy = vi.spyOn(tmpReporter, 'getCurrentScenario').mockReturnValue(EMPTY_SCENARIO)
            const addStepDataSpy = vi.spyOn(tmpReporter, 'addStepData').mockReturnValue()

            vi.mocked(containsSteps).mockReturnValue(true)
            tmpReporter.onHookStart({} as HookStatsExtended)

            expect(getCurrentScenarioSpy).toHaveBeenCalledTimes(1)
            expect(containsSteps).toHaveBeenCalledTimes(1)

            expect(addStepDataSpy).toHaveBeenCalledWith({ state: PASSED, keyword: AFTER })
        })
        it('should not call `addStepData` to add a pending after step', () => {
            tmpReporter.options.disableHooks = true
            const withDisabledHooks = vi.spyOn(tmpReporter, 'addStepData').mockReturnValue()
            tmpReporter.onHookStart({} as HookStatsExtended)

            expect(withDisabledHooks).toHaveBeenCalledTimes(0)
        })
    })

    describe('onHookEnd', () => {
        it('should call update a hook step to passed', () => {
            const updateStepStatusSpy = vi.spyOn(tmpReporter, 'updateStepStatus').mockReturnValue()

            tmpReporter.onHookEnd({} as HookStatsExtended)

            expect(updateStepStatusSpy).toHaveBeenCalledWith({ state: PASSED })
        })

        it('should call update a hook step to the current state when there is an error', () => {
            const updateStepStatusSpy = vi.spyOn(tmpReporter, 'updateStepStatus').mockReturnValue()

            tmpReporter.onHookEnd({ state: FAILED, error: {} as Error } as HookStatsExtended)

            expect(updateStepStatusSpy).toHaveBeenCalledWith({ state: FAILED, error: {} })
        })

        it('should not call `addUpdateStepStatus` to add a pending after step', () => {
            tmpReporter.options.disableHooks = true
            const withDisabledHooks = vi.spyOn(tmpReporter, 'updateStepStatus').mockReturnValue()

            tmpReporter.onHookEnd({} as HookStatsExtended)

            expect(withDisabledHooks).toHaveBeenCalledTimes(0)
        })
    })

    describe('onTestStart', () => {
        it('should call `addStepDataSpy` to add a step when a test is started', () => {
            const addStepDataSpy = vi.spyOn(tmpReporter, 'addStepData').mockReturnValue()

            tmpReporter.onTestStart({ foo: 'bar' } as TestStatsExtended)

            expect(addStepDataSpy).toHaveBeenCalledWith({ foo: 'bar' })
        })
    })

    describe('onTestPass', () => {
        it('should call update a step', () => {
            const updateStepStatusSpy = vi.spyOn(tmpReporter, 'updateStepStatus').mockReturnValue()

            tmpReporter.onTestPass({ foo: true } as TestStatsExtended)

            expect(updateStepStatusSpy).toHaveBeenCalledWith({ foo: true })
        })
    })

    describe('onTestFail', () => {
        it('should call update a step', () => {
            const updateStepStatusSpy = vi.spyOn(tmpReporter, 'updateStepStatus').mockReturnValue()

            tmpReporter.onTestFail({ bar: true } as TestStatsExtended)

            expect(updateStepStatusSpy).toHaveBeenCalledWith({ bar: true })
        })
    })

    describe('onTestSkip', () => {
        it('should call update a step', () => {
            const updateStepStatusSpy = vi.spyOn(tmpReporter, 'updateStepStatus').mockReturnValue()

            tmpReporter.onTestSkip({ bar: false } as TestStatsExtended)

            expect(updateStepStatusSpy).toHaveBeenCalledWith({ bar: false })
        })
    })

    describe('onRunnerEnd', () => {
        it('should store the json file on the file system', async () => {
            tmpReporter.report.feature = { id: 'this-feature' }
            tmpReporter.options.jsonFolder = jsonFolder
            await fsp.rm(jsonFolder, {
                recursive: true,
                force: true
            })
            expect(fs.existsSync(jsonFolder)).toEqual(false)

            await tmpReporter.onRunnerEnd()
            const files = (await fsp.readdir(jsonFolder)).filter((dir) => dir !== '.' && dir !== '..')

            expect(files.length).toEqual(1)
            expect(files[0].includes(tmpReporter.report.feature.id!)).toEqual(true)
            expect(fs.existsSync(jsonFolder)).toEqual(true)
        })
        it('should by default create a unique Json file and should not add in existing Json file onRunnerEnd', async () => {
            tmpReporter.report.feature = { id: 'this-feature' }
            tmpReporter.options.jsonFolder = jsonFolder

            await tmpReporter.onRunnerEnd()
            await tmpReporter.onRunnerEnd()
            await tmpReporter.onRunnerEnd()
            await tmpReporter.onRunnerEnd()
            await tmpReporter.onRunnerEnd()

            const files = (await fsp.readdir(jsonFolder)).filter((dir) => dir !== '.' && dir !== '..')

            expect(files.length).toEqual(5)

            for (const jsonFile of files) {
                const fileContent = JSON.parse((await fsp.readFile(path.resolve(jsonFolder, jsonFile))).toString())
                expect(fileContent.length).toEqual(1)
            }
        })
        it('should be able to add json to an existing json output when reportFilePerRetry option is set to false', async () => {
            const jsonFile = `${jsonFolder}/this-feature.json`

            await fsp.rm(jsonFolder, { recursive: true, force: true })
            await fsp.mkdir(jsonFolder, { recursive: true })
            await fsp.copyFile(__dirname + '/__mocks__/mock.json', jsonFile)

            tmpReporter.report.feature = { id: 'this-feature' }
            tmpReporter.options.jsonFolder = jsonFolder
            tmpReporter.options.reportFilePerRetry = false

            const fileContent = JSON.parse((await fsp.readFile(path.resolve(jsonFolder, jsonFile))).toString())
            expect(fileContent.length).toEqual(1)

            await tmpReporter.onRunnerEnd()

            const files = (await fsp.readdir(jsonFolder)).filter((dir) => dir !== '.' && dir !== '..')

            expect(files.length).toEqual(1)
            const newFileContent = JSON.parse((await fsp.readFile(jsonFile)).toString())
            expect(newFileContent.length).toEqual(2)
        })

        afterEach(async () => {
            await fsp.rm(jsonFolder, {
                recursive: true,
                force: true
            })
        })
    })

    describe('getFeatureDataObject', () => {
        it('should be able to to create a feature JSON data object', () => {
            expect(tmpReporter.getFeatureDataObject(SUITE_FEATURE_STATS)).toMatchSnapshot()
        })

        it('should be able to to create a feature JSON data object with no line data', () => {
            expect(tmpReporter.getFeatureDataObject(SUITE_FEATURE_UID)).toMatchSnapshot()
        })
    })

    describe('getScenarioDataObject', () => {
        it('should be able to to create a scenario JSON data object', () => {
            expect(tmpReporter.getScenarioDataObject(TEST_SCENARIO_STATS, 'create-passed-feature')).toMatchSnapshot()
        })
    })

    describe('getStepDataObject', () => {
        beforeEach(() => {
            vi.mocked(getFailedMessage).mockReturnValue({})
        })

        it('should be able to to create a step JSON data object', () => {
            expect(tmpReporter.getStepDataObject(STEP_TEST_ONSTART_STATS)).toMatchSnapshot()
            expect(getFailedMessage).toHaveBeenCalledTimes(1)
        })

        it('should be able to add arguments to the step if they are present', () => {
            expect(tmpReporter.getStepDataObject(STEP_TEST_ONSTART_ARGUMENT_STATS)).toMatchSnapshot()
            expect(getFailedMessage).toHaveBeenCalledTimes(1)
        })

        it('should be able to to create a step JSON data object based on a hook', () => {
            STEP_HOOK_ONSTART_STATS.keyword = BEFORE
            expect(tmpReporter.getStepDataObject(STEP_HOOK_ONSTART_STATS)).toMatchSnapshot()
            expect(getFailedMessage).toHaveBeenCalledTimes(1)
        })

        it('should be able to to create a step JSON data object based on malformed data', () => {
            expect(tmpReporter.getStepDataObject(TEST_EMPTY_STATS)).toMatchSnapshot()
            expect(getFailedMessage).toHaveBeenCalled()
        })

        it('should be able to to create a step JSON data object based on missing keyword data', () => {
            expect(tmpReporter.getStepDataObject(TEST_NO_KEYWORD_STATS)).toMatchSnapshot()
            expect(getFailedMessage).toHaveBeenCalled()
        })
    })

    describe('getCurrentScenario', () => {
        it('should return the last number of the scenario array as the current running scenario number', () => {
            tmpReporter.report.feature = {
                elements: [{ foo: 'first-scenario' }, { bar: 'second-scenario' }, { foobar: 'current-scenario' }],
            }

            expect(tmpReporter.getCurrentScenario()).toEqual({ foobar: 'current-scenario' })
        })
    })

    describe('getCurrentStep', () => {
        it('should return current running step', () => {
            const currentScenarioMock = {
                steps: [{ foo: 'first-step' }, { foo: 'second-step' }, { foo: 'current-step' }] as Step[],
            }
            const getCurrentScenarioSpy = vi
                .spyOn(tmpReporter, 'getCurrentScenario')
                .mockReturnValue(currentScenarioMock)

            expect(tmpReporter.getCurrentStep()).toEqual(currentScenarioMock.steps[2])
            expect(getCurrentScenarioSpy).toHaveBeenCalledTimes(1)
        })
    })

    describe('addStepData', () => {
        it('should add step data to a current scenario', () => {
            const getCurrentScenarioSpy = vi.spyOn(tmpReporter, 'getCurrentScenario')
            const getStepDataObjectSpy = vi
                .spyOn(tmpReporter, 'getStepDataObject')
                .mockReturnValue({ foo: 'current-step' })

            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(EMPTY_SCENARIO)

            expect(tmpReporter.report.feature.elements![0].steps!.length).toEqual(0)

            tmpReporter.addStepData({} as HookStatsExtended)

            expect(tmpReporter.report.feature.elements![0].steps!.length).toEqual(1)
            expect(tmpReporter.report.feature.elements![0].steps).toMatchSnapshot()
            expect(getCurrentScenarioSpy).toHaveBeenCalledTimes(1)
            expect(getStepDataObjectSpy).toHaveBeenCalledTimes(1)
        })
    })

    describe('updateStepStatus', () => {
        it('should update step data of the current scenario step', () => {
            const pendingStep = { foo: 'current-step', status: PENDING }
            const updatedStep = { foo: 'current-step', status: PASSED, bar: false }
            const getCurrentScenarioSpy = vi.spyOn(tmpReporter, 'getCurrentScenario')
            const getStepDataObjectSpy = vi.spyOn(tmpReporter, 'getStepDataObject').mockReturnValue(updatedStep)
            const getCurrentStepSpy = vi
                .spyOn(tmpReporter, 'getCurrentStep')
                .mockReturnValue({ foo: 'current-step' })

            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(EMPTY_SCENARIO)
            tmpReporter.report.feature.elements![0].steps!.push(pendingStep)

            expect(tmpReporter.report.feature.elements![0].steps).toMatchSnapshot()
            expect(tmpReporter.report.feature.elements![0].steps!.length).toEqual(1)

            tmpReporter.updateStepStatus({} as TestStatsExtended)

            expect(tmpReporter.report.feature.elements![0].steps).toMatchSnapshot()
            expect(tmpReporter.report.feature.elements![0].steps!.length).toEqual(1)
            expect(getCurrentScenarioSpy).toHaveBeenCalledTimes(1)
            expect(getStepDataObjectSpy).toHaveBeenCalledTimes(1)
            expect(getCurrentStepSpy).toHaveBeenCalledTimes(1)
        })
    })

    describe('attach', () => {
        let mockStdout: SpyInstance
        beforeAll(() => {
            process.emit = vi.fn() as any
            mockStdout = vi.spyOn(process, 'emit')
        })

        afterEach(() => {
            //   process.emit.mockClear()
            mockStdout.mockClear()
        })

        it('should be able to attach default data', () => {
            WdioCucumberJsJsonReporter.attach('foo')

            expect(mockStdout).toHaveBeenCalledTimes(1)
            expect(mockStdout).toHaveBeenCalledWith('wdioCucumberJsReporter:attachment', {
                data: 'foo',
                type: TEXT_PLAIN,
            })
        })

        it('should be able to attach with all data', () => {
            WdioCucumberJsJsonReporter.attach('foo', 'text/plain')

            expect(mockStdout).toHaveBeenCalledTimes(1)
            expect(mockStdout).toHaveBeenCalledWith('wdioCucumberJsReporter:attachment', {
                data: 'foo',
                type: 'text/plain',
            })
        })
    })

    describe('cucumberJsAttachment', () => {
        it('should be able to add embeddings to a current step when they have not been added', () => {
            const pendingStep = { foo: 'current-step', status: PENDING }
            const getCurrentStepSpy = vi.spyOn(tmpReporter, 'getCurrentStep').mockReturnValue(pendingStep)

            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(EMPTY_SCENARIO)
            tmpReporter.report.feature.elements![0].steps!.push(pendingStep)

            expect(tmpReporter.report.feature.elements![0].steps![0]).toMatchSnapshot()

            tmpReporter.cucumberJsAttachment({ data: 'data', type: 'text/plain' })

            expect(tmpReporter.report.feature.elements![0].steps![0]).toMatchSnapshot()
            expect(getCurrentStepSpy).toHaveBeenCalledTimes(1)
        })

        it('should be able to add embeddings to a current step which already has embeddings', () => {
            const pendingStep: Step = {
                foo: 'current-step',
                result: { duration: 1, status: PENDING },
                embeddings: [{ data: 'data-1', mime_type: 'text/plain' }],
            }
            const getCurrentStepSpy = vi.spyOn(tmpReporter, 'getCurrentStep').mockReturnValue(pendingStep)

            tmpReporter.report.feature = EMPTY_FEATURE
            tmpReporter.report.feature.elements!.push(EMPTY_SCENARIO)
            tmpReporter.report.feature.elements![0].steps!.push(pendingStep)

            expect(tmpReporter.report.feature.elements![0].steps![0]).toMatchSnapshot()

            tmpReporter.cucumberJsAttachment({ data: 'data-2', type: 'text/plain' })

            expect(tmpReporter.report.feature.elements![0].steps![0]).toMatchSnapshot()
            expect(getCurrentStepSpy).toHaveBeenCalledTimes(1)
        })
    })
})
