import { defineConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { resolve } from 'path'

export default defineConfig({
  plugins: [solid()],
  resolve: {
    alias: {
      '@fermion/core': resolve(__dirname, '../../packages/core/src/index.ts'),
      '@fermion/renderer': resolve(__dirname, '../../packages/renderer/src/index.ts'),
      '@fermion/ui': resolve(__dirname, '../../packages/ui/src/index.ts'),
      '@fermion/solver': resolve(__dirname, '../../packages/solver/src/index.ts'),
    },
  },
  server: {
    port: 5173,
  },
})
