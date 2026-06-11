// 인쇄 보고서 — 강점 · 약점 · 보완 제안 섹션
// 모든 텍스트는 stripBoldMarkup 으로 별표 마크업을 제거한 평문으로 인쇄한다.
import React from 'react';
import { stripBoldMarkup } from '../../../lib/text-format';
import { PrintSection } from '../PrintSection.jsx';
import { PRINT_DESCRIPTIONS } from '../../../data/print-descriptions';

function itemText(item, ...keys) {
  if (typeof item === 'string') return item;
  for (const k of keys) {
    if (item?.[k]) return item[k];
  }
  return '';
}

export function PrintStrengthsWeaknesses({ result }) {
  const hasS   = result.strengths?.length > 0;
  const hasW   = result.weaknesses?.length > 0;
  const hasSug = result.improvementSuggestions?.length > 0;
  if (!hasS && !hasW && !hasSug) return null;

  return (
    <PrintSection title="강점 · 약점 · 보완 제안" description={PRINT_DESCRIPTIONS.sw}>

      {/* 강점 / 약점 2열 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: hasSug ? '10px' : 0 }}>
        {hasS && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#059669', marginBottom: '4px' }}>강점</div>
            {result.strengths.map((s, i) => (
              <div key={i} style={{
                fontSize: '11px', color: '#374151', lineHeight: 1.5,
                padding: '3px 8px', borderLeft: '2px solid #10b981', marginBottom: '3px',
              }}>
                {stripBoldMarkup(itemText(s, 'point', 'strength'))}
              </div>
            ))}
          </div>
        )}
        {hasW && (
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#dc2626', marginBottom: '4px' }}>약점</div>
            {result.weaknesses.map((w, i) => (
              <div key={i} style={{
                fontSize: '11px', color: '#374151', lineHeight: 1.5,
                padding: '3px 8px', borderLeft: '2px solid #f43f5e', marginBottom: '3px',
              }}>
                {stripBoldMarkup(itemText(w, 'point', 'weakness'))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 보완 제안 */}
      {hasSug && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6366f1', marginBottom: '4px' }}>보완 제안</div>
          {result.improvementSuggestions.map((s, i) => (
            <div key={i} style={{
              fontSize: '11px', color: '#374151', lineHeight: 1.5,
              padding: '3px 8px', borderLeft: '2px solid #a5b4fc', marginBottom: '3px',
            }}>
              {stripBoldMarkup(itemText(s, 'suggestion', 'action'))}
            </div>
          ))}
        </div>
      )}
    </PrintSection>
  );
}
