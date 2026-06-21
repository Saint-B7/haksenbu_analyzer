// 경량 SVG 레이더 차트 — recharts(200KB+) 의존을 제거하고 순수 SVG로 그림.
// 7~10축 레이더를 ~150줄 SVG로 그리며 색·라벨·가이드선을 자유롭게 커스텀할 수 있다.
// DNARadar / TopTierRadar는 SvgRadarChart의 도메인별 래퍼.

import { DNA_CRITERIA, TOP_TIER_CRITERIA } from '../../data/criteria';
import { useTheme } from '../../contexts/ThemeContext';
import { chartColors } from '../../data/dark-palette';

/**
 * 다각형 좌표 계산: 중심 (cx, cy)에서 반지름 r만큼 떨어진 N각형 꼭짓점 N개
 * angle = -π/2(12시 방향)부터 시작해서 시계방향
 */
const polygonPoints = (cx, cy, r, n) => {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    pts.push([cx + r * Math.cos(angle), cy + r * Math.sin(angle)]);
  }
  return pts;
};

/**
 * 값 다각형: 각 축마다 0~100 값을 반지름 비율로 변환
 */
const valuePolygonPoints = (cx, cy, rMax, values) => {
  const n = values.length;
  return values.map((v, i) => {
    const r = rMax * (Math.max(0, Math.min(100, v)) / 100);
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  });
};

export const SvgRadarChart = ({
  data,                  // [{ subject: '질문', value: 0~100 }, ...]
  width = 320,
  height = 260,
  guideValue,            // 점선 가이드 값 (예: 50, 66)
  fillColor = '#6366f1',
  strokeColor = '#6366f1',
  guideStrokeColor = '#cbd5e1',
  gridStrokeColor = '#e2e8f0',
  labelColor = '#475569',
  className = '',
}) => {
  const cx = width / 2;
  const cy = height / 2;
  // 라벨 공간(20px) + 약간의 여유를 두고 반지름 결정
  const rMax = Math.min(width, height) / 2 - 28;
  const n = data.length;
  if (n < 3) return null;

  // 그리드 다각형 4단계 (25, 50, 75, 100%)
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  // 축 끝점들
  const axisEnds = polygonPoints(cx, cy, rMax, n);

  // 값 다각형
  const valuePts = valuePolygonPoints(cx, cy, rMax, data.map((d) => d.value));
  const valuePathD = valuePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';

  // 가이드 다각형 (선택)
  let guidePathD = null;
  if (typeof guideValue === 'number') {
    const guidePts = polygonPoints(cx, cy, rMax * (guideValue / 100), n);
    guidePathD = guidePts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';
  }

  // 라벨 위치 (축 끝에서 약간 바깥쪽으로)
  const labelOffset = 14;
  const labels = data.map((d, i) => {
    const angle = -Math.PI / 2 + (i * 2 * Math.PI) / n;
    const lx = cx + (rMax + labelOffset) * Math.cos(angle);
    const ly = cy + (rMax + labelOffset) * Math.sin(angle);
    // 텍스트 정렬: 12시·6시 부근은 가운데, 좌측은 우측 정렬, 우측은 좌측 정렬
    const cos = Math.cos(angle);
    const anchor = Math.abs(cos) < 0.2 ? 'middle' : (cos < 0 ? 'end' : 'start');
    return { x: lx, y: ly, text: d.subject, anchor };
  });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      className={className}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="레이더 차트"
    >
      {/* 1) 동심 다각형 그리드 */}
      {gridLevels.map((lvl, idx) => {
        const pts = polygonPoints(cx, cy, rMax * lvl, n);
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + 'Z';
        return <path key={idx} d={d} fill="none" stroke={gridStrokeColor} strokeWidth="1" />;
      })}
      {/* 2) 축 라인 (중심 → 각 꼭짓점) */}
      {axisEnds.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke={gridStrokeColor} strokeWidth="1" />
      ))}
      {/* 3) 가이드 다각형 (점선) */}
      {guidePathD && (
        <path d={guidePathD} fill="none" stroke={guideStrokeColor} strokeWidth="1" strokeDasharray="4 4" />
      )}
      {/* 4) 값 다각형 (반투명 채움 + 테두리) */}
      <path d={valuePathD} fill={fillColor} fillOpacity="0.35" stroke={strokeColor} strokeWidth="2" />
      {/* 5) 값 점 */}
      {valuePts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r="3" fill={strokeColor} />
      ))}
      {/* 6) 라벨 */}
      {labels.map((l, i) => (
        <text
          key={i}
          x={l.x}
          y={l.y}
          fontSize="11"
          fontWeight="600"
          fill={labelColor}
          textAnchor={l.anchor}
          dominantBaseline="middle"
        >
          {l.text}
        </text>
      ))}
    </svg>
  );
};

export const DNARadar = ({ checklist }) => {
  const data = (checklist || []).map((item) => {
    const meta = DNA_CRITERIA.find((d) => d.id === item.id) || {};
    const score = (typeof item.qualityScore === 'number')
      ? item.qualityScore
      : (item.satisfied ? 75 : 20);
    return { subject: meta.short || item.name || `${item.id}`, value: score };
  });
  // 그리드·가이드·라벨만 다크 분기 (값 다각형의 인디고 데이터 색은 유지)
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const cc = chartColors(isDark);
  return (
    <div className="w-full saveable-remove-chart flex items-center justify-center" style={{ height: 260 }}>
      <SvgRadarChart
        data={data}
        width={320}
        height={260}
        guideValue={50}
        fillColor="#6366f1"
        strokeColor="#6366f1"
        guideStrokeColor={isDark ? '#64748b' : '#cbd5e1'}
        gridStrokeColor={cc.grid}
        labelColor={cc.axisText}
      />
    </div>
  );
};

export const TopTierRadar = ({ check }) => {
  const data = (check || []).map((item) => {
    const meta = TOP_TIER_CRITERIA.find((c) => c.id === item.id) || {};
    const score = (typeof item.qualityScore === 'number')
      ? item.qualityScore
      : (item.met ? 75 : 18);
    return { subject: meta.short || `${item.id}`, value: score };
  });
  // 그리드·라벨은 다크에서 중립 slate 로 (라이트는 기존 rose 톤 유지). 값 색은 유지.
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const cc = chartColors(isDark);
  return (
    <div className="w-full saveable-remove-chart flex items-center justify-center" style={{ height: 280 }}>
      <SvgRadarChart
        data={data}
        width={360}
        height={280}
        guideValue={66}
        fillColor="#fb7185"
        strokeColor="#e11d48"
        guideStrokeColor={isDark ? '#64748b' : '#fecaca'}
        gridStrokeColor={isDark ? cc.grid : '#fecaca'}
        labelColor={cc.axisText}
      />
    </div>
  );
};
