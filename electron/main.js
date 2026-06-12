// ─────────────────────────────────────────────────────────────────────────────
// Electron 메인 프로세스 — 앱의 "백엔드" 역할
//
// 역할:
//   1) BrowserWindow 생성 (renderer = React UI)
//   2) IPC 핸들러 등록 (renderer ↔ main 통신)
//   3) API 키 암호화/복호화 (OS 내장 safeStorage 사용)
//   4) OpenRouter LLM 호출 (api-bridge.js 위임)
//   5) 자동 업데이트 초기화 (updater.js 위임)
//
// 보안 원칙:
//   - nodeIntegration: false → renderer에서 Node.js 직접 접근 불가
//   - contextIsolation: true → preload와 renderer 컨텍스트 완전 분리
//   - API 키는 절대 renderer에 평문으로 전달하지 않음
//
// 컴파일 방식:
//   소스는 ESM으로 작성하지만 electron-vite가 CJS로 컴파일
//   → require('electron') 가 Electron CJS 인터셉터를 정상 통과
// ─────────────────────────────────────────────────────────────────────────────

import { app, BrowserWindow, ipcMain, safeStorage, shell } from 'electron';
import { join } from 'path';
import Store from 'electron-store';
import { autoUpdater } from 'electron-updater';
import { callOpenRouter, testOpenRouter, getOpenRouterCredits } from './api-bridge.js';
import { setupUpdater } from './updater.js';

// 앱 설정 저장소 (선택한 모델명 등 평문 설정)
const store = new Store({ name: 'app-config' });

let mainWindow = null;

// ── 창 생성 ───────────────────────────────────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 900,
    minHeight: 650,
    webPreferences: {
      // electron-vite가 preload를 dist-electron/preload.cjs로 출력
      preload: join(__dirname, 'preload.cjs'),
      nodeIntegration: false,   // 보안: renderer에서 Node.js 직접 접근 금지
      contextIsolation: true,   // 보안: preload ↔ renderer 컨텍스트 분리
    },
    title: '학생부 문장 분석기',
    // 작업표시줄·창 아이콘. 패키징 .exe 의 파일 아이콘은 electron-builder 의
    // win.icon 이 담당하고, 이 옵션은 개발 모드와 창 아이콘에 적용된다.
    icon: join(__dirname, '../build/icon.ico'),
    show: false,
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  // 개발 모드: electron-vite가 VITE_DEV_SERVER_URL 환경변수를 주입
  // 프로덕션: 빌드된 index.html 로드
  if (process.env['VITE_DEV_SERVER_URL']) {
    mainWindow.loadURL(process.env['VITE_DEV_SERVER_URL']);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(join(__dirname, '../dist/index.html'));
  }
}

// ── IPC 핸들러: LLM 호출 ──────────────────────────────────────────────────────

ipcMain.handle('call-llm', async (_event, args) => {
  const encBase64 = store.get('apiKeyEncrypted');
  if (!encBase64) {
    throw new Error('API 키가 설정되지 않았습니다. 우측 상단 ⚙️ 설정에서 키를 입력해 주세요.');
  }

  let apiKey;
  try {
    apiKey = safeStorage.decryptString(Buffer.from(encBase64, 'base64'));
  } catch {
    throw new Error('API 키 복호화에 실패했습니다. 설정에서 키를 다시 저장해 주세요.');
  }

  const model = store.get('model', 'anthropic/claude-sonnet-4-5');
  return callOpenRouter({ ...args, apiKey, model });
});

// ── IPC 핸들러: API 키 관리 ───────────────────────────────────────────────────

ipcMain.handle('save-api-key', (_event, plainKey) => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error('이 기기에서 안전한 암호화를 사용할 수 없습니다.');
  }
  const encrypted = safeStorage.encryptString(plainKey);
  store.set('apiKeyEncrypted', encrypted.toString('base64'));
});

ipcMain.handle('has-api-key', () => Boolean(store.get('apiKeyEncrypted')));

ipcMain.handle('delete-api-key', () => store.delete('apiKeyEncrypted'));

// ── IPC 핸들러: 앱 설정 ───────────────────────────────────────────────────────

ipcMain.handle('get-setting', (_event, key) => store.get(key));
ipcMain.handle('set-setting', (_event, key, value) => store.set(key, value));

// ── IPC 핸들러: 연결 테스트 ──────────────────────────────────────────────────
// 키를 저장하기 전에 실제로 통신되는지 검증.
// testOpenRouter는 절대 throw하지 않고 { ok, ... } 객체를 반환함.
ipcMain.handle('test-llm-connection', (_event, { apiKey, model }) => {
  return testOpenRouter({ apiKey, model });
});

// ── IPC 핸들러: 남은 크레딧(USD) 조회 ────────────────────────────────────────
// 저장된 키를 복호화해 OpenRouter /credits 를 호출. 키가 없거나 복호화·조회가
// 실패하면 조용히 null 반환 (UI는 뱃지를 숨김 — 에러 배너 띄우지 않음).
ipcMain.handle('get-credits', async () => {
  const encBase64 = store.get('apiKeyEncrypted');
  if (!encBase64) return null;

  let apiKey;
  try {
    apiKey = safeStorage.decryptString(Buffer.from(encBase64, 'base64'));
  } catch {
    return null;
  }

  const result = await getOpenRouterCredits({ apiKey });
  return result.ok ? { remaining: result.remaining } : null;
});

// ── IPC 핸들러: 외부 브라우저로 URL 열기 ─────────────────────────────────────
// 보안: openrouter.ai 도메인만 허용 — renderer가 임의 URL을 시스템에서 열지 못하도록
ipcMain.handle('open-external', async (_event, url) => {
  let parsed;
  try { parsed = new URL(url); } catch { return; }
  if (parsed.hostname !== 'openrouter.ai') return;
  await shell.openExternal(url);
});

// 업데이트 수동 설치 (다운로드 완료 후 사용자가 "지금 재시작" 클릭 시)
ipcMain.handle('install-update', () => autoUpdater.quitAndInstall());

// ── 앱 수명 관리 ──────────────────────────────────────────────────────────────

app.whenReady().then(() => {
  createWindow();
  setupUpdater(mainWindow);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
