import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'favicon-96x96.png', 'favicon.svg'],
      manifest: {
        name: 'LoveLog',
        short_name: 'LoveLog',
        description: 'Private Intimacy Tracker',
        theme_color: '#f43f5e',
        background_color: '#fafafa',
        display: 'standalone',
        icons: [
          {
            src: 'web-app-manifest-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'web-app-manifest-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ],
        start_url: '.',
        scope: '/'
      },
      devOptions: {
        enabled: true
      }
    })
  ],
  server: {
    // TODO 本地 hiddify vpn模式下必须使用，不然进不去
    host: true, // Listen on 0.0.0.0 
    port: 5173  // Force port 5173 if possible, or let it auto-increment
  }
})
