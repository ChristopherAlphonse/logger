"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfigManager = void 0;
var constants_1 = require("./constants");
var internalLogger_1 = require("./internalLogger");
var browserFS = {
    readFileSync: function (path, _encoding) {
        if (typeof window !== 'undefined' && window.localStorage) {
            var key = "logger-config-".concat(path.replace(/[^a-zA-Z0-9]/g, '_'));
            return (localStorage === null || localStorage === void 0 ? void 0 : localStorage.getItem(key)) || '{}';
        }
        return '{}';
    },
    writeFileSync: function (path, data, _encoding) {
        if (typeof window !== 'undefined' && window.localStorage) {
            var key = "logger-config-".concat(path.replace(/[^a-zA-Z0-9]/g, '_'));
            localStorage === null || localStorage === void 0 ? void 0 : localStorage.setItem(key, data);
        }
    },
    existsSync: function (path) {
        if (typeof window !== 'undefined' && window.localStorage) {
            var key = "logger-config-".concat(path.replace(/[^a-zA-Z0-9]/g, '_'));
            return (localStorage === null || localStorage === void 0 ? void 0 : localStorage.getItem(key)) !== null;
        }
        return false;
    },
};
var browserPath = {
    join: function () {
        var paths = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            paths[_i] = arguments[_i];
        }
        return paths.join('/').replace(/\/+/g, '/');
    },
};
var browserOS = {
    homedir: function () {
        if (typeof window !== 'undefined') {
            return '/home/user';
        }
        return typeof process !== 'undefined' && process.env
            ? process.env.HOME || process.env.USERPROFILE || '/home/user'
            : '/home/user';
    },
};
var fs;
var path;
var os;
try {
    if (typeof window === 'undefined' && typeof process !== 'undefined') {
        var nodeFS = require('node:fs');
        var nodePath = require('node:path');
        var nodeOS = require('node:os');
        fs = {
            readFileSync: nodeFS.readFileSync,
            writeFileSync: nodeFS.writeFileSync,
            existsSync: nodeFS.existsSync,
        };
        path = { join: nodePath.join };
        os = { homedir: nodeOS.homedir };
    }
    else {
        fs = browserFS;
        path = browserPath;
        os = browserOS;
    }
}
catch (_error) {
    fs = browserFS;
    path = browserPath;
    os = browserOS;
}
var internalLogger = (0, internalLogger_1.createInternalLogger)('[CONFIG]');
var DEFAULT_CONFIG = {
    ai: {
        enabled: true,
        provider: 'ollama',
        apiKey: '',
        caching: true,
        confidenceThreshold: constants_1.AI_CONSTANTS.DEFAULT_CONFIDENCE_THRESHOLD,
        maxInsightLength: constants_1.AI_CONSTANTS.DEFAULT_MAX_INSIGHT_LENGTH,
        timeout: constants_1.TIME_CONSTANTS.TEN_SECONDS,
        translateLogs: false,
        translateLogLevels: [0, 1],
        ollama: {
            baseUrl: constants_1.NETWORK_CONSTANTS.OLLAMA_DEFAULT_BASE_URL,
            model: constants_1.AI_CONSTANTS.OLLAMA_DEFAULT_MODEL,
            temperature: constants_1.AI_CONSTANTS.DEFAULT_TEMPERATURE,
            maxTokens: constants_1.AI_CONSTANTS.DEFAULT_MAX_TOKENS,
        },
        openai: {
            model: constants_1.AI_CONSTANTS.OPENAI_DEFAULT_MODEL,
            temperature: constants_1.AI_CONSTANTS.DEFAULT_TEMPERATURE,
            maxTokens: constants_1.AI_CONSTANTS.DEFAULT_MAX_TOKENS,
        },
        claude: {
            model: constants_1.AI_CONSTANTS.CLAUDE_DEFAULT_MODEL,
            temperature: constants_1.AI_CONSTANTS.DEFAULT_TEMPERATURE,
            maxTokens: constants_1.AI_CONSTANTS.DEFAULT_MAX_TOKENS,
        },
        prompts: {
            logTranslation: undefined,
        },
        rateLimit: {
            maxRequestsPerMinute: constants_1.RATE_LIMIT_CONSTANTS.DEFAULT_MAX_REQUESTS_PER_MINUTE,
            maxRequestsPerHour: constants_1.RATE_LIMIT_CONSTANTS.DEFAULT_MAX_REQUESTS_PER_HOUR,
        },
    },
    cache: {
        enabled: true,
        maxSize: constants_1.CACHE_CONSTANTS.DEFAULT_MAX_SIZE,
        ttl: constants_1.CACHE_CONSTANTS.DEFAULT_TTL,
        persistToDisk: false,
    },
};
var ConfigManager = /** @class */ (function () {
    function ConfigManager() {
        this.configPath = this.getConfigPath();
        this.config = this.loadConfig();
    }
    ConfigManager.getInstance = function () {
        if (!ConfigManager.instance) {
            ConfigManager.instance = new ConfigManager();
        }
        return ConfigManager.instance;
    };
    ConfigManager.prototype.getConfigPath = function () {
        var cwd = typeof process !== 'undefined' && process.cwd ? process.cwd() : '/';
        var localConfig = path.join(cwd, '.logger-ai.config.json');
        var globalConfig = path.join(os.homedir(), '.logger-ai.config.json');
        return fs.existsSync(localConfig) ? localConfig : globalConfig;
    };
    ConfigManager.prototype.loadConfig = function () {
        try {
            if (fs.existsSync(this.configPath)) {
                var fileContent = fs.readFileSync(this.configPath, 'utf-8');
                if (fileContent.length > constants_1.VALIDATION_CONSTANTS.MAX_CONFIG_FILE_SIZE) {
                    internalLogger.warn('Config file too large, using defaults', {
                        configPath: this.configPath,
                    });
                    return DEFAULT_CONFIG;
                }
                var userConfig = JSON.parse(fileContent);
                if (!this.isValidConfig(userConfig)) {
                    internalLogger.warn('Invalid config structure, using defaults', {
                        configPath: this.configPath,
                    });
                    return DEFAULT_CONFIG;
                }
                return this.mergeConfigs(DEFAULT_CONFIG, userConfig);
            }
        }
        catch (error) {
            internalLogger.warn("Failed to load AI logger config from ".concat(this.configPath), {
                error: error,
                configPath: this.configPath,
            });
        }
        return DEFAULT_CONFIG;
    };
    ConfigManager.prototype.mergeConfigs = function (defaultConfig, userConfig) {
        var merged = __assign({}, defaultConfig);
        if (userConfig.ai) {
            merged.ai = __assign(__assign(__assign({}, merged.ai), userConfig.ai), { ollama: __assign(__assign({}, merged.ai.ollama), userConfig.ai.ollama), openai: __assign(__assign({}, merged.ai.openai), userConfig.ai.openai), claude: __assign(__assign({}, merged.ai.claude), userConfig.ai.claude), rateLimit: __assign(__assign({ maxRequestsPerMinute: 60, maxRequestsPerHour: 1000 }, merged.ai.rateLimit), userConfig.ai.rateLimit) });
        }
        if (userConfig.cache) {
            merged.cache = __assign(__assign({}, merged.cache), userConfig.cache);
        }
        return merged;
    };
    ConfigManager.prototype.getConfig = function () {
        return __assign({}, this.config);
    };
    ConfigManager.prototype.getAIConfig = function () {
        return __assign({}, this.config.ai);
    };
    ConfigManager.prototype.updateConfig = function (updates) {
        this.config = this.mergeConfigs(this.config, updates);
    };
    ConfigManager.prototype.saveConfig = function () {
        try {
            var configData = JSON.stringify(this.config, null, 2);
            fs.writeFileSync(this.configPath, configData, 'utf-8');
        }
        catch (error) {
            internalLogger.error("Failed to save AI logger config to ".concat(this.configPath), {
                error: error,
                configPath: this.configPath,
            });
        }
    };
    ConfigManager.createSampleConfig = function (filePath) {
        var sampleConfig = __assign(__assign({}, DEFAULT_CONFIG), { ai: __assign(__assign({}, DEFAULT_CONFIG.ai), { openai: __assign(__assign({}, DEFAULT_CONFIG.ai.openai), { apiKey: 'your-openai-api-key-here' }), claude: __assign(__assign({}, DEFAULT_CONFIG.ai.claude), { apiKey: 'your-claude-api-key-here' }) }) });
        var cwd = typeof process !== 'undefined' && process.cwd ? process.cwd() : '/';
        var targetPath = filePath || path.join(cwd, '.logger-ai.config.json');
        try {
            var configData = JSON.stringify(sampleConfig, null, 2);
            fs.writeFileSync(targetPath, configData, 'utf-8');
            internalLogger.info('\nGetting started with FREE AI logging:');
            internalLogger.info('1. Install Ollama: https://ollama.ai');
            internalLogger.info('2. Pull a model: ollama pull llama3.2:3b');
            internalLogger.info('3. Start logging with AI insights!');
            internalLogger.info('\nFor cloud AI (OpenAI/Claude):');
            internalLogger.info('1. Add your API key to the config file');
            internalLogger.info('2. Change provider to "openai" or "claude"');
        }
        catch (error) {
            internalLogger.error("Failed to create sample config at ".concat(targetPath), {
                error: error,
                targetPath: targetPath,
            });
        }
    };
    ConfigManager.prototype.isProviderConfigured = function (provider) {
        var _a, _b;
        var config = this.getAIConfig();
        switch (provider) {
            case 'ollama':
                return true;
            case 'openai':
                return !!((_a = config.openai) === null || _a === void 0 ? void 0 : _a.apiKey);
            case 'claude':
                return !!((_b = config.claude) === null || _b === void 0 ? void 0 : _b.apiKey);
            default:
                return false;
        }
    };
    ConfigManager.prototype.getProviderConfig = function (provider) {
        var config = this.getAIConfig();
        switch (provider) {
            case 'ollama':
                return config.ollama || null;
            case 'openai':
                return config.openai || null;
            case 'claude':
                return config.claude || null;
            default:
                return null;
        }
    };
    ConfigManager.prototype.detectBestProvider = function () {
        var config = this.getAIConfig();
        if (config.provider === 'ollama')
            return 'ollama';
        if (this.isProviderConfigured('openai'))
            return 'openai';
        if (this.isProviderConfigured('claude'))
            return 'claude';
        return 'disabled';
    };
    ConfigManager.prototype.isAIAvailable = function () {
        var provider = this.detectBestProvider();
        return provider !== 'disabled';
    };
    ConfigManager.prototype.isValidConfig = function (config) {
        if (!config || typeof config !== 'object' || config === null)
            return false;
        var configObj = config;
        var dangerousKeys = ['__proto__', 'constructor', 'prototype'];
        if (this.hasDangerousKeys(configObj, dangerousKeys))
            return false;
        return this.isValidAIConfig(configObj);
    };
    ConfigManager.prototype.isValidAIConfig = function (configObj) {
        if (!configObj.ai || typeof configObj.ai !== 'object' || configObj.ai === null) {
            return true; // AI config is optional
        }
        var aiConfig = configObj.ai;
        if (!this.isValidProvider(aiConfig.provider))
            return false;
        if (!this.isValidTimeout(aiConfig.timeout))
            return false;
        if (!this.isValidConfidenceThreshold(aiConfig.confidenceThreshold))
            return false;
        return true;
    };
    ConfigManager.prototype.isValidProvider = function (provider) {
        if (!provider)
            return true; // Provider is optional
        var validProviders = ['ollama', 'openai', 'claude', 'disabled'];
        return validProviders.includes(String(provider));
    };
    ConfigManager.prototype.isValidTimeout = function (timeout) {
        if (timeout === undefined)
            return true; // Timeout is optional
        return (typeof timeout === 'number' && timeout >= 0 && timeout <= constants_1.VALIDATION_CONSTANTS.MAX_TIMEOUT);
    };
    ConfigManager.prototype.isValidConfidenceThreshold = function (confidenceThreshold) {
        if (confidenceThreshold === undefined)
            return true; // Confidence threshold is optional
        return (typeof confidenceThreshold === 'number' &&
            confidenceThreshold >= 0 &&
            confidenceThreshold <= 3);
    };
    ConfigManager.prototype.hasDangerousKeys = function (obj, dangerousKeys) {
        for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
            var key = _a[_i];
            if (dangerousKeys.includes(key))
                return true;
            if (obj[key] &&
                typeof obj[key] === 'object' &&
                obj[key] !== null &&
                this.hasDangerousKeys(obj[key], dangerousKeys)) {
                return true;
            }
        }
        return false;
    };
    return ConfigManager;
}());
exports.ConfigManager = ConfigManager;
