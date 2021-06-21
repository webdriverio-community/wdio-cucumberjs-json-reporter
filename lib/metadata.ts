import { AppData, BrowserData, MetadataObject, cjson_metadata } from './models';
import { DesiredCapabilitiesExtended, RunnerStatsExtended, W3CCapabilitiesExtended, WebdriverIOExtended } from './types/wdio';
import { NOT_KNOWN } from './constants';
import WebDriver from 'webdriver';

export class Metadata {
    /**
     * ```
     * Determine the metadata that needs to be added
     *
     * @param {object} data instance data
     *
     * @returns {
     *  {
     *      metadata: {
     *          app: {
     *              name: string,
     *              version: string
     *          },
     *          browser: {
     *              name: string,
     *              version: string
     *          },
     *          device: string,
     *          platform: {
     *              name: string,
     *              version: string
     *          }
     *      }
     *  }
     * }
     * ```
     */
    public determineMetadata ( data: RunnerStatsExtended ): MetadataObject {
        let instanceData: AppData | BrowserData;
        const currentCapabilities = data.capabilities as W3CCapabilitiesExtended;
        const optsCaps = browser?.options?.capabilities;
        const currentConfigCapabilities = data?.capabilities as DesiredCapabilitiesExtended;
        const w3cCaps = ( browser?.options as WebdriverIOExtended )?.requestedCapabilities;
        const metadata: cjson_metadata = ( currentConfigCapabilities as W3CCapabilitiesExtended )?.cjson_metadata // For WDIO V6
            || w3cCaps?.cjson_metadata // When an app is used to test
            || ( optsCaps as DesiredCapabilitiesExtended )?.cjson_metadata // devtools
            || {} as cjson_metadata;

        // When an app is used to test
        // eslint-disable-next-line @typescript-eslint/tslint/config
        if ( currentConfigCapabilities?.app || ( currentConfigCapabilities )?.testobject_app_id || metadata?.app ) {
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
                version: this.determinePlatformVersion( metadata ),
            },
        };
    }

    /**
     * Determine the device name
     *
     * @param {object} metadata
     * @param {object} currentConfigCapabilities
     * @return {string}
     */
    public determineDeviceName ( metadata: cjson_metadata, currentConfigCapabilities: WebDriver.DesiredCapabilities ): string {
        return ( metadata?.device || currentConfigCapabilities?.deviceName || `Device name ${NOT_KNOWN}` );
    }

    /**
     * Determine the platform name
     *
     * @param {object} metadata
     * @param {object} currentCapabilities
     * @return {string}
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
     *
     * @param {object} metadata
     * @return {string}
     */
    public determinePlatformVersion ( metadata: cjson_metadata ): string {
        return ( metadata && metadata.platform && metadata.platform?.version )
            ? metadata.platform.version
            : `Version ${NOT_KNOWN}`;
    }

    /**
     * Determine the app data
     *
     * @param {object} currentConfigCapabilities The capabilities from the configured capabilities
     * @param {object} metadata The custom set capabilities
     *
     * @returns {
     * {
     * app: {
     *          name: string,
     *          version: string,
     *      },
     *  }
     * }
     */
    public determineAppData ( currentConfigCapabilities: DesiredCapabilitiesExtended, metadata: cjson_metadata ): AppData {
        const metaAppName: string = ( metadata?.app && metadata.app?.name ) ? metadata?.app?.name : 'No metadata.app.name available';
        const metaAppVersion: string = ( metadata?.app && metadata.app.version ) ? metadata.app.version : 'No metadata.app.version available';
        const appPath = currentConfigCapabilities.app || currentConfigCapabilities.testobject_app_id || metaAppName;
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
     *
     * @param {object} currentCapabilities The capabilities of the current run, that holds the most actual data
     * @param {object} currentConfigCapabilities The capabilities from the configured capabilities
     * @param {object} metadata The custom set capabilities
     *
     * @returns {
     *  {
     *      browser: {
     *          name: string,
     *          version: string,
     *      },
     *  }
     * }
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
