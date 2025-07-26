# Test Usage for @calphonse/logger

This directory contains comprehensive tests for the `@calphonse/logger` package to ensure it works correctly across different module formats and import methods.

## Test Files

### Module Format Tests

- **`cjs-test.mjs`** - Tests CommonJS-style require functionality using ES modules
- **`cjs-destructuring-test.mjs`** - Tests destructuring imports from the package
- **`esm-test.mjs`** - Tests ES module imports and functionality
- **`typescript-support.ts`** - Tests TypeScript support with default imports
- **`typescript-destructuring.ts`** - Tests TypeScript support with destructuring imports

### Test Coverage

Each test file verifies:

1. **Basic logging methods**: `info()`, `warn()`, `error()`, `debug()`, `trace()`
2. **Table logging**: `table()` for structured data display
3. **Convenience logging**: `logger.log.info()`, `logger.log.error()`, etc.
4. **Custom logger creation**: `createLogger()` with custom configuration
5. **Child logger creation**: `createChildLogger()` with prefixes
6. **Log level management**: Setting and checking log levels
7. **Configuration**: Custom prefixes, colors, timestamps

## Running Tests

```bash
# Run all tests
npm test

# Run individual test formats
npm run test:cjs
npm run test:cjs-destructuring
npm run test:esm
npm run test:ts
npm run test:ts-destructuring
```

## Expected Output

All tests should produce colored console output showing:

- Timestamps
- Log levels (INFO, WARN, ERROR, DEBUG)
- Custom prefixes for child loggers
- Proper color coding for different log levels

## Import Methods Tested

### ES Modules (Default)

```typescript
import logger from '@calphonse/logger';
```

### ES Modules (Destructuring)

```typescript
import { logger, createLogger, LogLevel } from '@calphonse/logger';
```

### CommonJS (ES Module Wrapper)

```javascript
import logger from '@calphonse/logger';
```

## Package Configuration

This test package is configured as an ES module (`"type": "module"`) to test the package's compatibility with modern Node.js applications while still testing CommonJS-style functionality through ES module imports.

## Dependencies

- `@calphonse/logger` - The package being tested (linked locally)
- `chalk` - Required peer dependency
- `tsx` - For running TypeScript files directly
