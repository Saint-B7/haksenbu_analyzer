// ──────────────────────────────────────────────────────────
// 강점·약점·보완 제안 통합 카드
// 강점은 2열 그리드로, 약점과 보완 액션은 좌·우 페어링으로
// "무엇이 부족하고 어떻게 메울지"가 한 줄 안에 보이도록 정렬
// ──────────────────────────────────────────────────────────

import React from 'react';
import { Scale, CheckCircle2, AlertTriangle, Lightbulb } from 'lucide-react';
import { RichText, InfoTooltip, CollapsibleCard } from '../common';

export const StrengthsWeaknessesCard = ({ strengths, weaknesses, suggestions, forceOpen = false }) => {
  const hasS = strengths?.length > 0;
  const hasW = weaknesses?.length > 0;
  const hasSug = suggestions?.length > 0;
  if (!hasS && !hasW && !hasSug) return null;

  const counterBadge = (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 whitespace-nowrap">
      강점 {strengths?.length || 0} · 약점 {weaknesses?.length || 0}
    </span>
  );

  return (
    <CollapsibleCard
      icon={Scale}
      title="강점 · 약점 · 보완 제안"
      tooltip="강점·약점·보완 제안을 한 카드에 묶었습니다. 강점은 위쪽 2열로, 약점과 그 약점을 메우는 보완 액션은 좌우로 짝지어 표시되어 '무엇이 부족하고 어떻게 메울지'가 한 줄 안에 보입니다. 약점 수와 보완 제안 수가 다르면 빈 칸이 생길 수 있습니다."
      forceOpen={forceOpen}
      headerExtra={counterBadge}
    >
      {/* 강점 섹션 */}
      {hasS && (
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-emerald-800 dark:text-emerald-200 text-sm">강점</h3>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">{strengths.length}</span>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {strengths.map((s, i) => (
              <li key={i} className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed bg-emerald-50/60 border-l-4 border-emerald-400 rounded-r px-3 py-2">
                <RichText text={s} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* 약점 → 보완 매핑 섹션 — 좌(약점) / 우(보완) 페어링 */}
      {(hasW || hasSug) && (
        <div>
          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-amber-800 dark:text-amber-200 text-sm">약점 → 보완 액션</h3>
            <InfoTooltip content="약점과 보완 제안을 같은 행으로 짝지었습니다. 보완 제안 수가 약점 수와 다르면 일부 칸은 비어 있을 수 있습니다." />
          </div>
          <div className="space-y-2">
            {(() => {
              // 약점·보완을 행 단위로 페어링(둘 중 더 긴 길이 기준)
              const maxLen = Math.max(weaknesses?.length || 0, suggestions?.length || 0);
              return Array.from({ length: maxLen }).map((_, i) => {
                const w = weaknesses?.[i];
                const sug = suggestions?.[i];
                return (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-2 items-stretch">
                    {/* 좌: 약점 */}
                    <div className="bg-amber-50/60 border-l-4 border-amber-400 rounded-r px-3 py-2.5">
                      <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide mb-1">약점 {i + 1}</div>
                      {w ? (
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed"><RichText text={w} /></p>
                      ) : (
                        <p className="text-xs text-slate-400 italic">대응 약점 없음</p>
                      )}
                    </div>
                    {/* 우: 보완 액션 */}
                    <div className="bg-indigo-50/60 border-l-4 border-indigo-400 rounded-r px-3 py-2.5 flex items-start gap-2">
                      <Lightbulb className="w-3.5 h-3.5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide mb-1">보완 액션 {i + 1}</div>
                        {sug ? (
                          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed"><RichText text={sug} /></p>
                        ) : (
                          <p className="text-xs text-slate-400 italic">제안 없음</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        </div>
      )}
    </CollapsibleCard>
  );
};
