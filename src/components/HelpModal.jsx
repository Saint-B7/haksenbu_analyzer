// ──────────────────────────────────────────────────────────
// HelpModal — 초기 화면 '도움말' 버튼으로 여는 사용 가이드
//
// 사용자가 궁금해할 점(FAQ)과 사용법을 직관적으로 정리한다.
// SettingsModal과 동일한 모달 셸(오버레이·Esc·스크롤·다크 톤)을 따른다.
// 인쇄 보고서와 무관한 화면 전용 UI이므로 다크모드를 정식 지원한다.
// ──────────────────────────────────────────────────────────

import React, { useEffect } from 'react';
import {
  X, Sparkles, Coins, BarChart3, Printer,
  HelpCircle, Keyboard, ShieldCheck,
} from 'lucide-react';

// 작은 섹션 헤더 (아이콘 + 제목)
const SectionTitle = ({ icon: Icon, children }) => (
  <div className="flex items-center gap-2 mb-2">
    <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
    <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">{children}</h3>
  </div>
);

// FAQ 한 항목 (질문 + 답변)
const Faq = ({ q, children }) => (
  <div className="border-l-2 border-indigo-200 dark:border-indigo-700 pl-3">
    <div className="text-sm font-semibold text-slate-800 dark:text-slate-200">Q. {q}</div>
    <div className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed mt-0.5">{children}</div>
  </div>
);

// 단축키 한 줄
const Key = ({ children }) => (
  <kbd className="inline-block px-1.5 py-0.5 text-[11px] font-bold rounded border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
    {children}
  </kbd>
);

/**
 * @param {{ open: boolean, onClose: () => void, appVersion?: string }} props
 */
