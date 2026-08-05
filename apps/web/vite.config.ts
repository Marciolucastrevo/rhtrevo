import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Private Tailscale HTTPS preview for the RHTrevo development instance.
    allowedHosts: ['macbook-pro-de-marcio.tail5726a0.ts.net'],
  },
})
