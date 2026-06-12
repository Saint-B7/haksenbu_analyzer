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

  // 콘텐츠 높이를 측정해 페이지 경계 개수를 계산한다(화면 전용 가이드).
  const contentRef = useRef(null);
  const [pageCount, setPageCount] = useState(1);

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.scrollHeight;
      setPageCount(Math.max(1, Math.ceil(h / PAGE_CONTENT_PX)));
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [selectedSections, result]);

  // 경계는 1페이지~(pageCount-1)페이지 끝마다. k번째 경계 = 다음 페이지(k+1) 시작.
  const dividers = Array.from({ length: pageCount - 1 }, (_, k) => k + 1);

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

            {/* 페이지 경계 점선 + "── N페이지 ──" 라벨 — .no-print 로 인쇄 시 숨김 */}
            {dividers.map((k) => (
              <div
                key={k}
                className="print-page-divider no-print"
                style={{ top: `${k * PAGE_CONTENT_PX}px` }}
              >
                <span className="print-page-label">── {k + 1}페이지 ──</span>
              </div>
            ))}

          </div>

        </div>
      </div>
    </>
  );
}
