import { AICache } from "./ai-cache";
import { ConfigManager } from "./config-manager";
import {
	AI_CONSTANTS,
	NETWORK_CONSTANTS,
	TIME_CONSTANTS,
	VALIDATION_CONSTANTS,
} from "./constants";
import { createInternalLogger } from "./internalLogger";
import type {
	AIInsight,
	FrameworkContext,
	IAIService,
	StackFrame,
} from "./types";
import { ConfidenceLevel, LogLevel } from "./types";

declare const window: { [key: string]: unknown } | undefined;

const internalLogger = createInternalLogger("[AI-SERVICE]");

interface OllamaModule {
	Ollama: new (config: {
		host: string;
	}) => {
		list(): Promise<unknown>;
		generate(options: {
			model: string;
			prompt: string;
			options: { temperature: number; num_predict: number };
			stream?: boolean;
		}): Promise<{ response: string }>;
	};
}

interface OpenAIModule {
	default?: new (config: {
		apiKey: string;
		organization?: string;
	}) => OpenAIInstance;
	new (config: { apiKey: string; organization?: string }): OpenAIInstance;
	chat: {
		completions: {
			create(
				options: {
					model: string;
					messages: Array<{ role: string; content: string }>;
					temperature: number;
					max_tokens: number;
				},
				config?: { timeout: number },
			): Promise<{
				choices: Array<{ message?: { content?: string } }>;
			}>;
		};
	};
	models: {
		list(): Promise<unknown>;
	};
}

interface OpenAIInstance {
	chat: {
		completions: {
			create(
				options: {
					model: string;
					messages: Array<{ role: string; content: string }>;
					temperature: number;
					max_tokens: number;
				},
				config?: { timeout: number },
			): Promise<{
				choices: Array<{ message?: { content?: string } }>;
			}>;
		};
	};
	models: {
		list(): Promise<unknown>;
	};
}

let Ollama: OllamaModule["Ollama"] | null = null;
let OpenAI: OpenAIModule | null = null;

if (typeof window === "undefined" && typeof process !== "undefined") {
	try {
		const ollamaModule = require("ollama");
		Ollama = ollamaModule.Ollama;
	} catch {
		// Ollama module not available, will be handled gracefully
	}

	try {
		const openaiModule = require("openai");
		OpenAI = openaiModule.default || openaiModule;
	} catch {
		// OpenAI module not available, will be handled gracefully
	}
}

export class AIService implements IAIService {
	private configManager: ConfigManager;
	private cache: AICache;
	private ollama: InstanceType<OllamaModule["Ollama"]> | null = null;
	private openai: OpenAIInstance | null = null;
	private requestCount = 0;
	private readonly requestTimes: number[] = [];

	constructor() {
		this.configManager = ConfigManager.getInstance();
		this.cache = new AICache();
		this.initialize();
	}

	private initialize(): void {
		const config = this.configManager.getAIConfig();

		if (typeof window !== "undefined") {
			internalLogger.info("AI features disabled in browser environment");
			return;
		}

		switch (config.provider) {
			case "ollama":
				if (Ollama) {
					this.ollama = new Ollama({
						host:
							config.ollama?.baseUrl ||
							NETWORK_CONSTANTS.OLLAMA_DEFAULT_BASE_URL,
					});
				} else {
					internalLogger.warn("Ollama not available - AI features disabled");
				}
				break;
			case "openai":
				if (config.openai?.apiKey && OpenAI) {
					const OpenAIConstructor = OpenAI.default || OpenAI;
					this.openai = new (OpenAIConstructor as typeof OpenAI)({
						apiKey: config.openai.apiKey,
						organization: config.openai.organization,
					});
				} else {
					internalLogger.warn(
						"OpenAI not available or no API key - AI features disabled",
					);
				}
				break;
			case "claude":
				internalLogger.warn(
					'Claude integration not yet available. Use "ollama" or "openai" instead.',
				);
				break;
			case "disabled":
				break;
			default:
				internalLogger.warn(`Unknown AI provider: ${config.provider}`);
		}
	}

	async isHealthy(): Promise<boolean> {
		const config = this.configManager.getAIConfig();

		try {
			switch (config.provider) {
				case "ollama":
					if (!this.ollama) return false;
					await this.ollama.list();
					return true;

				case "openai":
					if (!this.openai?.models) return false;
					await this.openai.models.list();
					return true;

				case "claude":
					return false;

				default:
					return false;
			}
		} catch (error) {
			internalLogger.warn(
				`AI provider ${config.provider} health check failed`,
				{
					provider: config.provider,
					error,
				},
			);
			return false;
		}
	}

