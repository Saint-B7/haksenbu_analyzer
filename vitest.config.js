// Vitest 설정 — 순수 로직 모듈만 테스트하므로 jsdom·react 환경 불필요
//
// 실행 방법:
//   npm install
//   npm test               # 한 번 실행
//   npm run test:watch     # watch 모드(파일 저장 시 자동 재실행)
//
// 테스트 파일은 tests/ 디렉터리의 *.test.js 만 인식합니다.

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{js,jsx}'],
    environment: 'node',     // 기본값 — 순수 함수 테스트는 node로 충분
    globals: false,          // describe/test/expect는 명시적 import 권장
    reporters: 'verbose',
    // theme-context.test.js 만 jsdom 환경 사용 (matchMedia, classList 필요)
    environmentMatchGlobs: [
      ['tests/theme-context.test.js', 'jsdom'],
    ],
  },
});
