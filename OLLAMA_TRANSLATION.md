# Ollama Log Translation Feature

## Overview

The logger now includes **AI-powered log translation** using Ollama, which automatically converts technical log messages into human-readable explanations. This feature helps non-technical team members understand system logs and makes debugging more accessible.

## Features

- 🤖 **Local AI Translation**: Uses Ollama for free, local AI processing
- 🎯 **Selective Translation**: Configure which log levels to translate
- ⚡ **Async Processing**: Non-blocking translation with fallback to original messages
- 🎨 **Customizable Prompts**: Define your own translation prompts
- 📊 **Performance Tracking**: Monitor translation requests and response times
- 🔄 **Graceful Fallback**: Always shows original message if translation fails

## Prerequisites

1. **Install Ollama**: https://ollama.ai
2. **Download a model**: `ollama pull llama3.2:3b`
3. **Start Ollama service**: `ollama serve`

## Quick Start

```typescript
import { Logger, LogLevel } from '@calphonse/logger';

const logger = new Logger({
  ai: {
    enabled: true,
    provider: 'ollama',
    translateLogs: true,
    translateLogLevels: [LogLevel.ERROR, LogLevel.WARN],
    ollama: {
      baseUrl: 'http://localhost:11434',
      model: 'llama3.2:3b',
      temperature: 0.3,
      maxTokens: 200,
    },
  },
});

// Enable translation for existing logger
logger.enableLogTranslation();

// Technical log message
logger.error('Connection timeout after 5000ms to database server mysql://localhost:3306');

// Gets translated to something like:
// "The application failed to connect to the MySQL database because the connection took too long to establish"
```

## Configuration Options

```typescript
interface AIConfig {
  enabled: boolean;                    // Enable AI features
  provider: 'ollama' | 'openai' | 'claude' | 'disabled';
  translateLogs: boolean;              // Enable log translation
  translateLogLevels: LogLevel[];      // Which levels to translate
  ollama?: {
    baseUrl?: string;                  // Default: 'http://localhost:11434'
    model?: string;                    // Default: 'llama3.2:3b'
    temperature?: number;              // Default: 0.3
    maxTokens?: number;                // Default: 200
  };
  prompts?: {
    logTranslation?: string;           // Custom translation prompt
  };
}
```

## Translation Control Methods

```typescript
// Enable/disable translation
logger.enableLogTranslation();
logger.disableLogTranslation();

// Check AI service health
const isHealthy = await logger.isAIHealthy();

// Get translation stats
const stats = logger.getAIStats();
```

## Examples

### Before Translation (Technical)
```
[ERROR] Connection timeout after 5000ms to database server mysql://localhost:3306/myapp
[WARN] Memory usage exceeded 85% threshold: 3.4GB/4GB allocated
[ERROR] HTTP 429 Too Many Requests: Rate limit exceeded for API key abc123
```

### After Translation (Human-Readable)
```
[ERROR] The application couldn't connect to the database because it took too long to respond
[WARN] The system is using too much memory and might slow down or crash soon
[ERROR] Too many requests were made to the API too quickly, need to wait before trying again
```

## Running Examples

```bash
# Run the Ollama translation demo
npm run example:ollama

# Test translation functionality
npm run test-translation

# Run AI-powered demo (includes error analysis)
npm run example:ai-demo
```

## Supported Models

- **llama3.2:3b** (Recommended - fast and accurate)
- **llama3.2:1b** (Faster but less detailed)
- **llama3.1:8b** (More detailed but slower)
- **codegemma** (Good for code-related logs)

## Performance Considerations

- Translation adds latency to logging (typically 200-2000ms)
- Uses async processing to avoid blocking application
- Failed translations automatically fall back to original messages
- Rate limiting prevents API overuse

## Customizing Translation Prompts

```typescript
const logger = new Logger({
  ai: {
    enabled: true,
    provider: 'ollama',
    translateLogs: true,
    prompts: {
      logTranslation: `
        Convert this {level} log message to simple English for a non-technical user:
        "{message}"
        
        Context: {context}
        
        Respond with only the simplified explanation:
      `
    }
  }
});
```

## Troubleshooting

### Ollama Not Connecting
```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Start Ollama service
ollama serve

# Verify model is available
ollama list
```

### Translation Not Working
1. Check AI service health: `await logger.isAIHealthy()`
2. Verify log level is in `translateLogLevels`
3. Ensure `translateLogs` is enabled
4. Check Ollama logs for errors

### Performance Issues
- Use smaller models (llama3.2:1b)
- Reduce `maxTokens` limit
- Limit `translateLogLevels` to critical levels only
- Enable caching for repeated messages

## Security Notes

- All translation happens locally (no data sent to external services)
- Original technical logs are preserved for debugging
- No sensitive information is stored in translation cache
- Rate limiting prevents resource abuse

## Integration with Error Analysis

The translation feature works alongside existing AI error analysis:

```typescript
// This will both translate AND analyze the error
logger.error('Database connection failed', new Error('ECONNREFUSED'));

// Output includes:
// 1. Translated human-readable message
// 2. AI-generated error analysis with suggestions
```
