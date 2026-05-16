// 인쇄 보고서 — 재작성 제안 (AI 대안 문장) 섹션
import React from 'react';

export function PrintRewrite({ result }) {
  if (!result.rewrittenVersion) return null;

  return (
    <div className="print-section">
      <div className="print-section-title">재작성 제안 (AI 대안 문장)</div>

      <div style={{
        fontSize: '12px', color: '#374151', lineHeight: 1.8,
        padding: '12px 14px', background: '#f0f9ff',
        border: '1px solid #bae6fd', borderRadius: '8px',
      }}>
        {result.rewrittenVersion}
      </div>
    </div>
  );
}
