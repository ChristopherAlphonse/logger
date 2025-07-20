export default {
  compilationOptions: {
    preferredConfigPath: './tsconfig.json',
  },
  entries: [
    {
      filePath: './src/index.ts',
      outFile: './dist/index.d.ts',
      output: {
        sortNodes: true,
        noBanner: true,
      },
    },
  ],
};
