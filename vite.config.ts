import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` relatif : le site est publié sous /<dépôt>/ sur GitHub Pages, un
// chemin absolu casserait le chargement des bundles.
export default defineConfig({
  plugins: [react()],
  base: './',
  build: { outDir: 'dist', sourcemap: true },
});
