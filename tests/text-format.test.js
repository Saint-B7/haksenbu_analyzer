// stripBoldMarkup 단위 테스트
// AI 응답의 **굵게** 마크업과 떠도는 별표를 평문으로 정리하는 헬퍼.

import { describe, test, expect } from 'vitest';
import { stripBoldMarkup } from '../src/lib/text-format.js';

describe('stripBoldMarkup — null/undefined 안전', () => {
  test('null → 빈 문자열', () => {
    expect(stripBoldMarkup(null)).toBe('');
  });
  test('undefined → 빈 문자열', () => {
    expect(stripBoldMarkup(undefined)).toBe('');
  });
  test('빈 문자열 → 빈 문자열', () => {
    expect(stripBoldMarkup('')).toBe('');
  });
  test('숫자도 문자열로 변환되어 처리', () => {
    expect(stripBoldMarkup(42)).toBe('42');
  });
});

describe('stripBoldMarkup — 정상 마크업 제거', () => {
  test('단일 **굵게**', () => {
    expect(stripBoldMarkup('**중요**')).toBe('중요');
  });
  test('문장 안 **굵게**', () => {
    expect(stripBoldMarkup('이것은 **중요한** 부분')).toBe('이것은 중요한 부분');
  });
  test('여러 개의 **굵게**', () => {
    expect(stripBoldMarkup('**A** 그리고 **B**')).toBe('A 그리고 B');
  });
});

describe('stripBoldMarkup — 떠도는 별표', () => {
  test('단일 별표 *', () => {
    expect(stripBoldMarkup('a*b')).toBe('ab');
  });
  test('연속 별표 ***', () => {
    expect(stripBoldMarkup('a***b')).toBe('ab');
  });
  test('짝이 안 맞는 **', () => {
    // **A 같은 깨진 마크업도 별표 모두 제거
    expect(stripBoldMarkup('**A')).toBe('A');
  });
});

describe('stripBoldMarkup — 별표 없는 입력 무변경', () => {
  test('일반 한국어', () => {
    expect(stripBoldMarkup('안녕하세요')).toBe('안녕하세요');
  });
  test('숫자·기호 포함', () => {
    expect(stripBoldMarkup('점수: 85점 (완벽)')).toBe('점수: 85점 (완벽)');
  });
});
