import { dialects } from '@cucumber/gherkin';
import stripAnsi from 'strip-ansi';
import { FAILED } from './constants';

/**
 * Return the list of step keywords in the specified language
 *
 * @param {string} language
 *
 * @return {string[]}
 */
function getStepKeywords(language) {
    const dialect = dialects[language];
    return []
        .concat(dialect.given, dialect.when, dialect.then, dialect.and)
        .map(keyword => keyword.replace(/\s*$/, ''))
        .filter(keyword => keyword !== '*');
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
        return {
            error_message: stripAnsi(testObject.error.stack),
        };
    }

    return {};
}

/**
 * Check if the steps contain valid steps
 *
 * @param {array} steps
 *
 * @param {string} language
 *
 * @return {boolean}
 */
function containsSteps(steps, language) {
    const stepKeywords = getStepKeywords(language);
    return steps.some(step => stepKeywords.includes(step.keyword));
}

/**
 * Returns the first word in case it's a keyword in the specified language
 *
 * @param {array} title
 *
 * @param {string} language
 *
 * @return {string|undefined}
 */
function keywordStartsWith(title, language) {
    const stepKeywords = [].concat(getStepKeywords(language), ['After', 'Before']);
    return (title.match(new RegExp(`^(${stepKeywords.join('|')})\\s`)) || []).pop();
}

const utilFunctions = {
    containsSteps,
    getFailedMessage,
    keywordStartsWith,
};

export default utilFunctions;
