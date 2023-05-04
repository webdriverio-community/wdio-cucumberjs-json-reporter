class CJSCucumberJsJsonReporter {
    /**
     * Attach data to the report
     */
    public static attach(data: unknown, type: unknown): void {
        // eslint-disable-next-line @typescript-eslint/ban-types, @typescript-eslint/no-unsafe-assignment
        (process.emit as Function)('wdioCucumberJsReporter:attachment', { data, type })
    }
}

module.exports = CJSCucumberJsJsonReporter
exports.default = CJSCucumberJsJsonReporter
exports.CucumberJsJsonReporter = CJSCucumberJsJsonReporter
