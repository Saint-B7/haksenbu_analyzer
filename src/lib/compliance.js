// 학생부 기재요령 위반 자동 검출 룰셋 (한국 교육부 학교생활기록부 기재요령 기준)
// 정규식 기반으로 본문에서 위반 표현을 추출하고 카테고리·심각도·이유를 함께 반환한다.

/**
 * 룰 정의: 각 룰은 정규식과 메타데이터를 가짐
 * - severity: 'critical'(절대 금지) | 'high'(주의) | 'warning'(검토 필요)
 * - category: 카테고리 라벨
 * - hint: 어떻게 수정할지 안내
 */
export const COMPLIANCE_RULES = [
  // 1) 외부 수상·대회·경시
  {
    id: 'award-external',
    category: '외부 수상·대회',
    severity: 'critical',
    pattern: /(?:[가-힣A-Za-z\s]{2,15}?(?:대회|경시|올림피아드|콘테스트|챌린지|페스티벌))(?:에서)?\s*(?:[12345]등|금상|은상|동상|대상|최우수상|우수상|장려상|입상|수상|입선)/g,
    hint: '학교 교육과정 외 대회 수상은 기재 금지. 대신 활동 과정·산출물·학습 내용으로 서술',
  },
  {
    id: 'award-prize',
    category: '외부 수상·대회',
    severity: 'critical',
    pattern: /(?:금상|은상|동상|대상|최우수상|우수상|장려상)을?\s*(?:받|수상|획득|차지)/g,
    hint: '수상 사실은 기재 금지. 활동을 준비·참여한 과정과 배운 점만 서술',
  },

  // 2) 공인 어학·자격 시험
  {
    id: 'cert-language',
    category: '공인 어학·자격증',
    severity: 'critical',
    pattern: /(?:TOEIC|TOEFL|TEPS|토익|토플|텝스|HSK|JLPT|JPT|OPIc|아이엘츠|IELTS|DELE|DELF)\s*(?:점수|등급|급|레벨)?\s*(?:\d{2,4}점?|\d{1,2}급)?/gi,
    hint: '공인 어학 시험 명칭·점수 기재 금지. 영어/외국어 학습 활동 자체만 서술',
  },
  {
    id: 'cert-license',
    category: '공인 어학·자격증',
    severity: 'critical',
    pattern: /(?:정보처리(?:기능|기사|산업기사)|컴활|컴퓨터활용능력|MOS|ITQ|한자능력|한국사능력|기능사|산업기사|기사|기능장)\s*(?:\d급|\d+급|자격증)?(?:을?\s*취득|을?\s*보유|을?\s*따|을?\s*받)?/g,
    hint: '국가공인·민간자격증 명칭 기재 금지. 학습 과정과 응용 사례만 서술',
  },

  // 3) 부모·가족 정보
  {
    id: 'parent-occupation',
    category: '부모·가족 정보',
    severity: 'critical',
    pattern: /(?:아버지|어머니|부모님|부친|모친|아빠|엄마)(?:께서|이|가|은|는)?\s*(?:[가-힣]{2,8}(?:사|관|원|장|수|부|회사|기업|병원|대학|학교)\s*에서?|을\s*운영|에서\s*근무|에\s*다니)/g,
    hint: '부모 직업·직장 시사 표현 기재 금지. 학생 본인의 활동에만 집중',
  },
  {
    id: 'family-economic',
    category: '부모·가족 정보',
    severity: 'high',
    pattern: /(?:가정\s*형편|가정의\s*경제|집안\s*사정|어려운\s*가정|결손|한부모|편모|편부)/g,
    hint: '가정 경제·환경 정보 기재 금지. 학생의 활동·역량으로만 평가',
  },

  // 4) 사교육·학원
  {
    id: 'private-academy',
    category: '사교육·학원',
    severity: 'high',
    pattern: /(?:[가-힣]{2,10}\s*학원|[가-힣]{2,10}\s*과외|사교육|개인\s*교습|온라인\s*강의\s*수강|인강\s*수강)/g,
    hint: '특정 학원·과외 언급 금지. 학습한 내용·교재만 추상적으로 표현',
  },

  // 5) 논문·발명·특허
  {
    id: 'paper-citation',
    category: '논문·발명·특허',
    severity: 'high',
    pattern: /(?:논문\s*(?:게재|발표|투고)|학술지\s*(?:게재|발표)|국제\s*저널|SCI|SSCI|KCI|특허\s*(?:출원|등록|취득)|실용신안|발명\s*경진대회)/g,
    hint: '학술 논문 게재·특허 출원 등 외부 발표 사실 기재 금지',
  },

  // 6) 외부 기관·체험
  {
    id: 'external-institution',
    category: '외부 기관 활동',
    severity: 'warning',
    pattern: /(?:대학교?\s*(?:연구실|실험실)\s*(?:방문|견학|체험|인턴)|R&E|영재(?:교육원|학급)\s*수료|해외\s*(?:연수|어학연수|봉사))/g,
    hint: '학교 외 기관(대학·연구소) 활동은 학교장이 승인한 경우 외 기재 금지',
  },

  // 7) 창의 아이디어·발명 경진대회
  {
    id: 'creative-contest',
    category: '교내외 창의·발명',
    severity: 'high',
    pattern: /(?:창의\s*아이디어\s*경진대회|발명\s*경진대회|메이커\s*경진대회|창업\s*경진대회|아이디어\s*공모전)/g,
    hint: '창의·발명·창업 경진대회 명칭 기재 금지. 활동 내용만 서술',
  },

  // 8) 공인 시험 점수·석차
  {
    id: 'rank-percentile',
    category: '석차·점수',
    severity: 'high',
    pattern: /(?:전교\s*\d+등|전국\s*\d+등|상위\s*\d+%|전국\s*상위|전교\s*1등|반\s*1등)/g,
    hint: '석차·백분위·등수 기재 금지. 노력·태도·성장으로 서술',
  },
];

