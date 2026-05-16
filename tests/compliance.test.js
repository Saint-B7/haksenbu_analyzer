// detectComplianceViolations 단위 테스트
// 학생부 기재요령 위반 룰셋 11개에 대한 false positive / false negative 회귀 방지.
//
// 룰셋이 너무 느슨하면 위반이 누락되고(FN), 너무 엄격하면 정상 표현도 잡아내(FP) 교사가 매번 무시해야 한다.
// 각 카테고리마다 "위반 케이스"와 "비슷하지만 정상인 케이스"를 함께 두어 양쪽을 모두 검증.

import { describe, test, expect } from 'vitest';
import {
  detectComplianceViolations,
  COMPLIANCE_RULES,
  SEVERITY_META,
} from '../src/lib/compliance.js';

describe('detectComplianceViolations — 빈 입력', () => {
  test('빈 문자열 → 0건', () => {
    const r = detectComplianceViolations('');
    expect(r.matches).toEqual([]);
    expect(r.summary).toEqual({ critical: 0, high: 0, warning: 0 });
  });
  test('null/undefined 안전', () => {
    expect(detectComplianceViolations(null).matches).toEqual([]);
    expect(detectComplianceViolations(undefined).matches).toEqual([]);
  });
  test('숫자 입력 → 0건(타입 가드)', () => {
    expect(detectComplianceViolations(123).matches).toEqual([]);
  });
});

describe('detectComplianceViolations — 정상 본문(false positive 방지)', () => {
  test('전형적인 학생부 문장은 위반 0건', () => {
    const text = '문제의식을 갖고 자료를 조사하여 발표함. 후속 탐구로 연결하는 모습을 보임.';
    expect(detectComplianceViolations(text).matches.length).toBe(0);
  });
  test('"학습 활동" 같은 일반 표현은 위반 아님', () => {
    expect(detectComplianceViolations('영어 학습 활동에 적극 참여함').matches.length).toBe(0);
  });
  test('"논문 읽기"는 위반 아님 (논문 게재가 아님)', () => {
    // 학생이 논문을 읽는 것은 OK. 논문 게재·발표만 금지.
    expect(detectComplianceViolations('관련 논문을 찾아 읽음').matches.length).toBe(0);
  });
});

describe('detectComplianceViolations — 외부 수상·대회', () => {
  test('"수학 경시대회 1등" 위반 검출', () => {
    const r = detectComplianceViolations('수학 경시대회에서 1등을 차지함');
    expect(r.matches.length).toBeGreaterThanOrEqual(1);
    expect(r.matches.some((m) => m.category === '외부 수상·대회')).toBe(true);
    expect(r.summary.critical).toBeGreaterThanOrEqual(1);
  });
  test('"우수상을 받음" 위반 검출', () => {
    const r = detectComplianceViolations('과학 발표에서 우수상을 받음');
    expect(r.matches.some((m) => m.category === '외부 수상·대회')).toBe(true);
  });
});

describe('detectComplianceViolations — 공인 어학·자격증', () => {
  test('TOEIC 점수 위반', () => {
    const r = detectComplianceViolations('TOEIC 900점 취득');
    expect(r.matches.some((m) => m.category === '공인 어학·자격증')).toBe(true);
    expect(r.summary.critical).toBeGreaterThanOrEqual(1);
  });
  test('"토익" 한글 표기도 검출', () => {
    const r = detectComplianceViolations('토익 850점');
    expect(r.matches.some((m) => m.category === '공인 어학·자격증')).toBe(true);
  });
  test('"정보처리기능사 자격증" 위반', () => {
    const r = detectComplianceViolations('정보처리기능사 자격증을 취득함');
    expect(r.matches.some((m) => m.category === '공인 어학·자격증')).toBe(true);
  });
});

describe('detectComplianceViolations — 부모·가족 정보', () => {
  test('"아버지께서 한국회사에서 근무" 위반(한글 회사명 — 룰셋이 잡는 형태)', () => {
    // 주의: 현행 룰셋은 [가-힣]{2,8}회사 형태만 검출하므로 "IT회사"는 못 잡힘.
    //      이 false negative 한계는 룰셋 별도 강화로만 해결 가능(현재 범위 밖).
    const r = detectComplianceViolations('아버지께서 한국회사에서 근무');
    expect(r.matches.some((m) => m.category === '부모·가족 정보')).toBe(true);
  });
  test('"어머니께서 ○○병원에 다니심" 위반', () => {
    const r = detectComplianceViolations('어머니께서 서울병원에 다니심');
    expect(r.matches.some((m) => m.category === '부모·가족 정보')).toBe(true);
  });
  test('"가정 형편" 위반(high severity)', () => {
    const r = detectComplianceViolations('어려운 가정 형편에도 불구하고');
    expect(r.matches.some((m) => m.category === '부모·가족 정보')).toBe(true);
    expect(r.summary.high).toBeGreaterThanOrEqual(1);
  });
});

