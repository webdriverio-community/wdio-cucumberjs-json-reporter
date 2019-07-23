import { FAILED } from './constants';

/**
 * Escape html in strings
 *
 * @param   {string}  string
 * @return  {string}
 */
function escapeHTML(string) {
    return !string
        ? string
        : string
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
}

/**
 * Add a failed message
 *
 * @param {object}  testObject
 *
 * @return {object}
 */
function getFailedMessage(testObject) {
    if (testObject.state === FAILED) {
        const actual = testObject.error.actual;
        const expected = testObject.error.expected;
        const stack = testObject.error.stack;
        const errorMessage = `Actual: ${ actual }\nExpected: ${ expected }\n\nStack:\n${ stack }`;

        return {
            error_message: errorMessage,
        };
    }

    return {};
}

/**
 * Check if the steps contain valid steps
 *
 * @param {array} steps
 *
 * @return {boolean}
 */
function containsSteps(steps){
    return steps.some(step => ['Given', 'When', 'Then', 'And'].includes(step.keyword));
}

const utilFunctions = {
    containsSteps,
    escapeHTML,
    getFailedMessage
};

export default utilFunctions;