/**
 * 본문에서 기재요령 위반 검출
 * @param {string} text 분석 대상 본문
 * @returns {{matches: Array, summary: {critical: number, high: number, warning: number}}}
 */
export const detectComplianceViolations = (text) => {
  if (!text || typeof text !== 'string') return { matches: [], summary: { critical: 0, high: 0, warning: 0 } };
  const matches = [];
  const summary = { critical: 0, high: 0, warning: 0 };

  for (const rule of COMPLIANCE_RULES) {
    // 정규식 매칭 (g 플래그 → exec 반복)
    const regex = new RegExp(rule.pattern.source, rule.pattern.flags);
    let m;
    while ((m = regex.exec(text)) !== null) {
      matches.push({
        ruleId: rule.id,
        category: rule.category,
        severity: rule.severity,
        hint: rule.hint,
        excerpt: m[0],
        index: m.index,
      });
      summary[rule.severity] += 1;
      // 무한 루프 방지 (zero-width 매칭)
      if (m.index === regex.lastIndex) regex.lastIndex++;
    }
  }

  // 위치순으로 정렬
  matches.sort((a, b) => a.index - b.index);
  return { matches, summary };
};

// bg/text/border 는 라이트 + dark: 변형을 함께 둔다(다크에서 통계·뱃지가 밝게 뜨지 않도록).
// highlight(본문 형광펜)는 의도된 강조 마커라 라이트 톤 유지.
export const SEVERITY_META = {
  critical: { label: '절대 금지', color: 'rose',   bg: 'bg-rose-50 dark:bg-rose-900/30',   text: 'text-rose-800 dark:text-rose-300',   border: 'border-rose-300 dark:border-rose-700',   highlight: 'bg-rose-200/70 dark:bg-rose-500/30' },
  high:     { label: '주의',      color: 'orange', bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-800 dark:text-orange-300', border: 'border-orange-300 dark:border-orange-700', highlight: 'bg-orange-200/70 dark:bg-orange-500/30' },
  warning:  { label: '검토 필요', color: 'amber',  bg: 'bg-amber-50 dark:bg-amber-900/30',  text: 'text-amber-800 dark:text-amber-300',  border: 'border-amber-300 dark:border-amber-700',  highlight: 'bg-amber-200/70 dark:bg-amber-500/30' },
};
