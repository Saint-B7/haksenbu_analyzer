// humanizeError 단위 테스트
// 기술적 오류 메시지를 원인별 한국어 안내로 매핑하는 로직의 회귀 방지.
// (네트워크·크레딧 부족·키 문제·요청 한도·과부하 안내가 올바른 우선순위로 매칭되는지)

import { describe, test, expect } from 'vitest';
import { humanizeError } from '../src/lib/api.js';

describe('humanizeError — 원인별 안내 매핑', () => {
  test('빈 메시지 → 알 수 없는 오류', () => {
    expect(humanizeError('')).toBe('알 수 없는 오류');
    expect(humanizeError(null)).toBe('알 수 없는 오류');
  });

  test('네트워크 오류', () => {
    expect(humanizeError('Failed to fetch')).toMatch(/네트워크/);
    expect(humanizeError('NetworkError when attempting')).toMatch(/네트워크/);
  });

  test('크레딧 부족 (402 / insufficient)', () => {
    expect(humanizeError('OpenRouter API 오류 (402)')).toMatch(/크레딧 부족/);
    expect(humanizeError('insufficient credits')).toMatch(/크레딧 부족/);
  });

  test('API 키 문제 (401 / 403)', () => {
    expect(humanizeError('HTTP 401')).toMatch(/API 키/);
    expect(humanizeError('403 Forbidden')).toMatch(/API 키/);
  });

  test('요청 한도 초과 (429)', () => {
    expect(humanizeError('429 Too Many Requests')).toMatch(/한도/);
    expect(humanizeError('rate limit exceeded')).toMatch(/한도/);
  });

  test('서버 과부하 (529)', () => {
    expect(humanizeError('529 overloaded')).toMatch(/과부하/);
  });

  test('응답 형식 오류', () => {
    expect(humanizeError('Invalid response format')).toMatch(/응답 형식/);
  });

  test('매칭되지 않으면 원문 유지', () => {
    expect(humanizeError('알 수 없는 특이 오류 xyz')).toBe('알 수 없는 특이 오류 xyz');
  });
});
