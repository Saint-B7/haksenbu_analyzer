// ──────────────────────────────────────────────────────────
// 공통 프리젠테이션 컴포넌트
// RichText: **굵게** 마크다운 강조 표시를 노란 배경 강조로 렌더
// InfoTooltip: 호버 시 설명 툴팁 표시(z-50, 다른 sticky 요소 위로)
// CardHeader: 펼쳐진 카드의 상단 제목 줄
// CollapsibleCard: 점진적 공개를 위한 접힘/펼침 카드(인쇄·HTML 저장 시 forceOpen)
// ──────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Info, ChevronDown } from 'lucide-react';

export const RichText = ({ text, className = '' }) => {
  if (!text) return null;
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return (
    <span className={className}>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-bold text-slate-900 dark:text-slate-100 bg-yellow-100/60 px-0.5 rounded">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  );
};

export const InfoTooltip = ({ content }) => (
  <span className="relative inline-flex items-center group/tt cursor-help align-middle">
    <Info className="w-4 h-4 text-slate-400 group-hover/tt:text-indigo-500 transition" />
    {/* z-50: 모든 sticky/카드 wrapper 위, 폭은 모바일~데스크톱 반응형 */}
    <span className="absolute z-50 left-1/2 -translate-x-1/2 bottom-full mb-2 w-72 sm:w-80 md:w-96 px-3 py-2.5 bg-slate-900 text-white text-xs rounded-lg shadow-xl opacity-0 group-hover/tt:opacity-100 pointer-events-none transition leading-relaxed font-normal text-left">
      {content}
      <span className="absolute top-full left-1/2 -translate-x-1/2 -mt-px w-0 h-0 border-l-[6px] border-r-[6px] border-t-[6px] border-transparent border-t-slate-900" />
    </span>
  </span>
);

export const CardHeader = ({ icon: Icon, title, tooltip, children, color = 'text-indigo-600' }) => (
  <div className="flex items-center gap-2 mb-4 flex-wrap">
    {Icon && <Icon className={`w-5 h-5 ${color}`} />}
    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100">{title}</h2>
    {tooltip && <InfoTooltip content={tooltip} />}
    {children && <div className="ml-auto">{children}</div>}
  </div>
);

// 점진적 공개(progressive disclosure)를 위한 카드
// 헤더 클릭으로 본문 접기/펼치기, 모바일·긴 결과 페이지 가독성 향상
export const CollapsibleCard = ({
  icon: Icon,
  title,
  tooltip,
  defaultOpen = false,
  forceOpen = false,    // 인쇄·HTML 저장 시 강제 펼침
  headerExtra,          // 헤더 우측에 표시할 보조 정보(점수 뱃지 등)
  className = '',
  children,
}) => {
  const [open, setOpen] = useState(defaultOpen);
  const isOpen = forceOpen || open;
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm ${className}`}>
      <button
        type="button"
        onClick={() => !forceOpen && setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 p-4 sm:p-5 text-left transition ${
          forceOpen ? 'cursor-default' : 'hover:bg-slate-50/70'
        }`}
        aria-expanded={isOpen}
      >
        {Icon && <Icon className="w-5 h-5 text-indigo-600 flex-shrink-0" />}
        <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate">{title}</h2>
        {tooltip && <InfoTooltip content={tooltip} />}
        <div className="ml-auto flex items-center gap-2 flex-shrink-0">
          {headerExtra}
          {!forceOpen && (
            <ChevronDown
              className={`w-5 h-5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>
      {isOpen && (
        <div className="px-4 sm:px-5 pb-5 sm:pb-6 pt-1 border-t border-slate-100 dark:border-slate-700">
          {children}
        </div>
      )}
    </div>
  );
};
