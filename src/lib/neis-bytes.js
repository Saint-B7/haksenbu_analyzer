// NEIS 입력 바이트 계산 유틸리티
// NEIS는 한글 3바이트, 영문/숫자/공백 1바이트로 글자 수를 산정한다 (UTF-8 길이와 다름).

export const NEIS_BYTE_LIMIT = 1500;

// 권장 하한 — 한도 가까이 활용해 분량 손해를 줄임
export const NEIS_BYTE_REWRITE_MIN = 1470;

// 입력 문자열의 NEIS 기준 바이트 수를 반환
export const calcNeisBytes = (s) => {
  if (!s) return 0;
  let bytes = 0;
  for (const ch of s) {
    const code = ch.codePointAt(0);
    bytes += (code <= 0x7F) ? 1 : 3;
  }
  return bytes;
};
