import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// Simple copy plugin to ensure static images and _redirects are included in the build output
const copyImagesPlugin = () => ({
  name: 'copy-images-plugin',
  apply: 'build',
  closeBundle() {
    // Copy images directory
    const srcDir = path.resolve(__dirname, 'image');
    const destDir = path.resolve(__dirname, 'dist', 'image');
    try {
      if (fs.existsSync(srcDir)) {
        fs.mkdirSync(destDir, { recursive: true });
        // Node 16+: fs.cpSync available; fallback to manual copy if needed
        if ((fs as any).cpSync) {
          (fs as any).cpSync(srcDir, destDir, { recursive: true });
        } else {
          // Fallback: copy files one by one
          const entries = fs.readdirSync(srcDir, { withFileTypes: true });
          for (const entry of entries) {
            const s = path.join(srcDir, entry.name);
            const d = path.join(destDir, entry.name);
            if (entry.isDirectory()) {
              fs.mkdirSync(d, { recursive: true });
            } else {
              fs.copyFileSync(s, d);
            }
          }
        }
      }
    } catch (err) {
      console.warn('[copy-images-plugin] failed to copy images:', err);
    }

    // Copy _redirects file for Cloudflare Pages SPA routing
    const redirectsSrc = path.resolve(__dirname, 'public', '_redirects');
    const redirectsDest = path.resolve(__dirname, 'dist', '_redirects');
    try {
      if (fs.existsSync(redirectsSrc)) {
        fs.copyFileSync(redirectsSrc, redirectsDest);
        console.log('[copy-images-plugin] _redirects file copied successfully');
      } else {
        console.warn('[copy-images-plugin] _redirects file not found in public directory');
      }
    } catch (err) {
      console.warn('[copy-images-plugin] failed to copy _redirects:', err);
    }
  },
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react(), copyImagesPlugin()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
