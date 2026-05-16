// ──────────────────────────────────────────────────────────
// PrintReportView — 인쇄 미리보기 화면
// - 섹션 선택(selectedSections Set)에 따라 각 섹션 컴포넌트를 조합
// - [🖨️ 인쇄] → window.print()
// - [← 돌아가기] / Esc → onBack() (Esc는 HaksenbuAnalyzer 키보드 핸들러가 처리)
// ──────────────────────────────────────────────────────────

import React from 'react';
import { Printer, ArrowLeft } from 'lucide-react';
import '../../styles/print.css';

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

        </div>
      </div>
    </>
  );
}
