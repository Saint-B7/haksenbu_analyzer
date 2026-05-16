// ──────────────────────────────────────────────────────────
// 근거 엄격성 카드 — 구체적 근거 vs 추상적 표현 비율 검증
// 저자·제목·연도, 표본수·통계값 같은 구체 자료가 본문에 명시되어 있는지
// '관련 자료를 찾아봄' 같은 추상 표현은 모두 미충족 처리
// ──────────────────────────────────────────────────────────

import React from 'react';
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { RichText, InfoTooltip } from '../common';
import { EvidenceDonut } from '../charts/SmallCharts';

export const StrictEvidenceCard = ({ check }) => {
  if (!check) return null;

  const level = check.strictnessLevel;
  // concreteRatio가 직접 안 들어오면 등급 기준 기본값 사용
  const ratio = typeof check.concreteRatio === 'number'
    ? check.concreteRatio
    : level === '통과' ? 80 : level === '부족' ? 50 : 20;

  // 등급별 색상 토큰
  const color =
    level === '통과' ? { bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'border-emerald-300', text: 'text-emerald-800 dark:text-emerald-200' }
    : level === '부족' ? { bg: 'bg-amber-50 dark:bg-amber-900/30', border: 'border-amber-300', text: 'text-amber-800 dark:text-amber-200' }
    :                    { bg: 'bg-rose-50 dark:bg-rose-900/30', border: 'border-rose-300', text: 'text-rose-800 dark:text-rose-200' };
  const Icon = level === '통과' ? ShieldCheck : ShieldAlert;

  return (
    <div className={`rounded-xl border-2 ${color.border} ${color.bg} p-5 sm:p-6`}>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <Icon className={`w-6 h-6 ${color.text}`} />
        <h2 className={`text-lg sm:text-xl font-bold ${color.text}`}>근거 엄격성 체크</h2>
        <InfoTooltip content="본문에 구체적 자료(저자·제목·연도)와 수치(표본수·통계값 등)가 명시되어 있는지 엄격하게 검증합니다. '관련 자료를 찾아봄' 같은 추상적 표현은 모두 미충족 처리됩니다." />
        <span className={`ml-auto px-3 py-1 rounded-full text-base font-bold bg-white dark:bg-slate-800 border ${color.border} ${color.text}`}>
          {level}
        </span>
      </div>

      {/* 도넛 + 종합 평가 코멘트 */}
      <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start mb-5">
        <div className="flex-shrink-0"><EvidenceDonut ratio={ratio} level={level} /></div>
        <div className="flex-1">
          <p className={`text-base ${color.text} leading-relaxed font-semibold mb-2`}>
            <RichText text={check.verdict} />
          </p>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            구체적 근거의 비율이 높을수록 학생부의 신뢰도가 올라갑니다. 학종 평가에서 가장 핵심적으로 보는 부분 중 하나입니다.
          </p>
        </div>
      </div>

      {/* 4-quadrant: 발견된 자료/수치 + 추상 표현/누락 항목 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 발견된 구체적 자료
          </div>
          {check.specificSourcesFound?.length > 0
            ? <ul className="space-y-1">{check.specificSourcesFound.map((s, i) => (
                <li key={i} className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed">• <RichText text={s} /></li>
              ))}</ul>
            : <p className="text-xs text-slate-400 italic">없음</p>}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <div className="text-xs font-bold text-emerald-700 dark:text-emerald-300 mb-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> 발견된 구체적 수치/변인
          </div>
          {check.numericalDataFound?.length > 0
            ? <ul className="space-y-1">{check.numericalDataFound.map((s, i) => (
                <li key={i} className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed font-mono">• {s}</li>
              ))}</ul>
            : <p className="text-xs text-slate-400 italic">없음</p>}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <div className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-2 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> 추상적 표현 (구체화 필요)
          </div>
          {check.abstractExpressions?.length > 0
            ? <ul className="space-y-1">{check.abstractExpressions.map((s, i) => (
                <li key={i} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">• {s}</li>
              ))}</ul>
            : <p className="text-xs text-slate-400 italic">없음</p>}
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-lg p-3 border border-slate-200 dark:border-slate-700">
          <div className="text-xs font-bold text-rose-700 dark:text-rose-300 mb-2 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> 누락된 근거 항목
          </div>
          {check.missingItems?.length > 0
            ? <ul className="space-y-1">{check.missingItems.map((s, i) => (
                <li key={i} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">• {s}</li>
              ))}</ul>
            : <p className="text-xs text-slate-400 italic">없음</p>}
        </div>
      </div>
    </div>
  );
};
