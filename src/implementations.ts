/**
 * Bridge Pattern - Concrete Implementations
 * Separates logger abstraction from implementation details
 */

import type { ILogImplementation } from './types';

/**
 * Console implementation of the logging bridge
 */
export class ConsoleLogImplementation implements ILogImplementation {
  private readonly output: NodeJS.WritableStream;

  constructor(output: NodeJS.WritableStream = process.stdout) {
    this.output = output;
  }

  write(output: string): void {
    this.output.write(output);
  }

  getSourceInfo(): string {
    const stack = new Error().stack;
    if (!stack) return 'unknown';

    const lines = stack.split('\n');
    for (let i = 3; i < lines.length; i++) {
      const line = lines[i];
      if (line.includes('node_modules') || line.includes('packages/logger')) {
        continue;
      }

      const match = RegExp(/at\s+(.+?)\s+\((.+):(\d+):(\d+)\)/).exec(line);
      if (match) {
        const [, _functionName, filePath, lineNum] = match;
        const fileName = filePath.split('/').pop()?.split('\\').pop() || 'unknown';
        return `${fileName}:${lineNum}`;
      }
    }

    return 'unknown';
  }
}
