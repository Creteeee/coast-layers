import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/coast-layers/',   
  build: {
    outDir: 'docs',
  },
  plugins: [react()],
})
