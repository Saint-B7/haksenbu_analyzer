// ──────────────────────────────────────────────────────────
// HaksenbuAnalyzer — 학생부 문장 분석기 메인 컴포넌트
//   - 입력: 학년·항목·진로/학과·본문
//   - 분석: Anthropic Claude Sonnet 4 직접 호출, 3-phase 병렬
//     ① Core(buildCorePrompt) ② Extended(buildExtendedPrompt) ③ MultiPerspective
//   - 결과 UI: 3 탭(핵심 분석 / 심화 진단 / 평가 시뮬레이션)
//   - 저장: HTML로 통째 저장(탭·접힘 카드 그대로 인터랙티브 동작)
//   - 부수 기능: 기재요령 자동 검출, IndexedDB 히스토리, NEIS 바이트 계산
// ──────────────────────────────────────────────────────────

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Sparkles, FileText, Loader2, AlertTriangle,
  GraduationCap, Layers,
  Flame, Info, BarChart3, Network, Briefcase, RotateCcw,
  Users, Download, Target, CheckCircle2, XCircle, Coins,
  Sun, Moon, Printer,
} from 'lucide-react';
import SettingsModal from './components/SettingsModal';
import PrintDialog from './components/print/PrintDialog.jsx';
import PrintReportView from './components/print/PrintReportView.jsx';
import { useTheme } from './contexts/ThemeContext.jsx';

// 라이브러리
import { getPrefs, savePrefs } from './lib/user-prefs';
import { loadDraft, createDebouncedSave } from './lib/auto-save';
import { NEIS_BYTE_LIMIT, NEIS_BYTE_REWRITE_MIN, calcNeisBytes } from './lib/neis-bytes';
import { PRETENDARD_FONT_FACE_CSS } from './lib/fonts';
import { detectComplianceViolations } from './lib/compliance';
import { callPhase, humanizeError } from './lib/api';
import { stripBoldMarkup } from './lib/text-format';

// 프롬프트
import { buildCorePrompt } from './prompts/core';
import { buildExtendedPrompt } from './prompts/extended';
import { buildMultiPerspectivePrompt } from './prompts/multi';

// 데이터 상수
import {
  GRADES, ACTIVITY_TYPES, DNA_CRITERIA, depthBucketOf,
} from './data/criteria';
import { qualityLevelOf, SPECIFICITY_COLORS } from './data/colors';
import { TOAST_COPIED_MS } from './data/constants';

// 공통 컴포넌트
import { RichText, InfoTooltip, CardHeader, CollapsibleCard } from './components/common';

// 차트
import { DNARadar } from './components/charts/SvgRadarChart';
import { CircularScore, DepthGauge, MatchBadge } from './components/charts/SmallCharts';

// 서사 흐름 + 카드
import { UnifiedStructureFlow } from './components/UnifiedStructureFlow';
import { SummaryStrip } from './components/cards/SummaryStrip';
import { StrengthsWeaknessesCard } from './components/cards/StrengthsWeaknessesCard';
import { ComplianceCard } from './components/cards/ComplianceCard';
import { HistoryCard } from './components/cards/HistoryCard';
import { TopTierCheckCard } from './components/cards/TopTierCheckCard';
import { PromotionRoadmapCard } from './components/cards/PromotionRoadmapCard';
import { MultiPerspectiveCard } from './components/cards/MultiPerspectiveCard';
import { StrictEvidenceCard } from './components/cards/StrictEvidenceCard';
import { RewriteCard } from './components/cards/RewriteCard';

const EXAMPLE_SENTENCES = [
  {
    label: '세특 예시',
    preview: '확률과 통계에서 실생활 데이터를 활용해…',
    text: '확률과 통계 수업에서 실생활 데이터를 활용한 프로젝트를 자발적으로 기획하여 편의점 3개월 매출 데이터를 수집·분석하고, 베이즈 정리를 적용해 요일별 최적 발주량 산출 모형을 개발함. 이 과정에서 조건부 확률 개념을 스스로 심화 탐구하고 결과를 반 친구들에게 발표하여 통계적 사고력 확산에 기여함.',
  },
  {
    label: '동아리 예시',
    preview: '독서 토론 동아리 부장으로서 철학 고전…',
    text: '독서 토론 동아리(탐구독서) 부장으로서 철학 고전 5권에 대한 월례 심화 토론을 기획·진행함. 특히 인공지능 윤리를 주제로 토론 자료를 직접 제작하고 소크라테스식 문답법을 적용하여 참여 학생들의 비판적 사고력을 이끌어냄. 외부 전문가 초청 특강을 섭외하는 등 자기주도적 리더십이 돋보임.',
  },
  {
    label: '봉사 예시',
    preview: '교내 분리수거 캠페인을 기획하여…',
    text: '학교 환경부 활동에서 분리수거 실태를 스스로 조사하여 교내 재활용 캠페인을 기획함. 학급별 홍보 자료를 직접 제작하고 1개월간 캠페인을 운영한 결과 교내 분리수거 참여율이 23% 향상됨. 환경 문제를 단순 관심에서 실천으로 이어가는 태도가 인상적임.',
  },
];

