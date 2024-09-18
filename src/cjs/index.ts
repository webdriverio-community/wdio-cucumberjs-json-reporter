class CJSCucumberJsJsonReporter {
    /**
     * Attach data to the report
     */
    public static attach(data: unknown, type: unknown): void {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type, @typescript-eslint/no-unsafe-assignment
        (process.emit as Function)('wdioCucumberJsReporter:attachment', { data, type })
    }
}

module.exports = CJSCucumberJsJsonReporter
exports.default = CJSCucumberJsJsonReporter
exports.CucumberJsJsonReporter = CJSCucumberJsJsonReporter
