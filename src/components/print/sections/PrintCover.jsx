// 인쇄 보고서 — 표지 섹션
import React from 'react';

export function PrintCover({ grade, activityType, careerGoal, desiredMajor }) {
  const today = new Date().toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="print-cover">
      <div className="print-cover-eyebrow">학생부 문장 분석 보고서</div>
      <div className="print-cover-title">{grade} · {activityType}활동</div>
      {(careerGoal || desiredMajor) && (
        <div className="print-cover-sub">
          {careerGoal && `진로: ${careerGoal}`}
          {careerGoal && desiredMajor && ' · '}
          {desiredMajor && `학과: ${desiredMajor}`}
        </div>
      )}
      <div className="print-cover-date">분석일: {today}</div>
    </div>
  );
}
