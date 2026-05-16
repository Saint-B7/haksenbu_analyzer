// 인쇄 보고서 — 상위권 체크리스트 (10가지 도약) 섹션
import React from 'react';

export function PrintTopTier({ result }) {
  if (!result.topTierCheck?.length) return null;

  return (
    <div className="print-section">
      <div className="print-section-title">상위권 체크리스트 (10가지 도약)</div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px' }}>
        {result.topTierCheck.map((item, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', fontSize: '11px' }}>
            <span style={{
              color: item.met ? '#10b981' : '#f43f5e',
              fontWeight: 700, flexShrink: 0, marginTop: '1px',
            }}>
              {item.met ? '✓' : '✗'}
            </span>
            <div>
              <div style={{ fontWeight: 600, color: '#1e293b' }}>
                {item.name || item.criterion}
              </div>
              {item.comment && (
                <div style={{ color: '#64748b', fontSize: '10px', lineHeight: 1.4, marginTop: '1px' }}>
                  {item.comment}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
