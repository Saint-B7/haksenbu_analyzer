// 인쇄 보고서 — 재작성 제안 (AI 대안 문장) 섹션
// rewrittenVersion 전문 + NEIS 바이트 수 표시. 별표 마크업은 stripBoldMarkup 으로 제거.
import React from 'react';
import { calcNeisBytes, NEIS_BYTE_LIMIT } from '../../../lib/neis-bytes';
import { stripBoldMarkup } from '../../../lib/text-format';
import { PrintSection, PrintHighlight } from '../PrintSection.jsx';
import { PRINT_DESCRIPTIONS } from '../../../data/print-descriptions';

export function PrintRewrite({ result }) {
  if (!result.rewrittenVersion) return null;

  // 별표 제거 후의 평문 기준으로 바이트 수 계산 (실제 NEIS 입력 형태와 동일)
  const text = stripBoldMarkup(result.rewrittenVersion);
  const bytes = calcNeisBytes(text);

  return (
    <PrintSection title="재작성 제안 (AI 대안 문장)" description={PRINT_DESCRIPTIONS.rewrite} avoidBreak>

      {/* NEIS 바이트 수 — 핵심 수치이므로 볼드+음영 강조 */}
      <div style={{ fontSize: '10px', color: '#64748b', textAlign: 'right', marginBottom: '6px' }}>
        <PrintHighlight tone="gray">{bytes} / {NEIS_BYTE_LIMIT} 바이트</PrintHighlight>
      </div>

      <div style={{
        fontSize: '12px', color: '#374151', lineHeight: 1.8,
        padding: '12px 14px', background: '#f0f9ff',
        border: '1px solid #bae6fd', borderRadius: '8px',
      }}>
        {text}
      </div>
    </PrintSection>
  );
}
