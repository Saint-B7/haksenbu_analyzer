// 인쇄 보고서 — 다각도 평가 (3관점 입학사정관) 섹션
// result.multiPerspectiveEvaluation = {
//   evaluators[]: { id, score, reasoningTrace[], verdict, criticalWeakness, feedbackComment }
//   consensus: { averageScore, varianceScore, varianceLevel, interpretation, conflictPoints[] }
//   admissionProbability: { topTier, upperTier, stableTier, interpretation }
//   criticalWeaknessConsensus, summary
// }
// 화면 카드(MultiPerspectiveCard)와 동일한 깊이로 전문을 출력하며, 모든 텍스트는
// stripBoldMarkup 으로 별표 마크업을 제거한 평문으로 인쇄한다.
import React from 'react';
import { EVALUATORS } from '../../../data/criteria';
import { stripBoldMarkup } from '../../../lib/text-format';
import { PrintSection, PrintHighlight } from '../PrintSection.jsx';
import { PRINT_DESCRIPTIONS } from '../../../data/print-descriptions';

export function PrintMultiPerspective({ result }) {
  const multi = result.multiPerspectiveEvaluation;
  const evaluators = multi?.evaluators || [];
  if (evaluators.length === 0) return null;

  const consensus = multi.consensus;
  const prob = multi.admissionProbability;

  return (
    <PrintSection title="다각도 평가 (3관점 입학사정관)" description={PRINT_DESCRIPTIONS.multi}>

      {/* 평가자별 상세 — 각 평가자가 한 덩어리로 페이지에 들어가도록 print-item */}
      {evaluators.map((ev, i) => {
        const meta = EVALUATORS.find((e) => e.id === ev.id) || EVALUATORS[i] || {};
        const trace = Array.isArray(ev.reasoningTrace) ? ev.reasoningTrace : [];
        return (
          <div key={i} className="print-item" style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '8px', padding: '10px 12px', marginBottom: '8px',
          }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#4f46e5' }}>{meta.name || ev.id}</span>
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>{meta.persona ? stripBoldMarkup(meta.persona) : ''}</span>
              <span style={{ marginLeft: 'auto', fontSize: '16px', color: '#0f172a' }}>
                <PrintHighlight>{ev.score}</PrintHighlight><span style={{ fontSize: '10px', color: '#94a3b8' }}>/100</span>
              </span>
            </div>

            {/* 판단 근거 단계(reasoningTrace) 전체 */}
            {trace.length > 0 && (
              <div style={{ marginBottom: '4px' }}>
                {trace.map((t, ti) => (
                  <div key={ti} style={{ fontSize: '10px', color: '#475569', lineHeight: 1.5 }}>
                    {stripBoldMarkup(t)}
                  </div>
                ))}
              </div>
            )}

            {ev.verdict && (
              <div style={{ fontSize: '10px', color: '#374151', marginBottom: '2px' }}>
                <span style={{ fontWeight: 700, color: '#94a3b8' }}>판정 · </span>{stripBoldMarkup(ev.verdict)}
              </div>
            )}
            {ev.criticalWeakness && (
              <div style={{ fontSize: '10px', color: '#b91c1c', marginBottom: '2px' }}>
                <span style={{ fontWeight: 700 }}>핵심 약점 · </span>{stripBoldMarkup(ev.criticalWeakness)}
              </div>
            )}
            {ev.feedbackComment && (
              <div style={{ fontSize: '10px', color: '#475569', fontStyle: 'italic' }}>
                {stripBoldMarkup(ev.feedbackComment)}
              </div>
            )}
          </div>
        );
      })}

      {/* 합의 분석 */}
      {consensus && (
        <div className="print-item" style={{ fontSize: '11px', color: '#374151', marginBottom: '8px' }}>
          <div style={{ fontWeight: 700, color: '#4f46e5', marginBottom: '3px' }}>합의 분석</div>
          <div style={{ fontSize: '10px', marginBottom: '2px' }}>
            평균 {consensus.averageScore}점 · 분산 {consensus.varianceScore}
            {consensus.varianceLevel ? ` (${consensus.varianceLevel})` : ''}
          </div>
          {consensus.interpretation && (
            <div style={{ fontSize: '10px', color: '#475569', marginBottom: '4px' }}>
              {stripBoldMarkup(consensus.interpretation)}
            </div>
          )}
          {/* 의견이 갈리는 충돌 지점 — 관점별 입장 전문 */}
          {Array.isArray(consensus.conflictPoints) && consensus.conflictPoints.map((cp, ci) => (
            <div key={ci} style={{
              fontSize: '10px', color: '#475569', borderLeft: '2px solid #c7d2fe',
              paddingLeft: '6px', marginBottom: '3px',
            }}>
              <span style={{ fontWeight: 700, color: '#4338ca' }}>{stripBoldMarkup(cp.topic)} · </span>
              {cp.conservativeView && <div>신뢰형: {stripBoldMarkup(cp.conservativeView)}</div>}
              {cp.academicView && <div>탐구형: {stripBoldMarkup(cp.academicView)}</div>}
              {cp.fitView && <div>적합성형: {stripBoldMarkup(cp.fitView)}</div>}
            </div>
          ))}
        </div>
      )}

      {/* 합격 가능성 분포 */}
      {prob && (
        <div className="print-item" style={{ fontSize: '11px', color: '#374151', marginBottom: '8px' }}>
          <div style={{ fontWeight: 700, color: '#4f46e5', marginBottom: '3px' }}>합격 가능성 분포</div>
          <div style={{ fontSize: '10px', marginBottom: '2px' }}>
            최상위권 {prob.topTier}% · 상위권 {prob.upperTier}% · 안정권 {prob.stableTier}%
          </div>
          {prob.interpretation && (
            <div style={{ fontSize: '10px', color: '#475569' }}>{stripBoldMarkup(prob.interpretation)}</div>
          )}
        </div>
      )}

      {/* 공통 약점 */}
      {multi.criticalWeaknessConsensus && (
        <div className="print-item" style={{ fontSize: '10px', color: '#b91c1c', marginBottom: '6px' }}>
          <span style={{ fontWeight: 700 }}>공통 약점 · </span>{stripBoldMarkup(multi.criticalWeaknessConsensus)}
        </div>
      )}

      {/* 종합 요약 */}
      {multi.summary && (
        <div className="print-item" style={{
          fontSize: '11px', color: '#374151', lineHeight: 1.7,
          background: '#eef2ff', borderRadius: '6px', padding: '8px 10px',
        }}>
          <span style={{ fontWeight: 700, color: '#4338ca' }}>종합 요약 · </span>{stripBoldMarkup(multi.summary)}
        </div>
      )}
    </PrintSection>
  );
}
