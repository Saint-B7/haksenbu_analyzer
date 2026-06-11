// 인쇄 보고서 — 종합 점수 & DNA 섹션
// result.dnaChecklist[] = { id, name, satisfied, qualityScore, evidence, dnaRewrite }
// 화면 카드와 동일한 깊이로 DNA 7요소의 근거(evidence)와 요소별 대안(dnaRewrite)까지
// 전문 출력한다. 모든 텍스트는 stripBoldMarkup 으로 별표 마크업을 제거한 평문으로 인쇄.
import React from 'react';
import { stripBoldMarkup } from '../../../lib/text-format';
import { PrintSection, PrintHighlight, PRINT_TOKENS } from '../PrintSection.jsx';
import { PRINT_DESCRIPTIONS } from '../../../data/print-descriptions';

export function PrintOverallScore({ result }) {
  if (result.overallScore === undefined) return null;

  return (
    <PrintSection title="종합 점수 & DNA" description={PRINT_DESCRIPTIONS.score}>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '20px', marginBottom: '10px' }}>
        {/* 점수 원형 배지 */}
        <div style={{
          width: '60px', height: '60px', borderRadius: '50%', flexShrink: 0,
          background: '#eef2ff', border: '3px solid #6366f1',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '20px', fontWeight: 800, color: '#4f46e5',
        }}>
          {result.overallScore}
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '12px', marginBottom: '4px', color: '#374151' }}>
            DNA 충족: <PrintHighlight>{result.satisfiedCount ?? '-'} / 7</PrintHighlight>
            {' · '}최상위 도약: <PrintHighlight>{result.topTierMetCount ?? '-'} / 10</PrintHighlight>
          </div>
          {result.scoreReason && (
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.6 }}>
              {stripBoldMarkup(result.scoreReason)}
            </div>
          )}
        </div>
      </div>

      {/* DNA 7요소 소제목 + 설명 (DNA는 별도 섹션이 아니라 이 카드 안에 둔다) */}
      {result.dnaChecklist && (
        <div style={{ marginTop: '12px' }}>
          <div style={{ fontSize: '12px', fontWeight: 700, color: PRINT_TOKENS.accent }}>7가지 핵심 DNA</div>
          <div style={{ fontSize: '9px', color: PRINT_TOKENS.descColor, lineHeight: 1.5, margin: '2px 0 6px' }}>
            {PRINT_DESCRIPTIONS.dna}
          </div>
        </div>
      )}

      {/* DNA 체크리스트 — 요소별 근거(evidence) + 대안(dnaRewrite) 전문 */}
      {result.dnaChecklist && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          {result.dnaChecklist.map((item) => {
            const q = typeof item.qualityScore === 'number' ? item.qualityScore : (item.satisfied ? 75 : 25);
            return (
              // print-item — DNA 요소 하나가 페이지 중간에서 잘리지 않도록 (Phase 4)
              <div key={item.id} className="print-item" style={{
                fontSize: '11px', padding: '4px 0', borderBottom: '1px solid #f1f5f9',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: q >= 50 ? '#10b981' : '#f43f5e', fontWeight: 700, flexShrink: 0 }}>
                    {q >= 50 ? '✓' : '✗'}
                  </span>
                  <span style={{ color: '#1e293b', fontWeight: 700, flex: 1 }}>{item.name}</span>
                  <span style={{ color: '#6b7280', fontWeight: 600 }}>{q}점</span>
                </div>

                {/* 근거 */}
                {item.evidence && (
                  <div style={{ fontSize: '10px', color: '#475569', margin: '2px 0 0 18px' }}>
                    <span style={{ fontWeight: 700, color: '#94a3b8' }}>근거 · </span>{stripBoldMarkup(item.evidence)}
                  </div>
                )}

                {/* 요소별 대안 */}
                {item.dnaRewrite && (
                  <div style={{
                    fontSize: '10px', color: '#0369a1',
                    background: '#f0f9ff', borderRadius: '4px', padding: '4px 6px', margin: '2px 0 0 18px',
                  }}>
                    <span style={{ fontWeight: 700 }}>대안 · </span>{stripBoldMarkup(item.dnaRewrite)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </PrintSection>
  );
}
