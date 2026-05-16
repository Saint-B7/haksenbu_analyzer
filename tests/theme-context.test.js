// @vitest-environment jsdom
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { resolveInitialTheme, getSystemPrefersDark } from '../src/contexts/ThemeContext.jsx';

// matchMedia는 jsdom에 기본 구현 없음 — 테스트마다 직접 모킹
function mockMatchMedia(prefersDark) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: query === '(prefers-color-scheme: dark)' ? prefersDark : false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

describe('resolveInitialTheme — 저장값 우선', () => {
  test("저장값 'dark' → 'dark' 반환", () => {
    expect(resolveInitialTheme('dark', false)).toBe('dark');
  });

  test("저장값 'light' → 'light' 반환 (시스템이 dark여도)", () => {
    expect(resolveInitialTheme('light', true)).toBe('light');
  });

  test('저장값 없음(null) + 시스템 dark → dark 반환', () => {
    expect(resolveInitialTheme(null, true)).toBe('dark');
  });

  test('저장값 없음(null) + 시스템 light → light 반환', () => {
    expect(resolveInitialTheme(null, false)).toBe('light');
  });

  test("저장값이 유효하지 않은 문자열 → 시스템 감지로 폴백", () => {
    expect(resolveInitialTheme('invalid', true)).toBe('dark');
    expect(resolveInitialTheme('invalid', false)).toBe('light');
  });
});

describe('getSystemPrefersDark — 시스템 감지', () => {
  beforeEach(() => {
    // 각 테스트 전 matchMedia 초기화
    Object.defineProperty(window, 'matchMedia', { writable: true, value: undefined });
  });

  test('matchMedia 없는 환경 → false 반환', () => {
    expect(getSystemPrefersDark()).toBe(false);
  });

  test('시스템 다크 모드 → true 반환', () => {
    mockMatchMedia(true);
    expect(getSystemPrefersDark()).toBe(true);
  });

  test('시스템 라이트 모드 → false 반환', () => {
    mockMatchMedia(false);
    expect(getSystemPrefersDark()).toBe(false);
  });
});
