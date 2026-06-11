// 인쇄 보고서 — 구조 흐름 (6단계 서사) 섹션
// result.structureMap 은 6개 단계 객체의 "배열"이다.
//   각 단계: { stage, status, qualityScore, keyContent, keywords[], excerpt, diagnosis, stageRewrite }
// 화면 카드(UnifiedStructureFlow)와 동일한 깊이로 전문을 출력한다.
// 모든 텍스트는 stripBoldMarkup 으로 별표 마크업을 제거한 평문으로 인쇄한다.
import React from 'react';
import { NARRATIVE_STAGES } from '../../../data/criteria';
import { STATUS_COLORS } from '../../../data/colors';
import { stripBoldMarkup } from '../../../lib/text-format';
import { PrintSection, PrintHighlight } from '../PrintSection.jsx';
import { PRINT_DESCRIPTIONS } from '../../../data/print-descriptions';

export function PrintStructureFlow({ result }) {
  // structureMap 은 배열 — 비어 있으면 출력하지 않는다
  const stages = Array.isArray(result.structureMap) ? result.structureMap : null;
  if (!stages?.length) return null;

  return (
    <PrintSection title="구조 흐름 (6단계 서사)" description={PRINT_DESCRIPTIONS.structure}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {stages.map((stage, i) => {
          // 단계 메타(이름·기호)는 NARRATIVE_STAGES 에서, 상태 라벨은 STATUS_COLORS 에서 가져온다
          const meta = NARRATIVE_STAGES[(stage.stage ?? i + 1) - 1] || NARRATIVE_STAGES[i] || {};
          const statusInfo = STATUS_COLORS[stage.status] || STATUS_COLORS.missing;
          const q = typeof stage.qualityScore === 'number' ? stage.qualityScore : null;
          const present = stage.status && stage.status !== 'missing';

          return (
            // print-item — 단계 하나가 페이지 중간에서 잘리지 않도록 (Phase 4)
            <div key={i} className="print-item" style={{
              display: 'flex', gap: '10px', alignItems: 'flex-start',
              padding: '6px 0', borderBottom: '1px solid #f1f5f9',
            }}>
              {/* 단계 번호 원형 */}
              <div style={{
                width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
                background: present ? '#6366f1' : '#e2e8f0',
                color: present ? 'white' : '#94a3b8',
                fontSize: '11px', fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {stage.stage ?? i + 1}
              </div>

              <div style={{ flex: 1, lineHeight: 1.6 }}>
                {/* 단계명 + 상태 라벨 + 품질 점수 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                  <span style={{ fontWeight: 700, fontSize: '12px', color: present ? '#0f172a' : '#94a3b8' }}>
                    {meta.mark} {meta.name}
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    <PrintHighlight tone="gray">{statusInfo.label}{q !== null ? ` · ${q}점` : ''}</PrintHighlight>
                  </span>
                </div>

                {/* 본문 분석 핵심 내용 */}
                {stage.keyContent && (
                  <div style={{ fontSize: '11px', color: '#374151', marginBottom: '2px' }}>
                    {stripBoldMarkup(stage.keyContent)}
                  </div>
                )}

                {/* 키워드 */}
                {Array.isArray(stage.keywords) && stage.keywords.length > 0 && (
                  <div style={{ fontSize: '10px', color: '#6366f1', marginBottom: '2px' }}>
                    {stage.keywords.map((k) => `#${stripBoldMarkup(k)}`).join(' ')}
                  </div>
                )}

                {/* 본문 발췌 인용 */}
                {stage.excerpt && (
                  <div style={{
                    fontSize: '10px', color: '#64748b', fontStyle: 'italic',
                    borderLeft: '2px solid #cbd5e1', paddingLeft: '6px', margin: '2px 0',
                  }}>
                    “{stripBoldMarkup(stage.excerpt)}”
                  </div>
                )}

                {/* AI 진단 코멘트 */}
                {stage.diagnosis && (
                  <div style={{ fontSize: '10px', color: '#475569', marginBottom: '2px' }}>
                    <span style={{ fontWeight: 700, color: '#94a3b8' }}>진단 · </span>
                    {stripBoldMarkup(stage.diagnosis)}
                  </div>
                )}

                {/* 단계별 대안 문장 */}
                {stage.stageRewrite && (
                  <div style={{
                    fontSize: '10px', color: '#0369a1',
                    background: '#f0f9ff', borderRadius: '4px', padding: '4px 6px', marginTop: '2px',
                  }}>
                    <span style={{ fontWeight: 700 }}>대안 · </span>
                    {stripBoldMarkup(stage.stageRewrite)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </PrintSection>
  );
}
