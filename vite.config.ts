import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repoBase = process.env.GITHUB_PAGES === 'true' ? '/gameit/' : '/';

export default defineConfig({
  plugins: [react()],
  base: repoBase,
});
