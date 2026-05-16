// ─────────────────────────────────────────────────────────────────────────────
// electron-vite 통합 설정
//
// electron-vite가 main/preload를 CJS로 컴파일하는 이유:
//   Electron은 CJS require('electron')만 인터셉터로 가로채 실제 API를 제공.
//   ESM import { BrowserWindow } from 'electron'은 npm 패키지를 직접 로드하므로
//   ipcMain, BrowserWindow 등이 undefined로 반환됨.
//
// 출력 경로:
//   dist-electron/main.js     — 메인 프로세스 (CJS)
//   dist-electron/preload.js  — preload 스크립트 (CJS)
//   dist/                     — renderer (ESM 번들)
// ─────────────────────────────────────────────────────────────────────────────

import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({

  // ── 메인 프로세스 ─────────────────────────────────────────────────────────
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron',
      rollupOptions: {
        // 절대경로 — 'electron/main.js' 상대경로는 electron 패키지 subpath로 오인됨
        input: resolve(__dirname, 'electron/main.js'),
        output: {
          // .cjs 확장자: "type":"module" 프로젝트에서도 CJS로 로드됨
          format: 'cjs',
          entryFileNames: 'main.cjs',
        },
      },
    },
  },

  // ── Preload 스크립트 ──────────────────────────────────────────────────────
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist-electron',
      emptyOutDir: false,  // main.js를 삭제하지 않도록
      rollupOptions: {
        input: resolve(__dirname, 'electron/preload.js'),
        output: {
          format: 'cjs',
          entryFileNames: 'preload.cjs',
        },
      },
    },
  },

  // ── Renderer 프로세스 ────────────────────────────────────────────────────
  renderer: {
    root: resolve(__dirname, '.'),
    base: './',
    plugins: [react()],
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: resolve(__dirname, 'index.html'),
      },
    },
  },
});
