// 학생 누적 분석 결과의 시간별 추이를 그리는 경량 라인 차트.
// HistoryCard 안에서 종합점수·DNA 충족 수 등 단일 지표를 시각화한다.

import { useTheme } from '../../contexts/ThemeContext';
import { chartColors } from '../../data/dark-palette';

export const TrendLineChart = ({ entries, valueKey, color = '#6366f1', label, max = 100 }) => {
  const { theme } = useTheme();
  const cc = chartColors(theme === 'dark'); // 그리드·축 텍스트만 다크 분기 (라인·데이터 색 유지)
  if (!entries || entries.length < 2) return null;
  const W = 320, H = 140, PAD_L = 32, PAD_R = 12, PAD_T = 12, PAD_B = 24;
  const chartW = W - PAD_L - PAD_R;
  const chartH = H - PAD_T - PAD_B;

  const values = entries.map((e) => e.summary?.[valueKey]).filter((v) => v !== undefined && v !== null);
  if (values.length < 2) return null;

  const points = entries.map((e, i) => {
    const v = e.summary?.[valueKey];
    if (v === undefined || v === null) return null;
    const x = PAD_L + (entries.length === 1 ? chartW / 2 : (i / (entries.length - 1)) * chartW);
    const y = PAD_T + chartH - (v / max) * chartH;
    return { x, y, value: v, label: e.label || `#${i + 1}` };
  }).filter(Boolean);

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Y축 라벨 (0, 50, 100 같은 4구간)
  const yTicks = [0, max * 0.25, max * 0.5, max * 0.75, max];

  return (
    <div className="w-full">
      {label && <div className="text-xs font-bold text-slate-600 dark:text-slate-400 mb-2">{label}</div>}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ maxHeight: 180 }}>
        {/* Y축 가이드라인 */}
        {yTicks.map((t, i) => {
          const y = PAD_T + chartH - (t / max) * chartH;
          return (
            <g key={i}>
              <line x1={PAD_L} y1={y} x2={W - PAD_R} y2={y} stroke={cc.grid} strokeWidth="1" strokeDasharray={i === 0 ? '0' : '2 2'} />
              <text x={PAD_L - 4} y={y + 3} fontSize="9" fill={cc.tickText} textAnchor="end">{t}</text>
            </g>
          );
        })}
        {/* 선 */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2" />
        {/* 점 + 값 */}
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill={color} />
            <text x={p.x} y={p.y - 8} fontSize="10" fontWeight="bold" fill={color} textAnchor="middle">{p.value}</text>
            <text x={p.x} y={H - 6} fontSize="9" fill={cc.axisText} textAnchor="middle">{p.label}</text>
          </g>
        ))}
      </svg>
    </div>
  );
};
