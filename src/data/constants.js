// 코드 곳곳에 흩어져 있던 매직 넘버를 의미 있는 이름으로 모아 둔 파일.
// 값을 바꿀 때 이 파일만 보면 되도록 한 곳에 모은다.
//
// 분류 기준:
//   1) UI 표시 한도(키워드 개수, 발췌 길이, 토스트 표시 시간)
//   2) 게이지 스케일 여유 비율
//   3) 에러 진단 본문 길이(LLM 응답 추적용 잘라낼 길이)
//   4) 점수 fallback (AI 응답에 qualityScore 누락 시 사용)

// ── (1) UI 표시 한도 ─────────────────────────────────────────

// 서사 흐름 단계 박스에 노출할 키워드 최대 개수.
// 그 이상은 박스가 어수선해지므로 잘라낸다.
export const KEYWORDS_DISPLAY_LIMIT = 4;

// 본문 발췌 인용(`"..."`)을 카드 안에 표시할 때의 최대 길이.
// (히스토리 변환 단계에서 짧은 미리보기로 자를 때 사용)
export const EXCERPT_DISPLAY_LIMIT = 100;

// 토스트 메시지 표시 시간(ms)
export const TOAST_COPIED_MS = 1500;  // "복사됨" 표시 시간
export const TOAST_SAVED_MS  = 1800;  // "✓ 저장됨" 표시 시간


// ── (2) 게이지 스케일 여유 비율 ──────────────────────────────

// 대안 문장 바이트 게이지의 동적 스케일 계산에 사용.
//   scaleMax = max(NEIS_BYTE_LIMIT * BASE, altBytes * OVER)
// BASE: 권장 한도(1500B)에 적용할 여유 — 게이지 끝까지 차지 않도록 약간의 여백
// OVER: 권장 한도를 초과한 경우 실제 분량 기준으로 잡을 여유
export const REWRITE_GAUGE_HEADROOM_BASE = 1.10;
export const REWRITE_GAUGE_HEADROOM_OVER = 1.05;


// ── (3) 에러 진단 본문 길이 ──────────────────────────────────

// LLM 응답 / 네트워크 에러를 기록할 때 진단용으로 잘라낼 문자열 길이.
// 너무 길면 UI가 깨지고 너무 짧으면 디버깅이 어려워서 절충값으로 고정.
export const ERR_DIAG_HTTP_LEN = 300;   // HTTP 응답 본문(에러 시)
export const ERR_DIAG_API_LEN  = 400;   // API JSON 응답 전체
export const ERR_DIAG_FULL_LEN = 500;   // JSON 파싱 실패 시 원문
export const ERR_DIAG_MSG_LEN  = 120;   // 에러 메시지 자체


// ── (4) 점수 fallback ────────────────────────────────────────

// AI 응답에 qualityScore(0~100)가 빠지면 satisfied/met 등급으로 추정.
// "충족=75 / 미충족=25" 같은 보수적 기본값을 둔다.
export const DNA_FALLBACK_SCORE_SATISFIED   = 75;
export const DNA_FALLBACK_SCORE_UNSATISFIED = 25;

export const TOPTIER_FALLBACK_SCORE_MET   = 75;
export const TOPTIER_FALLBACK_SCORE_UNMET = 18;

// 도약 충족(met) 판정 임계 점수 — qualityScore가 이 이상이면 충족으로 본다.
export const TOPTIER_MET_THRESHOLD = 66;

// 서사 6단계 박스의 status 등급별 기본 품질 점수(qualityScore 누락 시 사용).
// 5단계는 colors.js의 STATUS_COLORS와 짝을 이룬다.
export const STRUCTURE_FALLBACK_SCORES = {
  excellent: 92,
  strong:    75,
  normal:    53,
  weak:      30,
  missing:    8,
};
