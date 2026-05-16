// ─────────────────────────────────────────────────────────────────────────────
// ThemeContext — 다크/라이트 모드 전역 관리
//
// 초기화 순서:
//   1) electron-store(또는 localStorage)에 저장된 'theme' 값 읽기
//   2) 없으면 시스템 설정(prefers-color-scheme) 자동 감지
//
// 적용 방식:
//   document.documentElement.classList 에 'dark' 추가/제거
//   → Tailwind darkMode: 'class' 와 연동
//
// 저장:
//   Electron 환경 → window.electronAPI.setSetting('theme', value)
//   브라우저 환경 → localStorage.setItem('theme', value)
// ─────────────────────────────────────────────────────────────────────────────

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── 스토리지 헬퍼 ─────────────────────────────────────────────────────────────

const THEME_KEY = 'theme';

/** 저장된 theme 값을 읽는다. 없으면 null. */
async function loadSavedTheme() {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI.getSetting(THEME_KEY);
  }
  return localStorage.getItem(THEME_KEY) ?? null;
}

/** theme 값을 저장한다. */
async function persistTheme(value) {
  if (typeof window !== 'undefined' && window.electronAPI) {
    return window.electronAPI.setSetting(THEME_KEY, value);
  }
  localStorage.setItem(THEME_KEY, value);
}

// ── 시스템 다크 감지 ─────────────────────────────────────────────────────────

/** OS 수준 다크 모드 설정 여부를 반환한다. */
export function getSystemPrefersDark() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
}

// ── 순수 로직: 초기 theme 결정 ───────────────────────────────────────────────

/**
 * 저장된 값과 시스템 감지 결과로 초기 theme을 결정한다.
 * 저장된 값('light'|'dark')이 있으면 우선 사용, 없으면 시스템 감지.
 */
export function resolveInitialTheme(savedTheme, systemPrefersDark) {
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return systemPrefersDark ? 'dark' : 'light';
}

// ── DOM 반영 ─────────────────────────────────────────────────────────────────

function applyThemeToDom(theme) {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

// ── Context ──────────────────────────────────────────────────────────────────

const ThemeContext = createContext({
  theme: 'light',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  // 초기값은 저장값 로드 전까지 시스템 감지로 플리커 방지
  const [theme, setTheme] = useState(() =>
    resolveInitialTheme(null, getSystemPrefersDark())
  );

  // 마운트 시 저장된 theme 로드 → 시스템 감지보다 우선
  useEffect(() => {
    loadSavedTheme().then((saved) => {
      const resolved = resolveInitialTheme(saved, getSystemPrefersDark());
      setTheme(resolved);
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // theme 변경 시 DOM 반영 + 저장
  useEffect(() => {
    applyThemeToDom(theme);
    persistTheme(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/** 다크/라이트 모드 상태와 토글 함수를 반환한다. */
export function useTheme() {
  return useContext(ThemeContext);
}