	async analyzeError(
		error: Error,
		context?: Record<string, unknown>,
	): Promise<AIInsight> {
		const startTime = Date.now();
		const config = this.configManager.getAIConfig();

		if (config.caching) {
			const cacheKey = AICache.generateErrorKey(error, context);
			const cached = await this.cache.get(cacheKey);
			if (cached) {
				return cached;
			}
		}

		const insight = await this.generateInsight(error, context);
		insight.processingTime = Date.now() - startTime;

		if (config.caching) {
			const cacheKey = AICache.generateErrorKey(error, context);
			await this.cache.set(cacheKey, insight);
		}

		this.recordRequest();
		return insight;
	}

	async analyzeStackTrace(
		stackTrace: StackFrame[],
		context?: Record<string, unknown>,
	): Promise<AIInsight> {
		const startTime = Date.now();
		const config = this.configManager.getAIConfig();

		if (config.caching) {
			const cacheKey = AICache.generateStackTraceKey(stackTrace, context);
			const cached = await this.cache.get(cacheKey);
			if (cached) {
				return cached;
			}
		}

		const framework = this.detectFramework(stackTrace, "");
		const insight = await this.generateStackTraceInsight(
			stackTrace,
			framework,
			context,
		);
		insight.processingTime = Date.now() - startTime;

		if (config.caching) {
			const cacheKey = AICache.generateStackTraceKey(stackTrace, context);
			await this.cache.set(cacheKey, insight);
		}

		this.recordRequest();
		return insight;
	}

	detectFramework(
		stackTrace: StackFrame[],
		errorMessage: string,
	): FrameworkContext {
		const message = errorMessage.toLowerCase();
		const files = stackTrace.map(
			(frame) => frame.fileName?.toLowerCase() || "",
		);

		if (files.some((f) => f.includes("react") || f.includes("jsx")))
			return "react";
		if (files.some((f) => f.includes("next"))) return "next";
		if (files.some((f) => f.includes("express"))) return "express";
		if (files.some((f) => f.includes("fastify"))) return "fastify";
		if (files.some((f) => f.includes("nest"))) return "nest";
		if (files.some((f) => f.includes("vue"))) return "vue";
		if (files.some((f) => f.includes("angular"))) return "angular";
		if (message.includes("document") || message.includes("window"))
			return "browser";
		if (files.some((f) => f.includes("node_modules"))) return "node";

		return "unknown" as FrameworkContext;
	}

	private async generateInsight(
		error: Error,
		context?: Record<string, unknown>,
	): Promise<AIInsight> {
		const config = this.configManager.getAIConfig();
		const framework = this.detectFramework([], error.message) || "unknown";

		try {
			switch (config.provider) {
				case "ollama":
					return await this.generateOllamaInsight(error, framework, context);
				case "openai":
					return await this.generateOpenAIInsight(error, framework, context);
				case "claude":
					return await this.generateClaudeInsight(error, framework, context);
				default:
					return this.generateBasicInsight(error, framework);
			}
		} catch (aiError) {
			internalLogger.warn(
				"AI analysis failed, falling back to basic insights",
				{
					aiError,
					errorMessage: error.message,
				},
			);
			return this.generateBasicInsight(error, framework);
		}
	}

	private async generateOllamaInsight(
		error: Error,
		framework: FrameworkContext,
		context?: Record<string, unknown>,
	): Promise<AIInsight> {
		if (!this.ollama) {
			throw new Error("Ollama not initialized");
		}

		const config = this.configManager.getAIConfig();
		const prompt = this.buildErrorAnalysisPrompt(error, framework, context);

		const response = await this.ollama.generate({
			model: config.ollama?.model || AI_CONSTANTS.OLLAMA_DEFAULT_MODEL,
			prompt,
			options: {
				temperature:
					config.ollama?.temperature || AI_CONSTANTS.DEFAULT_TEMPERATURE,
				num_predict:
					config.ollama?.maxTokens || AI_CONSTANTS.DEFAULT_MAX_TOKENS,
			},
		});

		return this.parseAIResponse(response.response, framework);
	}

