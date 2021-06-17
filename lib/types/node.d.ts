import { cjson_metadata } from '../models';
export {};


declare global {
  namespace NodeJS {
    export interface EnvironmentVariables {
      wdioCucumberJsReporter: string;
      attachment: string;
    }
  }

  namespace WebDriver{
    export interface W3CCapabilities{
      cjson_metadata: cjson_metadata;
    }

    export interface Capabilities{
      w3cCaps?: {
        alwaysMatch?: {
          foo?: boolean;
          cjson_metadata?: cjson_metadata;
        };
      };
    }

    export interface DesiredCapabilities{
      cjson_metadata?: cjson_metadata;
      testobject_app_id?: string;
    //   w3cCaps: {
    //     alwaysMatch: {
    //       foo: true;
    //     };
    //   };
    }
  }


}
