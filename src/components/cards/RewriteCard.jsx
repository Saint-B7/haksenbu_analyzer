// ──────────────────────────────────────────────────────────
// 대안 문장 카드 — 분석 결과를 반영한 추천 문장을 표시
//
// 분리된 자식 컴포넌트(원본의 인라인 IIFE를 추출):
//   RewriteByteBadge — 우측 상단의 권장 범위 뱃지 + 바이트 수 표시
//   RewriteByteGauge — 권장 1470~1500바이트 구간을 강조한 게이지 바
//
// IIFE를 풀어내어 얻은 이점:
//   - React DevTools에서 각 컴포넌트가 이름으로 보임
//   - 동일한 props에 대해 React.memo 메모이제이션 적용 가능
//   - 단위 테스트(스냅샷·렌더 테스트)를 단독으로 작성하기 쉬움
// ──────────────────────────────────────────────────────────

import React from 'react';
import { BookOpen, Copy } from 'lucide-react';
import {
  NEIS_BYTE_LIMIT,
  NEIS_BYTE_REWRITE_MIN,
  calcNeisBytes,
} from '../../lib/neis-bytes';
import { stripBoldMarkup } from '../../lib/text-format';
import {
  REWRITE_GAUGE_HEADROOM_BASE,
  REWRITE_GAUGE_HEADROOM_OVER,
} from '../../data/constants';
import { InfoTooltip } from '../common';

// 권장 범위(1470~1500B) 안에 있는지 단일 진실(single source of truth)로 계산.
const isInRecommendedRange = (bytes) =>
  bytes >= NEIS_BYTE_REWRITE_MIN && bytes <= NEIS_BYTE_LIMIT;

/**
 * 대안 문장 헤더 우측의 바이트 수 + 권장 범위 뱃지.
 * 권장 범위 안이면 초록색 ✓ 표시, 아니면 회색.
 */
const RewriteByteBadge = ({ rewrittenVersion }) => {
  const altBytes = calcNeisBytes(rewrittenVersion);
  const inRecommended = isInRecommendedRange(altBytes);
  const tone = inRecommended ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-600 dark:text-slate-400';
  const badgeText = inRecommended ? '권장 범위 ✓' : '권장 범위 외';
  const badgeBg = inRecommended
    ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 border-emerald-300'
    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-600';

  return (
    <div className="ml-auto flex items-center gap-2 flex-wrap">
      <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${badgeBg}`}>{badgeText}</span>
      <span className={`text-sm font-mono font-bold ${tone}`}>
        {altBytes} 바이트
      </span>
    </div>
  );
};

/**
 * 권장 1470~1500바이트 구간을 연녹색으로 강조한 게이지 바.
 *
 * 동적 스케일:
 *   scaleMax = max(NEIS_BYTE_LIMIT * BASE, altBytes * OVER)
 *   - 분량이 권장 범위 안이면 1500의 110%(=1650)로
 *   - 권장 범위 초과 시 실제 분량의 105%로 스케일 자동 확장
 *   상수 두 개는 data/constants.js에서 가져온다.
 */
const RewriteByteGauge = ({ rewrittenVersion }) => {
  const altBytes = calcNeisBytes(rewrittenVersion);
  const scaleMax = Math.max(
    NEIS_BYTE_LIMIT * REWRITE_GAUGE_HEADROOM_BASE,
    altBytes * REWRITE_GAUGE_HEADROOM_OVER,
  );
  const pct = Math.min(100, (altBytes / scaleMax) * 100);
  const recommendStartPct = (NEIS_BYTE_REWRITE_MIN / scaleMax) * 100;
  const recommendEndPct = (NEIS_BYTE_LIMIT / scaleMax) * 100;
  const inRecommended = isInRecommendedRange(altBytes);
  const fillColor = inRecommended ? 'bg-emerald-500' : 'bg-slate-400';

  return (
    <div className="mb-4">
      <div className="relative h-2.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
        {/* 권장 구간 배경(1470~1500): 연녹색 강조 */}
        <div
          className="absolute inset-y-0 bg-emerald-200/70"
          style={{ left: `${recommendStartPct}%`, width: `${recommendEndPct - recommendStartPct}%` }}
        />
        {/* 실제 진행 바 */}
        <div className={`h-full transition-all duration-500 ${fillColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold text-center mt-1.5">
        권장 1470~1500바이트
      </div>
    </div>
  );
};

/**
 * 대안 문장 카드 본체. 종합 점수 카드와 함께 펼친 상태로 표시되는 핵심 결과 영역.
 * 별표 마크업(**X**, *)은 stripBoldMarkup으로 화면 표시 전·복사 시 모두 제거.
 *
 * @param {Object} props
 * @param {string}   props.rewrittenVersion - AI가 작성한 추천 문장 원문(별표 포함 가능)
 * @param {boolean}  props.copied           - 부모가 관리하는 "복사됨" 토스트 상태
 * @param {Function} props.onCopy           - 클립보드 복사 핸들러
 */
export const RewriteCard = ({ rewrittenVersion, copied, onCopy }) => {
  if (!rewrittenVersion) return null;

  return (
    <div className="bg-white dark:bg-slate-800 border-2 border-indigo-300 rounded-xl p-5 sm:p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <BookOpen className="w-5 h-5 text-indigo-600" />
        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">대안 문장</h3>
        <InfoTooltip content="모든 분석 결과와 최상위 도약 10기준을 반영해 본문 탐구활동이 자연스럽게 후속 탐구로 이어지도록 작성된 추천 문장. 권장 분량은 1470~1500바이트이며, 분석 결과의 풍부함에 따라 그 범위를 자연스럽게 벗어날 수 있습니다. 명사형 종결, 학생부 기재요령 준수." />
        <RewriteByteBadge rewrittenVersion={rewrittenVersion} />
      </div>

      <RewriteByteGauge rewrittenVersion={rewrittenVersion} />

      {/* 본문 — 별표 마크업 제거 후 평문으로 표시 */}
      <p className="text-base text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
        {stripBoldMarkup(rewrittenVersion)}
      </p>

      <button
        onClick={onCopy}
        className="mt-3 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 rounded-md text-slate-700 dark:text-slate-300 inline-flex items-center gap-1.5"
      >
        <Copy className="w-3.5 h-3.5" />
        {copied ? '복사됨' : '대안 문장 복사'}
      </button>
    </div>
  );
};
