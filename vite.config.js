// ─────────────────────────────────────────────────────────────────────────────
// 브라우저 전용 개발 서버 설정 (npm run web-dev 시 사용)
// Electron 통합은 electron.vite.config.js 를 사용 (npm run dev)
// ─────────────────────────────────────────────────────────────────────────────

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

// package.json version 을 빌드타임 상수(__APP_VERSION__)로 주입 (web 환경 폴백용)
const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));

export default defineConfig({
  base: './',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
});
