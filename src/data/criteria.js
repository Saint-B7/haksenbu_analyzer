// 학생부 분석에 사용되는 데이터 상수 모음
// - 7요소 DNA / 6단계 서사 / 활동 유형 / 탐구 깊이 버킷
// - 최상위 도약 10기준 / 3관점 평가자 / 진급 로드맵 카테고리
// EVALUATORS와 ROADMAP_CATEGORIES는 lucide-react 아이콘을 직접 참조한다.

import {
  ShieldCheck, Microscope, GraduationCap, Briefcase, Network,
} from 'lucide-react';

export const GRADES = ['1학년', '2학년', '3학년'];

export const DNA_CRITERIA = [
  { id: 1, mark: '①', name: '질문으로 시작', short: '질문',  desc: '감상이 아닌 문제의식이 출발점' },
  { id: 2, mark: '②', name: '근거를 확보',   short: '근거',  desc: '책·논문·통계·실험·설문·사례 1개 이상' },
  { id: 3, mark: '③', name: '과정을 보여줌', short: '과정',  desc: '결과가 아닌 탐구 흐름의 서사화' },
  { id: 4, mark: '④', name: '활동을 확장',   short: '확장',  desc: '후속 탐구·발표·캠페인·제안으로 연결' },
  { id: 5, mark: '⑤', name: '공동체와 연결', short: '공동체', desc: '개인 성장이 공동체 기여로 의미화' },
  { id: 6, mark: '⑥', name: '평가는 마지막', short: '평가',  desc: '중간 칭찬 없이 끝에서 역량 정리' },
  { id: 7, mark: '⑦', name: '감정보다 신뢰', short: '신뢰',  desc: '과장 지양, 구체성·논리로 설득' },
];

export const NARRATIVE_STAGES = [
  { id: 1, mark: '①', name: '계기', desc: '배경·접점',     hex: '#fb7185' },
  { id: 2, mark: '②', name: '탐구', desc: '질문·자료조사', hex: '#fb923c' },
  { id: 3, mark: '③', name: '분석', desc: '해석·원인추론', hex: '#f59e0b' },
  { id: 4, mark: '④', name: '실행', desc: '실험·설문·발표', hex: '#10b981' },
  { id: 5, mark: '⑤', name: '확산', desc: '공유·실천·후속', hex: '#0ea5e9' },
  { id: 6, mark: '⑥', name: '평가', desc: '역량 정리',     hex: '#6366f1' },
];

export const ACTIVITY_TYPES = [
  { value: '자율',   label: '자율활동',            focus: '⑤ 확산',              tooltip: '분석 시 ⑤확산 단계의 품질을 가장 비중 있게 평가합니다. 학교 안팎의 경험을 확장하고 공유하는 역량이 핵심입니다.' },
  { value: '동아리', label: '동아리활동',          focus: '② 탐구심화',           tooltip: '분석 시 ②탐구심화 단계의 품질을 가장 비중 있게 평가합니다. 주제에 깊이 파고드는 지속적 탐구 역량이 핵심입니다.' },
  { value: '진로',   label: '진로활동',            focus: '② 탐구 · ⑥ 진로역량', tooltip: '분석 시 ②탐구와 ⑥진로역량(진로 방향성·실천 의지)을 중점 평가합니다.' },
  { value: '세특',   label: '세부능력 및 특기사항', focus: '② 탐구 · ⑥ 교과역량', tooltip: '분석 시 ②탐구와 ⑥교과역량(교과 심화 탐구력)을 중점 평가합니다.' },
  { value: '행특',   label: '행동특성 및 종합의견', focus: '⑥ 통합 평가',          tooltip: '분석 시 ⑥통합 평가(인성·리더십·공동체 의식 등 학교생활 전반)를 종합적으로 분석합니다.' },
];

export const DEPTH_BUCKETS = [
  { min: 1,  max: 1,  label: '고1 수준',     short: '고1' },
  { min: 2,  max: 3,  label: '고2 수준',     short: '고2' },
  { min: 4,  max: 5,  label: '고3 심화 수준', short: '고3' },
  { min: 6,  max: 7,  label: '대학 1-2학년 수준', short: '대1-2' },
  { min: 8,  max: 9,  label: '대학 3-4학년 수준', short: '대3-4' },
  { min: 10, max: 10, label: '대학원 수준',   short: '대학원' },
];

export const depthBucketOf = (score) => {
  const s = Math.max(1, Math.min(10, score || 1));
  return DEPTH_BUCKETS.find((b) => s >= b.min && s <= b.max) || DEPTH_BUCKETS[0];
};

