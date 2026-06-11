// ──────────────────────────────────────────────────────────
// PrintSection — 인쇄 보고서 항목 공통 래퍼
//
// 모든 인쇄 섹션이 동일한 레이아웃(테두리 카드 · 큰 제목 · 작은 설명 · 본문)을
// 따르도록 단일화한다. 종이는 항상 흰색이므로 색상은 전부 인라인 라이트 토큰으로
// 고정한다(다크모드 무관 — Tailwind dark: 클래스 사용 금지).
//
// 레이아웃:
//   ┌─────────────────────────────────────┐
//   │ ▍큰 글씨 제목                          │  ← 좌측 인디고 보더 + 굵은 제목
//   │   작은 회색 글씨로 상세 설명(툴팁 내용)   │
//   │─────────────────────────────────────│
//   │ 본문(children)                        │
//   └─────────────────────────────────────┘
// ──────────────────────────────────────────────────────────
import React from 'react';

// 공통 색·치수 토큰 — 모든 인쇄 섹션이 동일한 값을 공유한다
export const PRINT_TOKENS = {
  border:      '#d1d5db', // 섹션 외곽 얇은 테두리
  titleColor:  '#1e293b', // 제목 짙은 색
  descColor:   '#64748b', // 설명 회색
  accent:      '#6366f1', // 인디고 강조(좌측 보더·소제목)
  divider:     '#e2e8f0', // 제목/본문 구분선
  shadeYellow: '#fef9c3', // 핵심 강조 음영(연노랑)
  shadeGray:   '#f1f5f9', // 보조 강조 음영(연회색)
};

/**
 * 인쇄 보고서 항목 카드.
 * @param {{ title: string, description?: string, icon?: React.ReactNode, children: React.ReactNode }} props
 */
export function PrintSection({ title, description, icon, children }) {
  return (
    <div className="print-section" style={{
      border: `1px solid ${PRINT_TOKENS.border}`,
      borderRadius: '10px',
      padding: '14px 16px',
      marginBottom: '20px',
      background: '#ffffff',
      color: PRINT_TOKENS.titleColor,
    }}>
      {/* 제목 띠 — 좌측 인디고 보더로 항목 시작 강조 */}
      <div style={{ borderLeft: `3px solid ${PRINT_TOKENS.accent}`, paddingLeft: '10px' }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          fontSize: '17px', fontWeight: 800, color: PRINT_TOKENS.titleColor, lineHeight: 1.3,
        }}>
          {icon}
          {title}
        </div>
        {description && (
          <div style={{ fontSize: '10px', color: PRINT_TOKENS.descColor, lineHeight: 1.5, marginTop: '3px' }}>
            {description}
          </div>
        )}
      </div>

      {/* 구분선 */}
      <div style={{ borderTop: `1px solid ${PRINT_TOKENS.divider}`, margin: '10px 0' }} />

      {/* 본문 */}
      <div>{children}</div>
    </div>
  );
}

/**
 * 핵심 포인트 강조 — 볼드 + 연한 음영(인쇄에서 과하지 않게).
 * 점수·등급·충족 여부·대안 핵심 어구 등에 일관되게 사용한다.
 * @param {{ children: React.ReactNode, tone?: 'yellow'|'gray' }} props
 */
export function PrintHighlight({ children, tone = 'yellow' }) {
  return (
    <span style={{
      fontWeight: 700,
      background: tone === 'gray' ? PRINT_TOKENS.shadeGray : PRINT_TOKENS.shadeYellow,
      borderRadius: '3px',
      padding: '0 4px',
    }}>
      {children}
    </span>
  );
}
