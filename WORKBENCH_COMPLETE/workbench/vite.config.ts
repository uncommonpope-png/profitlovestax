import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    define: {
      'process.env.GSK_MCP_URL': JSON.stringify(process.env.GSK_MCP_URL || 'http://127.0.0.1:3001'),
      'process.env.MCP_API_KEY': JSON.stringify(process.env.MCP_API_KEY || 'gsk-dev-key'),
    },
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
      dedupe: ['react', 'react-dom'],
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom/client',
        '@solana/web3.js',
        'lucide-react',
        'motion/react',
        'react-markdown',
        'three',
        'zod',
        'dockview',
        '@monaco-editor/react',
        '@xterm/xterm',
        '@xterm/addon-fit',
        '@xterm/addon-webgl',
        'web-tree-sitter',
      ],
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      sourcemap: true,
    },
    base: './',
  };
});