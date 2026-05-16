// recoverTruncatedJson / parseAnalysisJson 단위 테스트
// LLM 응답이 max_tokens로 잘리거나 후행 콤마, 스마트 따옴표 등으로 깨졌을 때
// 복구해 JSON으로 만들어주는 로직의 회귀 방지.

import { describe, test, expect } from 'vitest';
import {
  recoverTruncatedJson,
  parseAnalysisJson,
} from '../src/lib/json-recovery.js';

describe('recoverTruncatedJson — null/빈 입력', () => {
  test('빈 문자열 → null', () => {
    expect(recoverTruncatedJson('')).toBe(null);
  });
  test('null → null', () => {
    expect(recoverTruncatedJson(null)).toBe(null);
  });
  test('JSON 시작점 { 가 없으면 null', () => {
    expect(recoverTruncatedJson('hello world')).toBe(null);
  });
});

describe('recoverTruncatedJson — 완전한 JSON', () => {
  test('단순 객체', () => {
    expect(recoverTruncatedJson('{"a":1}')).toBe('{"a":1}');
  });
  test('중첩 객체', () => {
    const json = '{"a":{"b":{"c":1}}}';
    expect(recoverTruncatedJson(json)).toBe(json);
  });
  test('배열을 포함한 객체', () => {
    const json = '{"items":[1,2,3]}';
    expect(recoverTruncatedJson(json)).toBe(json);
  });
});

describe('recoverTruncatedJson — preamble/코드펜스', () => {
  test('JSON 앞 텍스트는 잘려나감', () => {
    expect(recoverTruncatedJson('여기 결과: {"a":1}')).toBe('{"a":1}');
  });
  test('```json 코드펜스 제거', () => {
    expect(recoverTruncatedJson('```json\n{"a":1}\n```')).toBe('{"a":1}');
  });
  test('``` 코드펜스만 제거', () => {
    expect(recoverTruncatedJson('```\n{"a":1}\n```')).toBe('{"a":1}');
  });
});

describe('recoverTruncatedJson — 잘린 JSON 자동 닫기', () => {
  test('객체 중간에서 잘린 경우 닫기', () => {
    // {"a":1,"b": 에서 끊김
    const recovered = recoverTruncatedJson('{"a":1,"b":');
    // 마지막 안전 지점(콤마 1번째 뒤)까지 잘라내고 닫는다
    expect(recovered).toBe('{"a":1}');
  });
  test('배열 중간에서 잘린 경우', () => {
    const recovered = recoverTruncatedJson('{"items":[1,2,3,');
    // 마지막 안전 지점(3 뒤 콤마)까지 잘라낸 뒤 닫음
    expect(recovered).toBe('{"items":[1,2,3]}');
  });
  test('열린 문자열 안에서 잘린 경우', () => {
    // "a":"unfinished — 문자열 안에서 끊김
    const recovered = recoverTruncatedJson('{"a":"unfinished');
    // 안전 지점이 없으므로 null 반환되거나 재구성 시도
    // 현 구현은 safeEnd === -1 이면 null
    expect(recovered).toBe(null);
  });
  test('중첩 구조 잘림', () => {
    const recovered = recoverTruncatedJson('{"outer":{"inner":1,"x":');
    // outer.inner:1 까지만 보존하고 모두 닫기
    expect(recovered).toBe('{"outer":{"inner":1}}');
  });
});

describe('parseAnalysisJson — 정상 동작', () => {
  test('완전한 JSON → recovered=false', () => {
    const result = parseAnalysisJson('{"score":85}');
    expect(result.data).toEqual({ score: 85 });
    expect(result.recovered).toBe(false);
  });
  test('빈 입력 → throw', () => {
    expect(() => parseAnalysisJson('')).toThrow('빈 응답');
  });
  test('JSON 추출 실패 → throw with diagnostic', () => {
    try {
      parseAnalysisJson('이것은 JSON이 아닙니다');
      expect.fail('should have thrown');
    } catch (e) {
      expect(e.message).toMatch(/JSON을 추출하지 못했습니다/);
      expect(e.diagnostic).toBeDefined();
    }
  });
});

describe('parseAnalysisJson — 복구 동작', () => {
  test('후행 콤마 복구 → recovered=true', () => {
    // {"a":1,} 같은 후행 콤마는 1차 실패 후 2차 시도에서 복구
    const result = parseAnalysisJson('{"a":1,}');
    expect(result.data).toEqual({ a: 1 });
    expect(result.recovered).toBe(true);
  });
  test('스마트 따옴표 복구', () => {
    // 좌·우 큰따옴표(\u201C, \u201D) → 일반 큰따옴표
    const smart = '{\u201Ca\u201D:1}';
    const result = parseAnalysisJson(smart);
    expect(result.data).toEqual({ a: 1 });
    expect(result.recovered).toBe(true);
  });
  test('잘린 응답을 코드펜스+잘림 복구로 처리(데이터 정확성만 검증)', () => {
    // 주의: recovered 플래그는 "JSON.parse 1차 실패 후 후행 콤마/스마트 따옴표 복구"만을
    //      의미하므로, recoverTruncatedJson 단계의 잘림 정리만 일어난 경우에는 false가 됨.
    //      여기서는 잘려도 데이터가 올바르게 복원되는지(가장 중요한 회귀 방지)에 집중.
    const result = parseAnalysisJson('```json\n{"a":1,"b":2,');
    expect(result.data).toEqual({ a: 1, b: 2 });
  });
});
