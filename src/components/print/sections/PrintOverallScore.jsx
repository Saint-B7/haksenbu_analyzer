// 인쇄 보고서 — 종합 점수 & DNA 섹션
import React from 'react';

export function PrintOverallScore({ result }) {
  if (result.overallScore === undefined) return null;

  return (
    <div className="print-section">
      <div className="print-section-title">종합 점수 & DNA</div>

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
          <div style={{ fontSize: '12px', fontWeight: 600, marginBottom: '4px', color: '#374151' }}>
            DNA 충족: {result.satisfiedCount ?? '-'} / 7 · 최상위 도약: {result.topTierMetCount ?? '-'} / 10
          </div>
          {result.scoreReason && (
            <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.6 }}>
              {result.scoreReason}
            </div>
          )}
        </div>
      </div>

      {/* DNA 체크리스트 2열 */}
      {result.dnaChecklist && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px', marginTop: '8px' }}>
          {result.dnaChecklist.map((item) => {
            const q = typeof item.qualityScore === 'number' ? item.qualityScore : (item.satisfied ? 75 : 25);
            return (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', padding: '2px 0' }}>
                <span style={{ color: q >= 50 ? '#10b981' : '#f43f5e', fontWeight: 700, flexShrink: 0 }}>
                  {q >= 50 ? '✓' : '✗'}
                </span>
                <span style={{ color: '#374151', flex: 1 }}>{item.name}</span>
                <span style={{ color: '#6b7280', fontWeight: 600 }}>{q}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