describe('detectComplianceViolations — 사교육·학원', () => {
  test('"○○학원" 위반 검출', () => {
    const r = detectComplianceViolations('수학마스터학원에서 배운 내용');
    expect(r.matches.some((m) => m.category === '사교육·학원')).toBe(true);
  });
  test('"인강 수강" 위반', () => {
    const r = detectComplianceViolations('인강 수강을 통해 학습함');
    expect(r.matches.some((m) => m.category === '사교육·학원')).toBe(true);
  });
});

describe('detectComplianceViolations — 논문·발명·특허', () => {
  test('"논문 게재" 위반', () => {
    const r = detectComplianceViolations('국제 학술지에 논문 게재');
    expect(r.matches.some((m) => m.category === '논문·발명·특허')).toBe(true);
  });
  test('"특허 출원" 위반', () => {
    const r = detectComplianceViolations('아이디어를 정리해 특허 출원함');
    expect(r.matches.some((m) => m.category === '논문·발명·특허')).toBe(true);
  });
});

describe('detectComplianceViolations — 외부 기관 활동', () => {
  test('"대학 연구실 방문" 위반(warning)', () => {
    const r = detectComplianceViolations('서울대학교 연구실 방문 체험');
    expect(r.matches.some((m) => m.category === '외부 기관 활동')).toBe(true);
    expect(r.summary.warning).toBeGreaterThanOrEqual(1);
  });
  test('"해외 봉사" 위반', () => {
    const r = detectComplianceViolations('해외 봉사 활동에 참여');
    expect(r.matches.some((m) => m.category === '외부 기관 활동')).toBe(true);
  });
});

describe('detectComplianceViolations — 석차·점수', () => {
  test('"전교 1등" 위반(high)', () => {
    const r = detectComplianceViolations('전교 1등을 유지함');
    expect(r.matches.some((m) => m.category === '석차·점수')).toBe(true);
    expect(r.summary.high).toBeGreaterThanOrEqual(1);
  });
  test('"상위 5%" 위반', () => {
    const r = detectComplianceViolations('전국 상위 5%의 성적을 거둠');
    expect(r.matches.some((m) => m.category === '석차·점수')).toBe(true);
  });
  test('"노력하여 성장함"은 위반 아님(false positive 방지)', () => {
    const r = detectComplianceViolations('꾸준히 노력하여 성장함');
    expect(r.matches.length).toBe(0);
  });
});

describe('detectComplianceViolations — 결과 정합성', () => {
  test('matches는 index 오름차순 정렬', () => {
    const text = '전교 1등을 유지하고 TOEIC 900점을 취득함. 어머니께서 회사에서 근무.';
    const r = detectComplianceViolations(text);
    for (let i = 1; i < r.matches.length; i++) {
      expect(r.matches[i].index).toBeGreaterThanOrEqual(r.matches[i - 1].index);
    }
  });
  test('summary 합계 = matches.length', () => {
    const text = 'TOEIC 900점, 전교 1등, 우수상을 받음.';
    const r = detectComplianceViolations(text);
    const total = r.summary.critical + r.summary.high + r.summary.warning;
    expect(total).toBe(r.matches.length);
  });
  test('각 match는 ruleId, category, severity, hint, excerpt, index를 모두 포함', () => {
    const r = detectComplianceViolations('TOEIC 900점');
    expect(r.matches.length).toBeGreaterThan(0);
    const m = r.matches[0];
    expect(m).toHaveProperty('ruleId');
    expect(m).toHaveProperty('category');
    expect(m).toHaveProperty('severity');
    expect(m).toHaveProperty('hint');
    expect(m).toHaveProperty('excerpt');
    expect(m).toHaveProperty('index');
    expect(typeof m.index).toBe('number');
  });
});

describe('SEVERITY_META — 메타데이터 일관성', () => {
  test('critical/high/warning 모두 정의', () => {
    expect(SEVERITY_META).toHaveProperty('critical');
    expect(SEVERITY_META).toHaveProperty('high');
    expect(SEVERITY_META).toHaveProperty('warning');
  });
  test('모든 룰의 severity가 SEVERITY_META에 정의되어 있음', () => {
    for (const rule of COMPLIANCE_RULES) {
      expect(SEVERITY_META).toHaveProperty(rule.severity);
    }
  });
});
