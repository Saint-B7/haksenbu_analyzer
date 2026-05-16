// ─────────────────────────────────────────────────────────────────────────────
// 자동 업데이트 모듈 — electron-updater 통합
//
// 동작 흐름:
//   앱 시작 → checkForUpdatesAndNotify() → GitHub Releases API 폴링
//   → 새 버전 감지 → 백그라운드 다운로드 → 완료 알림
//   → 사용자 "지금 재시작" 클릭 → quitAndInstall()
//
// IPC 이벤트(main → renderer):
//   'update-status' 채널로 { type, ...payload } 전송
// ─────────────────────────────────────────────────────────────────────────────

import { app } from 'electron';
import { autoUpdater } from 'electron-updater';

/**
 * 자동 업데이트 초기화 (app.whenReady() 이후 호출)
 * @param {import('electron').BrowserWindow} mainWindow
 */
export const setupUpdater = (mainWindow) => {
  if (!app.isPackaged) return;

  autoUpdater.autoDownload        = true;
  autoUpdater.autoInstallOnAppQuit = true;

  const send = (status) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('update-status', status);
    }
  };

  autoUpdater.on('checking-for-update', () => send({ type: 'checking' }));
  autoUpdater.on('update-available', (info) => send({ type: 'available', info }));
  autoUpdater.on('update-not-available', () => send({ type: 'not-available' }));
  autoUpdater.on('download-progress', (p) => send({ type: 'downloading', percent: Math.round(p.percent) }));
  autoUpdater.on('update-downloaded', (info) => send({ type: 'downloaded', info }));
  autoUpdater.on('error', (err) => send({ type: 'error', message: err?.message ?? '알 수 없는 오류' }));

  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      console.warn('[updater] 업데이트 확인 실패:', err?.message);
    });
  }, 3000);
};
