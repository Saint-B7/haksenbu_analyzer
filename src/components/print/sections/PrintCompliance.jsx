// 인쇄 보고서 — 규정 준수 검사 (기재요령 위반) 섹션
import React from 'react';

export function PrintCompliance({ complianceViolations }) {
  if (!complianceViolations) return null;

  return (
    <div className="print-section">
      <div className="print-section-title">규정 준수 검사 (기재요령 위반)</div>

      {complianceViolations.summary.total === 0 ? (
        <div style={{ fontSize: '12px', color: '#059669', fontWeight: 600 }}>✓ 위반 사항 없음</div>
      ) : (
        <>
          <div style={{ fontSize: '12px', color: '#dc2626', fontWeight: 700, marginBottom: '6px' }}>
            위반 {complianceViolations.summary.total}건 검출
          </div>
          {complianceViolations.matches.map((m, i) => (
            <div key={i} style={{
              fontSize: '11px', lineHeight: 1.5,
              padding: '5px 8px', borderLeft: '3px solid #f43f5e',
              background: '#fff1f2', borderRadius: '0 4px 4px 0', marginBottom: '4px',
            }}>
              <span style={{ fontWeight: 700, color: '#9f1239' }}>[{m.category}] </span>
              <span style={{ color: '#374151' }}>{m.excerpt}</span>
              {m.hint && (
                <div style={{ color: '#6b7280', fontSize: '10px', marginTop: '2px' }}>{m.hint}</div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
