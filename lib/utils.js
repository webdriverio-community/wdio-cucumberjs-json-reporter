import { FAILED } from './constants';

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
    getFailedMessage
};

export default utilFunctions;
