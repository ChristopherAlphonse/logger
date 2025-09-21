"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createInternalLogger = void 0;
var SimpleInternalLogger = /** @class */ (function () {
    function SimpleInternalLogger(prefix) {
        this.prefix = prefix;
    }
    SimpleInternalLogger.prototype.warn = function (message, data) {
        var output = data
            ? "".concat(this.prefix, " ").concat(message, " ").concat(JSON.stringify(data), "\n")
            : "".concat(this.prefix, " ").concat(message, "\n");
        if (typeof process !== 'undefined' && process.stderr) {
            process.stderr.write(output);
        }
        else {
            console.warn(output.trim());
        }
    };
    SimpleInternalLogger.prototype.error = function (message, data) {
        var output = data
            ? "".concat(this.prefix, " ").concat(message, " ").concat(JSON.stringify(data), "\n")
            : "".concat(this.prefix, " ").concat(message, "\n");
        if (typeof process !== 'undefined' && process.stderr) {
            process.stderr.write(output);
        }
        else {
            console.error(output.trim());
        }
    };
    SimpleInternalLogger.prototype.info = function (message, data) {
        var output = data
            ? "".concat(this.prefix, " ").concat(message, " ").concat(JSON.stringify(data), "\n")
            : "".concat(this.prefix, " ").concat(message, "\n");
        if (typeof process !== 'undefined' && process.stdout) {
            process.stdout.write(output);
        }
        else {
            console.info(output.trim());
        }
    };
    return SimpleInternalLogger;
}());
var createInternalLogger = function (prefix) {
    if (prefix === void 0) { prefix = '[INTERNAL]'; }
    return new SimpleInternalLogger(prefix);
};
exports.createInternalLogger = createInternalLogger;
