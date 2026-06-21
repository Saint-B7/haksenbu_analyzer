// 색상 및 품질 등급 매핑
// 0~100 점수, 5단계 status, 태그/특정성 분류용 색상을 한 곳에 모음.

// 품질 등급 — 0~100 점수를 5단계로 매핑
// 단순 충족/미충족(boolean)이 아닌 "얼마나 잘 드러났는가"를 단계화한다.
// 각 단계의 bg/border/text 는 라이트 클래스 뒤에 dark: 변형을 함께 둔다.
// (다크에서는 slate-800 카드 위에서 은은하게 보이도록 X-900/30 배경 + X-300 텍스트)
export const QUALITY_LEVELS = [
  { min: 0,  max: 15,  key: 'missing',   label: '누락',   short: '0',
    bg: 'bg-rose-50 dark:bg-rose-900/30',    border: 'border-rose-300 dark:border-rose-700',    text: 'text-rose-700 dark:text-rose-300',
    radarFill: '#fb7185', radarStroke: '#e11d48',
    desc: '본문에서 식별되지 않거나 매우 형식적' },
  { min: 16, max: 40,  key: 'weak',      label: '약함',   short: '1',
    bg: 'bg-orange-50 dark:bg-orange-900/30',  border: 'border-orange-300 dark:border-orange-700',  text: 'text-orange-700 dark:text-orange-300',
    radarFill: '#fb923c', radarStroke: '#ea580c',
    desc: '존재하나 표현이 추상적·짧음' },
  { min: 41, max: 65,  key: 'normal',    label: '보통',   short: '2',
    bg: 'bg-amber-50 dark:bg-amber-900/30',   border: 'border-amber-300 dark:border-amber-700',   text: 'text-amber-700 dark:text-amber-300',
    radarFill: '#fbbf24', radarStroke: '#d97706',
    desc: '일반 학생 수준에 부합' },
  { min: 66, max: 85,  key: 'strong',    label: '강함',   short: '3',
    bg: 'bg-sky-50 dark:bg-sky-900/30',     border: 'border-sky-300 dark:border-sky-700',     text: 'text-sky-700 dark:text-sky-300',
    radarFill: '#38bdf8', radarStroke: '#0284c7',
    desc: '구체성·서사·논리 모두 양호' },
  { min: 86, max: 100, key: 'excellent', label: '탁월',   short: '4',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-300',
    radarFill: '#34d399', radarStroke: '#059669',
    desc: '대체불가·최상위권 수준' },
];

export const qualityLevelOf = (score) => {
  const s = Math.max(0, Math.min(100, score ?? 0));
  return QUALITY_LEVELS.find((q) => s >= q.min && s <= q.max) || QUALITY_LEVELS[0];
};

// 5단계 status (missing/weak/normal/strong/excellent) → Tailwind 색상
export const STATUS_COLORS = {
  excellent: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-400 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-300', label: '탁월', barBg: 'bg-emerald-500' },
  strong:    { bg: 'bg-sky-50 dark:bg-sky-900/30',     border: 'border-sky-300 dark:border-sky-700',     text: 'text-sky-700 dark:text-sky-300',     label: '강함', barBg: 'bg-sky-500' },
  normal:    { bg: 'bg-amber-50 dark:bg-amber-900/30',   border: 'border-amber-300 dark:border-amber-700',   text: 'text-amber-700 dark:text-amber-300',   label: '보통', barBg: 'bg-amber-500' },
  weak:      { bg: 'bg-orange-50 dark:bg-orange-900/30',  border: 'border-orange-300 dark:border-orange-700',  text: 'text-orange-700 dark:text-orange-300',  label: '약함', barBg: 'bg-orange-500' },
  missing:   { bg: 'bg-rose-50 dark:bg-rose-900/30',    border: 'border-rose-300 dark:border-rose-700',    text: 'text-rose-700 dark:text-rose-300',    label: '누락', barBg: 'bg-rose-500' },
};

// 다음 단계 로드맵 카드의 태그 4종 색상 (라이트 + dark: 변형)
export const TAG_COLORS = {
  '심화': 'bg-indigo-100 text-indigo-700 border-indigo-200 dark:bg-indigo-900/40 dark:text-indigo-300 dark:border-indigo-700',
  '확장': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700',
  '적용': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-700',
  '융합': 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700',
};

// 진로/학과 매칭 명확도 (multi 결과 표기에 사용)
export const SPECIFICITY_COLORS = {
  high:   { bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-700', label: '명확' },
  medium: { bg: 'bg-amber-50 dark:bg-amber-900/30',   text: 'text-amber-700 dark:text-amber-300',   border: 'border-amber-200 dark:border-amber-700',   label: '추정' },
  low:    { bg: 'bg-slate-50 dark:bg-slate-700/50',   text: 'text-slate-600 dark:text-slate-300',   border: 'border-slate-200 dark:border-slate-600',   label: '약함' },
};

// 점수 → 색상 (emerald/sky/amber/orange/rose 5단계). stroke/fill hex 는 라이트·다크 공통.
export const scoreColorOf = (score) => {
  if (score >= 80) return { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-300 dark:border-emerald-700', text: 'text-emerald-700 dark:text-emerald-300', stroke: '#059669', fill: '#34d399' };
  if (score >= 65) return { bg: 'bg-sky-50 dark:bg-sky-900/30',     border: 'border-sky-300 dark:border-sky-700',     text: 'text-sky-700 dark:text-sky-300',     stroke: '#0284c7', fill: '#38bdf8' };
  if (score >= 50) return { bg: 'bg-amber-50 dark:bg-amber-900/30',   border: 'border-amber-300 dark:border-amber-700',   text: 'text-amber-700 dark:text-amber-300',   stroke: '#d97706', fill: '#fbbf24' };
  if (score >= 35) return { bg: 'bg-orange-50 dark:bg-orange-900/30',  border: 'border-orange-300 dark:border-orange-700',  text: 'text-orange-700 dark:text-orange-300',  stroke: '#ea580c', fill: '#fb923c' };
  return                 { bg: 'bg-rose-50 dark:bg-rose-900/30',     border: 'border-rose-300 dark:border-rose-700',    text: 'text-rose-700 dark:text-rose-300',    stroke: '#e11d48', fill: '#fb7185' };
};
