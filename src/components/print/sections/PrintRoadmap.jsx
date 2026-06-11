// 인쇄 보고서 — 진학 로드맵 섹션
// result.promotionRoadmap = {
//   currentApplicationActivities[]: { title, description, tag, linkedWeakness }
//   nextStages[]: { targetGrade, growthFocus, categories[]: { key, items[]: { title, description, tag } } }
// }
// 화면 카드(PromotionRoadmapCard)와 동일한 깊이로 전문을 출력하며, 모든 텍스트는
// stripBoldMarkup 으로 별표 마크업을 제거한 평문으로 인쇄한다.
import React from 'react';
import { ROADMAP_CATEGORIES } from '../../../data/criteria';
import { stripBoldMarkup } from '../../../lib/text-format';
import { PrintSection } from '../PrintSection.jsx';
import { PRINT_DESCRIPTIONS } from '../../../data/print-descriptions';

// 배열 아이템을 안전하게 문자열로 추출
function itemText(item, ...keys) {
  if (typeof item === 'string') return item;
  for (const k of keys) {
    if (item?.[k]) return item[k];
  }
  return '';
}

// 카테고리 key → 한글 라벨 (ROADMAP_CATEGORIES 재사용)
const categoryLabel = (key) =>
  ROADMAP_CATEGORIES.find((c) => c.key === key)?.label || key;

export function PrintRoadmap({ result }) {
  const roadmap = result.promotionRoadmap;
  if (!roadmap) return null;

  const currentApps = roadmap.currentApplicationActivities || [];
  const nextStages  = roadmap.nextStages || [];
  if (currentApps.length === 0 && nextStages.length === 0) return null;

  return (
    <PrintSection title="진학 로드맵" description={PRINT_DESCRIPTIONS.roadmap}>

      {/* 즉시 적용 활동 */}
      {currentApps.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', marginBottom: '5px' }}>
            즉시 적용 활동 추천
          </div>
          {currentApps.map((a, i) => (
            <div key={i} className="print-item" style={{
              fontSize: '11px', color: '#374151', lineHeight: 1.5,
              padding: '4px 8px', borderLeft: '2px solid #f59e0b', marginBottom: '4px',
            }}>
              <span style={{ fontWeight: 700 }}>{stripBoldMarkup(itemText(a, 'title', 'activity'))}</span>
              {a.tag && <span style={{ fontSize: '9px', color: '#b45309', marginLeft: '4px' }}>[{stripBoldMarkup(a.tag)}]</span>}
              {a.description && (
                <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '1px' }}>{stripBoldMarkup(a.description)}</div>
              )}
              {a.linkedWeakness && (
                <div style={{ fontSize: '9px', color: '#dc2626', marginTop: '1px' }}>
                  보완 약점: {stripBoldMarkup(a.linkedWeakness)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 진급 이후 단계별 로드맵 */}
      {nextStages.length > 0 && (
        <div>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#4f46e5', marginBottom: '5px' }}>
            진급 이후 단계별 로드맵
          </div>
          {nextStages.map((stage, i) => (
            <div key={i} className="print-item" style={{ marginBottom: '8px' }}>
              {/* 단계 제목 + 성장 초점 */}
              <div style={{
                fontSize: '11px', fontWeight: 700, color: '#374151',
                padding: '3px 8px', borderLeft: '2px solid #a5b4fc',
              }}>
                {stripBoldMarkup(itemText(stage, 'targetGrade', 'stage'))}
                {stage.growthFocus && (
                  <span style={{ fontWeight: 400, color: '#6b7280' }}> — {stripBoldMarkup(stage.growthFocus)}</span>
                )}
              </div>

              {/* 카테고리(깊이심화/학과/진로/융합)별 활동 항목 전체 */}
              {Array.isArray(stage.categories) && stage.categories.map((cat, ci) => (
                <div key={ci} style={{ margin: '3px 0 0 12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: '#6366f1' }}>
                    {categoryLabel(cat.key)}
                  </div>
                  {Array.isArray(cat.items) && cat.items.map((it, ii) => (
                    <div key={ii} style={{ fontSize: '10px', color: '#374151', paddingLeft: '8px', marginTop: '1px' }}>
                      <span style={{ fontWeight: 600 }}>· {stripBoldMarkup(itemText(it, 'title'))}</span>
                      {it.tag && <span style={{ fontSize: '9px', color: '#6366f1', marginLeft: '3px' }}>[{stripBoldMarkup(it.tag)}]</span>}
                      {it.description && (
                        <span style={{ color: '#6b7280' }}> — {stripBoldMarkup(it.description)}</span>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </PrintSection>
  );
}
