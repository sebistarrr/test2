import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base` doit correspondre au chemin de publication GitHub Pages
// (https://sebistarrr.github.io/test2/), sinon les assets sont cherchés à la
// racine du domaine et le sprite de la lance revient en 404.
export default defineConfig({
  base: '/test2/',
  plugins: [react()],
  build: { outDir: 'dist', assetsDir: 'assets' },
});
