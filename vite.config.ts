import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site under /Plato/; Cloudflare Pages and the custom domain serve it from the root.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_ACTIONS ? '/Plato/' : '/',
});
