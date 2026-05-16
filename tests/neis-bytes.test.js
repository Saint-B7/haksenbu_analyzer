// calcNeisBytes 단위 테스트
// NEIS 시스템의 한글 3바이트 / ASCII 1바이트 규칙을 정확히 따르는지 검증한다.
//
// 주의: NEIS 카운트는 코드포인트 기준 (서로게이트 페어 안전 분해 후 1자씩 처리)이므로
// 이모지·BMP 외 문자도 안전하게 처리되어야 한다.

import { describe, test, expect } from 'vitest';
import {
  calcNeisBytes,
  NEIS_BYTE_LIMIT,
  NEIS_BYTE_REWRITE_MIN,
} from '../src/lib/neis-bytes.js';

describe('calcNeisBytes — 빈 입력', () => {
  test('빈 문자열 → 0', () => {
    expect(calcNeisBytes('')).toBe(0);
  });
  test('null → 0', () => {
    expect(calcNeisBytes(null)).toBe(0);
  });
  test('undefined → 0', () => {
    expect(calcNeisBytes(undefined)).toBe(0);
  });
});

describe('calcNeisBytes — 단일 종류 문자', () => {
  test('영문 1글자 = 1바이트', () => {
    expect(calcNeisBytes('a')).toBe(1);
  });
  test('영문 5글자 = 5바이트', () => {
    expect(calcNeisBytes('hello')).toBe(5);
  });
  test('한글 1글자 = 3바이트', () => {
    expect(calcNeisBytes('가')).toBe(3);
  });
  test('한글 3글자 = 9바이트', () => {
    expect(calcNeisBytes('학생부')).toBe(9);
  });
  test('숫자 1글자 = 1바이트', () => {
    expect(calcNeisBytes('5')).toBe(1);
  });
  test('공백 1자 = 1바이트', () => {
    expect(calcNeisBytes(' ')).toBe(1);
  });
  test('줄바꿈 1자 = 1바이트', () => {
    expect(calcNeisBytes('\n')).toBe(1);
  });
});

describe('calcNeisBytes — 혼합 입력', () => {
  test('한글 + 영문', () => {
    // "가a" = 3 + 1 = 4
    expect(calcNeisBytes('가a')).toBe(4);
  });
  test('한 문장(공백 포함)', () => {
    // "학생 1명" = 학(3) + 생(3) + 공백(1) + 1(1) + 명(3) = 11
    expect(calcNeisBytes('학생 1명')).toBe(11);
  });
  test('마침표·쉼표는 ASCII 1바이트', () => {
    expect(calcNeisBytes('a,b.')).toBe(4);
  });
});

describe('calcNeisBytes — 경계 케이스', () => {
  test('NEIS_BYTE_LIMIT 자체는 1500', () => {
    expect(NEIS_BYTE_LIMIT).toBe(1500);
  });
  test('NEIS_BYTE_REWRITE_MIN 자체는 1470', () => {
    expect(NEIS_BYTE_REWRITE_MIN).toBe(1470);
  });
  test('한글 500자 = 1500바이트 (NEIS 한도)', () => {
    expect(calcNeisBytes('가'.repeat(500))).toBe(1500);
  });
  test('이모지(서로게이트 페어)도 3바이트로 카운트', () => {
    // 🎓 같은 BMP 외 문자도 ASCII가 아니므로 3바이트 처리
    // (NEIS는 사실 입력 자체가 안 되지만 안전하게 처리되어야 함)
    expect(calcNeisBytes('🎓')).toBe(3);
  });
  test('확장 ASCII(0x7F 경계) 처리', () => {
    // 코드포인트 0x7F 이하 = 1바이트
    expect(calcNeisBytes('~')).toBe(1);
  });
});
