import { FULL_RUNNER_STATS, SMALL_RUNNER_STATS, WDIO6_RUNNER_STATS } from './__mocks__/mocks';
import { W3CCapabilitiesExtended, WebdriverIOExtended } from '../types/wdio';
import { Browser } from 'webdriverio';
import { Metadata } from '../metadata';
import { NOT_KNOWN } from '../constants';
import { Options } from '@wdio/types';
import WebDriver from 'webdriver';
import { cjson_metadata } from '../models';

describe( 'metadata', () => {
    let metadataClassObject: Metadata;
    beforeAll( () => {
        metadataClassObject = new Metadata();
    } );

    describe( 'determineAppData', () => {
        it( 'should return that no app metadata could be determined', () => {
            expect( metadataClassObject.determineAppData(
                {} as WebDriver.DesiredCapabilities,
                {} as cjson_metadata,
            ) ).toMatchSnapshot();
        } );

        it( 'should return that the app name and version based on the metadata', () => {
            expect( metadataClassObject.determineAppData(
                {} as WebDriver.DesiredCapabilities,
                {
                    app: {
                        name: 'metadata app name',
                        version: 'metadata version 1.2.3',
                    },
                } as cjson_metadata,
            ) ).toMatchSnapshot();
        } );

        it( 'should return that the app name based on the config.app', () => {
            expect( metadataClassObject.determineAppData(
                {
                    app: 'here/there/app.apk',
                } as WebDriver.DesiredCapabilities,
                {} as cjson_metadata,
            ) ).toMatchSnapshot();
        } );

        it( 'should return that the app name based on the testobject_app_id', () => {
            expect( metadataClassObject.determineAppData(
                {
                    testobject_app_id: '1',
                } as WebDriver.DesiredCapabilities,
                {} as cjson_metadata,
            ) ).toMatchSnapshot();
        } );
    } );

    describe( 'determineBrowserData', () => {
        it( 'should return that no browser metadata could be determined', () => {
            expect( metadataClassObject.determineBrowserData(
                {} as WebDriver.DesiredCapabilities,
                {} as WebDriver.DesiredCapabilities,
                {} as cjson_metadata,
            ) ).toMatchSnapshot();
        } );

        it( 'should return that the browser name and version based on the metadata', () => {
            expect( metadataClassObject.determineBrowserData(
                {} as WebDriver.DesiredCapabilities,
                {} as WebDriver.DesiredCapabilities,
                {
                    browser: {
                        name: 'metadata browser name',
                        version: 'metadata version 1.2.3',
                    },
                } as cjson_metadata,
            ) ).toMatchSnapshot();
        } );

        it( 'should return that the browser name and version based on the capabilities when version is used', () => {
            expect( metadataClassObject.determineBrowserData(
                {
                    browserName: 'capabilities browser name',
                    version: 'capabilities version',
                } as WebDriver.DesiredCapabilities,
                {} as WebDriver.DesiredCapabilities,
                {} as cjson_metadata,
            ) ).toMatchSnapshot();
        } );

        it( 'should return that the browser name and version based on the capabilities when browserVersion is used', () => {
            expect( metadataClassObject.determineBrowserData(
                {
                    browserName: 'capabilities browser name',
                    browserVersion: 'capabilities browserVersion',
                } as WebDriver.DesiredCapabilities,
                {} as WebDriver.DesiredCapabilities,
                {} as cjson_metadata,
            ) ).toMatchSnapshot();
        } );

        it( 'should return that the browser name and version based on the configCapabilities', () => {
            expect( metadataClassObject.determineBrowserData(
                {} as WebDriver.DesiredCapabilities,
                {
                    browserName: 'configCapabilities browser name',
                    browserVersion: 'configCapabilities browser version',
                } as WebDriver.DesiredCapabilities,
                {} as cjson_metadata,
            ) ).toMatchSnapshot();
        } );
    } );

    describe( 'determineDeviceName', () => {
        it( 'should be able to return the device metadata based on the metadata.device', () => {
            expect( metadataClassObject.determineDeviceName( { device: 'metadata.device' } as cjson_metadata, {} as WebDriver.DesiredCapabilities ) ).toMatchSnapshot();
        } );

        it( 'should be able to return the device metadata based on the current.config.capabilities.deviceName', () => {
            expect(
                metadataClassObject.determineDeviceName( {} as cjson_metadata, { deviceName: 'current.config.capabilities.deviceName' } as WebDriver.DesiredCapabilities ),
            ).toMatchSnapshot();
        } );

        it( 'should be able to return the not known deviceName', () => {
            expect( metadataClassObject.determineDeviceName( {} as cjson_metadata, {} as WebDriver.DesiredCapabilities ) ).toMatchSnapshot();
        } );
    } );

    describe( 'determinePlatformName', () => {
        it( 'should be able to return the platform name based on the metadata.platform', () => {
            expect( metadataClassObject.determinePlatformName(
                {
                    platform: {
                        name: 'platform.name',
                    },
                } as cjson_metadata,
                {} as WebDriver.DesiredCapabilities,
            ) ).toMatchSnapshot();
        } );

        it( 'should be able to return the platform name based on the currentCapabilities.platformName', () => {
            expect(
                metadataClassObject.determinePlatformName( {} as cjson_metadata, { platformName: 'currentCapabilities.platformName' } as WebDriver.DesiredCapabilities ),
            ).toMatchSnapshot();
        } );

        it( 'should be able to return the platform name based on the currentCapabilities.platformName for mac properly', () => {
            expect(
                metadataClassObject.determinePlatformName( {} as cjson_metadata, { platformName: 'mac' } as WebDriver.DesiredCapabilities ),
            ).toMatchSnapshot();
        } );

        it( 'should be able to return the platform name based on the currentCapabilities.platformName for windows properly', () => {
            expect(
                metadataClassObject.determinePlatformName( {} as cjson_metadata, { platformName: 'windows nt' } as WebDriver.DesiredCapabilities ),
            ).toMatchSnapshot();
        } );

        it( 'should be able to return the not known platform name', () => {
            expect( metadataClassObject.determinePlatformName( {} as cjson_metadata, {} as WebDriver.DesiredCapabilities ) ).toMatchSnapshot();
        } );
    } );

    describe( 'determinePlatformVersion', () => {
        it( 'should be able to return the platform version based on the metadata.platform', () => {
            expect( metadataClassObject.determinePlatformVersion(
                {
                    platform: {
                        version: 'platform.version',
                    },
                } as cjson_metadata,
            ) ).toMatchSnapshot();
        } );

        it( 'should be able to return the not known platform version', () => {
            expect( metadataClassObject.determinePlatformVersion( {} as cjson_metadata ) ).toMatchSnapshot();
        } );
    } );

    describe( 'determineMetadata', () => {
        let determineAppDataSpy: jest.SpyInstance; let determineBrowserDataSpy: jest.SpyInstance; let determineDeviceNameSpy: jest.SpyInstance; let determinePlatformNameSpy: jest.SpyInstance;
        let determinePlatformVersionSpy;
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

        beforeEach( () => {
            delete global.browser;
            global.browser = {
                options: {
                    requestedCapabilities: {
                        w3cCaps: {
                            alwaysMatch: {
                                foo: true,
                            }
                        }
                    },
                } as WebdriverIOExtended,
            } as Browser<'sync'>;
            determineAppDataSpy = jest.spyOn( metadataClassObject, 'determineAppData' );
            determineBrowserDataSpy = jest.spyOn( metadataClassObject, 'determineBrowserData' ).mockReturnValue( browserMockData );
            determineDeviceNameSpy = jest.spyOn( metadataClassObject, 'determineDeviceName' ).mockReturnValue( NOT_KNOWN );
            determinePlatformNameSpy = jest.spyOn( metadataClassObject, 'determinePlatformName' ).mockReturnValue( NOT_KNOWN );
            determinePlatformVersionSpy = jest.spyOn( metadataClassObject, 'determinePlatformVersion' ).mockReturnValue( NOT_KNOWN );
        } );

        afterEach( () => {
            jest.clearAllMocks();
            delete global.browser;
        } );

        it( 'should return app metadata based on the currentCapabilities.app', () => {
            ( FULL_RUNNER_STATS.capabilities as W3CCapabilitiesExtended ).app = 'current.config.capabilities.app';

            determineAppDataSpy = jest.spyOn( metadataClassObject, 'determineAppData' ).mockReturnValue( appMockData );

            expect( metadataClassObject.determineMetadata( FULL_RUNNER_STATS ) ).toMatchSnapshot();

            expect( determineAppDataSpy ).toHaveBeenCalledTimes( 1 );
            expect( determineDeviceNameSpy ).toHaveBeenCalledTimes( 1 );
            expect( determinePlatformNameSpy ).toHaveBeenCalledTimes( 1 );
            expect( determinePlatformVersionSpy ).toHaveBeenCalledTimes( 1 );

            delete ( FULL_RUNNER_STATS.capabilities as W3CCapabilitiesExtended ).app;
            determineAppDataSpy.mockClear();
        } );

        it( 'should return app metadata based on the currentCapabilities.testobject_app_id', () => {
            ( FULL_RUNNER_STATS.capabilities as W3CCapabilitiesExtended ).testobject_app_id = 'current.config.capabilities.testobject_app_id';

            determineAppDataSpy = jest.spyOn( metadataClassObject, 'determineAppData' ).mockReturnValue( appMockData );

            expect( metadataClassObject.determineMetadata( FULL_RUNNER_STATS ) ).toMatchSnapshot();

            expect( determineAppDataSpy ).toHaveBeenCalledTimes( 1 );
            expect( determineDeviceNameSpy ).toHaveBeenCalledTimes( 1 );
            expect( determinePlatformNameSpy ).toHaveBeenCalledTimes( 1 );
            expect( determinePlatformVersionSpy ).toHaveBeenCalledTimes( 1 );

            delete ( FULL_RUNNER_STATS.capabilities as W3CCapabilitiesExtended ).testobject_app_id;
            determineAppDataSpy.mockClear();
        } );

        it( 'should return app metadata based on the current.config.capabilities[\'cjson:metadata\'].app', () => {
            ( FULL_RUNNER_STATS.capabilities as W3CCapabilitiesExtended )['cjson:metadata'].app = {
                'name': 'mock-appName',
                'version': 'mock-appVersion',
            };

            determineAppDataSpy = jest.spyOn( metadataClassObject, 'determineAppData' ).mockReturnValue( appMockData );

            expect( metadataClassObject.determineMetadata( FULL_RUNNER_STATS ) ).toMatchSnapshot();

            expect( determineAppDataSpy ).toHaveBeenCalledTimes( 1 );
            expect( determineDeviceNameSpy ).toHaveBeenCalledTimes( 1 );
            expect( determinePlatformNameSpy ).toHaveBeenCalledTimes( 1 );
            expect( determinePlatformVersionSpy ).toHaveBeenCalledTimes( 1 );

            delete ( FULL_RUNNER_STATS.capabilities as W3CCapabilitiesExtended )['cjson:metadata'].app;
            determineAppDataSpy.mockClear();
        } );

        it( 'should return metadata based on the requestedCapabilities.w3cCaps.alwaysMatch', () => {
            global.browser = {
                options: {
                    capabilities: {},
                    requestedCapabilities: {
                        w3cCaps: {
                            alwaysMatch: {
                                'cjson_metadata': {},
                            },
                        },
                    },
                } as Options.WebdriverIO,
            } as Browser<'sync'>;

            determineAppDataSpy = jest.spyOn( metadataClassObject, 'determineBrowserData' ).mockReturnValue( browserMockData );

            expect( metadataClassObject.determineMetadata( WDIO6_RUNNER_STATS ) ).toMatchSnapshot();
            determineAppDataSpy.mockClear();
        } );

        it( 'should return metadata based on the browser.options.capabilities if w3cCaps is empty', () => {
            global.browser = {
                options: {
                    requestedCapabilities: {
                        w3cCaps: {

                        }
                    },
                    capabilities: {
                        browserName: 'chrome',
                        'cjson_metadata': {},
                    }
                } as WebdriverIOExtended,
            } as Browser<'sync'>;

            determineAppDataSpy = jest.spyOn( metadataClassObject, 'determineBrowserData' ).mockReturnValue( browserMockData );

            expect( metadataClassObject.determineMetadata( WDIO6_RUNNER_STATS ) ).toMatchSnapshot();
            determineAppDataSpy.mockClear();
        } );

        it( 'should return metadata based on the browser.options.capabilities', () => {
            global.browser = {
                options: {
                    capabilities: {
                        browserName: 'chrome',
                        'cjson_metadata': {},
                    },
                } as WebdriverIOExtended,

            } as Browser<'sync'>;

            determineAppDataSpy = jest.spyOn( metadataClassObject, 'determineBrowserData' ).mockReturnValue( browserMockData );

            expect( metadataClassObject.determineMetadata( WDIO6_RUNNER_STATS ) ).toMatchSnapshot();
            determineAppDataSpy.mockClear();
        } );

        it( 'should call determineBrowserData when there is no way to  determine the app data', () => {
            metadataClassObject.determineMetadata( SMALL_RUNNER_STATS );

            expect( determineAppDataSpy ).toHaveBeenCalledTimes( 0 );
            expect( determineBrowserDataSpy ).toHaveBeenCalledTimes( 1 );
            expect( determineDeviceNameSpy ).toHaveBeenCalledTimes( 1 );
            expect( determinePlatformNameSpy ).toHaveBeenCalledTimes( 1 );
            expect( determinePlatformVersionSpy ).toHaveBeenCalledTimes( 1 );
        } );

        it( 'should be able to return browser metadata', () => {
            expect( metadataClassObject.determineMetadata( SMALL_RUNNER_STATS ) ).toMatchSnapshot();

            expect( determineBrowserDataSpy ).toHaveBeenCalledTimes( 1 );
            expect( determineDeviceNameSpy ).toHaveBeenCalledTimes( 1 );
            expect( determinePlatformNameSpy ).toHaveBeenCalledTimes( 1 );
            expect( determinePlatformVersionSpy ).toHaveBeenCalledTimes( 1 );
        } );
    } );
} );
