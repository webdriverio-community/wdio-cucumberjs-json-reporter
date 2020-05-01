import { NOT_KNOWN } from './constants';

/**
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
 */
function determineMetadata(data) {
    let instanceData;
    const currentCapabilities = data.capabilities;
    const { capabilities: optsCaps = {}, requestedCapabilities = {} } = browser.options;
    const currentConfigCapabilities = data.config.capabilities || {};
    const { w3cCaps = {} } = requestedCapabilities;
    const metadata = currentConfigCapabilities['cjson:metadata'] // For WDIO V6
    || (w3cCaps.alwaysMatch && w3cCaps.alwaysMatch['cjson:metadata']) // When an app is used to test
    || optsCaps['cjson:metadata'] // devtools
    || {};

    // When an app is used to test
    if (currentConfigCapabilities.app || currentConfigCapabilities.testobject_app_id || metadata.app) {
        instanceData = metadataFunctions.determineAppData(currentConfigCapabilities, metadata);
    } else {
        // Then a browser
        instanceData = metadataFunctions.determineBrowserData(currentCapabilities, currentConfigCapabilities, metadata);
    }

    return {
        metadata: {
            ...instanceData,
            device: metadataFunctions.determineDeviceName(metadata, currentConfigCapabilities),
            platform: {
                name: metadataFunctions.determinePlatformName(metadata, currentCapabilities),
                version: metadataFunctions.determinePlatformVersion(metadata),
            },
        }
    };
}

/**
 * Determine the device name
 *
 * @param {object} metadata
 * @param {object} currentConfigCapabilities
 * @return {string}
 */
function determineDeviceName(metadata, currentConfigCapabilities) {
    return (metadata.device || currentConfigCapabilities.deviceName || `Device name ${NOT_KNOWN}`);
}

/**
 * Determine the platform name
 *
 * @param {object} metadata
 * @param {object} currentCapabilities
 * @return {string}
 */
function determinePlatformName(metadata, currentCapabilities) {
    const currentPlatformName = currentCapabilities.platformName
        ? currentCapabilities.platformName.includes('mac')
            ? 'osx'
            : currentCapabilities.platformName.includes('windows')
                ? 'windows'
                : currentCapabilities.platformName
        : `Platform name ${NOT_KNOWN}`;
    return (metadata.platform && metadata.platform.name)
        ? metadata.platform.name
        : currentPlatformName;
}

/**
 * Determine the platform version
 *
 * @param {object} metadata
 * @return {string}
 */
function determinePlatformVersion(metadata) {
    return (metadata && metadata.platform && metadata.platform.version)
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
 *  {
 *      app: {
 *          name: string,
 *          version: string,
 *      },
 *  }
 * }
 */
function determineAppData(currentConfigCapabilities, metadata) {
    const metaAppName = (metadata.app && metadata.app.name) ? metadata.app.name : 'No metadata.app.name available';
    const metaAppVersion = (metadata.app && metadata.app.version) ? metadata.app.version : 'No metadata.app.version available';
    const appPath = (currentConfigCapabilities.app || currentConfigCapabilities.testobject_app_id || metaAppName);
    const appName = appPath.substring(appPath.replace('\\', '/').lastIndexOf('/')).replace('/', '');

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
function determineBrowserData(currentCapabilities, currentConfigCapabilities, metadata) {
    const browserName = currentCapabilities.browserName
        || currentConfigCapabilities.browserName
        || ((metadata && metadata.browser && metadata.browser.name) ? metadata.browser.name : 'No metadata.browser.name available');
    const browserVersion = currentCapabilities.version
        || currentCapabilities.browserVersion
        || currentConfigCapabilities.browserVersion
        || ((metadata && metadata.browser && metadata.browser.version) ? metadata.browser.version : 'No metadata.browser.version available');

    return {
        browser: {
            name: browserName,
            version: browserVersion,
        }
    };
}

const metadataFunctions = {
    determineAppData,
    determineBrowserData,
    determineDeviceName,
    determineMetadata,
    determinePlatformName,
    determinePlatformVersion,
};

export default metadataFunctions;
