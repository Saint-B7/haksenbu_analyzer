// LLM API 호출 헬퍼
// - Electron 환경: IPC를 통해 main 프로세스에 위임 (API 키는 renderer에 절대 노출되지 않음)
// - 브라우저(web-dev) 환경: Anthropic API 직접 호출

import { parseAnalysisJson } from './json-recovery';
import { ERR_DIAG_HTTP_LEN, ERR_DIAG_API_LEN } from '../data/constants';

// preload가 window.electronAPI를 주입하면 Electron 환경으로 판단
const isElectron = () => typeof window !== 'undefined' && window.electronAPI != null;

/**
 * 기술적 에러 메시지를 사용자 친화 한국어로 변환
 */
export const humanizeError = (msg) => {
  if (!msg) return '알 수 없는 오류';
  if (/Invalid response format/i.test(msg)) return '응답 형식 오류 — 잠시 후 다시 시도해 주세요.';
  if (/Failed to fetch|NetworkError/i.test(msg)) return '네트워크 오류 — 연결 상태를 확인하고 다시 시도해 주세요.';
  if (/402|insufficient|크레딧|credit/i.test(msg)) return '크레딧 부족 — OpenRouter에서 크레딧을 충전한 뒤 다시 시도해 주세요.';
  if (/429|rate.?limit/i.test(msg)) return '요청 한도 초과 — 30초~1분 후 다시 시도해 주세요.';
  if (/529|overload/i.test(msg)) return '서버 과부하 — 잠시 후 다시 시도해 주세요.';
  if (/API 키가 설정되지/i.test(msg)) return msg;
  return msg;
};

/**
 * 단일 phase API 호출 — 시스템 프롬프트 + 사용자 메시지 → 파싱된 JSON
 * @param {{system: string, userMsg: string, maxTokens?: number}} args
 * @returns {Promise<{parsed: any, recovered: boolean, stop: string}>}
 */
export const callPhase = async ({ system, userMsg, maxTokens = 8000 }) => {
  // ── Electron 경로: main 프로세스가 OpenRouter 호출, API 키는 renderer에 노출되지 않음
  if (isElectron()) {
    return window.electronAPI.callLLM({ system, userMsg, maxTokens });
  }

  // ── 브라우저(web-dev) 경로: Anthropic API 직접 호출
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMsg }],
    }),
  });

  if (!res.ok) {
    let bodyText = '';
    try { bodyText = (await res.text()).slice(0, ERR_DIAG_HTTP_LEN); } catch {}
    const err = new Error(`API 오류 (${res.status})`);
    err.diagnostic = bodyText;
    throw err;
  }

  const data = await res.json();
  if (data?.type === 'error' || data?.error) {
    const m = data?.error?.message || data?.message || '응답 형식 오류';
    const err = new Error(m);
    err.diagnostic = JSON.stringify(data).slice(0, ERR_DIAG_API_LEN);
    throw err;
  }
  if (!data?.content || !Array.isArray(data.content)) {
    const err = new Error('응답에 content 필드가 없습니다');
    err.diagnostic = JSON.stringify(data).slice(0, ERR_DIAG_API_LEN);
    throw err;
  }

  const raw = data.content.filter((b) => b?.type === 'text').map((b) => b.text || '').join('');
  const stop = data?.stop_reason;
  const { data: parsed, recovered } = parseAnalysisJson(raw);
  return { parsed, recovered, stop };
};
