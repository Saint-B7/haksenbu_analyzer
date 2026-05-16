import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { saveDraft, loadDraft, clearDraft, createDebouncedSave } from '../src/lib/auto-save.js';

class MockStorage {
  constructor() { this._data = {}; }
  getItem(k) { return Object.prototype.hasOwnProperty.call(this._data, k) ? this._data[k] : null; }
  setItem(k, v) { this._data[k] = String(v); }
  removeItem(k) { delete this._data[k]; }
}

const DRAFT = { text: '테스트 문장', careerGoal: '의사', desiredMajor: '의예과' };

describe('saveDraft / loadDraft', () => {
  let s;
  beforeEach(() => { s = new MockStorage(); });

  test('빈 스토리지 → 기본값 반환', () => {
    expect(loadDraft(s)).toEqual({ text: '', careerGoal: '', desiredMajor: '' });
  });

  test('null 스토리지 → 기본값 반환', () => {
    expect(loadDraft(null)).toEqual({ text: '', careerGoal: '', desiredMajor: '' });
  });

  test('저장 후 동일 값 조회', () => {
    saveDraft(DRAFT, s);
    expect(loadDraft(s)).toEqual(DRAFT);
  });

  test('덮어쓰기 — 마지막 값이 남음', () => {
    saveDraft(DRAFT, s);
    saveDraft({ text: '새 문장', careerGoal: '', desiredMajor: '' }, s);
    expect(loadDraft(s).text).toBe('새 문장');
  });

  test('null 스토리지로 저장 → 오류 없이 종료', () => {
    expect(() => saveDraft(DRAFT, null)).not.toThrow();
  });
});

describe('clearDraft', () => {
  let s;
  beforeEach(() => { s = new MockStorage(); });

  test('저장 후 삭제 → 기본값 반환', () => {
    saveDraft(DRAFT, s);
    clearDraft(s);
    expect(loadDraft(s)).toEqual({ text: '', careerGoal: '', desiredMajor: '' });
  });

  test('null 스토리지 → 오류 없이 종료', () => {
    expect(() => clearDraft(null)).not.toThrow();
  });
});

describe('createDebouncedSave', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  test('delay 전에는 저장 안 됨', () => {
    const s = new MockStorage();
    const debounced = createDebouncedSave(3000);
    debounced(DRAFT, s);
    vi.advanceTimersByTime(2999);
    expect(loadDraft(s).text).toBe('');
  });

  test('delay 경과 후 저장됨', () => {
    const s = new MockStorage();
    const debounced = createDebouncedSave(3000);
    debounced(DRAFT, s);
    vi.advanceTimersByTime(3000);
    expect(loadDraft(s)).toEqual(DRAFT);
  });

  test('연속 호출 시 마지막 값만 저장', () => {
    const s = new MockStorage();
    const debounced = createDebouncedSave(3000);
    debounced({ text: '첫 번째', careerGoal: '', desiredMajor: '' }, s);
    vi.advanceTimersByTime(1000);
    debounced({ text: '두 번째', careerGoal: '', desiredMajor: '' }, s);
    vi.advanceTimersByTime(3000);
    expect(loadDraft(s).text).toBe('두 번째');
  });

  test('첫 호출 후 다시 delay가 리셋됨', () => {
    const s = new MockStorage();
    const debounced = createDebouncedSave(3000);
    debounced({ text: '첫 번째', careerGoal: '', desiredMajor: '' }, s);
    vi.advanceTimersByTime(2000);
    debounced({ text: '두 번째', careerGoal: '', desiredMajor: '' }, s);
    vi.advanceTimersByTime(2999);
    // 두 번째 호출 후 3000ms 미만 — 아직 저장 안 됨
    expect(loadDraft(s).text).toBe('');
  });
});
