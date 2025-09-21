# @calphonse/logger

> A beautiful, intelligent logger for Node.js with AI-powered error analysis

<p align="center">
  <a href="https://www.npmjs.com/package/@calphonse/logger">
    <img src="https://flat.badgen.net/npm/v/@calphonse/logger?icon=npm" alt="npm"/>
  </a>
  <a href="https://www.typescriptlang.org/">
    <img src="https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white" alt="TypeScript"/>
  </a>
  <img src="https://img.shields.io/badge/AI-Powered-blue" alt="AI Powered"/>
</p>

## Features

- **Beautiful colored output** with timestamps and file locations
- **AI-powered error analysis** with intelligent insights and fix suggestions
- **Structured JSON logging** for production environments
- **Security hardened** with input validation and sanitization
- **TypeScript first** with full type safety
- **Zero dependencies** for core functionality (AI features optional)

## Installation

```bash
npm install @calphonse/logger
```

## Quick Start

```typescript
import { logger } from '@calphonse/logger';

// Basic logging
logger.info('Application started');
logger.warn('High memory usage detected');
logger.error('Database connection failed', { error: 'Connection timeout' });

// Structured logging
logger.info('User login', {
  userId: '12345',
  method: 'email',
  timestamp: new Date().toISOString(),
});

// AI error analysis (automatic)
try {
  throw new Error('Invalid JWT token');
} catch (error) {
  logger.error('Auth failed', error); // Gets AI analysis
}
```

## AI-Powered Analysis

Errors automatically get intelligent analysis:

```typescript
logger.error('Database error', new Error('Connection refused'));

// Output includes AI insights:
// AI Insight: Database connection failed
// Likely Causes: Service down, network issues, wrong credentials
// Suggested Fix: Check database service status and connection string
```

### Setup AI (Optional)

```bash
# Local AI (free)
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2:3b

# Or use cloud providers (OpenAI, Claude)
# Set environment variables: OPENAI_API_KEY, etc.
```

## Configuration

```typescript
import { Logger, LogLevel } from '@calphonse/logger';

const logger = new Logger({
  level: LogLevel.INFO,
  colors: true,
  timestamps: true,
  showSource: true,
  prefix: '[MY-APP]',
  json: false, // Set to true for production
  ai: {
    enabled: true,
    provider: 'ollama', // 'openai' | 'claude' | 'disabled'
    caching: true,
  },
});
```

## Factory Methods

```typescript
import { LoggerFactory } from '@calphonse/logger';

const jsonLogger = LoggerFactory.createJsonLogger();
const minimalLogger = LoggerFactory.createMinimalLogger();
const verboseLogger = LoggerFactory.createVerboseLogger();
```

## Child Loggers

```typescript
const userLogger = logger.child('[USER]');
const dbLogger = logger.child('[DB]');

userLogger.info('User created', { userId: '123' });
dbLogger.error('Query failed', { query: 'SELECT * FROM users' });
```

## API Reference

### Core Methods

```typescript
logger.error(message: string, data?: any): void
logger.warn(message: string, data?: any): void
logger.info(message: string, data?: any): void
logger.debug(message: string, data?: any): void
logger.trace(message: string, data?: any): void

logger.table(data: any[]): void // Display data in table format
logger.child(prefix: string): Logger
logger.setLevel(level: LogLevel): void
```

### Log Levels

```typescript
enum LogLevel {
  ERROR = 0, // Only errors
  WARN = 1, // Warnings and errors
  INFO = 2, // Info, warnings, and errors (default)
  DEBUG = 3, // Debug and above
  TRACE = 4, // Everything
}
```

## Express.js Example

```typescript
import express from 'express';
import { logger } from '@calphonse/logger';

const app = express();

// Request logging
app.use((req, res, next) => {
  logger.info('Request', {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
  });
  next();
});

// Error handling with AI analysis
app.use((err, req, res, next) => {
  logger.error('Request failed', err); // AI analyzes the error
  res.status(500).json({ error: 'Internal server error' });
});
```

## Security Features

- **Input validation** on all configuration
- **AI prompt sanitization** prevents injection attacks
- **Output stream validation** ensures safe logging destinations
- **Memory limits** prevent resource exhaustion
- **Safe defaults** for all options

## Automated Releases

This project features automated releases:

- **Auto-versioning** based on commit messages (`[major]`, `[minor]`, or patch)
- **Changelog generation** with recent commits
- **NPM publishing** when changes are merged
- **GitHub releases** with tags and notes
- **Branch protection compatible** - uses pull requests

Simply merge to main, and releases happen automatically!

## Development

```bash
git clone https://github.com/ChristopherAlphonse/logger.git
cd logger
pnpm install

# Development
pnpm dev          # Watch mode
pnpm test         # Run tests
pnpm build        # Build project
pnpm quality      # Run all checks
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run `pnpm quality` to ensure all checks pass
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ for the Node.js community**

If this logger helps you debug faster, please give it a ⭐ on GitHub!
