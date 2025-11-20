import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      // Base must be relative for Electron to load assets from file:// protocol
      // and works well for GitHub Pages sub-directories
      base: './', 
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      build: {
        chunkSizeWarningLimit: 2000,
        outDir: 'dist',
        emptyOutDir: true,
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          includeAssets: ['icons/icon.svg'], // Ensure 'icons' folder is in a 'public' directory
          manifest: {
            name: "Business Contacts Manager",
            short_name: "Contacts",
            description: "A modern and sleek business contacts application that allows users to manage contact details and attachments.",
            theme_color: "#0ea5e9",
            background_color: "#f1f5f9",
            display: "standalone",
            start_url: "./",
            icons: [
              {
                src: "./icons/icon.svg",
                sizes: "any",
                type: "image/svg+xml"
              }
            ]
          },
          workbox: {
            globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
            maximumFileSizeToCacheInBytes: 3000000 // Increase limit to avoid warnings
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});