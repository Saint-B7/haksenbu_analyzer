// ──────────────────────────────────────────────────────────
// 히스토리 카드 — 학생별 누적 분석 이력 저장/표시
// 학생 ID 기준으로 IndexedDB에 누적 저장하고
// 종합 점수·DNA 충족 수·도약 충족 수 변화량(▲▼)과 추이 차트 제공
// 자식 컴포넌트:
//  - DeltaBadge: ▲/▼ 변화량 뱃지
//  - HistoryRow: 단일 분석 내역을 한 줄로 표시
// ──────────────────────────────────────────────────────────

import React, { useState } from 'react';
import { Activity, Loader2, CheckCircle2 } from 'lucide-react';
import {
  getAnalysesByStudent,
  getAllStudents,
  saveAnalysis,
  deleteAnalysis,
  deleteStudent,
  summarizeForHistory,
} from '../../lib/idb';
import { useIndexedQuery, mutateIndexedQuery } from '../../lib/idb-cache';
import { TOAST_SAVED_MS } from '../../data/constants';
import { CollapsibleCard } from '../common';
import { TrendLineChart } from '../charts/TrendLineChart';

// 캐시 키 — 모듈 상수로 두어 mutate/query 호출처가 일관되도록
const STUDENTS_CACHE_KEY = 'students:all';
const historyCacheKey = (studentId) => (studentId ? `history:${studentId}` : null);

