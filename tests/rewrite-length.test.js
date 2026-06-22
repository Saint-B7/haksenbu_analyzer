// 대안 문장 목표 글자수 — 프롬프트 주입 + 옵션 상수 회귀 테스트
// 선택값에 따라 buildCorePrompt가 올바른 분량 지시를 넣는지,
// 'best'(기본)는 기존 동작(1470~1500바이트)을 그대로 유지하는지 검증.

import { describe, test, expect } from 'vitest';
import { buildCorePrompt } from '../src/prompts/core.js';
import { REWRITE_LENGTH_OPTIONS, REWRITE_LENGTH_RANGES } from '../src/data/constants.js';

const build = (len) => buildCorePrompt('세특', '3학년', '임상약사', '약학과', len);

describe('REWRITE_LENGTH 옵션·범위 상수', () => {
  test('옵션 4종 + 기본값 best가 마지막', () => {
    expect(REWRITE_LENGTH_OPTIONS.map((o) => o.value)).toEqual(['300', '400', '500', 'best']);
  });
  test('글자수 범위가 사양대로', () => {
    expect(REWRITE_LENGTH_RANGES['300']).toEqual([250, 350]);
    expect(REWRITE_LENGTH_RANGES['400']).toEqual([350, 450]);
    expect(REWRITE_LENGTH_RANGES['500']).toEqual([450, 500]);
    expect(REWRITE_LENGTH_RANGES['best']).toBeUndefined(); // best는 글자수 범위 없음
  });
});

describe('buildCorePrompt — 글자수 지시 주입', () => {
  test("'300' → 250~350자 지시 포함", () => {
    const p = build('300');
    expect(p).toContain('250~350자');
    expect(p).not.toContain('1470~1500바이트 사이'); // best 전용 문구는 없어야
  });

  test("'400' → 350~450자 지시 포함", () => {
    expect(build('400')).toContain('350~450자');
  });

  test("'500' → 450~500자 + NEIS 1500바이트 한도 언급", () => {
    const p = build('500');
    expect(p).toContain('450~500자');
    expect(p).toContain('1500바이트');
  });

  test("'best'(기본) → 기존 1470~1500바이트 지시 유지", () => {
    const p = build('best');
    expect(p).toContain('1470~1500바이트');
    expect(p).toContain('NEIS 권장 1470~1500바이트(한글 약 490~500자)');
  });

  test('인자 생략 시 best와 동일(무해한 기본값)', () => {
    expect(buildCorePrompt('세특', '3학년', '', '')).toContain('1470~1500바이트');
  });

  test('글자수 지시는 대안 문장 외 분석 기준을 바꾸지 않음', () => {
    // 7가지 DNA·6단계 서사 등 핵심 골격 문구는 모든 선택값에서 동일하게 존재
    for (const len of ['300', '400', '500', 'best']) {
      const p = build(len);
      expect(p).toContain('7가지 DNA');
      expect(p).toContain('6단계 서사');
      expect(p).toContain('명사형 종결');
    }
  });
});
