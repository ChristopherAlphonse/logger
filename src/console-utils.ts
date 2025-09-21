/**
 * Converts an arbitrary list of console-style arguments into a single message string and optional data payload.
 *
 * If `args` is empty returns `{ message: '' }`. If the first argument is a string containing printf-style
 * format specifiers (`%s`, `%d`, `%i`, `%o`, `%O`, `%c`, `%f`) the function delegates to `formatString`
 * using the remaining arguments as format values and trailing data. Otherwise it:
 * - concatenates stringified arguments (objects are serialized via `serializeForConsole`) separated by spaces to form `message`,
 * - collects any non-null objects into `data` (a single object if one was passed, or an array if multiple).
 *
 * @returns An object with `message` (always present) and optional `data` containing object argument(s) or remaining format arguments.
 */
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

/**
 * Returns true if the given string contains any printf-style format specifiers.
 *
 * Detects any of: `%s`, `%d`, `%i`, `%o`, `%O`, `%c`, `%f`.
 *
 * @param str - The string to scan for format specifiers
 * @returns `true` when at least one specifier is present, otherwise `false`
 */
export function hasFormatSpecifiers(str: string): boolean {
  return /%[sdioOcf]/.test(str);
}

/**
 * Formats a printf-style string using the provided arguments and returns the formatted message plus any unused arguments as data.
 *
 * Replaces format specifiers in `format` with values from `args` in order:
 * - `%s` — String coercion
 * - `%d` — Number coercion (defaults to `0`) then string
 * - `%i` — Number coercion, floored (defaults to `0`) then string
 * - `%o` — Object serialization via `serializeForConsole`
 * - `%O` — `JSON.stringify` with 2-space indentation
 * - `%c` — String coercion
 * - `%f` — Number coercion (defaults to `0`) then string
 *
 * If there are fewer arguments than specifiers, unmatched placeholders are left unchanged. Any arguments remaining after filling specifiers are returned as `data` (single value when one remains, otherwise an array).
 *
 * @param format - The format string containing zero or more specifiers
 * @param args - Values to substitute into the format string; any unused values become the returned `data`
 * @returns An object with the formatted `message` and optional `data` containing unused arguments
 */
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

/**
 * Serializes an arbitrary value to a concise string suitable for console output.
 *
 * For null/undefined returns the literal `"null"`/`"undefined"`. For objects:
 * - If the object defines a custom `toString()` (i.e., not `Object.prototype.toString`), that value is returned.
 * - Otherwise the object is JSON-stringified; strings longer than 100 characters are truncated to 97 characters plus `...`.
 * - If stringification throws, returns `"[Object]"`.
 * For non-objects returns `String(obj)`.
 *
 * @param obj - The value to serialize for console display.
 * @returns A short, human-readable string representation of `obj`.
 */
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

  return String(obj);
}
