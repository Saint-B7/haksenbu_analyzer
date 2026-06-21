// ─────────────────────────────────────────────────────────────────────────────
// SettingsModal — OpenRouter 연결 가이드 + 설정
//
// 진입 분기:
//   키 미저장 → 4단계 가이드 전체 표시
//   키 저장됨 → "연결됨" 요약 화면 (모델 선택 + 다시 설정)
//
// 비전공자 카피 원칙:
//   - "API 키" 대신 "키"로 짧게
//   - 비용은 항상 원화 함께 표시
//   - 긍정 표현 우선 ("다시 확인해 주세요" vs "잘못되었습니다")
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  X, Eye, EyeOff, CheckCircle2, AlertTriangle,
  Loader2, ExternalLink, ChevronLeft, Trash2,
} from 'lucide-react';

// ── 상수 ──────────────────────────────────────────────────────────────────────

// 분석에 사용하는 모델 목록 (연결 완료 후 설정 화면)
const ANALYSIS_MODELS = [
  { id: 'anthropic/claude-sonnet-4-5',    label: 'Claude Sonnet 4.5 (권장)' },
  // OpenRouter에서 ID 검증 완료 — Anthropic 신모델은 점(dot) 표기 사용
  { id: 'anthropic/claude-sonnet-4.6',    label: 'Claude Sonnet 4.6' },
  { id: 'anthropic/claude-opus-4.6',      label: 'Claude Opus 4.6 (고성능·고비용)' },
  { id: 'anthropic/claude-opus-4',        label: 'Claude Opus 4' },
  { id: 'anthropic/claude-haiku-4-5',     label: 'Claude Haiku 4.5 (빠름)' },
  { id: 'openai/gpt-4o',                  label: 'GPT-4o' },
  { id: 'openai/gpt-4o-mini',             label: 'GPT-4o mini (빠름/저렴)' },
  { id: 'google/gemini-2.0-flash-001',    label: 'Gemini 2.0 Flash' },
  { id: 'google/gemini-2.5-pro-preview',  label: 'Gemini 2.5 Pro' },
  // DeepSeek — OpenAI 호환 chat completions, 가성비 옵션
  { id: 'deepseek/deepseek-v3.2',         label: 'DeepSeek (저비용)' },
];

// 연결 테스트에 사용하는 모델 (가볍고 저렴한 것 우선)
// 연결 테스트는 max_tokens=10 ping이라 비용이 거의 없으므로,
// 신규 모델도 연결 가능 여부를 확인할 수 있게 함께 노출한다.
const TEST_MODELS = [
  { id: 'google/gemini-2.0-flash-001',  label: 'Gemini 2.0 Flash (가장 저렴)' },
  { id: 'deepseek/deepseek-v3.2',       label: 'DeepSeek (저비용)' },
  { id: 'anthropic/claude-haiku-4-5',   label: 'Claude Haiku 4.5' },
  { id: 'anthropic/claude-sonnet-4-5',  label: 'Claude Sonnet 4.5' },
  { id: 'anthropic/claude-sonnet-4.6',  label: 'Claude Sonnet 4.6' },
  { id: 'anthropic/claude-opus-4.6',    label: 'Claude Opus 4.6' },
];

const DEFAULT_ANALYSIS_MODEL = 'anthropic/claude-sonnet-4-5';
const DEFAULT_TEST_MODEL     = 'google/gemini-2.0-flash-001';

// 분석 모델 select 의 "직접 입력" 옵션 값 (프리셋에 없는 모델 ID를 코드 수정 없이 사용)
const CUSTOM_MODEL = '__custom__';

// ── 헬퍼 ──────────────────────────────────────────────────────────────────────

// openrouter.ai 링크를 시스템 기본 브라우저로 열기
const openExternal = (url) => window.electronAPI?.openExternal(url);

// OpenRouter 키는 sk-or- 로 시작
const isValidKeyFormat = (key) => key.startsWith('sk-or-');

// ── Stepper ────────────────────────────────────────────────────────────────────

