// ─────────────────────────────────────────────────────────────────────────────
// 브라우저 전용 개발 서버 설정 (npm run web-dev 시 사용)
// Electron 통합은 electron.vite.config.js 를 사용 (npm run dev)
// ─────────────────────────────────────────────────────────────────────────────

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: './',
  plugins: [react()],
});
