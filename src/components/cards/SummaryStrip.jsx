// ──────────────────────────────────────────────────────────
// 상단 요약 스트립 — sticky 고정으로 어느 탭이든 핵심 지표 노출
// 종합·DNA·도약·3관점·대안 바이트를 한 줄로 압축 표시
//
// 자식 컴포넌트:
//   SummaryCell — 단일 지표 셀(아이콘 + 라벨 + 값 + 접미 단위).
//                 상위 함수 안의 인라인 클로저로 두지 않고 별도 컴포넌트로 분리해
//                 매 렌더마다 새 함수가 만들어지지 않고 React DevTools에서도 잘 보이도록.
// ──────────────────────────────────────────────────────────

import React from 'react';
import { BarChart3, Target, Flame, Users, BookOpen } from 'lucide-react';
import { NEIS_BYTE_LIMIT, NEIS_BYTE_REWRITE_MIN, calcNeisBytes } from '../../lib/neis-bytes';

/**
 * 단일 지표 셀 — 아이콘 + 라벨 + 값 + 접미 단위.
 *
 * 이전에는 SummaryStrip 함수 내부에 인라인 `const Cell = (...)` 형태였으나
 * 매 렌더마다 새 컴포넌트 타입이 만들어져 메모이제이션이 무효화되는 단점이 있었다.
 * 모듈 최상위로 끌어올려 안정적인 컴포넌트 정체성을 갖게 한다.
 */
const SummaryCell = ({ label, value, suffix, color, icon: Icon }) => (
  <div className="flex items-center gap-2 px-3 py-1.5 min-w-0 flex-shrink-0">
    {Icon && <Icon className={`w-4 h-4 flex-shrink-0 ${color || 'text-slate-500 dark:text-slate-400'}`} />}
    <div className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-slate-500 dark:text-slate-400 font-semibold leading-tight">{label}</div>
      <div className={`text-sm font-mono font-bold leading-tight ${color || 'text-slate-700 dark:text-slate-300'}`}>
        {value}{suffix && <span className="text-[10px] text-slate-400 ml-0.5 font-normal">{suffix}</span>}
      </div>
    </div>
  </div>
);

export const SummaryStrip = ({ result, activityType, grade }) => {
  if (!result) return null;

  const overall = result.overallScore;
  const dnaCount = result.satisfiedCount;
  const dnaTotal = result.dnaChecklist?.length ?? 7;
  const topTier = result.topTierMetCount;
  const topTierTotal = result.topTierCheck?.length ?? 10;
  const mpAvg = result.multiPerspectiveEvaluation?.consensus?.averageScore;
  const altBytes = result.rewrittenVersion ? calcNeisBytes(result.rewrittenVersion) : null;

  // 점수 구간별 색상 — 같은 임계값 패턴이 종합/DNA/도약마다 다르므로
  // 각자 인라인 ternary로 처리(공통 추출하면 오히려 임계값이 숨겨져 가독성↓)
  const overallColor = overall >= 80 ? 'text-emerald-600'
    : overall >= 60 ? 'text-amber-600'
    : 'text-rose-600';
  const dnaColor = dnaCount >= 5 ? 'text-emerald-600'
    : dnaCount >= 3 ? 'text-amber-600'
    : 'text-rose-600';
  const topTierColor = topTier >= 7 ? 'text-rose-600'
    : topTier >= 4 ? 'text-orange-600'
    : 'text-slate-500 dark:text-slate-400';

  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm mb-4">
      <div className="flex items-center divide-x divide-slate-200 overflow-x-auto">
        {/* 학년·활동 유형 뱃지 */}
        <div className="flex items-center gap-1.5 px-3 py-2 flex-shrink-0">
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 whitespace-nowrap">{grade}</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 whitespace-nowrap">{activityType}</span>
        </div>
        {overall !== undefined && <SummaryCell label="종합" value={overall} suffix="/100" color={overallColor} icon={BarChart3} />}
        {dnaCount !== undefined && <SummaryCell label="DNA" value={`${dnaCount}/${dnaTotal}`} color={dnaColor} icon={Target} />}
        {topTier !== undefined && <SummaryCell label="도약" value={`${topTier}/${topTierTotal}`} color={topTierColor} icon={Flame} />}
        {mpAvg !== undefined && <SummaryCell label="3관점" value={mpAvg} suffix="/100" color="text-purple-600" icon={Users} />}
        {altBytes !== null && (
          <SummaryCell
            label="대안"
            value={altBytes}
            suffix="B"
            color={
              (altBytes >= NEIS_BYTE_REWRITE_MIN && altBytes <= NEIS_BYTE_LIMIT)
                ? 'text-emerald-600'
                : 'text-slate-600 dark:text-slate-400'
            }
            icon={BookOpen}
          />
        )}
      </div>
    </div>
  );
};
