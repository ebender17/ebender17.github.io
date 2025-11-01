import {defineConfig} from 'vite';
import path from 'path';

export default defineConfig({
  root: 'src',
  base: '/',
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname, 'src') }
    ]
  },
  server: {
    port: 8080,
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true
  }
});
