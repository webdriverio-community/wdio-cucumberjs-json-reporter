import { accessSync } from 'fs';

/**
 * Check if a file exists
 */
export const fileExists = ( filePath: string ): boolean => {
   // const fse = require('fs-extra');
    try {
        accessSync( filePath );
        return true;
    } catch ( err ) {
        return false;
    }
};