	private async generateOpenAIInsight(
		error: Error,
		framework: FrameworkContext,
		context?: Record<string, unknown>,
	): Promise<AIInsight> {
		if (!this.openai) {
			throw new Error("OpenAI not initialized");
		}

		const config = this.configManager.getAIConfig();
		const prompt = this.buildErrorAnalysisPrompt(error, framework, context);

		const response = await this.openai.chat.completions.create(
			{
				model: config.openai?.model || AI_CONSTANTS.OPENAI_DEFAULT_MODEL,
				messages: [
					{ role: "system", content: this.getSystemPrompt() },
					{ role: "user", content: prompt },
				],
				temperature:
					config.openai?.temperature || AI_CONSTANTS.DEFAULT_TEMPERATURE,
				max_tokens: config.openai?.maxTokens || AI_CONSTANTS.DEFAULT_MAX_TOKENS,
			},
			{ timeout: config.timeout },
		);

		const content = response.choices[0]?.message?.content;
		if (!content) {
			throw new Error("No response from OpenAI");
		}

		return this.parseAIResponse(content, framework);
	}

	private async generateClaudeInsight(
		_error: Error,
		_framework: FrameworkContext,
		_context?: Record<string, unknown>,
	): Promise<AIInsight> {
		throw new Error(
			'Claude integration not yet available. Use "ollama" or "openai" instead.',
		);
	}

	private async generateStackTraceInsight(
		stackTrace: StackFrame[],
		framework: FrameworkContext,
		context?: Record<string, unknown>,
	): Promise<AIInsight> {
		const config = this.configManager.getAIConfig();
		const prompt = this.buildStackTraceAnalysisPrompt(
			stackTrace,
			framework,
			context,
		);

		switch (config.provider) {
			case "ollama": {
				if (!this.ollama) throw new Error("Ollama not initialized");
				const response = await this.ollama.generate({
					model: config.ollama?.model || "llama3.2:3b",
					prompt,
					options: {
						temperature: config.ollama?.temperature || 0.7,
						num_predict: config.ollama?.maxTokens || 1000,
					},
				});
				return this.parseAIResponse(response.response, framework);
			}

			case "openai": {
				if (!this.openai) throw new Error("OpenAI not initialized");
				const openaiResponse = await this.openai.chat.completions.create(
					{
						model: config.openai?.model || "gpt-3.5-turbo",
						messages: [
							{ role: "system", content: this.getSystemPrompt() },
							{ role: "user", content: prompt },
						],
						temperature: config.openai?.temperature || 0.7,
						max_tokens: config.openai?.maxTokens || 1000,
					},
					{ timeout: config.timeout },
				);
				const content = openaiResponse.choices[0]?.message?.content;
				if (!content) throw new Error("No response from OpenAI");
				return this.parseAIResponse(content, framework);
			}

			default:
				return this.generateBasicInsight(
					new Error("Stack trace analysis"),
					framework,
				);
		}
	}

	private getSystemPrompt(): string {
		return `You are an expert JavaScript/TypeScript debugger. Analyze the provided error or stack trace and provide helpful insights in the following JSON format:

{
  "explanation": "Brief explanation of what went wrong",
  "likelyCauses": ["cause1", "cause2", "cause3"],
  "suggestedFix": "Specific actionable fix",
  "contextualInsights": ["insight1", "insight2"],
  "confidence": "LOW" | "MEDIUM" | "HIGH" | "VERY_HIGH"
}

Be concise, precise, and helpful. Focus on practical solutions.`;
	}

	private buildErrorAnalysisPrompt(
		error: Error,
		framework: FrameworkContext,
		context?: Record<string, unknown>,
	): string {
		const sanitizedError = {
			name: this.sanitizeString(error.name),
			message: this.sanitizeString(error.message),
			stack: this.sanitizeString(error.stack || ""),
		};

		const sanitizedContext = this.sanitizeContext(context);

		return `Analyze this JavaScript/TypeScript error:

Error: ${sanitizedError.name}: ${sanitizedError.message}
Stack: ${sanitizedError.stack}
Framework: ${framework}
Context: ${JSON.stringify(sanitizedContext, null, 2)}

Provide analysis in JSON format.`;
	}

	private buildStackTraceAnalysisPrompt(
		stackTrace: StackFrame[],
		framework: FrameworkContext,
		context?: Record<string, unknown>,
	): string {
		const sanitizedStackTrace = stackTrace.map((frame) => ({
			functionName: this.sanitizeString(frame.functionName || "anonymous"),
			fileName: this.sanitizeString(frame.fileName || ""),
			lineNumber: typeof frame.lineNumber === "number" ? frame.lineNumber : 0,
		}));

		const stackStr = sanitizedStackTrace
			.map(
				(frame) =>
					`${frame.functionName} at ${frame.fileName}:${frame.lineNumber}`,
			)
			.join("\n");

		const sanitizedContext = this.sanitizeContext(context);

		return `Analyze this JavaScript/TypeScript stack trace:

Stack Trace:
${stackStr}
Framework: ${framework}
Context: ${JSON.stringify(sanitizedContext, null, 2)}

Provide analysis in JSON format.`;
	}

