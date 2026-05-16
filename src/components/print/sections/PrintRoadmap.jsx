// 인쇄 보고서 — 진학 로드맵 섹션
import React from 'react';

// 배열 아이템을 안전하게 문자열로 추출
function itemText(item, ...keys) {
  if (typeof item === 'string') return item;
  for (const k of keys) {
    if (item?.[k]) return item[k];
  }
  return '';
}

export function PrintRoadmap({ result }) {
  const roadmap = result.promotionRoadmap;
  if (!roadmap) return null;

  const currentApps = roadmap.currentApplicationActivities || [];
  const nextStages  = roadmap.nextStages || [];
  if (currentApps.length === 0 && nextStages.length === 0) return null;

  return (
    <div className="print-section">
      <div className="print-section-title">진학 로드맵</div>

      {/* 즉시 적용 활동 */}
      {currentApps.length > 0 && (
        <div style={{ marginBottom: '10px' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#d97706', marginBottom: '5px' }}>
            즉시 적용 활동 추천
          </div>
          {currentApps.map((a, i) => (
            <div key={i} style={{
              fontSize: '11px', color: '#374151', lineHeight: 1.5,
              padding: '4px 8px', borderLeft: '2px solid #f59e0b', marginBottom: '4px',
            }}>
              <span style={{ fontWeight: 600 }}>{itemText(a, 'title', 'activity')}</span>
              {a.description && (
                <span style={{ color: '#6b7280' }}> — {a.description}</span>
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
            <div key={i} style={{
              fontSize: '11px', color: '#374151',
              padding: '4px 8px', borderLeft: '2px solid #a5b4fc', marginBottom: '4px',
            }}>
              <span style={{ fontWeight: 600 }}>{itemText(stage, 'targetGrade', 'stage')}</span>
              {stage.overview && (
                <span style={{ color: '#6b7280' }}> — {stage.overview}</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
