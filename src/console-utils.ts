/**
 * Process console.log-style arguments into a message and data object
 * Supports format strings like %s, %d, %o, etc.
 */
export function processConsoleArgs(args: any[]): {
  message: string;
  data?: any;
} {
  if (args.length === 0) {
    return { message: '' };
  }

  // Check if first argument is a format string
  if (typeof args[0] === 'string' && hasFormatSpecifiers(args[0])) {
    return formatString(args[0], ...args.slice(1));
  }

  // Handle multiple arguments like console.log('User:', user, 'Action:', action)
  const messageParts: string[] = [];
  const dataParts: any[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (typeof arg === 'string') {
      messageParts.push(arg);
    } else if (typeof arg === 'object' && arg !== null) {
      // Objects go to data, but keep their string representation in message
      dataParts.push(arg);
      messageParts.push(serializeForConsole(arg));
    } else {
      // Primitives go to message
      messageParts.push(String(arg));
    }
  }

  const message = messageParts.join(' ');
  const data =
    dataParts.length > 0
      ? dataParts.length === 1
        ? dataParts[0]
        : dataParts
      : undefined;

  return { message, data };
}

/**
 * Check if a string contains format specifiers like %s, %d, %o, etc.
 */
export function hasFormatSpecifiers(str: string): boolean {
  return /%[sdioOcf]/.test(str);
}

/**
 * Format a string with printf-style specifiers
 */
export function formatString(
  format: string,
  ...args: any[]
): { message: string; data?: any } {
  let message = format;
  let data: any = undefined;
  let argIndex = 0;

  // Replace format specifiers
  message = message.replace(/%([sdioOcf])/g, (match, specifier) => {
    if (argIndex >= args.length) {
      return match; // Keep the specifier if no more args
    }

    const arg = args[argIndex++];

    switch (specifier) {
      case 's': // string
        return String(arg);
      case 'd': // decimal
        return String(Number(arg) || 0);
      case 'i': // integer
        return String(Math.floor(Number(arg)) || 0);
      case 'o': // object (compact)
        return serializeForConsole(arg);
      case 'O': // object (detailed)
        return JSON.stringify(arg, null, 2);
      case 'c': // CSS style (ignored for now)
        return String(arg);
      case 'f': // float
        return String(Number(arg) || 0);
      default:
        return String(arg);
    }
  });

  // Any remaining args become data
  const remainingArgs = args.slice(argIndex);
  if (remainingArgs.length > 0) {
    data = remainingArgs.length === 1 ? remainingArgs[0] : remainingArgs;
  }

  return { message, data };
}

/**
 * Process console arguments with format string support
 * @deprecated Use processConsoleArgs() instead - format string support is now built-in
 */
export const processConsoleArgsWithFormatting = processConsoleArgs;

/**
 * Serialize an object for console-like display
 */
export function serializeForConsole(obj: any): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';

  if (typeof obj === 'object') {
    try {
      // Try to get a meaningful string representation
      if (obj.toString && obj.toString !== Object.prototype.toString) {
        return obj.toString();
      }

      // For arrays and objects, use JSON but limit length
      const json = JSON.stringify(obj);
      if (json.length > 100) {
        return json.substring(0, 97) + '...';
      }
      return json;
    } catch {
      return '[Object]';
    }
  }

  return String(obj);
}
