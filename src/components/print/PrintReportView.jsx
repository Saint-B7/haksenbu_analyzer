// ──────────────────────────────────────────────────────────
// PrintReportView — 인쇄 미리보기 화면
// - 섹션 선택(selectedSections Set)에 따라 각 섹션 컴포넌트를 조합
// - [🖨️ 인쇄] → window.print()
// - [← 돌아가기] / Esc → onBack() (Esc는 HaksenbuAnalyzer 키보드 핸들러가 처리)
// ──────────────────────────────────────────────────────────

import React, { useState, useRef, useLayoutEffect } from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import '../../styles/print.css';

// 한 페이지에 들어가는 콘텐츠 높이(px) — A4 1123px에서 위아래 1cm(약 37.8px)씩 제외.
// print.css의 @page margin:1cm 과 동일한 기준이라 미리보기 경계가 인쇄와 대략 일치한다.
const PAGE_CONTENT_PX = 1123 - 37.8 * 2; // ≈ 1047.4

import { PrintCover }               from './sections/PrintCover.jsx';
import { PrintOverallScore }        from './sections/PrintOverallScore.jsx';
import { PrintStructureFlow }       from './sections/PrintStructureFlow.jsx';
import { PrintTopTier }             from './sections/PrintTopTier.jsx';
import { PrintRoadmap }             from './sections/PrintRoadmap.jsx';
import { PrintMultiPerspective }    from './sections/PrintMultiPerspective.jsx';
import { PrintStrengthsWeaknesses } from './sections/PrintStrengthsWeaknesses.jsx';
import { PrintCompliance }          from './sections/PrintCompliance.jsx';
import { PrintRewrite }             from './sections/PrintRewrite.jsx';

export default function PrintReportView({
  result,
  selectedSections,
  activityType,
  grade,
  careerGoal,
  desiredMajor,
  complianceViolations,
  onBack,
}) {
  const has = (id) => selectedSections.has(id);
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  // 콘텐츠를 측정해 페이지 경계의 실제 Y 위치(px)를 계산한다(화면 전용 가이드).
  // 고정 간격으로 자르면 항목 중간을 가로지를 수 있으므로, 잘리면 안 되는 블록
  // (.print-item / .print-section / .print-cover)의 경계로 스냅해 실제 인쇄의
  // break-inside:avoid 동작과 일치시킨다.
  const contentRef = useRef(null);
  const [dividerTops, setDividerTops] = useState([]);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => {
      const total = el.scrollHeight;
      if (total <= PAGE_CONTENT_PX) { setDividerTops([]); return; }

      // 잘리면 안 되는 원자 블록들의 top 위치(콘텐츠 기준, 오름차순)
      const baseTop = el.getBoundingClientRect().top;
      const candidates = Array.from(el.querySelectorAll('.print-item, .print-section, .print-cover'))
        .map((n) => n.getBoundingClientRect().top - baseTop)
        .filter((y) => y > 0)
        .sort((a, b) => a - b);

      const tops = [];
      let pageStart = 0;
      let guard = 0;
      while (pageStart + PAGE_CONTENT_PX < total && guard++ < 300) {
        const ideal = pageStart + PAGE_CONTENT_PX;
        // ideal 이하의 마지막 블록 경계로 스냅(블록을 가로지르지 않도록).
        // 페이지보다 큰 블록이라 후보가 없으면 고정 위치로 진행(무한루프 방지).
        let snap = null;
        for (const y of candidates) {
          if (y > pageStart + 1 && y <= ideal) snap = y;
          else if (y > ideal) break;
        }
        const next = snap ?? ideal;
        tops.push(next);
        pageStart = next;
      }
      setDividerTops(tops);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [selectedSections, result]);

  return (
    <>
      {/* 상단 툴바 — print.css .print-toolbar, 인쇄 시 자동 숨김 */}
      <div className="print-toolbar">
        <button
          onClick={onBack}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '6px 12px', borderRadius: '8px',
            border: '1px solid #e2e8f0', background: 'white',
            color: '#475569', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          <ArrowLeft style={{ width: '14px', height: '14px' }} />
          돌아가기
        </button>
        <span style={{ fontSize: '11px', color: '#94a3b8' }}>Esc를 눌러도 돌아갑니다</span>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '11px', color: '#64748b' }}>
            브라우저 인쇄창 → '배경 그래픽 인쇄' 옵션을 켜면 색상이 정확하게 출력됩니다
          </span>
          <button
            onClick={() => window.print()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '8px 18px', borderRadius: '8px',
              background: '#4f46e5', color: 'white',
              fontSize: '13px', fontWeight: 700, cursor: 'pointer',
              border: 'none', boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
            }}
          >
            <Printer style={{ width: '14px', height: '14px' }} />
            🖨️ 인쇄
          </button>
        </div>
      </div>

      {/* A4 미리보기 — print.css .print-preview-wrapper / .print-preview-page */}
      <div className="print-preview-wrapper">
        <div className="print-preview-page">

          {/* 측정 대상 콘텐츠 + 페이지 경계 오버레이(화면 전용) */}
          <div className="print-content" ref={contentRef}>

            {has('cover')      && <PrintCover grade={grade} activityType={activityType} careerGoal={careerGoal} desiredMajor={desiredMajor} />}
            {has('score')      && <PrintOverallScore result={result} />}
            {has('structure')  && <PrintStructureFlow result={result} />}
            {has('toptier')    && <PrintTopTier result={result} />}
            {has('roadmap')    && <PrintRoadmap result={result} />}
            {has('multi')      && <PrintMultiPerspective result={result} />}
            {has('sw')         && <PrintStrengthsWeaknesses result={result} />}
            {has('compliance') && <PrintCompliance complianceViolations={complianceViolations} />}
            {has('rewrite')    && <PrintRewrite result={result} />}

            <div className="print-footer">
              학생부 문장 분석기 · 분석일 {today}
            </div>

            {/* 페이지 경계 점선 + "── N페이지 ──" 라벨 — .no-print 로 인쇄 시 숨김.
                위치는 항목 경계로 스냅된 실제 Y값(dividerTops). i번째 경계 = (i+2)페이지 시작. */}
            {dividerTops.map((top, i) => (
              <div
                key={i}
                className="print-page-divider no-print"
                style={{ top: `${top}px` }}
              >
                <span className="print-page-label">── {i + 2}페이지 ──</span>
              </div>
            ))}

          </div>

        </div>
      </div>
    </>
  );
}