	private parseAIResponse(
		response: string,
		framework: FrameworkContext,
	): AIInsight {
		try {
			const jsonMatch = response.match(/\{[\s\S]*\}/);
			if (jsonMatch) {
				const parsed = JSON.parse(jsonMatch[0]);
				return {
					explanation: parsed.explanation || "Error analysis",
					likelyCauses: parsed.likelyCauses || ["Unknown cause"],
					suggestedFix: parsed.suggestedFix || "Check the error details",
					contextualInsights: parsed.contextualInsights || [],
					confidence: this.parseConfidence(parsed.confidence),
					processingTime: 0,
					cached: false,
					framework,
				};
			}
		} catch (error) {
			internalLogger.warn("Failed to parse AI response", { error, response });
		}

		return {
			explanation: "AI analysis failed, using basic insight",
			likelyCauses: ["Analysis error"],
			suggestedFix: "Check the error details manually",
			contextualInsights: ["AI service unavailable"],
			confidence: ConfidenceLevel.LOW,
			processingTime: 0,
			cached: false,
			framework,
		};
	}

	private parseConfidence(confidence: string): ConfidenceLevel {
		switch (confidence?.toUpperCase()) {
			case "VERY_HIGH":
				return ConfidenceLevel.VERY_HIGH;
			case "HIGH":
				return ConfidenceLevel.HIGH;
			case "MEDIUM":
				return ConfidenceLevel.MEDIUM;
			case "LOW":
				return ConfidenceLevel.LOW;
			default:
				return ConfidenceLevel.MEDIUM;
		}
	}

	private generateBasicInsight(
		error: Error,
		framework: FrameworkContext,
	): AIInsight {
		return {
			explanation: `Basic analysis of ${error.name}: ${error.message}`,
			likelyCauses: ["Unknown cause - AI analysis unavailable"],
			suggestedFix: "Check the error details and stack trace",
			contextualInsights: ["AI service not available"],
			confidence: ConfidenceLevel.LOW,
			processingTime: 0,
			cached: false,
			framework,
		};
	}

	private recordRequest(): void {
		this.requestCount++;
		this.requestTimes.push(Date.now());
	}

	getStats(): {
		requestCount: number;
		recentRequests: number;
		provider: string;
		cacheStats: Record<string, unknown>;
	} {
		const config = this.configManager.getAIConfig();
		const recentRequests = this.requestTimes.filter(
			(time) => time > Date.now() - TIME_CONSTANTS.ONE_MINUTE,
		).length;

		return {
			requestCount: this.requestCount,
			recentRequests,
			provider: config.provider,
			cacheStats: this.cache.getDetailedStats() as unknown as Record<
				string,
				unknown
			>,
		};
	}

	private sanitizeString(input: string): string {
		if (typeof input !== "string") return "";

		const cleanInput = input
			.split("")
			.filter((char) => {
				const code = char.charCodeAt(0);
				return !(
					code < 32 ||
					(code >= 127 && code <= 159) ||
					char === "<" ||
					char === ">"
				);
			})
			.join("");

		return cleanInput.substring(
			0,
			VALIDATION_CONSTANTS.MAX_CONFIG_FILE_SIZE / 1024,
		);
	}

	private sanitizeContext(
		context?: Record<string, unknown>,
	): Record<string, unknown> {
		if (!context || typeof context !== "object" || context === null) return {};

		const sanitized: Record<string, unknown> = {};
		const maxKeys = 50;
		let keyCount = 0;

		for (const [key, value] of Object.entries(context)) {
			if (keyCount >= maxKeys) break;

			const sanitizedKey = this.sanitizeString(key);
			if (sanitizedKey.length === 0) continue;

			sanitized[sanitizedKey] = this.sanitizeValue(value);
			keyCount++;
		}

		return sanitized;
	}

	private sanitizeValue(value: unknown): unknown {
		if (typeof value === "string") {
			return this.sanitizeString(value);
		}

		if (typeof value === "number" || typeof value === "boolean") {
			return value;
		}

		if (value && typeof value === "object") {
			return this.sanitizeObject(value);
		}

		if (value !== null && value !== undefined) {
			return String(value).substring(0, 100);
		}

		return value;
	}

