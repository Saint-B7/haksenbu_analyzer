// ──────────────────────────────────────────────────────────
// 3관점 평가 시뮬레이션 카드
// 보수(신뢰도)·탐구·전공 적합성 — 가치 기준이 다른 평가자 3명
// 동일 문장에도 평가자별 점수가 ±5~25점 차이날 수 있음을 가시화
// 평균 점수보다 분산(의견 차이)·공통 약점이 입시 결과에 더 큰 영향
// 자식: VarianceIndicator(분산), AdmissionProbabilityBar(티어별 확률)
// ──────────────────────────────────────────────────────────

import React, { useState } from 'react';
import {
  Users, Activity, Scale, Zap, Crown, AlertTriangle,
  MessageSquare, Gauge, ChevronDown,
} from 'lucide-react';
import { EVALUATORS } from '../../data/criteria';
import { scoreColorOf, SPECIFICITY_COLORS } from '../../data/colors';
import { RichText, InfoTooltip } from '../common';

// SPECIFICITY_COLORS는 데이터 파일에 정의되어 있고 이 파일에서는 직접 쓰지 않지만,
// 같은 카드 컨텍스트의 일부 호환성을 위해 import만 유지(추후 활용 여지)
void SPECIFICITY_COLORS;

// 분산 지수 시각화 — 0~30 → 0~100% 게이지로 환산
const VarianceIndicator = ({ variance, level }) => {
  const pct = Math.max(0, Math.min(100, (variance ?? 0) * 3.33));
  // level이 비어있으면 variance 값으로 자동 등급 산정
  const lv = level || (variance < 8 ? 'low' : variance < 18 ? 'medium' : 'high');
  const map = {
    low:    { color: 'bg-emerald-500', text: 'text-emerald-700 dark:text-emerald-300', label: '의견 일치' },
    medium: { color: 'bg-amber-500',   text: 'text-amber-700 dark:text-amber-300',   label: '부분 충돌' },
    high:   { color: 'bg-rose-500',    text: 'text-rose-700 dark:text-rose-300',    label: '호불호 강함' },
  };
  const v = map[lv] || map.medium;
  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
        <span className="text-xs font-bold text-slate-600 dark:text-slate-400">분산 지수</span>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold ${v.text}`}>{v.label}</span>
          <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{variance ?? 0}</span>
        </div>
      </div>
      <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${v.color} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

// 합격 가능성 분포 바 — 대학 티어별 확률 표시
const AdmissionProbabilityBar = ({ label, value, accent }) => {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5 flex-wrap gap-1">
        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{label}</span>
        <span className={`text-base font-bold font-mono ${accent.text}`}>{pct}%</span>
      </div>
      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        <div className={`h-full ${accent.bar} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
};

