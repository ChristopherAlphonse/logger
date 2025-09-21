export function processConsoleArgs(args: unknown[]): {
  message: string;
  data?: unknown;
} {
  if (args.length === 0) {
    return { message: '' };
  }

  if (typeof args[0] === 'string' && hasFormatSpecifiers(args[0])) {
    return formatString(args[0], ...args.slice(1));
  }

  const messageParts: string[] = [];
  const dataParts: unknown[] = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (typeof arg === 'string') {
      messageParts.push(arg);
    } else if (typeof arg === 'object' && arg !== null) {
      dataParts.push(arg);
      messageParts.push(serializeForConsole(arg));
    } else {
      messageParts.push(String(arg));
    }
  }

  const message = messageParts.join(' ');
  const data =
    dataParts.length > 0 ? (dataParts.length === 1 ? dataParts[0] : dataParts) : undefined;

  return { message, data };
}

export function hasFormatSpecifiers(str: string): boolean {
  return /%[sdioOcf]/.test(str);
}

export function formatString(
  format: string,
  ...args: unknown[]
): { message: string; data?: unknown } {
  let message = format;
  let data: unknown = undefined;
  let argIndex = 0;

  message = message.replace(/%([sdioOcf])/g, (match, specifier) => {
    if (argIndex >= args.length) {
      return match;
    }

    const arg = args[argIndex++];

    switch (specifier) {
      case 's':
        return String(arg);
      case 'd':
        return String(Number(arg) || 0);
      case 'i':
        return String(Math.floor(Number(arg)) || 0);
      case 'o':
        return serializeForConsole(arg);
      case 'O':
        return JSON.stringify(arg, null, 2);
      case 'c':
        return String(arg);
      case 'f':
        return String(Number(arg) || 0);
      default:
        return String(arg);
    }
  });

  const remainingArgs = args.slice(argIndex);
  if (remainingArgs.length > 0) {
    data = remainingArgs.length === 1 ? remainingArgs[0] : remainingArgs;
  }

  return { message, data };
}

export function serializeForConsole(obj: unknown): string {
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';

  if (typeof obj === 'object') {
    try {
      if (
        obj &&
        typeof (obj as Record<string, unknown>).toString === 'function' &&
        (obj as Record<string, unknown>).toString !== Object.prototype.toString
      ) {
        return (obj as { toString(): string }).toString();
      }

      const json = JSON.stringify(obj);
      if (json.length > 100) {
        return `${json.substring(0, 97)}...`;
      }
      return json;
    } catch {
      return '[Object]';
    }
  }

  return obj !== null && obj !== undefined ? String(obj) : String(obj);
}
