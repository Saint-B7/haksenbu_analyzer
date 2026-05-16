// ─────────────────────────────────────────────────────────────────────────────
// OpenRouter API 호출 모듈 (main 프로세스 전용)
//
// 왜 main 프로세스에서 호출하는가?
//   1) CORS: 브라우저 renderer에서 외부 API를 직접 호출하면 CORS 오류 발생 가능
//   2) 보안: API 키가 renderer 메모리에 노출되지 않음
//   3) 안정성: Node.js fetch는 브라우저 정책의 영향을 받지 않음
//
// OpenRouter vs Anthropic API 형식 차이:
//   Anthropic: { model, system, messages: [{role:'user', content}] }
//   OpenRouter: { model, messages: [{role:'system',...}, {role:'user',...}] }
//   → system 프롬프트를 messages 배열 첫 번째 항목으로 변환
// ─────────────────────────────────────────────────────────────────────────────

import { parseAnalysisJson } from '../src/lib/json-recovery.js';

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const ERR_DIAG_LEN = 400;   // 오류 진단 본문 최대 길이
const TEST_BODY_LEN = 200;  // 테스트 오류 원문 최대 길이

/**
 * OpenRouter에 LLM 요청을 보내고 파싱된 결과를 반환
 *
 * @param {{
 *   system: string,       기존 callPhase와 동일한 인터페이스 유지
 *   userMsg: string,
 *   maxTokens?: number,
 *   apiKey: string,       main.js가 safeStorage에서 복호화해서 전달
 *   model: string         사용자가 설정에서 선택한 OpenRouter 모델 ID
 * }} args
 * @returns {Promise<{ parsed: any, recovered: boolean, stop: string }>}
 */
export const callOpenRouter = async ({ system, userMsg, maxTokens = 8000, apiKey, model }) => {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`,
      // OpenRouter 권장 헤더 — 어떤 앱에서 호출하는지 식별 (Usage 대시보드에 표시됨)
      'HTTP-Referer':  'https://github.com/haksenbu-analyzer',
      'X-Title':       '학생부 문장 분석기',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      // OpenAI 호환 형식: system 프롬프트를 messages 배열 첫 번째 항목으로
      messages: [
        { role: 'system', content: system  },
        { role: 'user',   content: userMsg },
      ],
    }),
  });

  if (!res.ok) {
    let bodyText = '';
    try { bodyText = (await res.text()).slice(0, ERR_DIAG_LEN); } catch { /* ignore */ }
    const err = new Error(`OpenRouter API 오류 (${res.status})`);
    err.diagnostic = bodyText;
    throw err;
  }

  const data = await res.json();

  // OpenAI 호환 형식 응답: choices[0].message.content
  const raw = data?.choices?.[0]?.message?.content;
  if (!raw) {
    const err = new Error('OpenRouter 응답에 content가 없습니다');
    err.diagnostic = JSON.stringify(data).slice(0, ERR_DIAG_LEN);
    throw err;
  }

  // finish_reason: 'stop' | 'length' | 'content_filter' | ...
  const stop = data?.choices?.[0]?.finish_reason ?? 'unknown';

  // 기존 parseAnalysisJson 재사용 — 잘림 복구 + 후행 콤마 보정 포함
  const { data: parsed, recovered } = parseAnalysisJson(raw);
  return { parsed, recovered, stop };
};

/**
 * 연결 테스트 전용 경량 호출 — max_tokens=10, 파싱 없음
 * 항상 결과 객체를 반환 (절대 throw 하지 않음 → IPC 오류 직렬화 문제 회피)
 *
 * @param {{ apiKey: string, model: string }} args
 * @returns {Promise<
 *   | { ok: true,  model: string, elapsedMs: number }
 *   | { ok: false, statusCode: number|null, message: string, rawMsg: string|null }
 * >}
 */
export const testOpenRouter = async ({ apiKey, model }) => {
  const start = Date.now();
  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer':  'https://github.com/haksenbu-analyzer',
        'X-Title':       '학생부 문장 분석기',
      },
      body: JSON.stringify({
        model,
        max_tokens: 10,
        messages: [{ role: 'user', content: 'ping' }],
      }),
    });

    const elapsedMs = Date.now() - start;

    if (!res.ok) {
      let rawMsg = null;
      try { rawMsg = (await res.text()).slice(0, TEST_BODY_LEN); } catch { /* ignore */ }
      return { ok: false, statusCode: res.status, message: `HTTP ${res.status}`, rawMsg };
    }

    const data = await res.json();
    // OpenRouter 응답의 model 필드 = 실제 사용된 모델 ID
    return { ok: true, model: data?.model ?? model, elapsedMs };

  } catch (e) {
    // fetch 자체 실패 (네트워크 단절, DNS 오류 등)
    return { ok: false, statusCode: null, message: e.message, rawMsg: null };
  }
};
