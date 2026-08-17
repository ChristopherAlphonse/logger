import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(import.meta.dirname, 'src/index.ts'),
      name: 'Logger',
      fileName: (format) => (format === 'es' ? 'index.es.js' : 'index.cjs'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: [
        'chalk',
        'ollama',
        'openai',
        'crypto-js',
        'crypto',
        'fs',
        'path',
        'os',
        'node:fs',
        'node:path',
        'node:os',
        'node:crypto',
      ],
      output: {
        globals: {
          chalk: 'chalk',
          ollama: 'ollama',
          openai: 'openai',
          'crypto-js': 'CryptoJS',
          crypto: 'crypto',
          fs: 'fs',
          path: 'path',
          os: 'os',
        },
        exports: 'named',
      },
    },
    sourcemap: true,
    minify: false,
  },
  plugins: [
    dts({
      insertTypesEntry: true,
      rollupTypes: true,
    }),
  ],
});
