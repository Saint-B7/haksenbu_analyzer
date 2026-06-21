// ──────────────────────────────────────────────────────────
// 6단계 서사 흐름 시각화
// 자율/진로/동아리/봉사/세특 등 항목 본문을
// ①계기 ②탐구 ③성장 ④도약 ⑤확산 ⑥평가 6박스로 분해
// 각 박스에 키워드, 품질 점수, 단계별 진단·대안 문장을 표시
//
// 구조:
//   UnifiedStructureFlow  — 외곽 카드 + 6박스 그리드(데스크톱/모바일)
//   StructureStageBox     — 단일 단계 박스(메모이제이션 가능한 작은 컴포넌트)
// ──────────────────────────────────────────────────────────

import React from 'react';
import { Microscope, ArrowRight, ArrowDown } from 'lucide-react';
import { NARRATIVE_STAGES } from '../data/criteria';
import { STATUS_COLORS } from '../data/colors';
import {
  KEYWORDS_DISPLAY_LIMIT,
  STRUCTURE_FALLBACK_SCORES,
} from '../data/constants';
import { RichText, CollapsibleCard } from './common';

/**
 * 단일 서사 단계 박스 — 한 단계(①계기 ~ ⑥평가)의 분석 내용을 카드로 표시.
 *
 * 별도 함수 컴포넌트로 분리한 이유:
 *   - React DevTools에서 각 박스가 이름으로 보여서 디버깅이 쉬워짐
 *   - 동일한 입력에 대해 React.memo로 메모이제이션을 적용할 수 있는 단위가 됨
 */
const StructureStageBox = ({ item, stageIdx }) => {
  const meta = NARRATIVE_STAGES[item.stage - 1] || NARRATIVE_STAGES[stageIdx];
  const status = STATUS_COLORS[item.status] || STATUS_COLORS.missing;

  // qualityScore: 본문 질에 따라 미세 차이를 보여주는 점수.
  // AI가 0~100 점수를 직접 채워주지 않을 경우 status 등급별 fallback 사용.
  const qScore = (typeof item.qualityScore === 'number')
    ? Math.max(0, Math.min(100, item.qualityScore))
    : (STRUCTURE_FALLBACK_SCORES[item.status] ?? STRUCTURE_FALLBACK_SCORES.missing);

  return (
    <div className={`flex flex-col rounded-lg border-2 ${status.border} ${status.bg} p-3.5`}>
      <div className="flex items-center justify-between mb-2 gap-1">
        <span className="text-base font-bold" style={{ color: meta.hex }}>
          {meta.mark} {meta.name}
        </span>
        <span className={`text-xs px-1.5 py-0.5 rounded font-bold ${status.text} bg-white dark:bg-slate-800 border ${status.border}`}>
          {status.label}
        </span>
      </div>
      <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 font-medium">{meta.desc}</div>

      {/* 품질 게이지(0~100) */}
      <div className="mb-2.5">
        <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
          <span className="font-semibold">품질</span>
          <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{qScore}</span>
        </div>
        <div className="h-1.5 bg-white dark:bg-slate-800 rounded-full overflow-hidden border border-slate-200 dark:border-slate-700">
          <div className={`h-full ${status.barBg} transition-all duration-500`} style={{ width: `${qScore}%` }} />
        </div>
      </div>

      {/* 본문 분석 핵심 내용 */}
      {item.keyContent
        ? <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed mb-2"><RichText text={item.keyContent} /></p>
        : <p className="text-sm text-slate-400 italic mb-2">본문에서 식별되지 않음</p>}

      {/* 본문 발췌 인용 */}
      {item.excerpt && (
        <div className="text-xs text-slate-600 dark:text-slate-400 italic mb-2 pl-2 border-l-2 border-slate-300 dark:border-slate-600">
          "{item.excerpt}"
        </div>
      )}

      {/* AI 진단 코멘트 */}
      {item.diagnosis && (
        <div className="text-xs text-slate-700 dark:text-slate-300 mt-1 mb-2 leading-relaxed">
          <span className="font-bold text-slate-500 dark:text-slate-400">진단 · </span>
          <RichText text={item.diagnosis} />
        </div>
      )}

      {/* 단계별 대안 문장 — 어떻게 한 단계 발전시킬지 제시 */}
      {item.stageRewrite && (
        <div className="text-xs text-indigo-800 dark:text-indigo-200 leading-relaxed mt-1 mb-2 p-2 bg-indigo-50/70 dark:bg-indigo-900/30 border-l-3 border-indigo-400 dark:border-indigo-500 rounded-r">
          <span className="font-bold text-indigo-600 dark:text-indigo-300">대안 문장 · </span>
          <RichText text={item.stageRewrite} />
        </div>
      )}

      {/* 단계별 키워드(상한 KEYWORDS_DISPLAY_LIMIT개만 노출) */}
      {item.keywords?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-auto pt-1">
          {item.keywords.slice(0, KEYWORDS_DISPLAY_LIMIT).map((k, i) => (
            <span key={i} className="text-[11px] px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 font-medium">
              #{k}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

export const UnifiedStructureFlow = ({ structureMap, forceOpen = false }) => {
  // 입력 검증: 6박스가 빠짐없이 들어와야 함, 누락 시 빈 박스로 자동 채움
  const safeMap = (structureMap && structureMap.length === 6)
    ? structureMap
    : NARRATIVE_STAGES.map((s) => ({
        stage: s.id,
        keyContent: '',
        keywords: [],
        status: 'missing',
        qualityScore: 0,
        excerpt: '',
        diagnosis: '',
      }));

  return (
    <CollapsibleCard
      icon={Microscope}
      title="문장의 서사 (6단계 흐름 + 진단)"
      tooltip="좋은 학생부 문장은 ① 계기에서 시작해 ⑥ 평가로 끝나는 한 편의 이야기 구조를 가집니다. 각 박스에는 본문 발췌·핵심 키워드·5단계 등급(누락·약함·보통·강함·탁월)·품질 점수(0~100)·진단 코멘트가 함께 표시됩니다. 항목별로 강조 단계가 다릅니다 — 자율은 ⑤확산, 동아리·세특·진로는 ②탐구, 행특·세특은 ⑥평가가 핵심."
      forceOpen={forceOpen}
    >
      {/* 데스크톱: 가로 흐름, 모바일: 세로 흐름 — 화살표 방향도 다르게 */}
      <div className="hidden md:flex items-stretch gap-1 overflow-x-auto pb-2 narrative-flow-desktop">
        {safeMap.map((item, idx) => (
          <div key={item.stage} className="flex items-stretch flex-shrink-0">
            <div className="w-56 lg:w-60">
              <StructureStageBox item={item} stageIdx={idx} />
            </div>
            {idx < 5 && (
              <div className="flex items-center px-1.5">
                <ArrowRight className="w-5 h-5 text-slate-400" />
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="md:hidden flex flex-col items-stretch gap-1 narrative-flow-mobile">
        {safeMap.map((item, idx) => (
          <div key={item.stage} className="flex flex-col items-center">
            <div className="w-full">
              <StructureStageBox item={item} stageIdx={idx} />
            </div>
            {idx < 5 && <ArrowDown className="w-5 h-5 text-slate-400 my-1" />}
          </div>
        ))}
      </div>
    </CollapsibleCard>
  );
};
