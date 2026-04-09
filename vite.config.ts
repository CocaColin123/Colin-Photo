import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

// 仅在本仓库的 GitHub Actions（见 deploy-pages.yml）里设置 DEPLOY_TARGET=github-pages 时使用子路径。
// 不要用 GITHUB_ACTIONS 判断：Vercel 连 GitHub 构建时也可能带上该变量，导致错误打成 /Colin-Photo/ 白屏。
const base = process.env.DEPLOY_TARGET === 'github-pages' ? '/Colin-Photo/' : '/';

export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  server: {
    hmr: process.env.DISABLE_HMR !== 'true',
  },
});