function Stepper({ currentStep }) {
  const steps = ['가입', '충전', '키 발급', '연결 테스트'];
  return (
    <div className="flex items-center" aria-label="진행 단계">
      {steps.map((label, i) => {
        const num   = i + 1;
        const done  = currentStep > num;
        const active = currentStep === num;
        return (
          <React.Fragment key={num}>
            <div className="flex flex-col items-center gap-1 min-w-[54px]">
              <div
                aria-current={active ? 'step' : undefined}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                  ${done   ? 'bg-emerald-500 text-white'
                  : active ? 'bg-indigo-600 text-white'
                           : 'bg-slate-200 dark:bg-slate-600 text-slate-400'}`}
              >
                {done ? <CheckCircle2 className="w-4 h-4" /> : num}
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight
                ${active ? 'text-indigo-600'
                : done   ? 'text-emerald-600'
                         : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-1 mb-4
                ${currentStep > num ? 'bg-emerald-400' : 'bg-slate-200 dark:bg-slate-600'}`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── 공통 외부 링크 버튼 ────────────────────────────────────────────────────────

function ExtLinkButton({ url, label, ariaLabel }) {
  return (
    <button
      onClick={() => openExternal(url)}
      aria-label={ariaLabel}
      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
    >
      <ExternalLink className="w-4 h-4 shrink-0" />
      {label}
    </button>
  );
}

// ── Step 1: 가입 ───────────────────────────────────────────────────────────────

function Step1Signup({ onNext }) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        <span className="font-semibold text-slate-800 dark:text-slate-200">OpenRouter</span>는
        Claude·Gemini·GPT 등 여러 AI를 하나의 키로 쓸 수 있게 해주는 중개 서비스입니다.
        무료 가입 후 소액을 충전하면 바로 분석을 시작할 수 있습니다.
      </p>

      <ExtLinkButton
        url="https://openrouter.ai"
        label="openrouter.ai 가입 페이지 열기"
        ariaLabel="openrouter.ai 가입 페이지를 외부 브라우저에서 열기"
      />

      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
        Google 또는 GitHub 계정으로 30초 만에 가입할 수 있습니다.
      </p>

      <div className="flex justify-end pt-1">
        <button
          onClick={onNext}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          가입 완료, 다음 →
        </button>
      </div>
    </div>
  );
}

// ── Step 2: 충전 ───────────────────────────────────────────────────────────────

function Step2Credit({ onNext, onBack }) {
  // 체크박스는 사용자 확인 표시용 — 버튼을 게이팅하지 않음
  const [acknowledged, setAcknowledged] = useState(false);
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        분석 1회당 약{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">30~80원</span>이 차감됩니다.
        처음에는{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">$5(약 7,000원)</span>{' '}
        충전을 권장합니다.
      </p>

      <ExtLinkButton
        url="https://openrouter.ai/credits"
        label="Credits 페이지 열기"
        ariaLabel="OpenRouter Credits 페이지를 외부 브라우저에서 열기"
      />

      <p className="text-xs text-slate-500 dark:text-slate-400">
        결제 후 OpenRouter 첫 화면 우측 상단에서 잔액을 확인할 수 있습니다.
      </p>

      <label className="flex items-start gap-2.5 cursor-pointer select-none">
        <input
          type="checkbox"
          checked={acknowledged}
          onChange={e => setAcknowledged(e.target.checked)}
          className="mt-0.5 w-4 h-4 rounded accent-indigo-600 shrink-0"
        />
        <span className="text-sm text-slate-600 dark:text-slate-400">
          이미 충전했어요 (또는 무료 모델만 쓸 거예요)
        </span>
      </label>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          이전
        </button>
        <button
          onClick={onNext}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}

// ── Step 3: 키 발급 ─────────────────────────────────────────────────────────────

function Step3IssueKey({ apiKeyDraft, setApiKeyDraft, showKey, setShowKey, onNext, onBack }) {
  const inputRef = useRef(null);
  // 단계에 진입할 때 입력 필드에 자동 포커스
  useEffect(() => { inputRef.current?.focus(); }, []);

  const hasInput  = apiKeyDraft.length > 0;
  const valid     = isValidKeyFormat(apiKeyDraft);
  const showError = hasInput && !valid;
  const showOk    = hasInput && valid;

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        키는 비밀번호와 같으므로{' '}
        <span className="font-semibold text-slate-800 dark:text-slate-200">한 번만 노출</span>됩니다.
        발급 직후 복사해서 아래에 바로 붙여넣으세요.
      </p>

      <ExtLinkButton
        url="https://openrouter.ai/keys"
        label="Keys 페이지 열기"
        ariaLabel="OpenRouter Keys 페이지를 외부 브라우저에서 열기"
      />

      {/* 3단계 절차 안내 */}
      <ol className="space-y-2.5">
        {[
          '"Create Key" 버튼 클릭',
          '이름 입력 (예: "학생부 분석기")',
          <span key="s3">생성된{' '}
            <code className="text-xs bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">
              sk-or-v1-…
            </code>
            {' '}로 시작하는 키 복사</span>,
        ].map((text, i) => (
          <li key={i} className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
              {i + 1}
            </span>
            <span className="text-sm text-slate-600 dark:text-slate-400">{text}</span>
          </li>
        ))}
      </ol>

      {/* 키 입력 필드 */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          여기에 키 붙여넣기
        </label>
        <div className="relative">
          <input
            ref={inputRef}
            type={showKey ? 'text' : 'password'}
            value={apiKeyDraft}
            onChange={e => setApiKeyDraft(e.target.value)}
            placeholder="sk-or-v1-..."
            className={`w-full border rounded-xl px-3 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 transition-colors
              ${showError ? 'border-rose-400 bg-rose-50 dark:bg-rose-900/30 focus:ring-rose-200'
              : showOk    ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 focus:ring-emerald-200'
                          : 'border-slate-300 dark:border-slate-600 focus:ring-indigo-200'}`}
          />
          <button
            type="button"
            onClick={() => setShowKey(v => !v)}
            aria-label={showKey ? '키 숨기기' : '키 표시하기'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {showError && (
          <p className="flex items-center gap-1 text-xs text-rose-600">
            <AlertTriangle className="w-3 h-3 shrink-0" />
            OpenRouter 키 형식이 아닙니다 (sk-or-v1-… 형태여야 합니다)
          </p>
        )}
        {showOk && (
          <p className="flex items-center gap-1 text-xs text-emerald-600">
            <CheckCircle2 className="w-3 h-3 shrink-0" />
            올바른 형식입니다
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          이전
        </button>
        <button
          onClick={onNext}
          disabled={!valid}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
        >
          다음 →
        </button>
      </div>
    </div>
  );
}

// ── Step 4: 연결 테스트 결과 표시 ─────────────────────────────────────────────

function TestResultView({ testResult }) {
  if (!testResult) return null;

  if (testResult.type === 'ok') {
    return (
      <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4 space-y-1">
        <p className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          연결 성공!
        </p>
        <p className="text-xs text-emerald-700 dark:text-emerald-300 pl-6">
          응답 모델: <span className="font-mono">{testResult.model}</span>
          {' · '}응답 시간: {(testResult.elapsedMs / 1000).toFixed(1)}초
        </p>
        <p className="text-xs text-emerald-500 pl-6">잠시 후 자동으로 닫힙니다…</p>
      </div>
    );
  }

  // 오류 분류 → 사용자 친화 메시지
  const { statusCode, message = '', rawMsg } = testResult;
  let mainMsg;
  let showRechargeLink = false;

  if (/ByteString|greater than 255/i.test(message)) {
    // 헤더에 한글/특수문자가 섞여 fetch가 ByteString 변환에 실패한 경우
    mainMsg = 'API 키에 한글이나 특수 문자가 섞여 있을 수 있습니다. 키를 다시 복사해 붙여넣어 주세요. (앞뒤 공백 포함 주의)';
  } else if (statusCode === 401) {
    mainMsg = '키가 거부되었습니다. 키를 다시 확인하거나 새로 발급해 주세요.';
  } else if (statusCode === 402) {
    mainMsg = 'OpenRouter 잔액이 부족합니다.';
    showRechargeLink = true;
  } else if (/fetch|network|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(message)) {
    mainMsg = '인터넷 연결을 확인해 주세요. 학교 방화벽이 차단했을 수도 있습니다.';
  } else {
    mainMsg = '연결에 실패했습니다. 잠시 후 다시 시도해 주세요.';
  }

  return (
    <div className="bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-700 rounded-xl p-4 space-y-2">
      <p className="flex items-start gap-2 text-sm text-rose-800 dark:text-rose-200">
        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        {mainMsg}
      </p>
      {showRechargeLink && (
        <button
          onClick={() => openExternal('https://openrouter.ai/credits')}
          className="ml-6 flex items-center gap-1 text-xs text-indigo-600 hover:underline"
        >
          <ExternalLink className="w-3 h-3" />
          충전 페이지로 이동
        </button>
      )}
      {/* 기타 오류 시 원본 메시지 소자로 추가 표시 */}
      {!showRechargeLink && statusCode !== 401 && message && (
        <p className="ml-6 text-xs text-rose-400 font-mono break-all">{message}</p>
      )}
      {rawMsg && (
        <p className="ml-6 text-xs text-rose-300 font-mono break-all">{rawMsg}</p>
      )}
    </div>
  );
}

// ── Step 4: 연결 테스트 ────────────────────────────────────────────────────────

function Step4Test({ apiKeyDraft, testModel, setTestModel, testing, testResult, onTest, onBack }) {
  const succeeded = testResult?.type === 'ok';
  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
        키가 정상 작동하는지 짧은 호출로 확인합니다.
        토큰 차감은 매우 적습니다 (1원 미만).
      </p>

      {/* 테스트 모델 선택 */}
      <div className="space-y-1.5">
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">테스트 모델</label>
        <select
          value={testModel}
          onChange={e => setTestModel(e.target.value)}
          className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {TEST_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
        </select>
      </div>

      {/* 테스트 버튼 */}
      <button
        onClick={onTest}
        disabled={testing || succeeded}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-xl transition-colors"
      >
        {testing && <Loader2 className="w-4 h-4 animate-spin" />}
        {testing ? '테스트 중…' : '연결 테스트'}
      </button>

      {/* 결과 */}
      <TestResultView testResult={testResult} />

      {/* 이전 버튼 — 성공 후에는 숨김 */}
      {!succeeded && (
        <div className="flex justify-start pt-1">
          <button
            onClick={onBack}
            className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            이전
          </button>
        </div>
      )}
    </div>
  );
}

// ── 연결됨 화면 ────────────────────────────────────────────────────────────────

function ConnectedView({ model, onModelChange, onReset, onDeleteKey }) {
  const [confirmReset, setConfirmReset] = useState(false);
  // 저장된 모델이 프리셋에 없으면 "직접 입력" 모드로 시작
  const isPreset = ANALYSIS_MODELS.some((m) => m.id === model);
  const [customMode, setCustomMode] = useState(!isPreset && !!model);

  return (
    <div className="space-y-5">
      {/* 연결 상태 배지 */}
      <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl p-4">
        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center shrink-0">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <p className="text-sm font-bold text-emerald-800 dark:text-emerald-200">OpenRouter 연결됨</p>
          <p className="text-xs text-emerald-600">API 키가 안전하게 저장되어 있습니다.</p>
        </div>
      </div>

      {/* 분석 모델 선택 */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">분석 모델</label>
        <select
          value={customMode ? CUSTOM_MODEL : model}
          onChange={e => {
            const v = e.target.value;
            if (v === CUSTOM_MODEL) { setCustomMode(true); }      // 입력 칸 노출, 모델은 사용자가 입력
            else { setCustomMode(false); onModelChange(v); }
          }}
          className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
        >
          {ANALYSIS_MODELS.map(m => (
            <option key={m.id} value={m.id}>{m.label}</option>
          ))}
          <option value={CUSTOM_MODEL}>직접 입력 (모델 ID)…</option>
        </select>
        {customMode && (
          <input
            type="text"
            value={model}
            onChange={e => onModelChange(e.target.value.trim())}
            placeholder="예: anthropic/claude-sonnet-4.7"
            className="w-full border border-slate-300 dark:border-slate-600 rounded-xl px-3 py-2.5 text-sm font-mono bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          />
        )}
        <p className="text-xs text-slate-400">
          {customMode
            ? 'OpenRouter 모델 ID를 provider/model 형식으로 입력하세요. 신규 모델도 코드 수정 없이 사용 가능합니다.'
            : '모델 선택은 즉시 저장됩니다.'}
        </p>
      </div>

      {/* 사용량 확인 링크 */}
      <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3">
        <p className="text-xs text-slate-600 dark:text-slate-400">
          OpenRouter 사용량은{' '}
          <span className="font-semibold text-slate-800 dark:text-slate-200">openrouter.ai/credits</span>에서 확인할 수 있습니다.
        </p>
        <button
          onClick={() => openExternal('https://openrouter.ai/credits')}
          className="shrink-0 ml-3 flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
          aria-label="OpenRouter 잔액 확인 페이지를 외부 브라우저에서 열기"
        >
          <ExternalLink className="w-3 h-3" />
          잔액 확인
        </button>
      </div>

      {/* 다시 설정 / 키 삭제 */}
      {confirmReset ? (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 space-y-3">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            기존 키를 삭제하고 처음부터 다시 설정하시겠습니까?
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => { setConfirmReset(false); onReset(); }}
              className="px-4 py-1.5 text-sm bg-amber-600 hover:bg-amber-700 text-white rounded-lg transition-colors"
            >
              확인
            </button>
            <button
              onClick={() => setConfirmReset(false)}
              className="px-4 py-1.5 text-sm border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 rounded-lg transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-4 pt-1">
          <button
            onClick={() => setConfirmReset(true)}
            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 hover:underline transition-colors"
          >
            다시 설정
          </button>
          <button
            onClick={onDeleteKey}
            className="flex items-center gap-1.5 text-sm text-rose-500 hover:text-rose-700 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            키 삭제
          </button>
        </div>
      )}
    </div>
  );
}

// ── 메인 모달 ──────────────────────────────────────────────────────────────────

/**
 * @param {{ open: boolean, onClose: () => void, onKeyConnected?: () => void }} props
 */
export default function SettingsModal({ open, onClose, onKeyConnected }) {
  const api = window.electronAPI;

  // ── 가이드 흐름 상태
  const [currentStep,  setCurrentStep]  = useState(1);
  const [apiKeyDraft,  setApiKeyDraft]  = useState('');
  const [showKey,      setShowKey]      = useState(false);
  const [testModel,    setTestModel]    = useState(DEFAULT_TEST_MODEL);
  const [testing,      setTesting]      = useState(false);
  const [testResult,   setTestResult]   = useState(null);

  // ── 저장된 설정 상태
  const [hasKey,         setHasKey]         = useState(false);
  const [analysisModel,  setAnalysisModel]  = useState(DEFAULT_ANALYSIS_MODEL);
  const [showGuide,      setShowGuide]      = useState(false);

  // 모달이 열릴 때 초기화 + 키 존재 여부 확인
  const initModal = useCallback(async () => {
    setCurrentStep(1);
    setApiKeyDraft('');
    setShowKey(false);
    setTestResult(null);
    setTesting(false);
    setTestModel(DEFAULT_TEST_MODEL);
    try {
      const [keyExists, savedModel] = await Promise.all([
        api.hasApiKey(),
        api.getSetting('model'),
      ]);
      setHasKey(keyExists);
      setAnalysisModel(savedModel || DEFAULT_ANALYSIS_MODEL);
      setShowGuide(!keyExists); // 키 없으면 가이드 바로 표시
    } catch {
      setShowGuide(true);
    }
  }, [api]);

  useEffect(() => {
    if (open) initModal();
  }, [open, initModal]);

  // ── 연결 테스트 핸들러
  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await api.testLLMConnection({ apiKey: apiKeyDraft, model: testModel });
      if (result.ok) {
        setTestResult({ type: 'ok', model: result.model, elapsedMs: result.elapsedMs });
        // 성공: 키 저장 → 부모에 알림 → 1.5초 뒤 모달 닫기
        try { await api.saveApiKey(apiKeyDraft); } catch { /* safeStorage 오류는 무시 */ }
        setHasKey(true);
        onKeyConnected?.(); // 배너 숨김 + 토스트 트리거
        setTimeout(onClose, 1500);
      } else {
        setTestResult({
          type: 'error',
          statusCode: result.statusCode,
          message:    result.message,
          rawMsg:     result.rawMsg,
        });
      }
    } catch (e) {
      // IPC 자체 오류 (거의 발생하지 않음)
      setTestResult({ type: 'error', message: e.message || '알 수 없는 오류' });
    } finally {
      setTesting(false);
    }
  };

  // ── 분석 모델 변경 (즉시 저장)
  const handleModelChange = async (newModel) => {
    setAnalysisModel(newModel);
    try { await api.setSetting('model', newModel); } catch { /* ignore */ }
  };

  // ── 키 삭제
  const handleDeleteKey = async () => {
    try {
      await api.deleteApiKey();
      setHasKey(false);
      setShowGuide(true);
      setCurrentStep(1);
      setApiKeyDraft('');
      setTestResult(null);
    } catch { /* ignore */ }
  };

  // ── 다시 설정 (키 삭제 확인 후 가이드 처음으로)
  const handleReset = () => {
    handleDeleteKey();
  };

  if (!open) return null;

  const inGuideMode = showGuide || !hasKey;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 모달 패널 */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">

        {/* ── 헤더 */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
            {inGuideMode ? 'OpenRouter 연결 가이드' : 'API 키 & 사용량 설정'}
          </h2>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── 본문 (스크롤 가능) */}
        <div className="overflow-y-auto flex-1 px-6 py-5">
          {inGuideMode ? (
            <div className="space-y-5">
              {/* 진행 표시 */}
              <Stepper currentStep={currentStep} />

              <div className="border-t border-slate-100 dark:border-slate-700 pt-5">
                {currentStep === 1 && (
                  <Step1Signup onNext={() => setCurrentStep(2)} />
                )}
                {currentStep === 2 && (
                  <Step2Credit
                    onNext={() => setCurrentStep(3)}
                    onBack={() => setCurrentStep(1)}
                  />
                )}
                {currentStep === 3 && (
                  <Step3IssueKey
                    apiKeyDraft={apiKeyDraft}
                    setApiKeyDraft={setApiKeyDraft}
                    showKey={showKey}
                    setShowKey={setShowKey}
                    onNext={() => { setTestResult(null); setCurrentStep(4); }}
                    onBack={() => setCurrentStep(2)}
                  />
                )}
                {currentStep === 4 && (
                  <Step4Test
                    apiKeyDraft={apiKeyDraft}
                    testModel={testModel}
                    setTestModel={setTestModel}
                    testing={testing}
                    testResult={testResult}
                    onTest={handleTest}
                    onBack={() => { setTestResult(null); setCurrentStep(3); }}
                  />
                )}
              </div>
            </div>
          ) : (
            <ConnectedView
              model={analysisModel}
              onModelChange={handleModelChange}
              onReset={handleReset}
              onDeleteKey={handleDeleteKey}
            />
          )}
        </div>

        {/* ── 푸터 (가이드 모드에서만) */}
        {inGuideMode && (
          <div className="px-6 py-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between shrink-0">
            <button
              onClick={() => openExternal('https://openrouter.ai/docs')}
              aria-label="OpenRouter 공식 문서를 외부 브라우저에서 열기"
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-indigo-600 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              도움말
            </button>
            <span className="text-xs text-slate-400 tabular-nums">{currentStep} / 4</span>
          </div>
        )}
      </div>
    </div>
  );
}
