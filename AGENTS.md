# 프로젝트 규칙 (학생부 문장 분석기)

## 코드 스타일
- 한국어 주석을 충분히 달 것 (비전공자 교사가 읽을 수 있게)
- React 18, 함수형 컴포넌트, Hook 사용
- Tailwind CSS만 사용, 다른 CSS 라이브러리 추가 금지
- 외부 의존성은 react / react-dom / lucide-react만 사용

## 작업 원칙
- 사용자 명시적 요청 범위만 외과적으로 수정
- 모듈 경계(src/lib, src/data, src/components/cards 등) 존중
- 단위 테스트가 있는 함수를 수정하면 tests/ 안의 해당 테스트도 갱신

## 빌드·테스트
- 변경 후에는 항상 `npm test` 실행 (vitest, 86개 통과 유지)
- 단일 파일 빌드: `node _build_single.cjs`