// 인쇄 보고서 — 구조 흐름 (6단계 서사) 섹션
import React from 'react';

export function PrintStructureFlow({ result }) {
  if (!result.structureMap?.stages) return null;

  return (
    <div className="print-section">
      <div className="print-section-title">구조 흐름 (6단계 서사)</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {result.structureMap.stages.map((stage, i) => (
          <div key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
            {/* 단계 번호 원형 */}
            <div style={{
              width: '20px', height: '20px', borderRadius: '50%', flexShrink: 0,
              background: stage.present ? '#6366f1' : '#e2e8f0',
              color: stage.present ? 'white' : '#94a3b8',
              fontSize: '10px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {i + 1}
            </div>

            <div style={{ flex: 1, lineHeight: 1.5 }}>
              <span style={{ fontWeight: 700, fontSize: '12px', color: stage.present ? '#0f172a' : '#94a3b8' }}>
                {stage.label}
              </span>
              {stage.excerpt && (
                <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                  — {stage.excerpt}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
