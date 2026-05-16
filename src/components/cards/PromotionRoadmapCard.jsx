// ──────────────────────────────────────────────────────────
// 진급 이후 로드맵 카드 — 두 영역 통합 표시
// ① 분석 결과 즉시 적용: 현재 약점을 메울 후속 활동 추천
// ② 진급 이후 단계별 로드맵: 학년별 발전 경로
//   - 카테고리: 탐구·교과·진로·자율
// ──────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Map as MapIcon, Compass, Rocket, ChevronDown } from 'lucide-react';
import { ROADMAP_CATEGORIES } from '../../data/criteria';
import { TAG_COLORS } from '../../data/colors';
import { RichText, InfoTooltip } from '../common';

export const PromotionRoadmapCard = ({ roadmap, careerGoal, desiredMajor, forceOpen = false }) => {
  if (!roadmap) return null;

  const stages = roadmap.nextStages || [];
  const currentApps = roadmap.currentApplicationActivities || [];
  if (stages.length === 0 && currentApps.length === 0) return null;

  // collapsible 통합(forceOpen 시 강제 펼침)
  const [open, setOpen] = useState(forceOpen);
  const isOpen = forceOpen || open;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 shadow-sm roadmap-card">
      <button
        type="button"
        onClick={() => !forceOpen && setOpen((o) => !o)}
        className={`w-full bg-gradient-to-r from-indigo-600 to-purple-600 p-5 sm:p-6 text-white text-left transition ${
          isOpen ? 'rounded-t-xl' : 'rounded-xl'
        } ${forceOpen ? 'cursor-default' : 'hover:brightness-110'}`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <MapIcon className="w-6 h-6" />
          <h2 className="text-lg sm:text-xl font-bold">진급 이후 로드맵</h2>
          <InfoTooltip content="(1) 분석 결과를 지금 즉시 적용할 수 있는 탐구 활동 추천과, (2) 진급 후 학년별 발전 로드맵을 함께 제시합니다. 입력하신 진로·학과(또는 추론된 값)를 모두 고려합니다." />
          {!forceOpen && (
            <ChevronDown className={`ml-auto w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          )}
        </div>
        <p className="text-sm text-white/90 leading-relaxed">
          현재 학년: <span className="font-bold">{roadmap.currentGrade}</span>
          {careerGoal && <> · 진로 희망: <span className="font-bold">{careerGoal}</span></>}
          {desiredMajor && <> · 희망 학과: <span className="font-bold">{desiredMajor}</span></>}
        </p>
      </button>

      {isOpen && (
        <>
          {/* (1) 분석 결과 즉시 적용 — 탐구 활동 추천 */}
          {currentApps.length > 0 && (
            <div className="p-5 sm:p-6 bg-amber-50/40 border-b border-amber-100 roadmap-section">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">탐구 활동 추천</h3>
                <span className="text-xs text-amber-700 dark:text-amber-300 bg-amber-100 px-2 py-0.5 rounded-full font-bold">분석 결과 즉시 적용</span>
                <InfoTooltip content="현재 분석에서 드러난 약점·보완점을 지금 학기 또는 다음 학기 안에 메울 수 있는 구체적 후속 활동입니다. 학년이 올라가기를 기다리지 않고 바로 시도할 수 있는 추천입니다." />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                현재 분석에서 발견된 <span className="font-semibold text-amber-700 dark:text-amber-300">약점·보완점</span>을 즉시 메울 수 있는 후속 활동입니다.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {currentApps.map((act, i) => (
                  <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-amber-200 dark:border-amber-700 hover:border-amber-400 transition">
                    <div className="flex items-start justify-between gap-2 mb-2 flex-wrap">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex-1 min-w-0">
                        <RichText text={act.title} />
                      </div>
                      {act.tag && (
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TAG_COLORS[act.tag] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                          {act.tag}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed mb-2">
                      <RichText text={act.description} />
                    </p>
                    {act.linkedWeakness && (
                      <div className="text-[10px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded px-2 py-1 inline-block font-semibold">
                        보완 ▸ {act.linkedWeakness}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* (2) 진급 이후 단계별 로드맵 */}
          {stages.length > 0 && (
            <div className="p-5 sm:p-6 space-y-8">
              <div className="flex items-center gap-2 flex-wrap mb-2">
                <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Rocket className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">진급 이후 학년별 단계</h3>
              </div>
              {stages.map((stage, sIdx) => (
                <div key={sIdx} className="relative">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-base">{sIdx + 1}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 flex-wrap">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">{stage.targetGrade}</h3>
                        <Rocket className="w-4 h-4 text-indigo-500" />
                      </div>
                      {stage.growthFocus && (
                        <p className="text-sm text-indigo-700 dark:text-indigo-300 font-semibold mt-1 leading-relaxed">
                          <RichText text={stage.growthFocus} />
                        </p>
                      )}
                    </div>
                  </div>
                  {/* 카테고리별(탐구/교과/진로/자율) 그리드 */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:pl-13">
                    {ROADMAP_CATEGORIES.map((cat) => {
                      const matched = (stage.categories || []).find((c) => c.key === cat.key);
                      const items = matched?.items || [];
                      const Icon = cat.icon;
                      return (
                        <div key={cat.key} className={`rounded-lg border ${cat.ring} ${cat.bg} p-4`}>
                          <div className="flex items-center gap-2 mb-3 flex-wrap">
                            <div className={`w-7 h-7 rounded-md ${cat.dot} text-white flex items-center justify-center`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <h4 className={`text-sm font-bold ${cat.text}`}>{cat.label}</h4>
                            <InfoTooltip content={cat.desc} />
                          </div>
                          {items.length > 0 ? (
                            <ul className="space-y-2">
                              {items.map((it, i) => (
                                <li key={i} className="bg-white dark:bg-slate-800 rounded-md p-3 border border-slate-200 dark:border-slate-700">
                                  <div className="flex items-start justify-between gap-2 mb-1 flex-wrap">
                                    <div className="text-sm font-bold text-slate-900 dark:text-slate-100 flex-1 min-w-0">
                                      <RichText text={it.title} />
                                    </div>
                                    {it.tag && (
                                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${TAG_COLORS[it.tag] || 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'}`}>
                                        {it.tag}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                                    <RichText text={it.description} />
                                  </p>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-slate-400 italic">추천 항목이 생성되지 않았습니다.</p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};
