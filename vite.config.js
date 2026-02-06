import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      stream: 'stream-browserify',
      crypto: 'crypto-browserify',
    }
  },
  define: {
    'process.env': {},
    global: 'globalThis',
  },
  optimizeDeps: {
    include: [
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-react-ui',
      '@solana/wallet-adapter-wallets',
      '@solana/web3.js'
    ],
    esbuildOptions: {
      target: 'esnext',
      supported: {
        bigint: true
      }
    }
  },
  build: {
    target: 'esnext',
    commonjsOptions: {
      transformMixedEsModules: true
    }
  }
})
