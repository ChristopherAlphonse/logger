import type { BrowserConsoleMode, LoggerOutput } from './types';

const noopOutput: LoggerOutput = {
  write: () => true,
};

const localHostnamePattern =
  /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0|\[?::1\]?|.*\.localhost)$/i;

function getHostname(): string {
  const globalWithLocation = globalThis as typeof globalThis & {
    location?: { hostname?: string };
  };

  return globalWithLocation.location?.hostname || '';
}

export function isBrowserRuntime(): boolean {
  const globalWithWindow = globalThis as typeof globalThis & {
    window?: unknown;
  };

  return globalWithWindow.window !== undefined;
}

export function isLocalBrowserHost(): boolean {
  return localHostnamePattern.test(getHostname());
}

export function shouldUseBrowserConsole(mode: BrowserConsoleMode = 'localhost'): boolean {
  if (!isBrowserRuntime()) {
    return false;
  }

  if (mode === 'always') {
    return true;
  }

  if (mode === 'never') {
    return false;
  }

  return isLocalBrowserHost();
}

export function createConsoleOutput(mode: BrowserConsoleMode = 'localhost'): LoggerOutput {
  if (!shouldUseBrowserConsole(mode)) {
    return noopOutput;
  }

  const browserConsole = globalThis.console;
  if (!browserConsole?.info) {
    return noopOutput;
  }

  return {
    write: (chunk: string) => {
      browserConsole.info(chunk.trimEnd());
      return true;
    },
  };
}

export function createDefaultOutput(mode: BrowserConsoleMode = 'localhost'): LoggerOutput {
  if (typeof process !== 'undefined' && process.stdout) {
    return process.stdout;
  }

  return createConsoleOutput(mode);
}
