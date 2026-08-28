import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
  },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        lab: 'lab.html',
      },
    },
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Frontline',
        short_name: 'Frontline',
        description: 'Modern military 1v1 FPS for phone and tablet',
        theme_color: '#0b1014',
        background_color: '#0b1014',
        display: 'standalone',
        orientation: 'landscape',
        start_url: '/',
        icons: [
          {
            src: 'favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
})
