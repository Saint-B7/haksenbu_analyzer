// JSON 추출 / 잘림 복구
// LLM 응답이 max_tokens로 끊기거나 후행 콤마·스마트 따옴표 등으로 깨졌을 때
// 가능한 한 안전하게 복구해서 JSON.parse에 전달한다.

import { ERR_DIAG_FULL_LEN, ERR_DIAG_MSG_LEN } from '../data/constants';

/**
 * 잘림 복구: 응답이 도중에 끊기면 마지막 안전 지점까지 자르고 자동으로 닫음.
 * @param {string} rawText LLM이 반환한 원본 문자열 (코드펜스 포함 가능)
 * @returns {string|null} 복구된 JSON 문자열 또는 null
 */
export const recoverTruncatedJson = (rawText) => {
  if (!rawText) return null;
  let s = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
  const startIdx = s.indexOf('{');
  if (startIdx === -1) return null;
  s = s.slice(startIdx);

  // 한 번 훑어서 완전한 JSON인지 확인
  const traverse = (str) => {
    let depth = 0;
    let inString = false;
    let escape = false;
    let lastZeroDepth = -1;
    for (let i = 0; i < str.length; i++) {
      const c = str[i];
      if (escape) { escape = false; continue; }
      if (c === '\\') { escape = true; continue; }
      if (c === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (c === '{' || c === '[') depth++;
      else if (c === '}' || c === ']') {
        depth--;
        if (depth === 0) lastZeroDepth = i;
      }
    }
    return { depth, inString, lastZeroDepth };
  };

  const { depth, inString, lastZeroDepth } = traverse(s);

  // (1) 완전한 JSON: 끝 탐색 후 그대로 반환
  if (depth === 0 && !inString && lastZeroDepth >= 0) {
    return s.slice(0, lastZeroDepth + 1);
  }

  // (2) 잘렸음 → 마지막 안전 지점(콤마, 닫는 괄호) 찾아서 잘라낸 뒤 자동 닫기
  // 마지막 valid 종료 위치를 찾기 (문자열 밖의 , 또는 } 또는 ])
  let safeEnd = -1;
  let depth2 = 0, inString2 = false, escape2 = false;
  const stack = [];
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escape2) { escape2 = false; continue; }
    if (c === '\\') { escape2 = true; continue; }
    if (c === '"') { inString2 = !inString2; continue; }
    if (inString2) continue;
    if (c === '{' || c === '[') { depth2++; stack.push(c); }
    else if (c === '}' || c === ']') { depth2--; stack.pop(); }
    if (c === ',' || c === '}' || c === ']') safeEnd = i;
  }

  if (safeEnd === -1) return null;
  let body = s.slice(0, safeEnd + 1);
  body = body.replace(/,\s*$/, ''); // 끝 콤마 제거

  // 다시 깊이/스택 계산하여 닫기
  let inString3 = false, escape3 = false;
  const stack2 = [];
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (escape3) { escape3 = false; continue; }
    if (c === '\\') { escape3 = true; continue; }
    if (c === '"') { inString3 = !inString3; continue; }
    if (inString3) continue;
    if (c === '{' || c === '[') stack2.push(c);
    else if (c === '}' || c === ']') stack2.pop();
  }
  if (inString3) body += '"'; // 열린 문자열 닫기
  while (stack2.length > 0) {
    const top = stack2.pop();
    body += (top === '{') ? '}' : ']';
  }
  return body;
};

/**
 * 다단계 파싱 (잘림 복구 + 후행 콤마 + 스마트 따옴표 보정)
 * @returns {{data: any, recovered: boolean}}
 */
export const parseAnalysisJson = (raw) => {
  if (!raw) throw new Error('빈 응답');
  const candidate = recoverTruncatedJson(raw);
  if (!candidate) {
    const err = new Error('응답에서 JSON을 추출하지 못했습니다');
    err.diagnostic = raw.slice(0, ERR_DIAG_FULL_LEN);
    throw err;
  }

  // 1차 시도
  try { return { data: JSON.parse(candidate), recovered: false }; } catch (e1) {
    // 2차 시도: 후행 콤마 제거
    let repaired = candidate.replace(/,(\s*[}\]])/g, '$1');
    try { return { data: JSON.parse(repaired), recovered: true }; } catch (e2) {
      // 3차 시도: 스마트 따옴표 정규화
      repaired = repaired
        .replace(/[\u201C\u201D]/g, '"')
        .replace(/[\u2018\u2019]/g, "'");
      try { return { data: JSON.parse(repaired), recovered: true }; } catch (e3) {
        const err = new Error(`JSON 파싱 실패: ${e1.message.slice(0, ERR_DIAG_MSG_LEN)}`);
        err.diagnostic = candidate.slice(0, ERR_DIAG_FULL_LEN);
        throw err;
      }
    }
  }
};
