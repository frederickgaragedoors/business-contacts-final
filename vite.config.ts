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
          includeAssets: ['icons/icon.svg'],
          manifest: {
            name: 'Business Contacts Manager',
            short_name: 'Contacts',
            description: 'Manage your business contacts, jobs, and invoices.',
            theme_color: '#0ea5e9',
            background_color: '#0f172a',
            display: 'standalone',
            icons: [
              {
                src: 'icons/icon.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              }
            ]
          }
        })
      ],
      define: {
        // deeply polyfill process.env to prevent 'process is not defined' errors in some libs
        'process.env': {},
        // Use || '' to ensure it returns a string even if the env var is undefined during build
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve('.'),
        }
      }
    };
});