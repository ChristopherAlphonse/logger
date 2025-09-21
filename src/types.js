"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfidenceLevel = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
    LogLevel[LogLevel["TRACE"] = 4] = "TRACE";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
var ConfidenceLevel;
(function (ConfidenceLevel) {
    ConfidenceLevel[ConfidenceLevel["LOW"] = 0] = "LOW";
    ConfidenceLevel[ConfidenceLevel["MEDIUM"] = 1] = "MEDIUM";
    ConfidenceLevel[ConfidenceLevel["HIGH"] = 2] = "HIGH";
    ConfidenceLevel[ConfidenceLevel["VERY_HIGH"] = 3] = "VERY_HIGH";
})(ConfidenceLevel || (exports.ConfidenceLevel = ConfidenceLevel = {}));