export const MultiPerspectiveCard = ({ multi, forceOpen = false }) => {
  if (!multi) return null;
  const evaluators = multi.evaluators || [];
  const consensus = multi.consensus || {};
  const prob = multi.admissionProbability || {};
  if (evaluators.length === 0) return null;

  const [open, setOpen] = useState(forceOpen);
  const isOpen = forceOpen || open;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-300 dark:border-slate-600 shadow-sm">
      {/* 헤더 */}
      <button
        type="button"
        onClick={() => !forceOpen && setOpen((o) => !o)}
        className={`w-full bg-gradient-to-r from-slate-800 via-indigo-800 to-purple-800 p-5 sm:p-6 text-white text-left transition ${
          isOpen ? 'rounded-t-xl' : 'rounded-xl'
        } ${forceOpen ? 'cursor-default' : 'hover:brightness-110'}`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Users className="w-6 h-6" />
          <h2 className="text-lg sm:text-xl font-bold">3관점 평가 시뮬레이션</h2>
          <InfoTooltip content="신뢰도·탐구·전공 적합성 — 서로 다른 가치 기준을 가진 입학사정관 3명을 시뮬레이션합니다. 같은 문장도 평가자에 따라 점수가 ±5~25점 차이가 나는 게 정상입니다. 점수보다 분산(의견 차이)과 공통 약점이 입시 결과에 더 큰 영향을 줄 수 있습니다." />
          <div className="ml-auto flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-full bg-white/25 text-base font-bold backdrop-blur-sm">
              평균 {consensus.averageScore ?? '-'} / 100
            </span>
            {!forceOpen && (
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
            )}
          </div>
        </div>
        <p className="text-sm text-white/90 leading-relaxed">
          평가 요소·가중치가 다른 <span className="font-bold">독립 평가자 3명</span>의 판단을 동시에 시뮬레이션 — 단일 점수 대신 <span className="font-bold">합의·분산·확률 분포</span>를 함께 제공합니다.
        </p>
      </button>

      {isOpen && (
        <>
          {/* 3 평가자 카드 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-5 sm:p-6 bg-slate-50/50">
            {evaluators.map((ev) => {
              const meta = EVALUATORS.find((e) => e.id === ev.id) || EVALUATORS[0];
              const Icon = meta.icon;
              const sc = scoreColorOf(ev.score ?? 0);
              return (
                <div key={ev.id} className={`rounded-xl border-2 ${meta.cardBorder} ${meta.cardBg} overflow-hidden`}>
                  {/* 평가자 헤더 — 페르소나/가치관 안내 */}
                  <div className={`bg-gradient-to-br ${meta.headerBg} p-4 text-white`}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-sm">
                        <Icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold leading-tight">{meta.name}</div>
                        <div className="text-[10px] text-white/70 font-mono">{meta.nameEn} Reviewer</div>
                      </div>
                    </div>
                    <p className="text-[11px] text-white/80 leading-relaxed">{meta.persona}</p>
                  </div>
                  {/* 점수 */}
                  <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">평가 점수</span>
                      <span className={`text-3xl font-bold font-mono ${sc.text}`}>{ev.score ?? '-'}</span>
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-700"
                        style={{ width: `${Math.max(0, Math.min(100, ev.score ?? 0))}%`, backgroundColor: sc.fill }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 font-mono leading-relaxed">
                      가중치 · {meta.weights}
                    </div>
                  </div>
                  {/* 사고 흐름 */}
                  {ev.reasoningTrace?.length > 0 && (
                    <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Activity className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">사고 과정</span>
                      </div>
                      <ol className="space-y-1.5">
                        {ev.reasoningTrace.map((step, i) => (
                          <li key={i} className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed pl-2 border-l-2 border-slate-300 dark:border-slate-600">
                            <RichText text={step} />
                          </li>
                        ))}
                      </ol>
                    </div>
                  )}
                  {/* 판정 + 약점 + 피드백 */}
                  <div className="p-4 space-y-3">
                    {ev.verdict && (
                      <div>
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">최종 판정</div>
                        <p className={`text-base font-semibold ${meta.textAccent} leading-relaxed`}>
                          <RichText text={ev.verdict} />
                        </p>
                      </div>
                    )}
                    {ev.criticalWeakness && (
                      <div className="bg-rose-50 dark:bg-rose-900/30 border-l-4 border-rose-400 rounded-r p-2.5">
                        <div className="text-xs font-bold text-rose-700 dark:text-rose-300 uppercase tracking-wide mb-0.5 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> 치명적 약점
                        </div>
                        <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                          <RichText text={ev.criticalWeakness} />
                        </p>
                      </div>
                    )}
                    {ev.feedbackComment && (
                      <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-2.5">
                        <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1 flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" /> 피드백
                        </div>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
                          "<RichText text={ev.feedbackComment} />"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 합의 점수 + 분산 지수 + 충돌 + 합격 확률 + 종합 요약 */}
          <div className="px-5 sm:px-6 pb-6 space-y-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-indigo-200 dark:border-indigo-700 p-5">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Scale className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">합의 점수 + 분산 지수</h3>
                <InfoTooltip content="합의 점수는 세 평가자 점수의 평균입니다. 분산 지수가 낮으면 평가자들의 의견이 일치하는 안정적 강점이고, 높으면 호불호가 갈리는 위험·기회 양면을 가진 문장입니다." />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <div className="flex items-center justify-between mb-2 flex-wrap gap-1">
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wide">평균 (합의 점수)</span>
                    <span className="text-3xl font-bold font-mono text-indigo-700 dark:text-indigo-300">{consensus.averageScore ?? '-'}</span>
                  </div>
                  <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                      style={{ width: `${Math.max(0, Math.min(100, consensus.averageScore ?? 0))}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 px-1 font-mono">
                    <span>0</span><span>50</span><span>100</span>
                  </div>
                </div>
                <div className="flex flex-col justify-center">
                  <VarianceIndicator variance={consensus.varianceScore} level={consensus.varianceLevel} />
                </div>
              </div>
              {consensus.interpretation && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold text-indigo-700 dark:text-indigo-300">해석 · </span>
                    <RichText text={consensus.interpretation} />
                  </p>
                </div>
              )}
            </div>

            {/* 의견 충돌 포인트 */}
            {consensus.conflictPoints?.length > 0 && (
              <div className="bg-amber-50/50 rounded-xl border border-amber-200 dark:border-amber-700 p-5">
                <div className="flex items-center gap-2 mb-3 flex-wrap">
                  <Zap className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">의견 충돌 지점</h3>
                  <InfoTooltip content="세 평가자의 해석이 가장 크게 갈리는 주제와 각자의 입장을 보여줍니다. 학종 평가에서 입학사정관 성향에 따라 결과가 갈릴 수 있는 위험·기회 영역입니다." />
                </div>
                <div className="space-y-3">
                  {consensus.conflictPoints.map((cp, i) => (
                    <div key={i} className="bg-white dark:bg-slate-800 rounded-lg border border-amber-200 dark:border-amber-700 p-4">
                      <div className="text-sm font-bold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-1.5">
                        <span className="w-5 h-5 rounded-full bg-amber-500 text-white flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                        {cp.topic}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {[
                          { ev: EVALUATORS[0], view: cp.conservativeView },
                          { ev: EVALUATORS[1], view: cp.academicView },
                          { ev: EVALUATORS[2], view: cp.fitView },
                        ].map((row, j) => {
                          const Icon = row.ev.icon;
                          return (
                            <div key={j} className={`rounded-lg p-3 border ${row.ev.cardBorder} ${row.ev.cardBg}`}>
                              <div className={`flex items-center gap-1 mb-1.5 text-xs font-bold ${row.ev.textAccent} uppercase tracking-wide`}>
                                <Icon className="w-3.5 h-3.5" />
                                {row.ev.name}
                              </div>
                              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                                <RichText text={row.view} />
                              </p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 합격 가능성 분포 — 대학 티어별 확률 */}
            <div className="bg-white dark:bg-slate-800 rounded-xl border-2 border-purple-200 p-5">
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <Crown className="w-5 h-5 text-purple-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">합격 가능성 분포</h3>
                <InfoTooltip content="평균 점수·분산·약점을 종합한 추정 확률입니다. 분산이 클수록 최상위 가능성이 낮아지는 경향을 반영합니다. 단순 합격/불합격이 아닌 '대학 티어별' 확률로 표시되어 현실적 의사결정에 도움이 됩니다." />
              </div>
              <div className="space-y-4">
                <AdmissionProbabilityBar label="🏆 최상위 대학 (SKY · 의약 · 서울교대)" value={prob.topTier}
                  accent={{ text: 'text-rose-700 dark:text-rose-300',    bar: 'bg-gradient-to-r from-rose-500 to-pink-500' }} />
                <AdmissionProbabilityBar label="🎯 상위권 대학 (서울 주요 · 거점국립 인기학과)" value={prob.upperTier}
                  accent={{ text: 'text-amber-700 dark:text-amber-300',   bar: 'bg-gradient-to-r from-amber-500 to-orange-500' }} />
                <AdmissionProbabilityBar label="✅ 안정권 (일반 4년제)" value={prob.stableTier}
                  accent={{ text: 'text-emerald-700 dark:text-emerald-300', bar: 'bg-gradient-to-r from-emerald-500 to-teal-500' }} />
              </div>
              {prob.interpretation && (
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold text-purple-700">해석 · </span>
                    <RichText text={prob.interpretation} />
                  </p>
                </div>
              )}
            </div>

            {/* 공통 치명 약점 + 종합 요약 */}
            {(multi.criticalWeaknessConsensus || multi.summary) && (
              <div className="bg-slate-900 rounded-xl p-5 text-white">
                {multi.criticalWeaknessConsensus && (
                  <div className="mb-4 pb-4 border-b border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-5 h-5 text-rose-400" />
                      <h3 className="text-base font-bold">공통 치명 약점</h3>
                      <InfoTooltip content="세 평가자가 모두 우려한 한 가지 약점입니다. 평균 점수보다 입시 결과에 더 큰 영향을 주는 경우가 많습니다." />
                    </div>
                    <p className="text-base text-slate-200 leading-relaxed pl-7">
                      <RichText text={multi.criticalWeaknessConsensus} />
                    </p>
                  </div>
                )}
                {multi.summary && (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Gauge className="w-5 h-5 text-indigo-300" />
                      <h3 className="text-base font-bold">종합 평가 요약</h3>
                    </div>
                    <p className="text-base text-slate-200 leading-relaxed pl-7">
                      <RichText text={multi.summary} />
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
