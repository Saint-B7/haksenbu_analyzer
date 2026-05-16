// ─────────────────────────────────────────────────────────────────────────────
// Electron Preload 스크립트
//
// contextBridge를 통해 renderer(React)에서 호출할 수 있는 API만 선별적으로 노출.
// 이 파일만이 Node.js 환경에 접근할 수 있는 유일한 경계선이며,
// 여기서 노출하지 않은 Node.js/Electron 기능은 renderer에서 절대 사용 불가.
//
// 보안 체크리스트:
//   ✅ nodeIntegration: false (main.js에서 설정)
//   ✅ contextIsolation: true (main.js에서 설정)
//   ✅ 화이트리스트 방식 — 필요한 채널만 명시적으로 노출
//   ✅ API 키 평문은 renderer에 전달하지 않음 (has-api-key만 노출)
// ─────────────────────────────────────────────────────────────────────────────

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {

  // ── LLM 호출 ───────────────────────────────────────────────────────────────
  // main 프로세스가 OpenRouter를 직접 호출하고 파싱된 결과만 반환.
  // API 키는 main 프로세스 내부에서만 처리됨.
  callLLM: (args) => ipcRenderer.invoke('call-llm', args),

  // ── 연결 테스트 ─────────────────────────────────────────────────────────────
  // { apiKey, model } → { ok, model?, elapsedMs?, statusCode?, message?, rawMsg? }
  // 항상 resolve (절대 reject하지 않음) — api-bridge.testOpenRouter 참고
  testLLMConnection: (args) => ipcRenderer.invoke('test-llm-connection', args),

  // ── 외부 브라우저 열기 ──────────────────────────────────────────────────────
  // openrouter.ai 도메인만 허용 (main.js에서 검증)
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // ── API 키 관리 ─────────────────────────────────────────────────────────────
  saveApiKey:   (key) => ipcRenderer.invoke('save-api-key', key),
  hasApiKey:    ()    => ipcRenderer.invoke('has-api-key'),
  deleteApiKey: ()    => ipcRenderer.invoke('delete-api-key'),

  // ── 앱 설정 ─────────────────────────────────────────────────────────────────
  // 선택한 모델명, UI 옵션 등 평문 설정값 읽기/쓰기
  getSetting: (key)        => ipcRenderer.invoke('get-setting', key),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),

  // ── 자동 업데이트 설치 트리거 ────────────────────────────────────────────────
  installUpdate: () => ipcRenderer.invoke('install-update'),

  // ── 자동 업데이트 상태 수신 (단방향: main → renderer) ──────────────────────
  // 콜백이 받는 status 객체 형태:
  //   { type: 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error',
  //     percent?: number,   // downloading 시 진행률(0~100)
  //     info?:    object,   // available/downloaded 시 릴리스 정보
  //     message?: string }  // error 시 오류 메시지
  onUpdateStatus: (callback) => {
    const handler = (_event, status) => callback(status);
    ipcRenderer.on('update-status', handler);
    // React useEffect cleanup 함수로 사용할 수 있도록 해제 함수 반환
    return () => ipcRenderer.removeListener('update-status', handler);
  },
});
