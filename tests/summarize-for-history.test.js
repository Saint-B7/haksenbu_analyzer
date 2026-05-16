// summarizeForHistory 단위 테스트
// 분석 결과 객체에서 히스토리 저장용 요약만 안전하게 추출하는지 확인.
// 입력에 일부 필드가 빠져도 깨지지 않아야 한다(LLM 응답 변동 대비).

import { describe, test, expect } from 'vitest';
import { summarizeForHistory } from '../src/lib/idb.js';

const minimalResult = {
  overallScore: 75,
  satisfiedCount: 4,
  topTierMetCount: 3,
  researchDepth: { score: 5 },
  multiPerspectiveEvaluation: { consensus: { averageScore: 70 } },
  rewrittenVersion: '대안 문장 본문 ...',
  dnaChecklist: [
    { id: 1, name: '질문', qualityScore: 80, satisfied: true },
    { id: 2, name: '근거', qualityScore: 30, satisfied: false },
    { id: 3, name: '과정', satisfied: true },   // qualityScore 누락 → fallback
    { id: 4, name: '확장', satisfied: false },  // qualityScore 누락 → fallback
  ],
};

const violations = {
  matches: [{}, {}, {}],  // 3건
  summary: { critical: 1, high: 1, warning: 1 },
};

describe('summarizeForHistory — 정상 입력', () => {
  test('모든 필드가 있는 경우 그대로 추출', () => {
    const s = summarizeForHistory(minimalResult, violations);
    expect(s.overallScore).toBe(75);
    expect(s.satisfiedCount).toBe(4);
    expect(s.topTierMetCount).toBe(3);
    expect(s.researchDepth).toBe(5);
    expect(s.multiPerspectiveAvg).toBe(70);
    expect(s.rewrittenLength).toBe('대안 문장 본문 ...'.length);
    expect(s.complianceViolations).toBe(3);
    expect(s.complianceCritical).toBe(1);
  });
  test('dnaScores: qualityScore 있으면 그대로, 없으면 fallback(75/25)', () => {
    const s = summarizeForHistory(minimalResult, violations);
    expect(s.dnaScores).toHaveLength(4);
    expect(s.dnaScores[0]).toEqual({ id: 1, name: '질문', score: 80 });
    expect(s.dnaScores[1]).toEqual({ id: 2, name: '근거', score: 30 });
    // qualityScore 누락 + satisfied=true → 75
    expect(s.dnaScores[2]).toEqual({ id: 3, name: '과정', score: 75 });
    // qualityScore 누락 + satisfied=false → 25
    expect(s.dnaScores[3]).toEqual({ id: 4, name: '확장', score: 25 });
  });
});

describe('summarizeForHistory — 결측 필드 안전 처리', () => {
  test('result 자체가 undefined', () => {
    const s = summarizeForHistory(undefined, undefined);
    expect(s.overallScore).toBeUndefined();
    expect(s.satisfiedCount).toBeUndefined();
    expect(s.dnaScores).toEqual([]);
    expect(s.rewrittenLength).toBe(0);
    expect(s.complianceViolations).toBe(0);
    expect(s.complianceCritical).toBe(0);
  });
  test('result는 있지만 dnaChecklist 없음', () => {
    const r = { overallScore: 60 };
    const s = summarizeForHistory(r, undefined);
    expect(s.overallScore).toBe(60);
    expect(s.dnaScores).toEqual([]);
  });
  test('result는 있지만 rewrittenVersion 없음 → length 0', () => {
    const r = { overallScore: 60 };
    const s = summarizeForHistory(r, undefined);
    expect(s.rewrittenLength).toBe(0);
  });
  test('researchDepth 객체는 있지만 score 없음', () => {
    const r = { researchDepth: {} };
    const s = summarizeForHistory(r, undefined);
    expect(s.researchDepth).toBeUndefined();
  });
  test('multiPerspectiveEvaluation.consensus 누락', () => {
    const r = { multiPerspectiveEvaluation: {} };
    const s = summarizeForHistory(r, undefined);
    expect(s.multiPerspectiveAvg).toBeUndefined();
  });
});

describe('summarizeForHistory — violations 변형', () => {
  test('violations 자체가 undefined → 0/0', () => {
    const s = summarizeForHistory(minimalResult, undefined);
    expect(s.complianceViolations).toBe(0);
    expect(s.complianceCritical).toBe(0);
  });
  test('violations.matches는 있고 summary는 없음', () => {
    const v = { matches: [{}, {}] };
    const s = summarizeForHistory(minimalResult, v);
    expect(s.complianceViolations).toBe(2);
    expect(s.complianceCritical).toBe(0);
  });
});