export default function HelpModal({ open, onClose, appVersion }) {
  // Esc 로 닫기 (모달이 열려 있을 때만)
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 배경 오버레이 */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* 모달 패널 */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-xl flex flex-col max-h-[90vh]">

        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">도움말 · 사용 가이드</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="닫기"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 본문 (스크롤) */}
        <div className="overflow-y-auto flex-1 px-6 py-5 space-y-6">

          {/* 소개 */}
          <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
            <span className="font-bold text-slate-800 dark:text-slate-200">학생부 문장 분석기</span>는
            입력한 학생부 문장을 입학사정관 관점으로 진단하고, 점수·강약점·대안 문장·기재요령 위반까지
            한 번에 정리해 주는 도구입니다.
          </p>

          {/* 빠른 시작 */}
          <section>
            <SectionTitle icon={Sparkles}>빠른 시작 3단계</SectionTitle>
            <ol className="space-y-2">
              {[
                ['설정(동전 아이콘)에서 OpenRouter API 키를 연결합니다.', 'AI 분석에 필요한 단계로, 처음 한 번만 하면 됩니다.'],
                ['학년·활동 유형·진로/학과를 고르고, 분석할 문장을 붙여넣습니다.', '진로·학과는 선택 입력이지만 적합성 평가에 활용됩니다.'],
                ['[분석 시작] 버튼(또는 Ctrl+Enter)을 누르면 결과가 표시됩니다.', '잠시 후 핵심 분석·심화 진단·평가 시뮬레이션 탭이 나타납니다.'],
              ].map(([t, d], i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
                  <div>
                    <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 leading-snug">{t}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mt-0.5">{d}</div>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* 자주 묻는 질문 */}
          <section>
            <SectionTitle icon={HelpCircle}>자주 묻는 질문</SectionTitle>
            <div className="space-y-3">
              <Faq q="분석하려면 꼭 API 키가 필요한가요?">
                네. 이 앱은 <b>OpenRouter</b>를 통해 AI 분석을 수행합니다. 우측 상단{' '}
                <Coins className="inline w-3.5 h-3.5 -mt-0.5" /> 설정에서 키를 연결하세요.
                키는 기기에 <b>암호화 저장</b>되어 외부로 노출되지 않습니다.
              </Faq>
              <Faq q="비용은 어떻게 드나요?">
                OpenRouter <b>크레딧(USD)</b>이 분석량만큼 차감됩니다. 키를 연결하면 헤더에
                <b> 남은 크레딧</b>이 표시되고, <b>$0.5 미만</b>이면 노란색으로 부족을 알립니다.
              </Faq>
              <Faq q="입력한 문장이 외부에 저장되나요?">
                분석 시에만 OpenRouter로 전송되며 앱이 별도로 서버에 저장하지 않습니다.
                입력 내용은 실수로 닫아도 복구되도록 <b>내 기기에만</b> 임시 저장됩니다.
              </Faq>
              <Faq q="‘NEIS 바이트’는 무엇인가요?">
                재작성 제안에 표시되는 바이트 수로, 실제 NEIS 입력 한도 기준입니다
                (<b>1500바이트 ≈ 한글 500자</b>). 한도를 넘지 않게 다듬는 데 활용하세요.
              </Faq>
              <Faq q="결과가 안 나오거나 오류가 떠요.">
                남은 크레딧과 인터넷 연결을 먼저 확인하세요. 응답이 잘린 경우 자동 복구를 시도하며,
                그래도 비면 잠시 후 다시 분석해 주세요.
              </Faq>
              <Faq q="업데이트는 어떻게 되나요?">
                새 버전이 나오면 <b>자동으로 감지·다운로드</b>되고, 헤더에
                <b> “지금 설치”</b> 버튼이 뜹니다. 클릭하면 재시작되며 적용됩니다.
              </Faq>
            </div>
          </section>

          {/* 결과 화면 안내 */}
          <section>
            <SectionTitle icon={BarChart3}>결과 화면 (3개 탭)</SectionTitle>
            <ul className="space-y-1.5 text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <li><b className="text-slate-800 dark:text-slate-200">핵심 분석</b> — 종합 점수·7가지 DNA·문장의 서사(구조도)·학과 연계</li>
              <li><b className="text-slate-800 dark:text-slate-200">심화 진단</b> — 상위권 10가지 도약·진급 이후 로드맵</li>
              <li><b className="text-slate-800 dark:text-slate-200">평가 시뮬레이션</b> — 3관점 입학사정관 평가·합격 가능성 분포</li>
            </ul>
          </section>

          {/* 인쇄/저장 */}
          <section>
            <SectionTitle icon={Printer}>인쇄 · PDF 저장</SectionTitle>
            <p className="text-[13px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <b>[인쇄]</b>에서 보고서에 담을 항목을 고르면, 미리보기에 <b>A4 페이지 경계</b>가
              점선으로 표시됩니다. <Key>Ctrl</Key> + <Key>P</Key> 로 인쇄하거나 PDF로 저장하며,
              인쇄창의 <b>‘배경 그래픽’</b> 옵션을 켜면 색이 정확히 출력됩니다.
            </p>
          </section>

          {/* 단축키 */}
          <section>
            <SectionTitle icon={Keyboard}>단축키</SectionTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-[13px]">
              {[
                [<><Key>Ctrl</Key> + <Key>Enter</Key></>, '분석 시작'],
                [<><Key>Ctrl</Key> + <Key>,</Key></>, '설정(API 키) 열기'],
                [<><Key>Ctrl</Key> + <Key>P</Key></>, '인쇄 / PDF 저장'],
                [<><Key>Ctrl</Key> + <Key>Shift</Key> + <Key>L</Key></>, '다크/라이트 전환'],
                [<><Key>Esc</Key></>, '미리보기·창 닫기'],
              ].map(([k, label], i) => (
                <div key={i} className="flex items-center justify-between gap-2">
                  <span className="text-slate-500 dark:text-slate-400">{label}</span>
                  <span className="flex items-center gap-1">{k}</span>
                </div>
              ))}
            </div>
          </section>

          {/* 안내 푸터 */}
          <div className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-700 pt-4">
            <ShieldCheck className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
            <p className="leading-relaxed">
              자동 검사(기재요령 등)는 보조 도구이며 누락 가능성이 있으니, 최종 검토는 반드시
              교사 본인이 수행하세요{appVersion ? ` · v${appVersion}` : ''}.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
