/**
 * Utilities for console compatibility and argument processing
 */

/**
 * Process console.log style arguments into message and data
 */
export function processConsoleArgs(args: any[]): {
  message: string;
  data?: any;
} {
  if (args.length === 0) {
    return { message: '' };
  }

  if (args.length === 1) {
    const arg = args[0];
    if (typeof arg === 'string') {
      return { message: arg };
    }
    // For non-strings, convert to string but preserve original as data
    return {
      message: String(arg),
      data: typeof arg === 'object' ? arg : undefined,
    };
  }

  // Multiple arguments - need to process like console.log does
  let message = '';
  const dataObjects: any[] = [];

  for (const arg of args) {
    if (
      typeof arg === 'string' ||
      typeof arg === 'number' ||
      typeof arg === 'boolean'
    ) {
      if (message) message += ' ';
      message += String(arg);
    } else if (arg === null) {
      if (message) message += ' ';
      message += 'null';
    } else if (arg === undefined) {
      if (message) message += ' ';
      message += 'undefined';
    } else {
      // Objects, arrays, etc.
      if (message) message += ' ';
      message += '[object]';
      dataObjects.push(arg);
    }
  }

  // Return structured result
  if (dataObjects.length === 0) {
    return { message };
  } else if (dataObjects.length === 1) {
    return { message, data: dataObjects[0] };
  } else {
    return { message, data: dataObjects };
  }
}

/**
 * Format string with printf-style specifiers
 * Supports %s (string), %d (number), %o (object), %O (object), %c (css - ignored)
 */
export function formatString(
  format: string,
  ...args: any[]
): { message: string; data?: any } {
  let message = format;
  let argIndex = 0;
  const unusedArgs: any[] = [];
  const dataObjects: any[] = [];

  // Replace format specifiers
  message = message.replace(/%[sdoOc]/g, match => {
    if (argIndex >= args.length) {
      return match; // No more args, leave specifier as-is
    }

    const arg = args[argIndex++];

    switch (match) {
      case '%s':
        return String(arg);
      case '%d':
        return String(Number(arg));
      case '%o':
      case '%O':
        if (typeof arg === 'object' && arg !== null) {
          dataObjects.push(arg);
        }
        return '[object]';
      case '%c':
        // CSS styling - ignore in our logger
        return '';
      default:
        return match;
    }
  });

  // Collect unused arguments
  while (argIndex < args.length) {
    const arg = args[argIndex++];
    if (typeof arg === 'object' && arg !== null) {
      dataObjects.push(arg);
    } else {
      unusedArgs.push(arg);
    }
  }

  // Append unused string/number args to message
  if (unusedArgs.length > 0) {
    message += ' ' + unusedArgs.join(' ');
  }

  // Return result
  if (dataObjects.length === 0) {
    return { message };
  } else if (dataObjects.length === 1) {
    return { message, data: dataObjects[0] };
  } else {
    return { message, data: dataObjects };
  }
}

/**
 * Check if first argument looks like a printf-style format string
 */
export function hasFormatSpecifiers(str: string): boolean {
  return typeof str === 'string' && /%[sdoOc]/.test(str);
}

/**
 * Process arguments like console.log, with format string support
 */
export function processConsoleArgsWithFormatting(args: any[]): {
  message: string;
  data?: any;
} {
  if (args.length === 0) {
    return { message: '' };
  }

  const firstArg = args[0];

  // Check if first argument is a format string
  if (
    typeof firstArg === 'string' &&
    hasFormatSpecifiers(firstArg) &&
    args.length > 1
  ) {
    return formatString(firstArg, ...args.slice(1));
  }

  // Fall back to regular argument processing
  return processConsoleArgs(args);
}

/**
 * Serialize objects for display like console does
 */
export function serializeForConsole(obj: any): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);

  try {
    // For objects/arrays, show a abbreviated representation
    if (Array.isArray(obj)) {
      if (obj.length === 0) return '[]';
      if (obj.length <= 3) {
        return `[${obj
          .map(item => (typeof item === 'object' ? '{...}' : String(item)))
          .join(', ')}]`;
      }
      return `[${obj
        .slice(0, 2)
        .map(item => (typeof item === 'object' ? '{...}' : String(item)))
        .join(', ')}, ... +${obj.length - 2} more]`;
    }

    if (typeof obj === 'object') {
      const keys = Object.keys(obj);
      if (keys.length === 0) return '{}';
      if (keys.length <= 2) {
        return `{${keys
          .map(
            key =>
              `${key}: ${
                typeof obj[key] === 'object' ? '{...}' : String(obj[key])
              }`
          )
          .join(', ')}}`;
      }
      return `{${keys
        .slice(0, 2)
        .map(
          key =>
            `${key}: ${
              typeof obj[key] === 'object' ? '{...}' : String(obj[key])
            }`
        )
        .join(', ')}, ... +${keys.length - 2} more}`;
    }

    return String(obj);
  } catch {
    return '[object]';
  }
}