export default function HaksenbuAnalyzer() {
  // ── 테마 ─────────────────────────────────────────────────
  const { theme, toggleTheme } = useTheme();

  // ── 입력 상태 ─────────────────────────────────────────────
  const [grade, setGrade] = useState(() => getPrefs().grade);
  const [activityType, setActivityType] = useState(() => getPrefs().activityType);
  const [careerGoal, setCareerGoal] = useState(() => loadDraft().careerGoal);
  const [desiredMajor, setDesiredMajor] = useState(() => loadDraft().desiredMajor);
  const [text, setText] = useState(() => loadDraft().text);

  // ── 분석 상태 ─────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [errorDetail, setErrorDetail] = useState(null);
  const [partialNotice, setPartialNotice] = useState(null);
  const [copied, setCopied] = useState(false);

  // 3관점 평가는 기본에서 빠지고 사용자가 별도로 트리거(추가 분석 버튼).
  // 핵심·심화 분석을 먼저 받아본 뒤 필요할 때만 추가 호출 → 평균 응답 시간 단축.
  const [mpLoading, setMpLoading] = useState(false);
  const [mpError, setMpError] = useState(null);

  // ── 결과 화면 상태 ────────────────────────────────────────
  // activeTab: 'core' | 'deep' | 'eval'
  const [activeTab, setActiveTab] = useState('core');

  // 히스토리(IndexedDB) 저장에 쓰는 학생 식별 정보
  const [studentId, setStudentId] = useState('');
  const [studentName, setStudentName] = useState('');
  const [historyLabel, setHistoryLabel] = useState('');

  // 설정 모달 (Electron 전용 — API 키 / 모델 선택)
  const [settingsOpen, setSettingsOpen] = useState(false);
  const isElectronEnv = typeof window !== 'undefined' && window.electronAPI != null;

  // 인쇄 보고서 — 섹션 선택 다이얼로그 + 미리보기 뷰
  const [printDialogOpen, setPrintDialogOpen] = useState(false);
  const [view, setView] = useState('main');          // 'main' | 'print'
  const [printSections, setPrintSections] = useState(null); // Set<string>

  // API 키 존재 여부: null=확인중, true=설정됨, false=미설정
  const [apiKeyReady, setApiKeyReady] = useState(null);
  // 키 연결 성공 직후 토스트 표시 플래그
  const [apiKeyToast, setApiKeyToast] = useState(false);
  // 자동 업데이트 상태: null | { type, percent?, info?, message? }
  const [updateStatus, setUpdateStatus] = useState(null);
  // OpenRouter 남은 크레딧(USD): null = 미표시(키 없음·조회 실패), number = 표시
  const [credits, setCredits] = useState(null);

  // 남은 크레딧 갱신 — 저장된 키 기반. 실패 시 조용히 null(뱃지 숨김), 폴링 없음.
  const refreshCredits = () => {
    if (!isElectronEnv || !window.electronAPI?.getCredits) return;
    window.electronAPI.getCredits()
      .then((c) => setCredits(c && typeof c.remaining === 'number' ? c.remaining : null))
      .catch(() => setCredits(null));
  };

  // 학년·항목 변경 시 localStorage에 저장
  useEffect(() => { savePrefs({ grade, activityType }); }, [grade, activityType]);

  // 텍스트·진로·학과 — 3초 디바운스 자동 저장
  const _debouncedSave = useRef(createDebouncedSave(3000));
  useEffect(() => {
    _debouncedSave.current({ text, careerGoal, desiredMajor });
  }, [text, careerGoal, desiredMajor]);

  // 앱 마운트 시 키 존재 여부 + 남은 크레딧을 한 번씩 조회
  useEffect(() => {
    if (!isElectronEnv) return;
    window.electronAPI.hasApiKey()
      .then(setApiKeyReady)
      .catch(() => setApiKeyReady(null));
    refreshCredits();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 자동 업데이트 IPC 구독 (패키징된 앱에서만 updater가 동작)
  useEffect(() => {
    if (!isElectronEnv || !window.electronAPI?.onUpdateStatus) return;
    return window.electronAPI.onUpdateStatus(setUpdateStatus);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 설정 모달에서 테스트 성공 후 호출 → 배너 숨김 + 토스트 + 크레딧 갱신
  const handleKeyConnected = () => {
    setApiKeyReady(true);
    setApiKeyToast(true);
    setTimeout(() => setApiKeyToast(false), 1500);
    refreshCredits();
  };

  // 설정 모달 닫힘 → 키 상태 재동기화 (삭제 케이스 포함) + 크레딧 갱신
  const handleSettingsClose = () => {
    setSettingsOpen(false);
    if (isElectronEnv) {
      window.electronAPI.hasApiKey()
        .then(setApiKeyReady)
        .catch(() => {});
      refreshCredits();
    }
  };

  // 인쇄 모드 — 모든 collapsible 카드를 강제로 펼침
  const [printMode, setPrintMode] = useState(false);
  // HTML 저장 모드 — 모든 탭 컨텐츠를 동시에 렌더하여 추출
  const [saveMode, setSaveMode] = useState(false);

  // 결과 영역 DOM 참조 — HTML 저장 시 cloneNode 대상
  const resultRef = useRef(null);

  // 두 프레임 대기 — paint 사이클 완료 보장(차트 SVG 확정 렌더용)
  const waitTwoFrames = () => new Promise((resolve) => {
    requestAnimationFrame(() => requestAnimationFrame(resolve));
  });

  // ── HTML 저장 ─────────────────────────────────────────────
  // 저장본은 탭과 collapsible이 모두 인터랙티브하게 동작하도록 vanilla JS 임베드
  // 저장 시점 DOM 가공:
  //  - 비활성 탭에 hidden 주입 → 첫 화면은 핵심 탭만 보임
  //  - 차트 부모 컨테이너(.saveable-remove-chart-container) 통째로 제거
  //  - 데스크톱 서사 흐름 강제 노출, 모바일 흐름 제거
  //  - collapsible 카드는 모두 접힘 상태로 저장
  const saveAsHtml = async () => {
    if (!resultRef.current) return;
    setSaveMode(true);
    setPrintMode(true); // 저장 시점 collapsible은 펼쳐서 본문이 DOM에 존재해야 함
    // 차트 안정화 대기 — React 리렌더 → SVG 측정·그리기 완료까지 충분히 기다림
    await waitTwoFrames();
    await waitTwoFrames();
    await new Promise((r) => setTimeout(r, 200));

    const today = new Date().toISOString().slice(0, 10);
    const filename = `학생부분석_${activityType}_${grade}_${today}.html`;

    // resultRef를 cloneNode하여 원본 영향 없이 가공
    const cloned = resultRef.current.cloneNode(true);

    // (1) 비활성 탭 패널에 hidden 주입 — 첫 화면은 핵심 탭만 보임
    cloned.querySelectorAll('[data-tab-panel]').forEach((panel) => {
      const key = panel.getAttribute('data-tab-panel');
      if (key !== 'core') panel.classList.add('hidden');
    });

    // (2) 차트 부모 컨테이너 통째로 제거 — 빈 여백 방지
    cloned.querySelectorAll('.saveable-remove-chart').forEach((el) => el.remove());
    cloned.querySelectorAll('.saveable-remove-chart-container').forEach((el) => el.remove());

    // (3) DNA 본문 grid를 1열로 — 차트가 빠진 빈 첫 셀 방지
    cloned.querySelectorAll('.dna-body-grid').forEach((el) => {
      el.classList.remove('lg:grid-cols-2');
      el.classList.add('lg:grid-cols-1');
    });

    // (4) 서사 흐름 — 데스크톱 영역 항상 보이게, 모바일 영역은 제거
    cloned.querySelectorAll('.narrative-flow-desktop').forEach((el) => {
      el.classList.remove('hidden', 'md:flex');
      el.classList.add('flex');
    });
    cloned.querySelectorAll('.narrative-flow-mobile').forEach((el) => el.remove());

    // (5) 모든 collapsible 카드를 기본 접힘 상태로 처리
    //   (종합 점수·대안 문장은 일반 div이므로 영향 없이 펼쳐진 상태 유지)
    cloned.querySelectorAll('button[aria-expanded]').forEach((btn) => {
      // 탭 nav 버튼은 제외(data-tab 속성 보유)
      if (btn.hasAttribute('data-tab')) return;
      btn.setAttribute('aria-expanded', 'false');
      // chevron 회전 클래스 제거
      const chev = btn.querySelector('svg.lucide-chevron-down');
      if (chev) chev.classList.remove('rotate-180');
      // 헤더 button의 둥근 모서리 보정(rounded-t-xl → rounded-xl)
      if (btn.classList.contains('rounded-t-xl')) {
        btn.classList.remove('rounded-t-xl');
        btn.classList.add('rounded-xl');
      }
      // button 이후 모든 형제(본문)에 display:none 인라인 적용
      let sibling = btn.nextElementSibling;
      while (sibling) {
        // 또 다른 collapsible 헤더를 만나면 멈춤(다른 카드의 시작)
        if (sibling.tagName === 'BUTTON' && sibling.hasAttribute('aria-expanded')) break;
        sibling.setAttribute('style', (sibling.getAttribute('style') || '') + ';display:none;');
        sibling = sibling.nextElementSibling;
      }
    });

    const innerHtml = cloned.innerHTML;

    // 저장본에 들어갈 vanilla JS — 탭 전환 + collapsible 토글
    const interactiveScript = `
(function() {
  // 1) 탭 전환 — data-tab 버튼 클릭 시 해당 패널만 표시
  function setupTabs() {
    var tabBtns = document.querySelectorAll('[data-tab]');
    var tabPanels = document.querySelectorAll('[data-tab-panel]');
    if (tabBtns.length === 0 || tabPanels.length === 0) return;

    function activate(key) {
      tabBtns.forEach(function(b) {
        var on = b.getAttribute('data-tab') === key;
        if (on) {
          b.classList.add('bg-indigo-600', 'text-white', 'shadow-sm');
          b.classList.remove('bg-white', 'text-slate-700');
        } else {
          b.classList.remove('bg-indigo-600', 'text-white', 'shadow-sm');
          b.classList.add('bg-white', 'text-slate-700');
        }
      });
      tabPanels.forEach(function(p) {
        var match = p.getAttribute('data-tab-panel') === key;
        if (match) p.classList.remove('hidden');
        else p.classList.add('hidden');
      });
    }

    tabBtns.forEach(function(btn) {
      if (btn.disabled) return;
      btn.addEventListener('click', function() {
        var key = btn.getAttribute('data-tab');
        if (key) activate(key);
      });
    });
    activate('core');
  }

  // 2) Collapsible 토글 — 카드 단위로 button 이후 형제 한 번에 토글
  function setupCollapsibles() {
    var togglers = document.querySelectorAll('button[aria-expanded]');
    togglers.forEach(function(btn) {
      if (btn.hasAttribute('data-tab')) return;
      btn.style.cursor = 'pointer';

      btn.addEventListener('click', function(e) {
        e.preventDefault();
        var isOpen = btn.getAttribute('aria-expanded') === 'true';
        var nextOpen = !isOpen;
        btn.setAttribute('aria-expanded', nextOpen ? 'true' : 'false');
        var chev = btn.querySelector('svg.lucide-chevron-down');
        if (chev) chev.classList.toggle('rotate-180', nextOpen);
        // 헤더 button의 rounded-t-xl ↔ rounded-xl 전환
        if (btn.classList.contains('rounded-t-xl') || btn.classList.contains('rounded-xl')) {
          if (nextOpen) {
            btn.classList.remove('rounded-xl');
            btn.classList.add('rounded-t-xl');
          } else {
            btn.classList.remove('rounded-t-xl');
            btn.classList.add('rounded-xl');
          }
        }
        // button 이후 모든 형제를 한 번에 토글
        var sibling = btn.nextElementSibling;
        while (sibling) {
          if (sibling.tagName === 'BUTTON' && sibling.hasAttribute('aria-expanded')) break;
          sibling.style.display = nextOpen ? '' : 'none';
          sibling = sibling.nextElementSibling;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() { setupTabs(); setupCollapsibles(); });
  } else {
    setupTabs(); setupCollapsibles();
  }
})();
`;

    const html = `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>학생부 문장 분석 결과 — ${activityType} ${today}</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <style>
    /* Pretendard 폰트 — 웹앱과 동일하게 9개 weight @font-face 직접 선언 */${PRETENDARD_FONT_FACE_CSS}
    :root, html, body, button, input, select, textarea, h1, h2, h3, h4, h5, h6, p, span, div, li, a, label, code, pre {
      font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif !important;
    }
    svg text { font-family: 'Pretendard', system-ui, sans-serif !important; }

    body { padding: 24px; background: #f8fafc; color: #0f172a; }
    .saved-wrap { max-width: 1200px; margin: 0 auto; }
    .saved-meta { font-size: 12px; color: #64748b; padding-bottom: 12px; margin-bottom: 16px; border-bottom: 1px solid #e2e8f0; }
    .hidden { display: none !important; }
    /* chevron 회전 (Tailwind rotate-180 보강) */
    .rotate-180 { transform: rotate(180deg); }
    /* 툴팁 z-index 안전망 */
    .group\\/tt > span[class*="opacity-0"] {
      z-index: 9999 !important;
    }
    .group\\/tt:hover > span[class*="opacity-0"] {
      opacity: 1 !important;
    }
    .saved-wrap [data-tab-panel],
    .saved-wrap [data-tab-panel] > * {
      overflow: visible !important;
    }
    @media print { @page { size: A4; margin: 1cm; } body { background: white; } }
  </style>
</head>
<body>
  <div class="saved-wrap">
    <div class="saved-meta">학생부 문장 분석 결과 · ${grade} · ${activityType}활동 · 저장일 ${today} · 각 항목 카드 헤더를 클릭하면 본문이 펼쳐집니다</div>
    ${innerHtml}
  </div>
  <script>${interactiveScript}<\/script>
</body>
</html>`;

    // Blob → 다운로드 트리거
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);

    // 저장 모드 복원
    setPrintMode(false);
    setSaveMode(false);
  };

  // ── NEIS 바이트 계산 ──────────────────────────────────────
  const charCount = text.length;
  const byteCount = calcNeisBytes(text);
  const overLimit = byteCount > NEIS_BYTE_LIMIT;
  const underLimit = byteCount > 0 && byteCount < 600;
  const bytePct = Math.min(100, (byteCount / NEIS_BYTE_LIMIT) * 100);

  // 분석 요청 본문 — analyze와 analyzeMultiPerspective 두 곳에서 동일한 형태로 사용.
  const buildUserMsg = () =>
    `다음 ${grade} ${activityType}활동 학생부 문구를 분석해 JSON으로만 응답하세요.\n진로 희망: ${careerGoal || '(미입력)'}\n희망 학과: ${desiredMajor || '(미입력)'}\n\n----- 분석 대상 -----\n${text}`;

  // ── 분석 실행 (기본: Core + Extended 2-phase) ────────────────
  // 3관점 평가는 빠짐 — 사용자가 평가 시뮬레이션 탭에서 [추가 분석] 버튼으로 별도 호출.
  const analyze = async () => {
    if (!text.trim()) return;
    setLoading(true);
    setLoadingPhase('두 단계 병렬 분석 중...');
    setError(null);
    setErrorDetail(null);
    setPartialNotice(null);
    setMpError(null);
    setResult(null);
    setActiveTab('core'); // 새 분석 시작 시 핵심 탭으로

    const userMsg = buildUserMsg();

    // 2 phase 병렬 호출 — 한쪽 실패해도 다른 쪽 결과는 보존
    const [coreSettled, extSettled] = await Promise.allSettled([
      callPhase({
        system: buildCorePrompt(activityType, grade, careerGoal, desiredMajor),
        userMsg,
        maxTokens: 12000,
      }),
      callPhase({
        system: buildExtendedPrompt(activityType, grade, careerGoal, desiredMajor),
        userMsg,
        maxTokens: 8000,
      }),
    ]);

    const coreOk = coreSettled.status === 'fulfilled';
    const extOk  = extSettled.status === 'fulfilled';

    // 두 단계 모두 실패 → 전체 에러 처리
    if (!coreOk && !extOk) {
      const e = coreSettled.reason || extSettled.reason;
      setError(humanizeError(e?.message));
      if (e?.diagnostic) setErrorDetail(e.diagnostic);
      setLoading(false);
      setLoadingPhase('');
      console.error('[All phases failed]', coreSettled.reason, extSettled.reason);
      return;
    }

    // 결과 병합 — 같은 키는 후순위가 덮어쓰지만 각 phase 키셋이 거의 분리되어 있어 충돌 적음
    const merged = {
      ...(coreOk ? coreSettled.value.parsed : {}),
      ...(extOk  ? extSettled.value.parsed  : {}),
    };

    // 대안 문장 정리 — 별표 마크업·따옴표 군더더기만 정리(바이트 자동 절단은 폐기)
    if (merged.rewrittenVersion) {
      merged.rewrittenVersion = stripBoldMarkup(merged.rewrittenVersion).trim();
    }

    setResult(merged);

    // 부분 결과 안내 — 어떤 phase가 실패/복구/토큰한도 도달했는지 사용자에게 안내
    // (3관점 평가는 별도 호출이므로 여기서 안내하지 않는다)
    const notices = [];
    if (!coreOk) notices.push('핵심 분석 실패 — 심화 진단(최상위 도약·로드맵)만 표시됩니다.');
    if (!extOk)  notices.push('심화 진단(최상위 도약·로드맵) 실패 — 핵심 분석만 표시됩니다.');
    if (coreOk && coreSettled.value.recovered) notices.push('핵심 분석 응답이 일부 복구되었습니다.');
    if (extOk  && extSettled.value.recovered)  notices.push('심화 진단 응답이 일부 복구되었습니다.');
    if (coreOk && coreSettled.value.stop === 'max_tokens') notices.push('핵심 분석 응답이 토큰 한도에 도달했습니다 — 일부 항목이 누락될 수 있습니다.');
    if (extOk  && extSettled.value.stop === 'max_tokens')  notices.push('심화 진단 응답이 토큰 한도에 도달했습니다 — 일부 항목이 누락될 수 있습니다.');
    if (notices.length > 0) setPartialNotice(notices);

    setLoading(false);
    setLoadingPhase('');
  };

  // ── 3관점 평가 추가 분석 ────────────────────────────────────
  // 사용자가 평가 시뮬레이션 탭의 [추가 분석] 버튼을 눌렀을 때만 호출.
  // 기존 result 위에 multiPerspectiveEvaluation 키를 머지하는 방식.
  const analyzeMultiPerspective = async () => {
    if (!text.trim() || !result) return;
    setMpLoading(true);
    setMpError(null);

    const userMsg = buildUserMsg();

    try {
      const { parsed, recovered, stop } = await callPhase({
        system: buildMultiPerspectivePrompt(activityType, grade, careerGoal, desiredMajor),
        userMsg,
        maxTokens: 8000,
      });

      // 기존 result에 머지(덮어쓰기 아닌 추가)
      setResult((prev) => ({ ...(prev || {}), ...(parsed || {}) }));

      // 추가 알림이 있으면 partialNotice에 누적
      const notices = [];
      if (recovered) notices.push('3관점 평가 응답이 일부 복구되었습니다.');
      if (stop === 'max_tokens') notices.push('3관점 평가 응답이 토큰 한도에 도달했습니다 — 일부 항목이 누락될 수 있습니다.');
      if (notices.length > 0) {
        setPartialNotice((prev) => [...(prev || []), ...notices]);
      }
    } catch (e) {
      setMpError(humanizeError(e?.message));
      console.error('[MP phase failed]', e);
    } finally {
      setMpLoading(false);
    }
  };

  // 대안 문장 클립보드 복사 — 별표 마크업 제거 후 평문으로
  const copyRewrite = async () => {
    if (!result?.rewrittenVersion) return;
    try {
      const cleanText = stripBoldMarkup(result.rewrittenVersion);
      await navigator.clipboard.writeText(cleanText);
      setCopied(true);
      setTimeout(() => setCopied(false), TOAST_COPIED_MS);
    } catch (e) {
      // 클립보드 차단 환경에서는 무시(브라우저 보안 제약)
    }
  };

  // ── 결과 파생값 ───────────────────────────────────────────
  const depth = result?.researchDepth;
  const depthBucket = depth ? depthBucketOf(depth.score) : null;
  const hasNextStages = result?.promotionRoadmap?.nextStages?.length > 0;
  const hasCurrentApps = result?.promotionRoadmap?.currentApplicationActivities?.length > 0;
  // 3학년인 경우 진급 이후 단계는 의미 없음, 즉시 적용 활동만 보여줌
  const showRoadmap = (grade !== '3학년' && hasNextStages) || hasCurrentApps;
  // 기재요령 위반 검출 — 결과가 있을 때만 계산.
  // 정규식 11개를 매 렌더 다시 돌리지 않도록 useMemo로 감쌈(본문이 길면 체감 차이).
  // result(객체 참조)와 text(문자열) 변경 시에만 재계산.
  const complianceViolations = useMemo(
    () => (result ? detectComplianceViolations(text) : null),
    [result, text],
  );

  const disabledReason =
    isElectronEnv && apiKeyReady === false ? 'API 키를 먼저 연결해 주세요 (우측 상단 ⚙️)' :
    !text.trim() ? '분석할 학생부 문구를 입력해 주세요' :
    null;

  // ── 단축키 ─────────────────────────────────────────────────
  // ref를 매 렌더마다 최신값으로 교체 → useEffect는 마운트 1회만 등록하되
  // 클로저 안에서 항상 최신 analyze/disabledReason을 참조할 수 있음
  const _analyzeRef = useRef(null);
  const _disabledRef = useRef(null);
  const _toggleThemeRef = useRef(null);
  const _viewRef = useRef('main');
  const _printDialogOpenRef = useRef(false);
  _analyzeRef.current = analyze;
  _disabledRef.current = disabledReason;
  _toggleThemeRef.current = toggleTheme;
  _viewRef.current = view;
  _printDialogOpenRef.current = printDialogOpen;

  useEffect(() => {
    const handler = (e) => {
      const mod = e.metaKey || e.ctrlKey;
      // Ctrl/Cmd+Enter → 분석 시작
      if (mod && e.key === 'Enter') {
        e.preventDefault();
        if (!_disabledRef.current) _analyzeRef.current();
        return;
      }
      // Ctrl/Cmd+, → 설정 열기 (Electron 전용)
      if (mod && e.key === ',') {
        e.preventDefault();
        if (isElectronEnv) setSettingsOpen(true);
        return;
      }
      // Ctrl/Cmd+Shift+L → 다크/라이트 모드 전환
      if (mod && e.shiftKey && e.key === 'L') {
        e.preventDefault();
        _toggleThemeRef.current();
        return;
      }
      // Esc → 인쇄 미리보기 → 다이얼로그 → 설정 모달 순으로 닫기
      if (e.key === 'Escape') {
        if (_viewRef.current === 'print') { setView('main'); return; }
        if (_printDialogOpenRef.current) { setPrintDialogOpen(false); return; }
        setSettingsOpen(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 인쇄 미리보기 뷰 — 전체 화면 교체(훅은 유지됨)
  if (view === 'print') {
    return (
      <PrintReportView
        result={result}
        selectedSections={printSections}
        activityType={activityType}
        grade={grade}
        careerGoal={careerGoal}
        desiredMajor={desiredMajor}
        complianceViolations={complianceViolations}
        onBack={() => setView('main')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 p-4 sm:p-6 transition-colors duration-150">
      {/* API 키 연결 성공 토스트 — 1.5초 후 자동 소멸 */}
      {apiKeyToast && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-sm font-bold rounded-xl shadow-lg pointer-events-none">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          API 키 연결됨
        </div>
      )}
      {/* Pretendard 폰트 전역 적용 — Tailwind 기본 sans-serif 오버라이드 */}
      <style>{`
        ${PRETENDARD_FONT_FACE_CSS}

        :root, html, body {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif !important;
        }
        body, button, input, select, textarea, code, pre, kbd, samp,
        h1, h2, h3, h4, h5, h6, p, span, div, li, a, label,
        .font-sans, .font-mono {
          font-family: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif !important;
        }
        svg text { font-family: 'Pretendard', system-ui, sans-serif !important; }
      `}</style>

      {/* 인쇄용 글로벌 스타일 — 브라우저 인쇄(Ctrl+P) 시 입력 폼·헤더 등 숨김 */}
      <style>{`
        @media print {
          @page { size: A4 portrait; margin: 1cm; }
          html, body { background: white !important; }
          .print-hide { display: none !important; }
          .max-w-5xl { max-width: none !important; padding: 0 !important; margin: 0 !important; }
          .shadow-sm, .shadow { box-shadow: none !important; }
          button[aria-expanded] svg.lucide-chevron-down { display: none !important; }
          button[aria-expanded] { cursor: default !important; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
        }
      `}</style>

      <div className="max-w-5xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6 print-hide">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Sparkles className="w-7 h-7 text-indigo-600" />
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-slate-100">학생부 문장 분석기</h1>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">v1</span>
            {/* 다크모드 토글 버튼 */}
            <button
              onClick={toggleTheme}
              className="ml-auto p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
              aria-label={theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환'}
              title={theme === 'dark' ? '라이트 모드로 전환 (Ctrl+Shift+L)' : '다크 모드로 전환 (Ctrl+Shift+L)'}
              tabIndex={0}
            >
              {theme === 'dark'
                ? <Sun className="w-5 h-5" />
                : <Moon className="w-5 h-5" />}
            </button>
            {isElectronEnv && (
              <button
                onClick={() => setSettingsOpen(true)}
                className="relative p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors duration-150"
                title={apiKeyReady === false ? 'API 키 설정 필요 (Ctrl+,)' : 'API 키 · 사용량 설정 (Ctrl+,)'}
                aria-label="API 키 및 사용량 설정 열기"
              >
                {/* Coins 아이콘: API 키가 "사용 토큰을 차감받는 통로"임을 시각적으로 표현 */}
                <Coins className="w-5 h-5" />
                {/* 키 미설정 시 빨간 점 알림 배지 — Coins 우상단 */}
                {apiKeyReady === false && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                )}
              </button>
            )}
            {/* 남은 크레딧(USD) 뱃지 — 키 연결 + 조회 성공 시에만 표시.
                $0.5 미만이면 노란 경고 톤으로 잔액 부족을 환기. 다크모드 대응. */}
            {isElectronEnv && credits != null && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full border font-medium whitespace-nowrap ${
                  credits < 0.5
                    ? 'bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-700'
                    : 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700'
                }`}
                title="OpenRouter 남은 크레딧"
              >
                남은 크레딧 ${credits.toFixed(2)}
              </span>
            )}
            {/* 자동 업데이트 상태 배지 */}
            {isElectronEnv && updateStatus?.type === 'downloading' && (
              <span className="text-xs px-2.5 py-1 bg-indigo-50 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-full border border-indigo-200 dark:border-indigo-700 font-medium whitespace-nowrap">
                새 버전 {updateStatus.percent}% 다운로드 중
              </span>
            )}
            {isElectronEnv && updateStatus?.type === 'available' && (
              <span className="text-xs px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-700 font-medium">
                새 버전 감지됨
              </span>
            )}
            {/* 다운로드 완료 → 사용자가 직접 설치(재시작) 트리거. 이게 없으면 즉시
                설치가 진행되지 않는다(autoInstallOnAppQuit으로 다음 종료 시에야 적용). */}
            {isElectronEnv && updateStatus?.type === 'downloaded' && (
              <button
                onClick={() => window.electronAPI.installUpdate()}
                className="text-xs px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-full font-medium whitespace-nowrap transition-colors duration-150"
                title="다운로드된 새 버전을 설치하고 앱을 재시작합니다"
              >
                새 버전 준비됨 · 지금 설치
              </button>
            )}
            {/* 업데이트 확인 실패 — 조용한 실패로는 원인 파악이 안 되므로 작게 노출.
                상세 메시지는 title(툴팁)로 제공. */}
            {isElectronEnv && updateStatus?.type === 'error' && (
              <span
                className="text-xs px-2.5 py-1 bg-amber-50 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-700 font-medium whitespace-nowrap"
                title={`업데이트 확인 실패: ${updateStatus.message || '알 수 없는 오류'}`}
              >
                업데이트 확인 실패
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            기록의 가치를 높이는 학생부 문장 진단 솔루션
          </p>
        </div>

        {/* 설정 모달 (Electron 전용) */}
        {isElectronEnv && (
          <SettingsModal
            open={settingsOpen}
            onClose={handleSettingsClose}
            onKeyConnected={handleKeyConnected}
          />
        )}

        {/* 인쇄 섹션 선택 다이얼로그 — 결과가 있을 때만 의미 있음 */}
        <PrintDialog
          open={printDialogOpen}
          onClose={() => setPrintDialogOpen(false)}
          onConfirm={(sections) => {
            setPrintSections(sections);
            setPrintDialogOpen(false);
            setView('print');
          }}
        />

        {/* 업데이트 다운로드 완료 → 재시작 요청 모달 */}
        {isElectronEnv && updateStatus?.type === 'downloaded' && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full mx-4 border border-slate-200 dark:border-slate-700">
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-2">
                새 버전이 준비되었습니다
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-5">
                {updateStatus.info?.version && (
                  <><span className="font-semibold text-slate-700 dark:text-slate-300">v{updateStatus.info.version}</span>이(가) 다운로드되었습니다.<br /></>
                )}
                지금 재시작하면 업데이트가 적용됩니다.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setUpdateStatus(null)}
                  className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  나중에
                </button>
                <button
                  onClick={() => window.electronAPI.installUpdate()}
                  className="px-4 py-2 text-sm font-semibold bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-lg transition-colors"
                >
                  지금 재시작
                </button>
              </div>
            </div>
          </div>
        )}

        {/* API 키 미설정 배너 — 키가 없을 때만 표시, transition으로 부드럽게 숨김 */}
        {isElectronEnv && apiKeyReady !== null && (
          <div
            className={`print-hide transition-all duration-300 overflow-hidden
              ${apiKeyReady === false ? 'opacity-100 max-h-24 mb-4' : 'opacity-0 max-h-0'}`}
          >
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl px-4 py-3 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-indigo-500 shrink-0" />
              <p className="flex-1 text-sm text-indigo-800">
                분석을 시작하려면 먼저 OpenRouter API 키를 연결해 주세요.
              </p>
              <button
                onClick={() => setSettingsOpen(true)}
                className="shrink-0 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                설정 열기
              </button>
            </div>
          </div>
        )}

        {/* 입력 카드 — 학년·항목·진로/학과·본문 */}
        <div className="print-hide bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 sm:p-6 mb-6 shadow-sm space-y-5">
          <div>
            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              1. 학년 선택
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </label>
            <div className="flex flex-wrap gap-2">
              {GRADES.map((g) => (
                <button key={g} onClick={() => setGrade(g)}
                  className={`px-4 py-2 rounded-lg border text-sm font-semibold transition ${
                    grade === g
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-300'
                  }`}>{g}</button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">
              2. 항목 선택
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            </label>
            <div className="flex flex-wrap gap-2">
              {ACTIVITY_TYPES.map((t) => (
                <button key={t.value} onClick={() => setActivityType(t.value)}
                  className={`text-left px-3 py-2 rounded-lg border text-sm transition ${
                    activityType === t.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-indigo-300'
                  }`}>
                  <div className="font-bold">{t.label}</div>
                  <div className={`text-xs mt-0.5 flex items-center gap-1 ${activityType === t.value ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'}`}>
                    강조: {t.focus}
                    <InfoTooltip content={t.tooltip} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">
              3. 진로 희망 · 희망 학과
              {(careerGoal.trim() || desiredMajor.trim()) && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
            </label>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-1">
              <Info className="w-3.5 h-3.5" />
              <span><span className="font-semibold text-indigo-600 dark:text-indigo-400">둘 중 하나만 입력</span>해도 분석이 가능하며, 둘 다 입력하면 더 정밀한 추천이 제공됩니다.</span>
            </p>
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-2 items-center">
              <div className="relative">
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={careerGoal} onChange={(e) => setCareerGoal(e.target.value)}
                  placeholder="진로 희망 (예: 임상약사)"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
              </div>
              <div className="text-center text-xs font-bold text-slate-400 px-1 hidden md:block">또는</div>
              <div className="text-center text-xs font-bold text-slate-400 md:hidden">— 또는 —</div>
              <div className="relative">
                <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input type="text" value={desiredMajor} onChange={(e) => setDesiredMajor(e.target.value)}
                  placeholder="희망 학과 (예: 약학과)"
                  className="w-full pl-9 pr-3 py-2.5 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400" />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <label className="flex items-center gap-1.5 text-sm font-bold text-slate-700 dark:text-slate-300">
                4. 분석할 학생부 문구
                {charCount >= 10 && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />}
                <InfoTooltip content="NEIS 시스템은 한글 1자를 3바이트, 영문·숫자·공백을 1바이트로 계산합니다. 한도 1500바이트 ≈ 한글 500자입니다." />
              </label>
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-sm font-mono font-bold ${overLimit ? 'text-rose-500' : underLimit ? 'text-amber-500' : 'text-slate-700 dark:text-slate-300'}`}>
                  NEIS: {charCount}자 ({byteCount}바이트) / 한도 {NEIS_BYTE_LIMIT}바이트
                </span>
              </div>
            </div>
            {/* 바이트 진행 바 */}
            <div className="h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-2">
              <div
                className={`h-full transition-all duration-300 ${
                  overLimit ? 'bg-rose-500' : bytePct >= 90 ? 'bg-amber-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${Math.min(100, bytePct)}%` }}
              />
            </div>
            <textarea value={text} onChange={(e) => setText(e.target.value)}
              placeholder="학생부 문장을 붙여 넣으세요…  (NEIS 1500바이트 ≈ 한글 500자)"
              rows={9}
              className="w-full p-3 border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg text-sm leading-relaxed focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-y" />
            {overLimit && (
              <div className="mt-2 text-sm text-amber-700 flex items-center gap-1 font-medium bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                NEIS 한도 1500바이트({byteCount}바이트)를 초과했지만 분석은 정상 진행됩니다.
              </div>
            )}
          </div>

          <div className="flex flex-col items-start gap-1.5">
            <button onClick={analyze} disabled={loading || disabledReason !== null}
              className="w-full sm:w-auto px-7 py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white text-base font-bold rounded-lg transition flex items-center justify-center gap-2 shadow-sm">
              {loading
                ? <><Loader2 className="w-5 h-5 animate-spin" /> {loadingPhase || '분석 중…'}</>
                : <><Sparkles className="w-5 h-5" /> 분석 시작 <span className="ml-1 text-xs font-normal opacity-70">Ctrl+Enter</span></>}
            </button>
            {!loading && disabledReason && (
              <p className="flex items-center gap-1 text-xs text-slate-500">
                <Info className="w-3.5 h-3.5 shrink-0" />
                {disabledReason}
              </p>
            )}
          </div>
        </div>

        {/* 에러 박스 */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 text-rose-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm leading-relaxed font-semibold">{error}</div>
                {errorDetail && (
                  <details className="mt-2">
                    <summary className="text-xs text-rose-600 cursor-pointer font-medium">세부 정보 보기</summary>
                    <pre className="mt-2 text-[10px] text-slate-700 bg-white rounded p-2 border border-rose-200 overflow-auto max-h-40 whitespace-pre-wrap break-all">
                      {errorDetail}
                    </pre>
                  </details>
                )}
                <button onClick={analyze} disabled={loading}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white border border-rose-300 text-rose-700 rounded-md hover:bg-rose-100 transition">
                  <RotateCcw className="w-3.5 h-3.5" /> 다시 시도
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 부분 결과 안내 */}
        {partialNotice && partialNotice.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-amber-800">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold mb-1">일부 결과 안내</div>
                <ul className="text-xs space-y-1">
                  {partialNotice.map((n, i) => (<li key={i}>• {n}</li>))}
                </ul>
                <button onClick={analyze} disabled={loading}
                  className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white border border-amber-300 text-amber-700 rounded-md hover:bg-amber-100 transition">
                  <RotateCcw className="w-3.5 h-3.5" /> 전체 재분석
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 빈 상태 — 3-카드 사용 가이드 */}
        {!result && !loading && !error && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

              {/* 카드 1 — 사용 방법 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                    <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">사용 방법</h3>
                </div>
                <ol className="space-y-2.5">
                  {[
                    '학년과 항목을 선택하세요',
                    '진로 희망 또는 희망 학과를 입력하세요',
                    '학생부 문구를 아래 입력창에 붙여 넣으세요',
                    '[분석 시작] 버튼을 클릭하세요',
                  ].map((step, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 카드 2 — 분석 항목 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
                    <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">분석 항목</h3>
                </div>
                <ul className="space-y-2">
                  {[
                    '문장 품질 — 구체성 · 진정성 · 성장 서사',
                    '기재요령 위반 자동 검출',
                    '입학사정관 평가 시뮬레이션',
                    '활동 키워드 네트워크 시각화',
                    '진급 로드맵 · 활동 추천',
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* 카드 3 — 예시 문장으로 시작 */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 bg-amber-100 dark:bg-amber-900 rounded-lg flex items-center justify-center">
                    <FileText className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">예시 문장으로 시작</h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">클릭하면 입력창에 바로 채워집니다.</p>
                <div className="space-y-2">
                  {EXAMPLE_SENTENCES.map((ex, i) => (
                    <button key={i} onClick={() => setText(ex.text)}
                      className="w-full text-left px-3 py-2.5 rounded-lg border border-slate-200 dark:border-slate-600 hover:border-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">[{ex.label}]</span>{' '}
                      <span className="text-slate-500 dark:text-slate-400">{ex.preview}</span>
                    </button>
                  ))}
                </div>
              </div>

            </div>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 font-medium">개발자 : 배성인</p>
          </div>
        )}

        {/* 결과 화면 — 3 탭 + 카드 트리 */}
        {result && (
          <div className="space-y-6" ref={resultRef}>
            {/* 상단 요약 스트립(sticky) — 어느 탭이든 핵심 지표 노출 */}
            <div className="print-hide">
              <SummaryStrip result={result} activityType={activityType} grade={grade} />
            </div>

            {/* 결과 액션 버튼 — HTML 저장 + 인쇄 보고서 */}
            <div className="print-hide flex flex-wrap items-center gap-2 -mt-2">
              <button
                type="button"
                onClick={saveAsHtml}
                disabled={saveMode}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-400 transition shadow-sm disabled:opacity-60 disabled:cursor-not-allowed"
                title="현재 분석 결과 전체를 HTML 파일로 저장합니다. 저장된 파일을 브라우저로 열면 탭과 카드를 그대로 클릭해서 펼치고 접을 수 있습니다."
              >
                {saveMode ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                전체 결과 HTML 저장
              </button>
              {/* 인쇄 보고서 버튼 — 섹션 선택 다이얼로그를 먼저 열고, 확인 시 미리보기로 전환 */}
              <button
                type="button"
                onClick={() => setPrintDialogOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 hover:border-indigo-400 transition shadow-sm"
                title="인쇄할 섹션을 선택하고 A4 보고서를 인쇄합니다"
              >
                <Printer className="w-4 h-4" />
                🖨️ 인쇄 보고서
              </button>
            </div>

            {/* 3 탭 네비게이션 */}
            <div className="print-hide bg-white border border-slate-200 rounded-xl p-1.5 flex gap-1.5 shadow-sm overflow-x-auto">
              {[
                { key: 'core', label: '핵심 분석', icon: BarChart3,
                  desc: '점수 · 구조도 · DNA · 깊이 · 학과 · 강약점 · 대안 문장' },
                { key: 'deep', label: '심화 진단', icon: Flame,
                  desc: '최상위 도약 10가지 · 진급 이후 로드맵' },
                { key: 'eval', label: '평가 시뮬레이션', icon: Users,
                  desc: '3관점 평가 · 합의·분산 · 합격 가능성 분포 (탭 진입 후 [추가 분석] 버튼으로 별도 호출)',
                  // 탭 항상 클릭 가능 — 결과가 없으면 탭 안에서 [추가 분석] 버튼 안내
                },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    data-tab={tab.key}
                    onClick={() => !tab.disabled && setActiveTab(tab.key)}
                    disabled={tab.disabled}
                    className={`flex-1 min-w-0 px-3 sm:px-4 py-2.5 rounded-lg text-sm font-bold transition flex items-center justify-center gap-1.5 ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : tab.disabled
                          ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                          : 'bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                    title={tab.desc}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* ──── 탭 1: 핵심 분석 ──── */}
            {(activeTab === 'core' || saveMode) && (
              <div data-tab-panel="core" className="space-y-6 print-hide">

                {/* 1) 종합 점수 — 항상 펼침 */}
                {result.overallScore !== undefined && (
                  <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-sm">
                    <CardHeader icon={BarChart3} title="종합 점수"
                      tooltip="100점 만점 종합 평가. 7가지 DNA(50점 이상 충족 항목 수), 6단계 서사 흐름의 완결성, 근거의 검증 가능성, 탐구 깊이 1~10 점수를 가중 평균해 산출됩니다. 80점 이상은 우수, 60~79점은 보완 필요, 60점 미만은 재작성 권장 수준입니다. 우측 DNA·도약 충족 수와 함께 보면 약점이 어디인지 빠르게 파악할 수 있습니다." />
                    <div className="flex flex-col sm:flex-row items-center sm:items-stretch gap-5">
                      <div className="flex-shrink-0"><CircularScore score={result.overallScore} /></div>
                      <div className="flex-1 flex flex-col justify-center min-w-0">
                        <div className="text-xs text-slate-500 mb-1 font-medium">{grade} · {activityType}활동</div>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {result.satisfiedCount !== undefined && (
                            <span className={`text-sm font-bold px-3 py-1.5 rounded-lg border ${
                              result.satisfiedCount >= 5 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : result.satisfiedCount >= 3 ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>DNA {result.satisfiedCount} / 7 충족</span>
                          )}
                          {result.topTierMetCount !== undefined && (
                            <span className="text-sm font-bold px-3 py-1.5 rounded-lg border bg-rose-50 text-rose-700 border-rose-200">
                              🔥 도약 {result.topTierMetCount} / 10
                            </span>
                          )}
                        </div>
                        {result.scoreReason && (
                          <p className="text-sm text-slate-700 leading-relaxed"><RichText text={result.scoreReason} /></p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* 2) 탐구 깊이 분석 */}
                {depth && depthBucket && (
                  <CollapsibleCard
                    icon={GraduationCap}
                    title="탐구 깊이 분석"
                    tooltip="본문에 사용된 분석 도구(엑셀·통계·회귀·실험), 인용 자료의 학술성(교과서·도서·논문·1차 자료), 사고의 추상화 수준을 종합해 1~10 스케일로 환산합니다. 1~3은 고등학생 수준의 교과 기본·심화, 4~5는 고3 융합·통계 기초, 6~7은 학부 1~2학년의 학술 DB·회귀 활용, 8~9는 학부 고학년의 다중 회귀·이론 비판, 10은 대학원 수준의 메타분석입니다. 입시 컨설팅에서는 보통 4~5점이 최상위권 진입의 분기선으로 평가됩니다."
                    defaultOpen={false}
                    forceOpen={printMode}
                    headerExtra={
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                        {depth.score} / 10
                      </span>
                    }
                  >
                    <DepthGauge score={depth.score} bucketLabel={depth.bucketLabel || depthBucket.label} />
                    <p className="mt-4 text-sm text-slate-700 leading-relaxed"><RichText text={depth.rationale} /></p>
                    {depth.depthEvidence?.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">판정 근거</div>
                        <ul className="space-y-1.5">
                          {depth.depthEvidence.map((e, i) => (
                            <li key={i} className="text-xs text-slate-700 leading-relaxed pl-3 border-l-2 border-indigo-300">
                              <RichText text={e} />
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CollapsibleCard>
                )}

                {/* 3) 문장의 서사 (6단계 구조도) */}
                {result.structureMap && <UnifiedStructureFlow structureMap={result.structureMap} forceOpen={printMode} />}

                {/* 4) 7가지 DNA */}
                {result.dnaChecklist && (
                  <CollapsibleCard
                    icon={Target}
                    title="7가지 핵심 DNA"
                    tooltip="좋은 학생부 문장이 갖는 7가지 본질 요소 — ① 질문으로 시작하는가 ② 검증 가능한 근거가 있는가 ③ 사고 과정이 드러나는가 ④ 후속 활동으로 확장되는가 ⑤ 공동체와 연결되는가 ⑥ 평가가 마지막에 오는가 ⑦ 감정보다 신뢰를 주는가. 각 요소는 0~100점 품질 점수로 평가되며 5단계(누락·약함·보통·강함·탁월) 등급이 부여됩니다. 50점 이상 항목이 5개 이상이면 합격선, 3개 미만이면 재작성 권장입니다."
                    defaultOpen={false}
                    forceOpen={printMode}
                    headerExtra={
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap border ${
                        (result.satisfiedCount ?? 0) >= 5 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : (result.satisfiedCount ?? 0) >= 3 ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}>
                        {result.satisfiedCount ?? 0} / 7
                      </span>
                    }
                  >
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 dna-body-grid">
                      <DNARadar checklist={result.dnaChecklist} />
                      <ul className="space-y-3.5 dna-list">
                        {result.dnaChecklist.map((item) => {
                          const meta = DNA_CRITERIA.find((d) => d.id === item.id) || {};
                          const qScore = (typeof item.qualityScore === 'number')
                            ? item.qualityScore
                            : (item.satisfied ? 75 : 25);
                          const lvl = qualityLevelOf(qScore);
                          return (
                            <li key={item.id} className="flex items-start gap-3">
                              {qScore >= 50
                                ? <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                                : <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-baseline gap-1.5 flex-wrap">
                                  <span className="text-slate-400 text-sm font-bold">{meta.mark}</span>
                                  <span className="font-bold text-slate-900 text-base">{item.name}</span>
                                  <span className={`ml-auto text-xs px-2 py-0.5 rounded font-bold border ${lvl.bg} ${lvl.text} ${lvl.border}`}>
                                    {lvl.label} · {qScore}
                                  </span>
                                </div>
                                <div className="h-1.5 bg-slate-100 rounded-full mt-2 mb-2 overflow-hidden">
                                  <div className="h-full transition-all duration-500" style={{ width: `${qScore}%`, backgroundColor: lvl.radarStroke }} />
                                </div>
                                <p className="text-sm text-slate-700 leading-relaxed">
                                  <RichText text={item.evidence} />
                                </p>
                                {/* DNA 요소별 대안 문장 */}
                                {item.dnaRewrite && (
                                  <p className="text-sm text-indigo-800 leading-relaxed mt-2 p-2 bg-indigo-50/70 border-l-3 border-indigo-400 rounded-r">
                                    <span className="font-bold text-indigo-600">대안 문장 · </span>
                                    <RichText text={item.dnaRewrite} />
                                  </p>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </CollapsibleCard>
                )}

                {/* 5) 학과·전공 연계 */}
                {result.majorAlignment && (
                  <CollapsibleCard
                    icon={Network}
                    title="학과·전공 연계"
                    tooltip="본문의 탐구 주제·방법론·인용 자료를 분석해 자연스럽게 도출되는 학과를 추출합니다. 주연계 학과 1개(굵은 배지)와 관련 학과 2~4개, 그리고 융합 성격을 함께 제시합니다. 입력하신 희망 학과가 있을 경우 적합도(높음·보통·낮음·불명확)를 별도로 평가하며, 이는 입시 자료의 일관성 검증에 유용합니다."
                    defaultOpen={false}
                    forceOpen={printMode}
                    headerExtra={
                      <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 whitespace-nowrap">
                        {result.majorAlignment.primary}
                      </span>
                    }
                  >
                    <div className="mb-4">
                      <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">주연계 학과</div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="inline-block px-4 py-2 bg-indigo-600 text-white text-base font-bold rounded-lg shadow-sm">
                          {result.majorAlignment.primary}
                        </div>
                        {(desiredMajor || careerGoal) && <MatchBadge level={result.majorAlignment.matchWithDesired} />}
                      </div>
                      {result.majorAlignment.primaryReason && (
                        <p className="text-sm text-slate-700 mt-2 leading-relaxed">
                          <RichText text={result.majorAlignment.primaryReason} />
                        </p>
                      )}
                      {result.majorAlignment.matchComment && (desiredMajor || careerGoal) && (
                        <p className="text-sm text-purple-700 mt-1 leading-relaxed font-medium">
                          비교 · {result.majorAlignment.matchComment}
                        </p>
                      )}
                    </div>
                    {result.majorAlignment.related?.length > 0 && (
                      <div className="mb-3">
                        <div className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">관련 학과</div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.majorAlignment.related.map((r, i) => (
                            <span key={i} className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-md border border-indigo-200">{r}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {result.majorAlignment.crossDisciplinary && (
                      <div>
                        <div className="text-xs font-bold text-slate-500 mb-1 uppercase tracking-wide">융합 성격</div>
                        <p className="text-sm text-slate-700 leading-relaxed">{result.majorAlignment.crossDisciplinary}</p>
                      </div>
                    )}
                  </CollapsibleCard>
                )}

                {/* 6) 교과·단원 연계 (세특·행특에서는 자동 숨김) */}
                {result.curriculumConnection !== undefined && activityType !== '세특' && activityType !== '행특' && (
                  <CollapsibleCard
                    icon={Layers}
                    title="교과·단원 연계"
                    tooltip="본문에서 명시되거나 시사되는 교과명·단원명을 추출합니다. 단원명까지 정확히 명시되어 있으면 '명확', 교과명만 추정 가능하면 '추정', 둘 다 약하면 '약함' 라벨로 표시됩니다. 이 연계가 명확할수록 학종 평가에서 교과 학습과 비교과 활동의 일관성이 높게 평가됩니다. 세특·행특은 교과 단원이 본문에 직접 드러나지 않는 경우가 많아 자동으로 숨겨집니다."
                    defaultOpen={false}
                    forceOpen={printMode}
                    headerExtra={
                      result.curriculumConnection?.length > 0 ? (
                        <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-50 text-slate-600 border border-slate-200 whitespace-nowrap">
                          {result.curriculumConnection.length}건
                        </span>
                      ) : null
                    }
                  >
                    {result.curriculumConnection?.length > 0 ? (
                      <div className="space-y-3">
                        {result.curriculumConnection.map((c, i) => {
                          const sp = SPECIFICITY_COLORS[c.specificity] || SPECIFICITY_COLORS.low;
                          return (
                            <div key={i} className="border border-slate-200 rounded-lg p-3.5 hover:border-indigo-300 transition">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <span className="text-base font-bold text-slate-900">{c.subject}</span>
                                {c.unit && (<><span className="text-slate-400">›</span><span className="text-base font-semibold text-slate-700">{c.unit}</span></>)}
                                <span className={`ml-auto text-xs px-2 py-0.5 rounded border font-bold ${sp.border} ${sp.bg} ${sp.text}`}>{sp.label}</span>
                              </div>
                              {c.excerpt && (<p className="text-sm text-slate-600 italic leading-relaxed mt-1">"{c.excerpt}"</p>)}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">본문에서 교과·단원이 직접 추출되지 않았습니다.</p>
                    )}
                  </CollapsibleCard>
                )}

                {/* StrictEvidenceCard는 현재 비활성화 상태(&& false)로 보존 — 추후 재활성화 가능 */}
                {result.evidenceStrictCheck && false && <StrictEvidenceCard check={result.evidenceStrictCheck} />}

                {/* 7) 강점·약점·보완 통합 카드 */}
                <StrengthsWeaknessesCard
                  strengths={result.strengths}
                  weaknesses={result.weaknesses}
                  suggestions={result.improvementSuggestions}
                  forceOpen={printMode}
                />

                {/* 8) 기재요령 위반 자동 검출 */}
                <ComplianceCard
                  violations={complianceViolations}
                  originalText={text}
                  forceOpen={printMode}
                />

                {/* 9) 히스토리·변화 추적(학생별 누적) */}
                <HistoryCard
                  studentId={studentId}
                  studentName={studentName}
                  label={historyLabel}
                  result={result}
                  complianceViolations={complianceViolations}
                  activityType={activityType}
                  grade={grade}
                  text={text}
                  onIdChange={setStudentId}
                  onNameChange={setStudentName}
                  onLabelChange={setHistoryLabel}
                />

                {/* 10) 대안 문장 — 항상 펼침 */}
                <RewriteCard
                  rewrittenVersion={result.rewrittenVersion}
                  copied={copied}
                  onCopy={copyRewrite}
                />
              </div>
            )}
            {/* ──── 탭 1 종료 ──── */}

            {/* ──── 탭 2: 심화 진단 ──── */}
            {(activeTab === 'deep' || saveMode) && (
              <div data-tab-panel="deep" className="space-y-6">
                {result.topTierCheck && (
                  <TopTierCheckCard topTierCheck={result.topTierCheck} topTierMetCount={result.topTierMetCount} forceOpen={printMode} />
                )}
                {showRoadmap && (
                  <PromotionRoadmapCard roadmap={result.promotionRoadmap}
                    careerGoal={careerGoal} desiredMajor={desiredMajor} forceOpen={printMode} />
                )}
                {!result.topTierCheck && !showRoadmap && (
                  <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center">
                    <Flame className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm text-slate-500">심화 진단 결과가 생성되지 않았습니다.<br />[전체 재분석] 버튼으로 다시 시도해 보세요.</p>
                  </div>
                )}
              </div>
            )}

            {/* ──── 탭 3: 평가 시뮬레이션 ──── */}
            {(activeTab === 'eval' || saveMode) && (
              <div data-tab-panel="eval" className="space-y-6 print-hide">
                {result.multiPerspectiveEvaluation ? (
                  <MultiPerspectiveCard multi={result.multiPerspectiveEvaluation} forceOpen={printMode} />
                ) : (
                  /* 빈 상태 — 사용자가 [추가 분석] 버튼을 눌러 별도 호출 */
                  <div className="bg-white rounded-xl border-2 border-dashed border-purple-200 p-8 text-center">
                    <Users className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                    <h3 className="text-lg font-bold text-slate-800 mb-2">3관점 평가 시뮬레이션</h3>
                    <p className="text-sm text-slate-600 mb-1 leading-relaxed max-w-lg mx-auto">
                      신뢰도·탐구·전공 적합성 — 가치 기준이 다른 입학사정관 3명을 시뮬레이션해
                      합의 점수·분산 지수·합격 가능성 분포까지 산출합니다.
                    </p>
                    <p className="text-xs text-slate-500 mb-5 leading-relaxed">
                      기본 분석 속도를 위해 옵션으로 분리되어 있습니다 · 추가 호출 1회(약 20~30초)
                    </p>
                    <button
                      type="button"
                      onClick={analyzeMultiPerspective}
                      disabled={mpLoading || !text.trim()}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-base font-bold rounded-lg transition shadow-sm"
                    >
                      {mpLoading
                        ? <><Loader2 className="w-5 h-5 animate-spin" /> 3관점 평가 분석 중...</>
                        : <><Sparkles className="w-5 h-5" /> 3관점 평가 추가 분석</>}
                    </button>
                    {mpError && (
                      <div className="mt-4 max-w-lg mx-auto text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg p-3 text-left">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold mb-1">분석 실패</div>
                            <div className="text-xs leading-relaxed">{mpError}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="print-hide mt-8 text-xs text-slate-400 text-center leading-relaxed">
          기록의 가치를 높이는 학생부 문장 진단 솔루션
          <div className="mt-1 text-[11px] text-slate-300">개발자 : 배성인</div>
        </div>
      </div>
    </div>
  );
}
