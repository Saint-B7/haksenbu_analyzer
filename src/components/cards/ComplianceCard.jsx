// ──────────────────────────────────────────────────────────
// 기재요령 위반 자동 검출 카드
// 정규식 룰셋(11개) 기반으로 본문에서 기재 금지·주의 표현을 감지
// 위반 부분은 빨간 형광펜으로 본문 하이라이트, 카테고리별 그룹 표시
// 룰셋 기반이므로 모델 응답과 무관하게 즉시 동작
// ──────────────────────────────────────────────────────────

import React from 'react';
import { ShieldAlert, CheckCircle2, XCircle, AlertTriangle, Info } from 'lucide-react';
import { SEVERITY_META } from '../../lib/compliance';
import { CollapsibleCard } from '../common';

export const ComplianceCard = ({ violations, originalText, forceOpen = false }) => {
  if (!violations) return null;

  const { matches, summary } = violations;
  const total = matches.length;

  // 카테고리별 그룹화 — 같은 카테고리는 한 섹션으로 묶음
  const grouped = {};
  matches.forEach((m) => {
    if (!grouped[m.category]) grouped[m.category] = [];
    grouped[m.category].push(m);
  });

  // 본문 하이라이트 — 매칭 위치들을 잘라 위반 부분에 highlight 적용
  // 매칭은 index 순으로 정렬되어 있고 겹침 없음을 가정(룰셋 설계상 거의 겹치지 않음)
  const renderHighlightedText = () => {
    if (!originalText || matches.length === 0) {
      return <span className="text-slate-700 dark:text-slate-300">{originalText || '(본문 없음)'}</span>;
    }
    const segments = [];
    let cursor = 0;
    matches.forEach((m, i) => {
      // 매칭 직전까지의 일반 텍스트
      if (m.index > cursor) {
        segments.push({ text: originalText.slice(cursor, m.index), highlighted: false, key: `t${i}` });
      }
      // 매칭된 위반 표현
      segments.push({
        text: originalText.slice(m.index, m.index + m.excerpt.length),
        highlighted: true,
        severity: m.severity,
        category: m.category,
        key: `m${i}`,
      });
      cursor = m.index + m.excerpt.length;
    });
    // 꼬리 일반 텍스트
    if (cursor < originalText.length) {
      segments.push({ text: originalText.slice(cursor), highlighted: false, key: 'tail' });
    }
    return (
      <>
        {segments.map((s) => {
          if (!s.highlighted) return <span key={s.key} className="text-slate-700 dark:text-slate-300">{s.text}</span>;
          const meta = SEVERITY_META[s.severity] || SEVERITY_META.warning;
          return (
            <mark
              key={s.key}
              className={`${meta.highlight} ${meta.text} px-0.5 rounded font-bold`}
              title={`${meta.label} · ${s.category}`}
            >
              {s.text}
            </mark>
          );
        })}
      </>
    );
  };

  // 헤더 우측 뱃지 — 위반 수에 따라 색 변동
  const headerBadge = total === 0 ? (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-700 whitespace-nowrap">
      위반 없음
    </span>
  ) : (
    <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap border ${
      summary.critical > 0 ? 'bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-700'
      : summary.high > 0 ? 'bg-orange-50 text-orange-700 border-orange-200'
      : 'bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700'
    }`}>
      {total}건 검출
    </span>
  );

  return (
    <CollapsibleCard
      icon={ShieldAlert}
      title="기재요령 위반 자동 검출"
      tooltip="한국 교육부 학교생활기록부 기재요령에 따라 본문에서 기재 금지·주의 표현을 정규식 룰셋으로 자동 검출합니다. 검출된 표현은 빨간 형광펜으로 하이라이트되며, 카테고리(외부 수상·공인 자격증·부모 정보·사교육·논문/특허·외부 기관·창의 경진대회·석차)별로 그룹화되어 표시됩니다. 룰셋 기반이므로 모델 응답 결과와 무관하게 즉시 동작하며, 누락 가능성이 있으니 최종 검토는 교사 본인이 수행해야 합니다."
      defaultOpen={total > 0}
      forceOpen={forceOpen}
      headerExtra={headerBadge}
    >
      {total === 0 ? (
        /* 위반 0건 — 통과 메시지 */
        <div className="bg-emerald-50/60 border border-emerald-200 dark:border-emerald-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-emerald-800 dark:text-emerald-200">기재요령 위반 표현이 검출되지 않았습니다</h3>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
            룰셋 기반 자동 검사를 통과했습니다. 다만 룰셋이 모든 위반 표현을 포착하지는 못하므로, 최종 NEIS 입력 전 교사 본인의 검토가 필요합니다.
          </p>
        </div>
      ) : (
        <>
          {/* 요약 통계 — 심각도 3단계 카운트 */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            {['critical', 'high', 'warning'].map((sev) => {
              const meta = SEVERITY_META[sev];
              const count = summary[sev] || 0;
              return (
                <div key={sev} className={`${meta.bg} ${meta.border} border rounded-lg p-3 text-center`}>
                  <div className={`text-xs font-bold ${meta.text} uppercase tracking-wide mb-1`}>{meta.label}</div>
                  <div className={`text-2xl font-bold font-mono ${meta.text}`}>{count}</div>
                </div>
              );
            })}
          </div>

          {/* 본문 하이라이트 — 위반 위치를 형광펜 표시 */}
          <div className="mb-5">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2">본문 하이라이트</div>
            <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-sm leading-relaxed whitespace-pre-wrap break-words max-h-72 overflow-y-auto">
              {renderHighlightedText()}
            </div>
          </div>

          {/* 카테고리별 위반 목록 */}
          <div className="space-y-3">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">카테고리별 검출 내역</div>
            {Object.entries(grouped).map(([category, list]) => {
              const sev = list[0].severity;
              const meta = SEVERITY_META[sev];
              const Icon = sev === 'critical' ? XCircle : sev === 'high' ? AlertTriangle : Info;
              return (
                <div key={category} className={`${meta.bg} ${meta.border} border-l-4 rounded-r-lg p-3.5`}>
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Icon className={`w-4 h-4 ${meta.text}`} />
                    <span className={`font-bold text-sm ${meta.text}`}>{category}</span>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wide bg-white dark:bg-slate-800 ${meta.text} border ${meta.border}`}>
                      {meta.label}
                    </span>
                    <span className="text-xs font-mono text-slate-600 dark:text-slate-400 ml-auto">{list.length}건</span>
                  </div>
                  <div className="space-y-1.5">
                    {list.map((m, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-slate-400 flex-shrink-0">▸</span>
                        <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${meta.highlight} ${meta.text} font-bold`}>
                          {m.excerpt}
                        </code>
                      </div>
                    ))}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200/60">
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold text-slate-500 dark:text-slate-400">권고 · </span>{list[0].hint}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 푸터 — 룰셋 한계 안내 */}
          <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              ※ 본 검출은 정규식 룰셋 기반 자동 분석입니다. 모든 기재요령 위반을 100% 포착하지는 못하며, 최종 NEIS 입력 전 교사 본인의 검토가 반드시 필요합니다. 룰셋은 한국 교육부 학교생활기록부 기재요령을 기반으로 작성되었습니다.
            </p>
          </div>
        </>
      )}
    </CollapsibleCard>
  );
};
