// 인쇄 보고서 — 상위권 체크리스트 (10가지 도약) 섹션
// result.topTierCheck[] = { id, name, met, qualityScore,
//   satisfyingSentence, developedAlternative (충족 시), tipForImprovement (미충족 시) }
// 화면 카드(TopTierCheckCard)와 동일한 깊이로 전문을 출력하며, 모든 텍스트는
// stripBoldMarkup 으로 별표 마크업을 제거한 평문으로 인쇄한다.
import React from 'react';
import { stripBoldMarkup } from '../../../lib/text-format';
import { PrintSection, PrintHighlight } from '../PrintSection.jsx';
import { PRINT_DESCRIPTIONS } from '../../../data/print-descriptions';

export function PrintTopTier({ result }) {
  if (!result.topTierCheck?.length) return null;

  return (
    <PrintSection title="상위권 체크리스트 (10가지 도약)" description={PRINT_DESCRIPTIONS.toptier}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {result.topTierCheck.map((item, i) => {
          const q = typeof item.qualityScore === 'number' ? item.qualityScore : null;
          return (
            // print-item — 기준 하나가 페이지 중간에서 잘리지 않도록 (Phase 4)
            <div key={i} className="print-item" style={{
              fontSize: '11px', padding: '5px 0', borderBottom: '1px solid #f1f5f9',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: item.met ? '#10b981' : '#f43f5e', fontWeight: 700, flexShrink: 0 }}>
                  {item.met ? '✓' : '✗'}
                </span>
                <span style={{ fontWeight: 700, color: '#1e293b' }}>{item.name || item.criterion}</span>
                {q !== null && (
                  <span style={{ fontSize: '10px', color: '#64748b' }}>
                    <PrintHighlight tone="gray">{q}점</PrintHighlight>
                  </span>
                )}
              </div>

              {/* 충족 시 — 본문 발췌 + 발전 대안 */}
              {item.met && item.satisfyingSentence && (
                <div style={{
                  fontSize: '10px', color: '#64748b', fontStyle: 'italic',
                  borderLeft: '2px solid #cbd5e1', paddingLeft: '6px', margin: '2px 0 2px 18px',
                }}>
                  “{stripBoldMarkup(item.satisfyingSentence)}”
                </div>
              )}
              {item.met && item.developedAlternative && (
                <div style={{
                  fontSize: '10px', color: '#0369a1',
                  background: '#f0f9ff', borderRadius: '4px', padding: '4px 6px', margin: '2px 0 0 18px',
                }}>
                  <span style={{ fontWeight: 700 }}>발전 대안 · </span>{stripBoldMarkup(item.developedAlternative)}
                </div>
              )}

              {/* 미충족 시 — 보완 팁 */}
              {!item.met && item.tipForImprovement && (
                <div style={{
                  fontSize: '10px', color: '#9a3412',
                  background: '#fff7ed', borderRadius: '4px', padding: '4px 6px', margin: '2px 0 0 18px',
                }}>
                  <span style={{ fontWeight: 700 }}>보완 팁 · </span>{stripBoldMarkup(item.tipForImprovement)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </PrintSection>
  );
}