export const TOP_TIER_CRITERIA = [
  { id: 1,  name: '문제 정의 능력',     short: '문제정의',  nameEn: 'Problem Framing',
    subtitle: '기존 접근의 한계를 짚고, 풀어야 할 문제를 자기 언어로 다시 세움' },
  { id: 2,  name: '자기만의 관점',      short: '자기관점',  nameEn: 'Original Perspective',
    subtitle: '자료 정리·요약을 넘어, 자기 해석과 주장이 분명히 드러남' },
  { id: 3,  name: '지식의 재구성 능력', short: '지식재구성', nameEn: 'Knowledge Reconstruction',
    subtitle: '교과 개념을 새로운 맥락·사례에 변형해서 적용함' },
  { id: 4,  name: '연결의 깊이',        short: '연결깊이',  nameEn: 'Deep Integration',
    subtitle: '서로 다른 개념·교과를 구조적으로 잇고, "왜 연결되는지"까지 설명함' },
  { id: 5,  name: '불확실성 다루기',    short: '불확실성',  nameEn: 'Handling Uncertainty',
    subtitle: '실패·모순·예상 밖 결과를 분석하고 가설을 수정함' },
  { id: 6,  name: '탐구의 누적성',      short: '누적성',    nameEn: 'Continuity',
    subtitle: '1차 탐구의 한계를 인식해 2차 탐구로 확장하는 흐름이 있음' },
  { id: 7,  name: '인지적 도전',        short: '도전수준',  nameEn: 'Cognitive Challenge',
    subtitle: '학년 수준을 넘는 어려운 주제·방법에 도전하며 자기 한계를 확장함' },
  { id: 8,  name: '사고 구조',          short: '사고구조',  nameEn: 'Thinking Structure',
    subtitle: '"문제→가설→방법→결과→해석→한계" 같은 학술적 사고 골격이 보임' },
  { id: 9,  name: '평가 밀도',          short: '평가밀도',  nameEn: 'Evaluation Density',
    subtitle: '"잘함" 수준이 아닌, 복잡한 상황에서의 사고·해결 방식이 분석적으로 평가됨' },
  { id: 10, name: '대체 불가능성',      short: '대체불가',  nameEn: 'Irreplaceability',
    subtitle: '같은 활동을 한 다른 학생은 결코 쓸 수 없는 고유 내용이 담김' },
];

// 3관점 평가자 정의 (Multi-Perspective Evaluation)
export const EVALUATORS = [
  {
    id: 'conservative',
    name: '신뢰도 중심형',
    nameEn: 'Conservative',
    icon: ShieldCheck,
    accent: 'slate',
    headerBg: 'from-slate-700 to-slate-900',
    cardBg: 'bg-slate-50',
    cardBorder: 'border-slate-300',
    textAccent: 'text-slate-800',
    badge: 'bg-slate-100 text-slate-700 border-slate-300',
    persona: '과장 의심 · 검증 가능성 · 논리적 일관성',
    weights: '구체성 25 / 사고수준 15 / 진로연계 10 / 인과관계 20 / 차별성 10 / 신뢰도 20',
    desc: '근거가 검증 가능한지, 표현이 과장되지 않았는지를 가장 엄격히 봅니다.',
  },
  {
    id: 'academic',
    name: '탐구·지적 호기심형',
    nameEn: 'Academic',
    icon: Microscope,
    accent: 'indigo',
    headerBg: 'from-indigo-600 to-purple-700',
    cardBg: 'bg-indigo-50',
    cardBorder: 'border-indigo-300',
    textAccent: 'text-indigo-800',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-300',
    persona: '사고 깊이 · 문제 정의 · 개념 연결',
    weights: '구체성 10 / 사고수준 35 / 진로연계 15 / 인과관계 20 / 차별성 15 / 신뢰도 5',
    desc: '문제를 새롭게 정의하고, 개념을 깊이 연결했는지를 가장 중시합니다.',
  },
  {
    id: 'fit',
    name: '전공 적합성 중심형',
    nameEn: 'Fit',
    icon: GraduationCap,
    accent: 'emerald',
    headerBg: 'from-emerald-600 to-teal-700',
    cardBg: 'bg-emerald-50',
    cardBorder: 'border-emerald-300',
    textAccent: 'text-emerald-800',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-300',
    persona: '진로 일관성 · 전공 관련성 · 학과 핵심 역량',
    weights: '구체성 15 / 사고수준 20 / 진로연계 35 / 인과관계 10 / 차별성 10 / 신뢰도 10',
    desc: '입력하신 진로·학과 맥락에 얼마나 정합적으로 연결되는지를 봅니다.',
  },
];

export const ROADMAP_CATEGORIES = [
  { key: 'depthDeepening',     label: '깊이 심화',       icon: Microscope,   ring: 'border-indigo-200',  dot: 'bg-indigo-500',  bg: 'bg-indigo-50',   text: 'text-indigo-700',   desc: '현재 본문 주제를 한 단계 더 깊이 파고드는 방향' },
  { key: 'majorAligned',       label: '희망 학과 맞춤',  icon: GraduationCap, ring: 'border-purple-200',  dot: 'bg-purple-500',  bg: 'bg-purple-50',   text: 'text-purple-700',   desc: '희망 학과의 핵심 개념·방법론과 연결되는 방향' },
  { key: 'careerAligned',      label: '진로 맞춤',       icon: Briefcase,     ring: 'border-emerald-200', dot: 'bg-emerald-500', bg: 'bg-emerald-50',  text: 'text-emerald-700',  desc: '진로 희망의 실무·실천 맥락으로 확장하는 방향' },
  { key: 'crossDisciplinary',  label: '융합·확장',       icon: Network,       ring: 'border-amber-200',   dot: 'bg-amber-500',   bg: 'bg-amber-50',    text: 'text-amber-700',    desc: '인접 학문·다른 교과와 구조적으로 연결하는 방향' },
];
