// 인쇄 보고서 — 규정 준수 검사 (기재요령 위반) 섹션
// 위반 발췌·힌트 텍스트는 stripBoldMarkup 으로 별표 마크업을 제거한 평문으로 인쇄한다.
import React from 'react';
import { stripBoldMarkup } from '../../../lib/text-format';
import { PrintSection } from '../PrintSection.jsx';
import { PRINT_DESCRIPTIONS } from '../../../data/print-descriptions';

export function PrintCompliance({ complianceViolations }) {
  if (!complianceViolations) return null;

  return (
    <PrintSection title="규정 준수 검사 (기재요령 위반)" description={PRINT_DESCRIPTIONS.compliance}>

      {complianceViolations.summary.total === 0 ? (
        <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>✓ 위반 사항 없음</div>
      ) : (
        <>
          <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700, marginBottom: '6px' }}>
            위반 {complianceViolations.summary.total}건 검출
          </div>
          {complianceViolations.matches.map((m, i) => (
            <div key={i} className="print-item" style={{
              fontSize: '11px', lineHeight: 1.5,
              padding: '5px 8px', borderLeft: '3px solid #f43f5e',
              background: '#fff1f2', borderRadius: '0 4px 4px 0', marginBottom: '4px',
            }}>
              <span style={{ fontWeight: 700, color: '#9f1239' }}>[{stripBoldMarkup(m.category)}] </span>
              <span style={{ color: '#374151' }}>{stripBoldMarkup(m.excerpt)}</span>
              {m.hint && (
                <div style={{ color: '#6b7280', fontSize: '10px', marginTop: '2px' }}>{stripBoldMarkup(m.hint)}</div>
              )}
            </div>
          ))}
        </>
      )}
    </PrintSection>
  );
}
