// 카드 안에서 자주 쓰이는 작은 SVG 시각화 컴포넌트 모음.
// - CircularScore: 0~100 종합 점수 도넛
// - EvidenceDonut: 구체성 비율 도넛
// - DepthGauge: 1~10 탐구 깊이 게이지 (그라데이션 바 + 위치 핀)
// - MatchBadge: high/medium/low 적합도 뱃지

import { DEPTH_BUCKETS } from '../../data/criteria';
import { useTheme } from '../../contexts/ThemeContext';
import { chartColors } from '../../data/dark-palette';

export const CircularScore = ({ score = 0, size = 160 }) => {
  const { theme } = useTheme();
  const cc = chartColors(theme === 'dark'); // 트랙·라벨만 다크 분기 (데이터 색은 유지)
  const stroke = 12;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, score));
  const offset = circumference - (safe / 100) * circumference;
  const color = safe >= 80 ? '#10b981' : safe >= 60 ? '#f59e0b' : '#f43f5e';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="block">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={cc.track} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circumference} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`} strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 1s ease-out' }} />
      <text x={size/2} y={size/2 - 4} textAnchor="middle" fontSize={size * 0.28} fontWeight="800" fill={color}>{safe}</text>
      <text x={size/2} y={size/2 + size * 0.16} textAnchor="middle" fontSize={size * 0.09} fill={cc.axisText} fontWeight="500">/ 100점</text>
    </svg>
  );
};

export const EvidenceDonut = ({ ratio = 0, level = '심각' }) => {
  const { theme } = useTheme();
  const cc = chartColors(theme === 'dark');
  const size = 140, stroke = 14;
  const radius = (size - stroke) / 2;
  const circ = 2 * Math.PI * radius;
  const safe = Math.max(0, Math.min(100, ratio));
  const offset = circ - (safe / 100) * circ;
  const color = level === '통과' ? '#10b981' : level === '부족' ? '#f59e0b' : '#f43f5e';
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={cc.track} strokeWidth={stroke} />
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={circ} strokeDashoffset={offset}
        transform={`rotate(-90 ${size/2} ${size/2})`} strokeLinecap="round" />
      <text x={size/2} y={size/2 - 2} textAnchor="middle" fontSize="28" fontWeight="800" fill={color}>{safe}%</text>
      <text x={size/2} y={size/2 + 18} textAnchor="middle" fontSize="11" fill={cc.axisText} fontWeight="500">구체성</text>
    </svg>
  );
};

export const DepthGauge = ({ score, bucketLabel }) => {
  const pct = Math.max(0, Math.min(100, ((score - 1) / 9) * 100));
  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-2 flex-wrap gap-1">
        <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">현재 위치</div>
        <div className="text-base font-bold text-indigo-700 dark:text-indigo-300">
          {bucketLabel} <span className="text-sm text-slate-500 dark:text-slate-400 font-normal">({score}/10)</span>
        </div>
      </div>
      <div className="relative h-4 bg-gradient-to-r from-emerald-200 via-amber-200 to-rose-200 rounded-full">
        <div className="absolute top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-indigo-600 border-2 border-white shadow-md"
          style={{ left: `calc(${pct}% - 10px)` }} />
      </div>
      <div className="grid grid-cols-6 gap-1 mt-2 text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 text-center font-medium">
        {DEPTH_BUCKETS.map((b) => (<div key={b.short}>{b.short}</div>))}
      </div>
    </div>
  );
};

export const MatchBadge = ({ level }) => {
  if (!level || level === 'unknown') return null;
  const map = {
    high:   { bg: 'bg-emerald-100 dark:bg-emerald-900/50', text: 'text-emerald-700 dark:text-emerald-300', label: '적합도 높음' },
    medium: { bg: 'bg-amber-100 dark:bg-amber-900/50',   text: 'text-amber-700 dark:text-amber-300',   label: '적합도 보통' },
    low:    { bg: 'bg-rose-100 dark:bg-rose-900/50',    text: 'text-rose-700 dark:text-rose-300',    label: '적합도 낮음' },
  };
  const v = map[level] || map.medium;
  return <span className={`text-xs font-bold px-2 py-1 rounded-full ${v.bg} ${v.text}`}>{v.label}</span>;
};
