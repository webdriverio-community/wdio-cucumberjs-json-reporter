import { AppData, BrowserData, MetadataObject, cjson_metadata } from './models';
import { DesiredCapabilitiesExtended, RunnerStatsExtended, W3CCapabilitiesExtended, WebdriverIOExtended } from './types/wdio';
import { Browser } from 'webdriverio';
import { NOT_KNOWN } from './constants';
import WebDriver from 'webdriver';

export class Metadata {
    /**
     * Determine the metadata that needs to be added
     */
    public determineMetadata ( data: RunnerStatsExtended ): MetadataObject {
        let instanceData: AppData | BrowserData;
        const currentCapabilities = data.capabilities as W3CCapabilitiesExtended;
        const optsCaps = ( browser as Browser<'async'> ).options.capabilities as W3CCapabilitiesExtended;
        const currentConfigCapabilities = data?.capabilities as DesiredCapabilitiesExtended;
        const w3cCaps: cjson_metadata = Object.prototype.hasOwnProperty.call( data.config.capabilities, 'cjson:metadata' )
            // Fixes: https://github.com/webdriverio-community/wdio-cucumberjs-json-reporter/issues/73
            ? data.config.capabilities['cjson:metadata'] as cjson_metadata
            // Fallback
            : ( ( browser as Browser<'async'> ).options as WebdriverIOExtended )?.requestedCapabilities?.cjson_metadata;
        const metadata: cjson_metadata = ( currentConfigCapabilities as W3CCapabilitiesExtended )?.cjson_metadata
            || w3cCaps // When an app is used to test
            || ( optsCaps as DesiredCapabilitiesExtended )?.cjson_metadata // devtools
            || {} as cjson_metadata;

        // When an app is used to test
        // eslint-disable-next-line @typescript-eslint/tslint/config
        if ( currentConfigCapabilities?.app || metadata?.app ) {
            instanceData = this.determineAppData( currentConfigCapabilities, metadata );
        } else {
            // Then a browser
            instanceData = this.determineBrowserData( currentCapabilities, currentConfigCapabilities, metadata );
        }

        return <MetadataObject>{
            ...instanceData,
            device: this.determineDeviceName( metadata, currentConfigCapabilities ),
            platform: {
                name: this.determinePlatformName( metadata, currentCapabilities ),
                version: this.determinePlatformVersion( metadata, currentCapabilities ),
            },
        };
    }

    /**
     * Determine the device name
     */
    public determineDeviceName ( metadata: cjson_metadata, currentConfigCapabilities: WebDriver.DesiredCapabilities ): string {
        return ( metadata?.device || currentConfigCapabilities?.deviceName || `Device name ${NOT_KNOWN}` );
    }

    /**
     * Determine the platform name
     */
    public determinePlatformName ( metadata: cjson_metadata, currentCapabilities: WebDriver.DesiredCapabilities ): string {
        const currentPlatformName = currentCapabilities?.platformName
            ? currentCapabilities?.platformName.includes( 'mac' )
                ? 'osx'
                : currentCapabilities.platformName.includes( 'windows' )
                    ? 'windows'
                    : currentCapabilities?.platformName
            : `Platform name ${NOT_KNOWN}`;
        return ( metadata.platform && metadata?.platform?.name )
            ? metadata.platform?.name
            : currentPlatformName;
    }

    /**
     * Determine the platform version
     */
    public determinePlatformVersion( metadata: cjson_metadata, currentCapabilities?: WebDriver.DesiredCapabilities ): string {
        if ( metadata && metadata.platform && metadata.platform?.version ) {
            return metadata.platform.version;
        }
        if ( currentCapabilities?.platformVersion ) {
            return currentCapabilities.platformVersion;
        }
        return `Version ${NOT_KNOWN}`;
    }

    /**
     * Determine the app data
     */
    public determineAppData ( currentConfigCapabilities: DesiredCapabilitiesExtended, metadata: cjson_metadata ): AppData {
        const metaAppName: string = ( metadata?.app && metadata.app?.name ) ? metadata?.app?.name : 'No metadata.app.name available';
        const metaAppVersion: string = ( metadata?.app && metadata.app.version ) ? metadata.app.version : 'No metadata.app.version available';
        const appPath = currentConfigCapabilities.app || metaAppName;
        const appName = appPath.substring( appPath.replace( '\\', '/' ).lastIndexOf( '/' ) ).replace( '/', '' );

        return {
            app: {
                name: appName,
                version: metaAppVersion,
            },
        };
    }

    /**
     * Determine the browser data
     */
    public determineBrowserData ( currentCapabilities: WebDriver.DesiredCapabilities, currentConfigCapabilities: WebDriver.DesiredCapabilities, metadata: cjson_metadata ): BrowserData {
        const browserName = currentCapabilities?.browserName
            || currentConfigCapabilities?.browserName
            || ( ( metadata && metadata?.browser && metadata.browser?.name ) ? metadata?.browser?.name : 'No metadata.browser.name available' );
        const browserVersion = currentCapabilities?.version
            || currentCapabilities?.browserVersion
            || currentConfigCapabilities?.browserVersion
            || ( ( metadata && metadata?.browser && metadata?.browser?.version ) ? metadata?.browser?.version : 'No metadata.browser.version available' );

        return <BrowserData>{
            browser: {
                name: browserName,
                version: browserVersion,
            }
        };
    }
}