	private sanitizeObject(value: object): string {
		try {
			const stringified = JSON.stringify(value);
			if (stringified.length < 1000) {
				return "[Object]";
			}
		} catch {
			return "[Unserializable]";
		}
		return "[Object]";
	}

	async translateLog(
		message: string,
		level: LogLevel,
		data?: unknown,
	): Promise<string> {
		const config = this.configManager.getAIConfig();

		if (!config.enabled || !config.translateLogs) {
			return message;
		}

		if (!config.translateLogLevels.includes(level)) {
			return message;
		}

		try {
			const startTime = Date.now();

			const context = {
				level: LogLevel[level],
				timestamp: new Date().toISOString(),
				data: data ? this.sanitizeContext({ data }) : undefined,
			};

			const translatedMessage = await this.generateLogTranslation(
				message,
				context,
			);

			const processingTime = Date.now() - startTime;
			internalLogger.info("Log translation completed", {
				originalLength: message.length,
				translatedLength: translatedMessage.length,
				processingTime,
			});

			this.recordRequest();
			return translatedMessage;
		} catch (error) {
			internalLogger.warn("Log translation failed, using original message", {
				error,
				originalMessage: message,
			});
			return message;
		}
	}

	private async generateLogTranslation(
		message: string,
		context: Record<string, unknown>,
	): Promise<string> {
		const config = this.configManager.getAIConfig();

		switch (config.provider) {
			case "ollama":
				return await this.generateOllamaTranslation(message, context);
			case "openai":
				return await this.generateOpenAITranslation(message, context);
			case "claude":
				return await this.generateClaudeTranslation(message, context);
			default:
				return message;
		}
	}

	private async generateOllamaTranslation(
		message: string,
		context: Record<string, unknown>,
	): Promise<string> {
		if (!this.ollama) {
			throw new Error("Ollama not initialized");
		}

		const config = this.configManager.getAIConfig();
		const prompt = this.buildTranslationPrompt(message, context);

		const response = await this.ollama.generate({
			model: config.ollama?.model || "llama3.2:3b",
			prompt,
			options: {
				temperature: config.ollama?.temperature || 0.3,
				num_predict: config.ollama?.maxTokens || 200,
			},
			stream: false,
		});

		return this.parseTranslationResponse(response.response);
	}

	private async generateOpenAITranslation(
		message: string,
		context: Record<string, unknown>,
	): Promise<string> {
		if (!this.openai) {
			throw new Error("OpenAI not initialized");
		}

		const config = this.configManager.getAIConfig();
		const prompt = this.buildTranslationPrompt(message, context);

		const response = await this.openai.chat.completions.create({
			model: config.openai?.model || "gpt-3.5-turbo",
			messages: [
				{
					role: "system",
					content:
						"You are a helpful assistant that translates technical log messages into clear, human-readable explanations.",
				},
				{
					role: "user",
					content: prompt,
				},
			],
			max_tokens: config.openai?.maxTokens || 200,
			temperature: config.openai?.temperature || 0.3,
		});

		return this.parseTranslationResponse(
			response.choices[0]?.message?.content || message,
		);
	}

	private async generateClaudeTranslation(
		message: string,
		_context: Record<string, unknown>,
	): Promise<string> {
		return message;
	}

	private buildTranslationPrompt(
		message: string,
		context: Record<string, unknown>,
	): string {
		const config = this.configManager.getAIConfig();
		const customPrompt = config.prompts?.logTranslation;

		if (customPrompt) {
			return customPrompt
				.replace("{message}", message)
				.replace("{context}", JSON.stringify(context, null, 2));
		}

		const levelStr = (context.level as string) || "INFO";
		const dataStr = context.data
			? `\nAdditional data: ${JSON.stringify(context.data, null, 2)}`
			: "";

		return `Please translate this technical ${levelStr} log message into a clear, human-readable explanation that a non-technical person could understand. Keep it concise but informative:

Technical log message: "${message}"${dataStr}

Provide only the human-readable translation without any additional formatting or explanations.`;
	}

	private parseTranslationResponse(response: string): string {
		let cleaned = response.trim();

		const prefixes = [
			"Human-readable translation:",
			"Translation:",
			"Explanation:",
			"The message means:",
			"This means:",
		];

		for (const prefix of prefixes) {
			if (cleaned.toLowerCase().startsWith(prefix.toLowerCase())) {
				cleaned = cleaned.substring(prefix.length).trim();
			}
		}

		if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
			cleaned = cleaned.slice(1, -1);
		}

		return cleaned || response;
	}
}
