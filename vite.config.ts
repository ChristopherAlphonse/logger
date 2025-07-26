import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Logger',
      fileName: (format) => (format === 'es' ? 'index.es.js' : 'index.cjs.js'),
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['chalk'],
      output: {
        globals: {
          chalk: 'chalk',
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
      copyDtsFiles: true,
      include: ['src/**/*'],
    }),
  ],
});
