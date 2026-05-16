// 인쇄 보고서 — 다각도 평가 (3관점 입학사정관) 섹션
import React from 'react';

export function PrintMultiPerspective({ result }) {
  const multi = result.multiPerspectiveEvaluation;
  if (!multi?.perspectives?.length) return null;

  return (
    <div className="print-section">
      <div className="print-section-title">다각도 평가 (3관점 입학사정관)</div>

      {/* 3관점 카드 — 3열 그리드 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '10px' }}>
        {multi.perspectives.map((p, i) => (
          <div key={i} style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: '8px', padding: '10px',
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: '#4f46e5', marginBottom: '3px' }}>
              {p.perspectiveName}
            </div>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              {p.score}
              <span style={{ fontSize: '10px', color: '#94a3b8' }}>/100</span>
            </div>
            {p.keyComment && (
              <div style={{ fontSize: '10px', color: '#475569', lineHeight: 1.4, marginTop: '4px' }}>
                {p.keyComment}
              </div>
            )}
          </div>
        ))}
      </div>

      {multi.consensus && (
        <div style={{ fontSize: '11px', color: '#374151' }}>
          <span style={{ fontWeight: 700 }}>합의: </span>
          {multi.consensus}
        </div>
      )}
    </div>
  );
}
