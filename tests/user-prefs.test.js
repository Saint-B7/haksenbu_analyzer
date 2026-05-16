import { describe, test, expect, beforeEach } from 'vitest';
import { getPrefs, savePrefs, PREF_DEFAULTS } from '../src/lib/user-prefs.js';

class MockStorage {
  constructor() { this._data = {}; }
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; }
  setItem(k, v) { this._data[k] = String(v); }
}

describe('getPrefs', () => {
  let s;
  beforeEach(() => { s = new MockStorage(); });

  test('빈 스토리지 → 기본값 반환', () => {
    expect(getPrefs(s)).toEqual(PREF_DEFAULTS);
  });

  test('null 스토리지 → 기본값 반환', () => {
    expect(getPrefs(null)).toEqual(PREF_DEFAULTS);
  });

  test('저장된 학년 반환', () => {
    s.setItem('haksenbu.grade', '1학년');
    expect(getPrefs(s).grade).toBe('1학년');
  });

  test('저장된 항목 반환', () => {
    s.setItem('haksenbu.activityType', '동아리');
    expect(getPrefs(s).activityType).toBe('동아리');
  });

  test('학년만 저장됐을 때 항목은 기본값', () => {
    s.setItem('haksenbu.grade', '2학년');
    expect(getPrefs(s).activityType).toBe(PREF_DEFAULTS.activityType);
  });
});

describe('savePrefs', () => {
  let s;
  beforeEach(() => { s = new MockStorage(); });

  test('저장 후 동일 값 조회', () => {
    savePrefs({ grade: '1학년', activityType: '동아리' }, s);
    expect(getPrefs(s)).toEqual({ grade: '1학년', activityType: '동아리' });
  });

  test('덮어쓰기 — 마지막 값이 남음', () => {
    savePrefs({ grade: '1학년', activityType: '세특' }, s);
    savePrefs({ grade: '3학년', activityType: '행특' }, s);
    expect(getPrefs(s)).toEqual({ grade: '3학년', activityType: '행특' });
  });

  test('null 스토리지 → 오류 없이 종료', () => {
    expect(() => savePrefs({ grade: '2학년', activityType: '자율' }, null)).not.toThrow();
  });
});
