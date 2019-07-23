import Utils from '../utils';
import { TEST_SCENARIO_STATS, TEST_SCENARIO_STATS_ERROR } from './__mocks__/mocks';

describe('utils', () => {
    describe('escapeHTML', () => {
        it('should return an empty string and escape nothing', () => {
            expect(Utils.escapeHTML('')).toEqual('');
        });

        it('should return an empty string and escape nothing', () => {
            expect(Utils.escapeHTML('<div id="feature-chart">&</div>')).toMatchSnapshot();
        });
    });

    describe('getFailedMessage', () => {
        it('should not return an error message if the status is "passed"', () => {
            expect(Utils.getFailedMessage(TEST_SCENARIO_STATS)).toEqual({});
        });

        it('should return an error message if the status is "failed"', () => {
            expect(Utils.getFailedMessage(TEST_SCENARIO_STATS_ERROR)).toMatchSnapshot();
        });
    });

    describe('containsSteps', () => {
        it('should return false if none of the values is a step name', () => {
            const steps = [
                { keyword: 'foo' },
                { keyword: 'bar' },
                { keyword: 'foobar' },
            ];
            expect(Utils.containsSteps(steps)).toEqual(false);
        });

        it('should return true if step contains the word `Given`', () => {
            const steps = [
                { keyword: 'foo' },
                { keyword: 'bar' },
                { keyword: 'Given' },
            ];
            expect(Utils.containsSteps(steps)).toEqual(true);
        });

        it('should return true if step contains the word `When`', () => {
            const steps = [
                { keyword: 'When' },
                { keyword: 'bar' },
                { keyword: 'foo' },
            ];
            expect(Utils.containsSteps(steps)).toEqual(true);
        });

        it('should return true if step contains the word `Then`', () => {
            const steps = [
                { keyword: 'bar' },
                { keyword: 'Then' },
                { keyword: 'foo' },
            ];
            expect(Utils.containsSteps(steps)).toEqual(true);
        });

        it('should return true if step contains the word `And`', () => {
            const steps = [
                { keyword: 'bar' },
                { keyword: 'And' },
            ];
            expect(Utils.containsSteps(steps)).toEqual(true);
        });
    });
});
