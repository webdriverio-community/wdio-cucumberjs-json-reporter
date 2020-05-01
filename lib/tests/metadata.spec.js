import Metadata from '../metadata';
import { NOT_KNOWN } from '../constants';
import { FULL_RUNNER_STATS, SMALL_RUNNER_STATS, WDIO6_RUNNER_STATS } from './__mocks__/mocks';

describe('metadata', () => {
    describe('determineAppData', () => {
        it('should return that no app metadata could be determined', () => {
            expect(Metadata.determineAppData(
                {},
                {},
            )).toMatchSnapshot();
        });

        it('should return that the app name and version based on the metadata', () => {
            expect(Metadata.determineAppData(
                {},
                {
                    app: {
                        name: 'metadata app name',
                        version: 'metadata version 1.2.3',
                    },
                },
            )).toMatchSnapshot();
        });

        it('should return that the app name based on the config.app', () => {
            expect(Metadata.determineAppData(
                {
                    app: 'here/there/app.apk',
                },
                {},
            )).toMatchSnapshot();
        });

        it('should return that the app name based on the testobject_app_id', () => {
            expect(Metadata.determineAppData(
                {
                    testobject_app_id: '1',
                },
                {},
            )).toMatchSnapshot();
        });
    });

    describe('determineBrowserData', () => {
        it('should return that no browser metadata could be determined', () => {
            expect(Metadata.determineBrowserData(
                {},
                {},
                {},
            )).toMatchSnapshot();
        });

        it('should return that the browser name and version based on the metadata', () => {
            expect(Metadata.determineBrowserData(
                {},
                {},
                {
                    browser: {
                        name: 'metadata browser name',
                        version: 'metadata version 1.2.3',
                    },
                },
            )).toMatchSnapshot();
        });

        it('should return that the browser name and version based on the capabilities when version is used', () => {
            expect(Metadata.determineBrowserData(
                {
                    browserName: 'capabilities browser name',
                    version: 'capabilities version',
                },
                {},
                {},
            )).toMatchSnapshot();
        });

        it('should return that the browser name and version based on the capabilities when browserVersion is used', () => {
            expect(Metadata.determineBrowserData(
                {
                    browserName: 'capabilities browser name',
                    browserVersion: 'capabilities browserVersion',
                },
                {},
                {},
            )).toMatchSnapshot();
        });

        it('should return that the browser name and version based on the configCapabilities', () => {
            expect(Metadata.determineBrowserData(
                {},
                {
                    browserName: 'configCapabilities browser name',
                    browserVersion: 'configCapabilities browser version',
                },
                {},
            )).toMatchSnapshot();
        });
    });

    describe('determineDeviceName', () => {
        it('should be able to return the device metadata based on the metadata.device', () => {
            expect(Metadata.determineDeviceName({ device: 'metadata.device' }, {})).toMatchSnapshot();
        });

        it('should be able to return the device metadata based on the current.config.capabilities.deviceName', () => {
            expect(
                Metadata.determineDeviceName({}, { deviceName: 'current.config.capabilities.deviceName' }),
            ).toMatchSnapshot();
        });

        it('should be able to return the not known deviceName', () => {
            expect(Metadata.determineDeviceName({}, {})).toMatchSnapshot();
        });
    });

    describe('determinePlatformName', () => {
        it('should be able to return the platform name based on the metadata.platform', () => {
            expect(Metadata.determinePlatformName(
                {
                    platform: {
                        name: 'platform.name',
                    },
                },
                {},
            )).toMatchSnapshot();
        });

        it('should be able to return the platform name based on the currentCapabilities.platformName', () => {
            expect(
                Metadata.determinePlatformName({}, { platformName: 'currentCapabilities.platformName' }),
            ).toMatchSnapshot();
        });

        it('should be able to return the platform name based on the currentCapabilities.platformName for mac properly', () => {
            expect(
                Metadata.determinePlatformName({}, { platformName: 'mac' }),
            ).toMatchSnapshot();
        });

        it('should be able to return the platform name based on the currentCapabilities.platformName for windows properly', () => {
            expect(
                Metadata.determinePlatformName({}, { platformName: 'windows nt' }),
            ).toMatchSnapshot();
        });

        it('should be able to return the not known platform name', () => {
            expect(Metadata.determinePlatformName({}, {})).toMatchSnapshot();
        });
    });

    describe('determinePlatformVersion', () => {
        it('should be able to return the platform version based on the metadata.platform', () => {
            expect(Metadata.determinePlatformVersion(
                {
                    platform: {
                        version: 'platform.version',
                    },
                },
            )).toMatchSnapshot();
        });

        it('should be able to return the not known platform version', () => {
            expect(Metadata.determinePlatformVersion({})).toMatchSnapshot();
        });
    });

    describe('determineMetadata', () => {
        let determineAppDataSpy, determineBrowserDataSpy, determineDeviceNameSpy, determinePlatformNameSpy,
            determinePlatformVersionSpy;
        const appMockData = {
            app: {
                name: 'mock-appName',
                version: 'mock-appVersion',
            },
        };
        const browserMockData = {
            browser: {
                name: 'mock-browserName',
                version: 'mock-browserVersion',
            },
        };

        beforeEach(() => {
            delete global.browser;
            global.browser = {
                options: {
                    requestedCapabilities: {
                        w3cCaps:{
                            alwaysMatch:{
                                foo: true,
                            }
                        }
                    },
                },
            };
            determineAppDataSpy = jest.spyOn(Metadata, 'determineAppData');
            determineBrowserDataSpy = jest.spyOn(Metadata, 'determineBrowserData').mockReturnValue(browserMockData);
            determineDeviceNameSpy = jest.spyOn(Metadata, 'determineDeviceName').mockReturnValue(NOT_KNOWN);
            determinePlatformNameSpy = jest.spyOn(Metadata, 'determinePlatformName').mockReturnValue(NOT_KNOWN);
            determinePlatformVersionSpy = jest.spyOn(Metadata, 'determinePlatformVersion').mockReturnValue(NOT_KNOWN);
        });

        afterEach(() => {
            jest.clearAllMocks();
            delete global.browser;
        });

        it('should return app metadata based on the currentCapabilities.app', () => {
            FULL_RUNNER_STATS.config.capabilities.app = 'current.config.capabilities.app';

            const determineAppDataSpy = jest.spyOn(Metadata, 'determineAppData').mockReturnValue(appMockData);

            expect(Metadata.determineMetadata(FULL_RUNNER_STATS)).toMatchSnapshot();

            expect(determineAppDataSpy).toHaveBeenCalledTimes(1);
            expect(determineDeviceNameSpy).toHaveBeenCalledTimes(1);
            expect(determinePlatformNameSpy).toHaveBeenCalledTimes(1);
            expect(determinePlatformVersionSpy).toHaveBeenCalledTimes(1);

            delete FULL_RUNNER_STATS.config.capabilities.app;
            determineAppDataSpy.mockClear();
        });

        it('should return app metadata based on the currentCapabilities.testobject_app_id', () => {
            FULL_RUNNER_STATS.config.capabilities.testobject_app_id = 'current.config.capabilities.testobject_app_id';

            const determineAppDataSpy = jest.spyOn(Metadata, 'determineAppData').mockReturnValue(appMockData);

            expect(Metadata.determineMetadata(FULL_RUNNER_STATS)).toMatchSnapshot();

            expect(determineAppDataSpy).toHaveBeenCalledTimes(1);
            expect(determineDeviceNameSpy).toHaveBeenCalledTimes(1);
            expect(determinePlatformNameSpy).toHaveBeenCalledTimes(1);
            expect(determinePlatformVersionSpy).toHaveBeenCalledTimes(1);

            delete FULL_RUNNER_STATS.config.capabilities.testobject_app_id;
            determineAppDataSpy.mockClear();
        });

        it('should return app metadata based on the current.config.capabilities[\'cjson:metadata\'].app', () => {
            FULL_RUNNER_STATS.config.capabilities['cjson:metadata'].app = 'current.config.capabilitie[\'cjson:metadata\'].app';

            const determineAppDataSpy = jest.spyOn(Metadata, 'determineAppData').mockReturnValue(appMockData);

            expect(Metadata.determineMetadata(FULL_RUNNER_STATS)).toMatchSnapshot();

            expect(determineAppDataSpy).toHaveBeenCalledTimes(1);
            expect(determineDeviceNameSpy).toHaveBeenCalledTimes(1);
            expect(determinePlatformNameSpy).toHaveBeenCalledTimes(1);
            expect(determinePlatformVersionSpy).toHaveBeenCalledTimes(1);

            delete FULL_RUNNER_STATS.config.capabilities['cjson:metadata'].app;
            determineAppDataSpy.mockClear();
        });

        it('should return metadata based on the requestedCapabilities.w3cCaps.alwaysMatch', () => {
            global.browser = {
                options: {
                    requestedCapabilities: {
                        w3cCaps: {
                            alwaysMatch: {
                                'cjson:metadata': {},
                            },
                        },
                    },
                },
            };

            const determineAppDataSpy = jest.spyOn(Metadata, 'determineBrowserData').mockReturnValue(browserMockData);

            expect(Metadata.determineMetadata(WDIO6_RUNNER_STATS)).toMatchSnapshot();
            determineAppDataSpy.mockClear();
        });

        it('should return metadata based on the browser.options.capabilities', () => {
            global.browser = {
                options: {
                    requestedCapabilities: {
                        w3cCaps:{

                        }
                    },
                    capabilities: {
                        browserName: 'chrome',
                        'cjson:metadata': {},
                    }
                },
            };

            const determineAppDataSpy = jest.spyOn(Metadata, 'determineBrowserData').mockReturnValue(browserMockData);

            expect(Metadata.determineMetadata(WDIO6_RUNNER_STATS)).toMatchSnapshot();
            determineAppDataSpy.mockClear();
        });

        it('should return metadata based on the browser.options.capabilities', () => {
            global.browser = {
                options: {
                    capabilities: {
                        browserName: 'chrome',
                        'cjson:metadata': {},
                    },
                },

            };

            const determineAppDataSpy = jest.spyOn(Metadata, 'determineBrowserData').mockReturnValue(browserMockData);

            expect(Metadata.determineMetadata(WDIO6_RUNNER_STATS)).toMatchSnapshot();
            determineAppDataSpy.mockClear();
        });

        it('should call determineBrowserData when there is no way to  determine the app data', () => {
            Metadata.determineMetadata(SMALL_RUNNER_STATS);

            expect(determineAppDataSpy).toHaveBeenCalledTimes(0);
            expect(determineBrowserDataSpy).toHaveBeenCalledTimes(1);
            expect(determineDeviceNameSpy).toHaveBeenCalledTimes(1);
            expect(determinePlatformNameSpy).toHaveBeenCalledTimes(1);
            expect(determinePlatformVersionSpy).toHaveBeenCalledTimes(1);
        });

        it('should be able to return browser metadata', () => {
            expect(Metadata.determineMetadata(SMALL_RUNNER_STATS)).toMatchSnapshot();

            expect(determineBrowserDataSpy).toHaveBeenCalledTimes(1);
            expect(determineDeviceNameSpy).toHaveBeenCalledTimes(1);
            expect(determinePlatformNameSpy).toHaveBeenCalledTimes(1);
            expect(determinePlatformVersionSpy).toHaveBeenCalledTimes(1);
        });
    });
});
