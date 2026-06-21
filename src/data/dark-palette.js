// ─────────────────────────────────────────────────────────────────────────────
// dark-palette.js — 다크모드 "기준 팔레트" 명문화
//
// 초기 입력 화면(학년/항목 선택·진로 입력·본문 textarea·분석 시작 버튼)에서
// 추출한 다크 톤을 단일 기준으로 정의한다. 분석 결과 화면이 이 톤을 그대로
// 따르도록 각 컴포넌트의 dark: 클래스를 이 표에 맞춘다.
//
// ┌─ 역할 ───────────┬─ 라이트 ─────────┬─ 다크(기준) ───────────┐
// │ 최외곽 배경       │ bg-slate-50      │ dark:bg-slate-900       │
// │ 카드 배경         │ bg-white         │ dark:bg-slate-800       │
// │ 카드 테두리       │ border-slate-200 │ dark:border-slate-700   │
// │ 본문 텍스트       │ text-slate-900/700 │ dark:text-slate-100/300 │
// │ 보조 텍스트       │ text-slate-500/400 │ dark:text-slate-400/500 │
// │ 입력 필드 배경    │ bg-white         │ dark:bg-slate-700       │
// │ 입력 필드 테두리  │ border-slate-200 │ dark:border-slate-600   │
// │ 구분선           │ border-slate-100 │ dark:border-slate-700   │
// │ 강조 뱃지(인디고) │ bg-indigo-100 text-indigo-700 │ dark:bg-indigo-900 dark:text-indigo-300 │
// │ 의미색 뱃지(연한) │ bg-{c}-50 text-{c}-700 border-{c}-200 │ dark:bg-{c}-900/30 dark:text-{c}-300 dark:border-{c}-700 │
// └──────────────────┴──────────────────┴─────────────────────────┘
//
// Tailwind 클래스가 닿지 않는 곳(SVG 차트의 그리드·축·트랙 hex)은 아래
// CHART_COLORS 를 useTheme 의 theme === 'dark' 로 분기해 사용한다.
// (데이터 색 — 점수 구간별 emerald/sky/amber/orange/rose — 은 라이트·다크 공통 유지)
// ─────────────────────────────────────────────────────────────────────────────

// SVG 차트의 비데이터 요소(그리드선·축/눈금 텍스트·도넛 트랙) 색.
// 라이트는 기존 하드코딩 값과 동일, 다크는 카드 배경(slate-800) 위에서
// 은은하게 보이는 slate 계열로 맞춘다.
export const CHART_COLORS = {
  light: { grid: '#e2e8f0', axisText: '#64748b', tickText: '#94a3b8', track: '#e2e8f0' },
  // 다크: 그리드·트랙은 slate-700(은은), 텍스트는 slate-300/400(가독성 확보)
  dark:  { grid: '#334155', axisText: '#cbd5e1', tickText: '#94a3b8', track: '#334155' },
};

/** isDark 여부로 차트 비데이터 색 묶음을 반환한다. */
export const chartColors = (isDark) => (isDark ? CHART_COLORS.dark : CHART_COLORS.light);
