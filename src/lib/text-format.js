// 텍스트 후처리 유틸 — 학생부 분석 결과 곳곳에서 공통으로 쓰이는 짧은 헬퍼들.

/**
 * **굵게** 마크업과 떠도는 별표(*)를 제거해 평문으로 만든다.
 * AI 응답에는 강조 표시로 별표가 들어오지만 NEIS 입력·클립보드 복사 시에는
 * 평문이어야 하므로 화면 표시 직전이나 복사 직전에 호출한다.
 *
 * @param {string|null|undefined} s 입력 문자열 (null/undefined 안전)
 * @returns {string} 별표 마크업이 제거된 평문
 *
 * @example
 *   stripBoldMarkup('**좋은** 문장')   // → '좋은 문장'
 *   stripBoldMarkup('*깨진* 마크업')   // → '깨진 마크업'
 *   stripBoldMarkup(null)              // → ''
 */
export const stripBoldMarkup = (s) =>
  String(s ?? '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')  // **X** → X (정상 굵게 마크업)
    .replace(/\*+/g, '');               // 떠도는 단일/다중 별표 모두 제거
