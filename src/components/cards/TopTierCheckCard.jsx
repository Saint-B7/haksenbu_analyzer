// ──────────────────────────────────────────────────────────
// 최상위 도약 체크 카드 — 10개 도약 기준 점검
// 상위권은 '문제 해결', 최상위권은 '문제 재정의'
// 도약 기준별 충족도(0~100)를 레이더 차트와 개별 카드로 표시
// 충족된 기준은 원본 문장 + 대안, 미충족은 보완 팁 제공
// ──────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Flame, ChevronDown, TrendingUp, Lightbulb } from 'lucide-react';
import { TOP_TIER_CRITERIA } from '../../data/criteria';
import { qualityLevelOf } from '../../data/colors';
import {
  TOPTIER_FALLBACK_SCORE_MET,
  TOPTIER_FALLBACK_SCORE_UNMET,
  TOPTIER_MET_THRESHOLD,
} from '../../data/constants';
import { RichText } from '../common';
import { TopTierRadar } from '../charts/SvgRadarChart';

export const TopTierCheckCard = ({ topTierCheck, topTierMetCount, forceOpen = false }) => {
  if (!topTierCheck || topTierCheck.length === 0) return null;

  const total = topTierCheck.length;
  const met = topTierMetCount ?? topTierCheck.filter((c) => c.met).length;
  const ratio = (met / total) * 100;
  // 충족 비율에 따라 헤더 그라데이션 톤이 달라짐(높을수록 강렬)
  const headerColor = ratio >= 70 ? 'from-rose-500 to-orange-500'
    : ratio >= 40 ? 'from-orange-500 to-amber-500'
    : 'from-slate-500 to-slate-600';

  // forceOpen 시 강제 펼침(인쇄·HTML 저장 시), 아니면 자체 collapsible
  const [open, setOpen] = useState(forceOpen);
  const isOpen = forceOpen || open;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-rose-200 dark:border-rose-700 shadow-sm top-tier-card">
      <button
        type="button"
        onClick={() => !forceOpen && setOpen((o) => !o)}
        className={`w-full bg-gradient-to-r ${headerColor} p-5 sm:p-6 text-white text-left transition ${
          isOpen ? 'rounded-t-xl' : 'rounded-xl'
        } ${forceOpen ? 'cursor-default' : 'hover:brightness-110'}`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Flame className="w-6 h-6" />
          <h2 className="text-lg sm:text-xl font-bold">최상위 도약을 위한 마지막 점검</h2>
          <div className="ml-auto flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-white/25 text-base font-bold backdrop-blur-sm">
              {met} / {total} 충족
            </span>
            {!forceOpen && (
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </div>
        </div>
        <p className="text-sm text-white/90 leading-relaxed">
          상위권은 문제를 <span className="font-bold">해결</span>하지만, 최상위권은 문제를 <span className="font-bold">새롭게 정의</span>합니다.
        </p>
      </button>

      {isOpen && (
        <>
          {/* 도약 10기준 레이더 — saveable-remove-chart-container는 HTML 저장 시 제거 마커 */}
          <div className="p-5 sm:p-6 bg-rose-50/30 border-b border-rose-100 saveable-remove-chart-container">
            <TopTierRadar check={topTierCheck} />
          </div>

          {/* 기준별 개별 카드 */}
          <div className="divide-y divide-slate-100">
            {topTierCheck.map((item) => {
              const meta = TOP_TIER_CRITERIA.find((c) => c.id === item.id) || {};
              const qScore = (typeof item.qualityScore === 'number')
                ? item.qualityScore
                : (item.met ? TOPTIER_FALLBACK_SCORE_MET : TOPTIER_FALLBACK_SCORE_UNMET);
              const lvl = qualityLevelOf(qScore);
              const isMet = qScore >= TOPTIER_MET_THRESHOLD;

              return (
                <div key={item.id} className="p-4 sm:p-5 top-tier-item">
                  <div className="flex items-start gap-3 mb-3">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${
                      isMet ? 'bg-rose-100 text-rose-700 dark:text-rose-300' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'
                    }`}>🔥{item.id}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">{item.name || meta.name}</h3>
                        <span className="text-[10px] text-slate-400 font-mono">{meta.nameEn}</span>
                      </div>
                      {/* 부제 — 각 도약 기준의 의미를 한 줄로 안내 */}
                      {meta.subtitle && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-snug mt-0.5">{meta.subtitle}</p>
                      )}
                      <div className="mt-2 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full transition-all duration-500"
                            style={{ width: `${qScore}%`, backgroundColor: lvl.radarStroke }}
                          />
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{qScore}</span>
                      </div>
                    </div>
                    <span className={`flex-shrink-0 px-2.5 py-1 rounded-full text-xs font-bold border ${lvl.bg} ${lvl.text} ${lvl.border}`}>
                      {lvl.label}
                    </span>
                  </div>

                  {isMet && item.satisfyingSentence ? (
                    /* 충족된 기준: 원본 문장 + 한 단계 발전된 대안 */
                    <div className="space-y-3 sm:pl-13">
                      <div className="bg-emerald-50 dark:bg-emerald-900/30 border-l-4 border-emerald-400 rounded-r-lg p-3">
                        <div className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wide mb-1">원본 문장</div>
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic">"{item.satisfyingSentence}"</p>
                      </div>
                      {item.developedAlternative && (
                        <div className="bg-indigo-50 dark:bg-indigo-900/30 border-l-4 border-indigo-500 rounded-r-lg p-3">
                          <div className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 uppercase tracking-wide mb-1 flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" /> 한 단계 발전된 대안
                          </div>
                          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                            <RichText text={item.developedAlternative} />
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    /* 미충족 기준: 보완 팁 제공 */
                    <div className="sm:pl-13 space-y-2">
                      <p className="text-sm text-slate-500 dark:text-slate-400 italic">{lvl.desc}</p>
                      {item.tipForImprovement && (
                        <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg p-3.5 border-l-4 border-amber-400">
                          <div className="flex items-center gap-1.5 mb-1.5">
                            <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0" />
                            <span className="text-xs font-bold text-amber-800 dark:text-amber-200 uppercase tracking-wide">보완 팁</span>
                          </div>
                          <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                            <RichText text={item.tipForImprovement} />
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
};
