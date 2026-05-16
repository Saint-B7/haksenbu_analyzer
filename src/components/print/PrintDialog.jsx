// ──────────────────────────────────────────────────────────
// PrintDialog — 인쇄 보고서 섹션 선택 모달
// 체크박스로 원하는 섹션을 고른 뒤 [인쇄 미리보기] 클릭 → PrintReportView
// Esc/취소/배경 클릭 → onClose
// ──────────────────────────────────────────────────────────

import React, { useState, useEffect } from 'react';
import { Printer, X } from 'lucide-react';

// 인쇄 가능한 섹션 목록 — PrintReportView에서도 import해서 사용
export const PRINT_SECTIONS = [
  { id: 'cover',      label: '표지',              desc: '학년 · 항목 · 분석 날짜' },
  { id: 'score',      label: '종합 점수 & DNA',   desc: '점수 · DNA 충족 현황' },
  { id: 'structure',  label: '구조 흐름',          desc: '6단계 서사 구조' },
  { id: 'toptier',    label: '상위권 체크리스트', desc: '10가지 최상위 도약 체크' },
  { id: 'roadmap',    label: '진학 로드맵',        desc: '다음 단계 활동 추천' },
  { id: 'multi',      label: '다각도 평가',        desc: '3관점 입학사정관 평가' },
  { id: 'sw',         label: '강점 · 약점',        desc: '강점·약점·보완 제안' },
  { id: 'compliance', label: '규정 준수 검사',     desc: '기재요령 위반 검출 결과' },
  { id: 'rewrite',    label: '재작성 제안',        desc: 'AI 대안 문장' },
];

const ALL_IDS = PRINT_SECTIONS.map((s) => s.id);

// open: bool, onClose: ()=>void, onConfirm: (Set<string>)=>void
export default function PrintDialog({ open, onClose, onConfirm }) {
  // 모달이 열릴 때마다 전체 선택 상태로 초기화
  const [selected, setSelected] = useState(new Set(ALL_IDS));
  useEffect(() => {
    if (open) setSelected(new Set(ALL_IDS));
  }, [open]);

  if (!open) return null;

  const allSelected = selected.size === ALL_IDS.length;

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected(allSelected ? new Set() : new Set(ALL_IDS));
  };

  const handleConfirm = () => {
    if (selected.size === 0) return;
    onConfirm(new Set(selected));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">인쇄 보고서 섹션 선택</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="닫기"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 전체 선택/해제 토글 */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-700">
          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={allSelected}
              onChange={toggleAll}
              className="w-4 h-4 accent-indigo-600 cursor-pointer"
            />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {allSelected ? '전체 해제' : '전체 선택'}
            </span>
          </label>
        </div>

        {/* 섹션 목록 */}
        <div className="px-5 py-3 space-y-2.5 max-h-72 overflow-y-auto">
          {PRINT_SECTIONS.map((s) => (
            <label key={s.id} className="flex items-start gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selected.has(s.id)}
                onChange={() => toggle(s.id)}
                className="w-4 h-4 mt-0.5 accent-indigo-600 cursor-pointer shrink-0"
              />
              <div>
                <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  {s.label}
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">{s.desc}</div>
              </div>
            </label>
          ))}
        </div>

        {/* 푸터 */}
        <div className="px-5 py-4 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            취소 (Esc)
          </button>
          <button
            onClick={handleConfirm}
            disabled={selected.size === 0}
            className="flex items-center gap-2 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-bold rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
            인쇄 미리보기
          </button>
        </div>

      </div>
    </div>
  );
}