// 변화량 뱃지: 양수면 ▲ 초록색, 음수면 ▼ 빨강, 0이면 회색 ±0
const DeltaBadge = ({ delta, suffix = '' }) => {
  if (delta === undefined || delta === null) return null;
  if (delta === 0) {
    return <span className="text-[10px] font-mono text-slate-400">±0{suffix}</span>;
  }
  const isPositive = delta > 0;
  return (
    <span className={`text-[10px] font-mono font-bold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
      {isPositive ? '▲' : '▼'} {Math.abs(delta)}{suffix}
    </span>
  );
};

// 단일 분석 내역을 한 줄로 표시 (라벨, 점수, 시간, 변화량)
const HistoryRow = ({ entry, prevEntry, isLatest, onDelete }) => {
  const date = new Date(entry.timestamp);
  const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  const s = entry.summary || {};
  const ps = prevEntry?.summary || {};

  // 직전 기록과 비교한 변화량 계산
  const overallDelta = (s.overallScore !== undefined && ps.overallScore !== undefined)
    ? s.overallScore - ps.overallScore : null;
  const dnaDelta = (s.satisfiedCount !== undefined && ps.satisfiedCount !== undefined)
    ? s.satisfiedCount - ps.satisfiedCount : null;
  const topTierDelta = (s.topTierMetCount !== undefined && ps.topTierMetCount !== undefined)
    ? s.topTierMetCount - ps.topTierMetCount : null;

  return (
    <div className={`border rounded-lg p-3 ${isLatest ? 'border-indigo-300 bg-indigo-50/50' : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800'}`}>
      <div className="flex items-start gap-2 mb-2 flex-wrap">
        <div className={`text-xs font-bold px-2 py-0.5 rounded ${isLatest ? 'bg-indigo-600 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'}`}>
          {entry.label || '미라벨'}
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">{dateStr}</span>
        <span className="text-[10px] text-slate-400">{entry.activityType} · {entry.grade}</span>
        <button
          type="button"
          onClick={() => onDelete(entry.id)}
          className="ml-auto text-[10px] text-slate-400 hover:text-rose-600 transition"
          title="이 기록 삭제"
        >
          삭제
        </button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded p-2 text-center">
          <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold">종합</div>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-base font-mono font-bold text-slate-800 dark:text-slate-200">{s.overallScore ?? '-'}</span>
            <DeltaBadge delta={overallDelta} />
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded p-2 text-center">
          <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold">DNA</div>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-base font-mono font-bold text-slate-800 dark:text-slate-200">
              {s.satisfiedCount ?? '-'}<span className="text-[10px] text-slate-400">/7</span>
            </span>
            <DeltaBadge delta={dnaDelta} />
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 rounded p-2 text-center">
          <div className="text-[9px] text-slate-500 dark:text-slate-400 uppercase tracking-wide font-bold">도약</div>
          <div className="flex items-baseline justify-center gap-1 mt-0.5">
            <span className="text-base font-mono font-bold text-slate-800 dark:text-slate-200">
              {s.topTierMetCount ?? '-'}<span className="text-[10px] text-slate-400">/10</span>
            </span>
            <DeltaBadge delta={topTierDelta} />
          </div>
        </div>
      </div>
      {s.complianceCritical > 0 && (
        <div className="mt-2 text-[10px] text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded px-2 py-1">
          ⚠ 기재요령 절대 금지 위반 {s.complianceCritical}건
        </div>
      )}
    </div>
  );
};

// 메인 히스토리 카드 — 학생 정보 입력 + 저장 + 추이 차트 + 누적 목록
export const HistoryCard = ({
  studentId,
  studentName,
  label,
  result,
  complianceViolations,
  activityType,
  grade,
  text,
  onIdChange,
  onNameChange,
  onLabelChange,
}) => {
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);

  // 학생ID별 히스토리 — 캐시 hook으로 위임. studentId가 비어있으면 key=null로 fetch 비활성.
  // 같은 학생을 다시 봐도 IndexedDB 재질의 안 함(캐시 히트).
  const studentKey = historyCacheKey(studentId);
  const historyQ = useIndexedQuery(
    studentKey,
    () => getAnalysesByStudent(studentId),
  );
  const history = historyQ.data || [];
  const loading = historyQ.loading;

  // 전체 학생 목록(자동완성용) — 단일 키, 마운트 시 한 번만 fetch.
  const studentsQ = useIndexedQuery(
    STUDENTS_CACHE_KEY,
    () => getAllStudents(),
  );
  const studentList = studentsQ.data || [];

  const handleSave = async () => {
    if (!studentId || !studentId.trim()) {
      alert('학생 ID(또는 이니셜)를 입력해 주세요.');
      return;
    }
    if (!result) {
      alert('저장할 분석 결과가 없습니다.');
      return;
    }
    setSaving(true);
    try {
      const summary = summarizeForHistory(result, complianceViolations);
      const saved = await saveAnalysis({
        studentId: studentId.trim(),
        studentName: (studentName || '').trim() || studentId.trim(),
        label: (label || '').trim() || `분석 ${new Date().toLocaleString('ko-KR')}`,
        activityType,
        grade,
        originalText: text,
        summary,
      });
      // (1) 히스토리 캐시 — 정확하게 알고 있으므로 직접 갱신(재질의 불필요)
      mutateIndexedQuery(
        historyCacheKey(studentId.trim()),
        (prev) => [...(prev || []), saved].sort((a, b) => a.timestamp - b.timestamp),
      );
      // (2) 학생 목록 캐시 — 새 학생일 수 있으므로 다시 조회 후 캐시 갱신
      const fresh = await getAllStudents();
      mutateIndexedQuery(STUDENTS_CACHE_KEY, fresh);

      setSavedToast(true);
      setTimeout(() => setSavedToast(false), TOAST_SAVED_MS);
    } catch (e) {
      console.error('save failed', e);
      alert('저장 실패: ' + (e?.message || '알 수 없는 오류'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteEntry = async (id) => {
    if (!confirm('이 기록을 삭제하시겠습니까?')) return;
    try {
      await deleteAnalysis(id);
      // 히스토리 캐시에서 해당 항목만 제거
      mutateIndexedQuery(studentKey, (prev) => (prev || []).filter((h) => h.id !== id));
    } catch (e) {
      alert('삭제 실패');
    }
  };

  const handleDeleteAll = async () => {
    if (!studentId) return;
    if (!confirm(`'${studentId}' 학생의 모든 기록(${history.length}건)을 삭제하시겠습니까?`)) return;
    try {
      await deleteStudent(studentId);
      // 두 캐시 모두 갱신: 이 학생 히스토리는 비우고, 학생 목록은 재조회
      mutateIndexedQuery(studentKey, []);
      const fresh = await getAllStudents();
      mutateIndexedQuery(STUDENTS_CACHE_KEY, fresh);
    } catch (e) {
      alert('삭제 실패');
    }
  };

  const headerBadge = (
    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 whitespace-nowrap">
      {history.length}건
    </span>
  );

  return (
    <CollapsibleCard
      icon={Activity}
      title="히스토리 · 변화 추적"
      tooltip="학생 ID(또는 이니셜)로 분석 결과를 IndexedDB에 저장하고, 같은 학생의 초안→1차→2차→최종본 분석 결과를 시간순으로 누적합니다. 종합 점수·DNA 충족 수·도약 충족 수의 변화량(▲▼)이 자동 계산되어 학생 면담·지도 자료로 즉시 활용 가능합니다. 데이터는 이 브라우저에만 저장되며, 캐시 정리 시 사라질 수 있습니다."
      defaultOpen={false}
      headerExtra={headerBadge}
    >
      {/* 학생 정보 입력 영역 */}
      <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-lg p-3 mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-2">
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">학생 ID *</label>
            <input
              type="text"
              value={studentId || ''}
              onChange={(e) => onIdChange(e.target.value)}
              placeholder="예: A12, 홍OO"
              className="w-full px-2.5 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              list="student-id-suggestions"
            />
            <datalist id="student-id-suggestions">
              {studentList.map((s) => (
                <option key={s.studentId} value={s.studentId}>{`${s.studentName} (${s.count}건)`}</option>
              ))}
            </datalist>
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">학생명 (선택)</label>
            <input
              type="text"
              value={studentName || ''}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="예: 홍길동"
              className="w-full px-2.5 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide block mb-1">단계 라벨</label>
            <select
              value={label || ''}
              onChange={(e) => onLabelChange(e.target.value)}
              className="w-full px-2.5 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded focus:outline-none focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 bg-white dark:bg-slate-800"
            >
              <option value="">단계 선택...</option>
              <option value="초안">초안</option>
              <option value="1차 수정">1차 수정</option>
              <option value="2차 수정">2차 수정</option>
              <option value="3차 수정">3차 수정</option>
              <option value="최종본">최종본</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSave}
            disabled={!result || saving}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
            현재 분석 저장
          </button>
          {savedToast && (
            <span className="text-xs text-emerald-700 dark:text-emerald-300 font-bold animate-pulse">✓ 저장됨</span>
          )}
          {history.length > 0 && (
            <button
              type="button"
              onClick={handleDeleteAll}
              className="ml-auto text-xs text-rose-600 hover:text-rose-700 hover:underline"
            >
              이 학생 기록 모두 삭제
            </button>
          )}
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
          ※ 기록은 이 브라우저에만 저장됩니다. 학교 PC 캐시 정리 시 사라질 수 있으므로 중요한 자료는 별도 백업하세요.
        </p>
      </div>

      {/* 히스토리 표시 */}
      {loading && (
        <div className="flex items-center justify-center py-6 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin mr-2" /> 불러오는 중...
        </div>
      )}

      {!loading && history.length === 0 && studentId && (
        <div className="bg-slate-50 dark:bg-slate-700/50 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
          <Activity className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm text-slate-500 dark:text-slate-400">'{studentId}' 학생의 저장된 기록이 없습니다.</p>
          <p className="text-xs text-slate-400 mt-1">위 [현재 분석 저장] 버튼을 눌러 첫 기록을 추가하세요.</p>
        </div>
      )}

      {!loading && history.length === 0 && !studentId && (
        <div className="bg-slate-50 dark:bg-slate-700/50 border border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-6 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">학생 ID를 입력하면 누적된 기록을 볼 수 있습니다.</p>
        </div>
      )}

      {!loading && history.length > 0 && (
        <>
          {/* 추이 차트 — 2건 이상 누적된 경우에만 표시 */}
          {history.length >= 2 && (
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <TrendLineChart entries={history} valueKey="overallScore" color="#6366f1" label="종합 점수 추이" max={100} />
                <TrendLineChart entries={history} valueKey="satisfiedCount" color="#10b981" label="DNA 충족 수 (0~7)" max={7} />
                <TrendLineChart entries={history} valueKey="topTierMetCount" color="#e11d48" label="도약 충족 수 (0~10)" max={10} />
              </div>
            </div>
          )}

          {/* 누적 기록 목록(최신이 위) */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
              누적 기록 — 최신순
            </div>
            {[...history].reverse().map((entry, idx) => {
              // 시간순 오름차순 history에서 이전 항목을 찾아 변화량 계산
              const sortedAsc = history;
              const ascIdx = sortedAsc.findIndex((h) => h.id === entry.id);
              const prevEntry = ascIdx > 0 ? sortedAsc[ascIdx - 1] : null;
              return (
                <HistoryRow
                  key={entry.id}
                  entry={entry}
                  prevEntry={prevEntry}
                  isLatest={idx === 0}
                  onDelete={handleDeleteEntry}
                />
              );
            })}
          </div>
        </>
      )}
    </CollapsibleCard>
  );
};
