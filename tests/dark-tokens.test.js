// 다크모드 토큰 회귀 가드
// 데이터로 관리되는 색 토큰(의미색 뱃지·기재요령 심각도·차트 팔레트)에
// dark: 변형이 빠지지 않았는지 검증한다. 다크모드 정합성 작업이 되돌아가는 것을 방지.

import { describe, test, expect } from 'vitest';
import { QUALITY_LEVELS, STATUS_COLORS, SPECIFICITY_COLORS, scoreColorOf } from '../src/data/colors.js';
import { SEVERITY_META } from '../src/lib/compliance.js';
import { CHART_COLORS, chartColors } from '../src/data/dark-palette.js';

// 클래스 문자열에 dark: 변형이 포함되어 있는가
const hasDark = (s) => typeof s === 'string' && /(^|\s)dark:/.test(s);

describe('colors.js — bg/text/border에 dark: 변형', () => {
  test('QUALITY_LEVELS 5단계 모두', () => {
    expect(QUALITY_LEVELS).toHaveLength(5);
    for (const q of QUALITY_LEVELS) {
      expect(hasDark(q.bg)).toBe(true);
      expect(hasDark(q.text)).toBe(true);
      expect(hasDark(q.border)).toBe(true);
    }
  });

  test('STATUS_COLORS / SPECIFICITY_COLORS', () => {
    for (const v of Object.values(STATUS_COLORS)) {
      expect(hasDark(v.bg)).toBe(true);
      expect(hasDark(v.text)).toBe(true);
      expect(hasDark(v.border)).toBe(true);
    }
    for (const v of Object.values(SPECIFICITY_COLORS)) {
      expect(hasDark(v.bg)).toBe(true);
      expect(hasDark(v.text)).toBe(true);
      expect(hasDark(v.border)).toBe(true);
    }
  });

  test('scoreColorOf 모든 구간', () => {
    for (const s of [90, 70, 55, 40, 10]) {
      const c = scoreColorOf(s);
      expect(hasDark(c.bg)).toBe(true);
      expect(hasDark(c.text)).toBe(true);
      expect(hasDark(c.border)).toBe(true);
    }
  });
});

describe('compliance SEVERITY_META — dark: 변형', () => {
  test('bg/text/border/highlight 모두', () => {
    const keys = Object.keys(SEVERITY_META);
    expect(keys).toEqual(expect.arrayContaining(['critical', 'high', 'warning']));
    for (const v of Object.values(SEVERITY_META)) {
      expect(hasDark(v.bg)).toBe(true);
      expect(hasDark(v.text)).toBe(true);
      expect(hasDark(v.border)).toBe(true);
      expect(hasDark(v.highlight)).toBe(true);
    }
  });
});

describe('dark-palette — 차트 색 분기', () => {
  test('chartColors(isDark)가 올바른 묶음 반환', () => {
    expect(chartColors(true)).toBe(CHART_COLORS.dark);
    expect(chartColors(false)).toBe(CHART_COLORS.light);
  });

  test('라이트·다크 모두 필수 키가 hex 값', () => {
    for (const palette of [CHART_COLORS.light, CHART_COLORS.dark]) {
      for (const k of ['grid', 'axisText', 'tickText', 'track']) {
        expect(palette[k]).toMatch(/^#[0-9a-fA-F]{6}$/);
      }
    }
  });
});
