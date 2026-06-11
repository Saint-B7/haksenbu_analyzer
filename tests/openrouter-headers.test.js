// buildOpenRouterHeaders 단위 테스트
// 회귀 방지: 헤더 값에 한글 등 코드포인트 > 255 문자가 들어가면 fetch가
// "Cannot convert argument to a ByteString" 오류를 던진다.
// 모든 헤더 값이 ASCII(0~255)인지, 키의 보이지 않는 비ASCII 공백류가 제거되는지 검증.

import { describe, test, expect } from 'vitest';
import { buildOpenRouterHeaders } from '../electron/api-bridge.js';

// 문자열의 모든 문자가 ByteString 안전(코드포인트 <= 255)인지 확인
const isByteStringSafe = (s) => [...s].every((ch) => ch.charCodeAt(0) <= 255);

describe('buildOpenRouterHeaders — ASCII 보장', () => {
  test('모든 헤더 값이 ByteString 안전(<=255)', () => {
    const headers = buildOpenRouterHeaders('sk-or-v1-abcdef');
    for (const value of Object.values(headers)) {
      expect(isByteStringSafe(value)).toBe(true);
    }
  });

  test('X-Title은 한글이 아닌 ASCII 영문 식별자', () => {
    const headers = buildOpenRouterHeaders('sk-or-v1-abcdef');
    expect(headers['X-Title']).toBe('Haksenbu Analyzer');
    expect(isByteStringSafe(headers['X-Title'])).toBe(true);
  });

  test('HTTP-Referer는 ASCII URL', () => {
    const headers = buildOpenRouterHeaders('sk-or-v1-abcdef');
    expect(isByteStringSafe(headers['HTTP-Referer'])).toBe(true);
  });
});

describe('buildOpenRouterHeaders — 키 정제', () => {
  test('정상 키는 Bearer 접두사와 함께 그대로 전달', () => {
    const headers = buildOpenRouterHeaders('sk-or-v1-abcdef');
    expect(headers['Authorization']).toBe('Bearer sk-or-v1-abcdef');
  });

  test('앞뒤 일반 공백은 trim', () => {
    const headers = buildOpenRouterHeaders('  sk-or-v1-abcdef  ');
    expect(headers['Authorization']).toBe('Bearer sk-or-v1-abcdef');
  });

  test('보이지 않는 비ASCII 공백류(제로폭·NBSP·전각공백) 제거', () => {
    // ​ 제로폭,   NBSP, 　 전각공백, ﻿ 제로폭 NBSP
    const dirty = '﻿sk-or​-v1 -abc　def';
    const headers = buildOpenRouterHeaders(dirty);
    expect(headers['Authorization']).toBe('Bearer sk-or-v1-abcdef');
    expect(isByteStringSafe(headers['Authorization'])).toBe(true);
  });

  test('null/undefined 키도 오류 없이 처리', () => {
    expect(buildOpenRouterHeaders(undefined)['Authorization']).toBe('Bearer ');
    expect(buildOpenRouterHeaders(null)['Authorization']).toBe('Bearer ');
  });
});
