# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-09-21

### Added

- **Enhanced Table Safety**: Robust serialization for `logger.table()` method
  - Safe handling of BigInt values (converted to string with 'n' suffix)
  - Circular reference detection and protection
  - Special object type handling (Date, Error, Map, Set, etc.)
  - Graceful fallback for serialization errors
  - Prevents crashes when logging complex data structures

## [1.1.0] - 2025-01-27

### Added

- **Table Logging**: New `logger.table()` method for displaying tabular data

  - Supports custom headers and border options
  - Colored headers with proper column alignment
  - Works with both text and JSON output formats
  - Example: `logger.table(data, { headers: ['Name', 'Age'], border: false })`

## [1.0.3] - 2025-07-21

### Fixed

- **Dual Module Support**: Fixed CommonJS and ESM compatibility issues
  - Resolved chalk import handling for both module systems
  - Fixed method binding issues in exported logger instance
  - Ensured proper `this` context preservation for logger methods

### Added

- **Multiple Import Patterns**: Support for various CommonJS import styles
  - `const { logger } = require('@calphonse/logger')` (recommended)
  - `const { logger, createLogger, LogLevel } = require('@calphonse/logger')`
- **Enhanced Developer Experience**: Better TypeScript support and error handling

## [1.0.2] - 2025-07-21

### Fixed

- Minor documentation and build improvements

## [1.0.1] - 2025-07-20

### Fixed

- Resolved npm publication issues with initial release

## [1.0.0] - 2025-07-20

### Added

- **Initial Release** - A beautiful, feature-rich logging library for Node.js applications
- **Core Logging Features**:

  - Multiple log levels: ERROR, WARN, INFO, DEBUG, TRACE
  - Colored terminal output using chalk
  - Timestamp support with customizable format
  - Source file information tracking
  - Structured data logging with JSON support
  - Custom prefixes for log organization

- **Logger Configuration**:

  - Flexible configuration system with sensible defaults
  - Environment-aware settings
  - Custom output streams support
  - Color and formatting controls
  - Log level filtering
