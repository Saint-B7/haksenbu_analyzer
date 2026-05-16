# 학생부 문장 분석기 — 모듈 구조

원본 단일 파일 `haksenbu_analyzer_v15.jsx` (3,896줄)를 모듈로 분할하고
사용자 요청에 따라 단계별 개선을 누적 적용한 버전입니다.

## 빌드 방법

```bash
# 의존성 설치
npm ci

# 개발 서버 (Electron + Vite HMR)
npm run dev

# 로컬 빌드 (설치 파일 생성, GitHub 업로드 없음)
npm run build:win   # → dist/release/haksenbu-analyzer-setup-x.x.x.exe
npm run build:mac   # → dist/release/haksenbu-analyzer-x.x.x-universal.dmg

# 버전 올리기 + GitHub Releases 자동 배포
npm run release:patch   # 1.0.0 → 1.0.1 (테스트 → 버전 bump → push → Actions 트리거)
npm run release:minor   # 1.0.0 → 1.1.0
npm run release:major   # 1.0.0 → 2.0.0

# 앱 아이콘 재생성
npm run icons:gen
```

자세한 배포 절차는 [DEPLOY.md](DEPLOY.md)를, 설치 방법은 [USER_GUIDE.md](USER_GUIDE.md)를 참고하세요.

---

## v17.1 hotfix (단일 파일 빌드의 lucide `Map` 충돌)

`PromotionRoadmapCard.jsx`가 lucide-react의 `Map` 아이콘을 import하면서, 단일 파일 빌드 시
모든 lucide import가 한 줄로 합쳐져 JavaScript 빌트인 `Map` 컬렉션과 이름이 충돌했습니다.
`new Map()` 호출이 lucide의 `Map` 컴포넌트를 가리키게 되어 *"Map is not a constructor"* 오류 발생.

**수정**
- `PromotionRoadmapCard.jsx`: `Map` → `Map as MapIcon` alias + JSX 사용처 변경
- `_build_single.cjs`: alias 보존 로직 추가 (이전에는 `as MapIcon`을 떼어내서 유실됨)

빌드된 단일 파일에서 `import { ..., Map as MapIcon, ... }`로 합쳐지고,
본문의 `new Map()` 4곳(`idb.js` 1, `idb-cache.js` 3)은 모두 빌트인 `Map`을 가리킵니다.

---


## 진입점

```jsx
import HaksenbuAnalyzer from './src/HaksenbuAnalyzer';
```

## 디렉터리 구조

```
src/
├── HaksenbuAnalyzer.jsx
├── lib/
│   ├── neis-bytes.js
│   ├── fonts.js
│   ├── compliance.js
│   ├── idb.js
│   ├── idb-cache.js                  # ★ 이번 라운드: SWR-lite 캐시 hook
│   ├── json-recovery.js
│   ├── api.js
│   └── text-format.js
├── prompts/
│   ├── _shared.js / core.js / extended.js / multi.js
├── data/
│   ├── criteria.js / colors.js / constants.js
└── components/
    ├── common.jsx
    ├── UnifiedStructureFlow.jsx
    ├── charts/SvgRadarChart.jsx · TrendLineChart.jsx · SmallCharts.jsx
    └── cards/
        ├── SummaryStrip.jsx
        ├── HistoryCard.jsx           # ★ 이번 라운드: useIndexedQuery 적용
        ├── StrictEvidenceCard.jsx
        ├── TopTierCheckCard.jsx
        ├── PromotionRoadmapCard.jsx
        ├── MultiPerspectiveCard.jsx
        ├── StrengthsWeaknessesCard.jsx
        ├── ComplianceCard.jsx
        └── RewriteCard.jsx

tests/                                 # Vitest (86개, 모두 통과)
├── neis-bytes.test.js                 # 22
├── text-format.test.js                # 12
├── json-recovery.test.js              # 16
├── compliance.test.js                 # 27
└── summarize-for-history.test.js      # 9

dist/haksenbu_analyzer_single.jsx      # 모든 모듈을 합친 단일 파일(아티팩트용)
```

## 이번 라운드 변경 (v17)

### 1. `useMemo`로 정규식 호출 최적화

```diff
- const complianceViolations = result ? detectComplianceViolations(text) : null;
+ const complianceViolations = useMemo(
+   () => (result ? detectComplianceViolations(text) : null),
+   [result, text],
+ );
```

본문이 길수록 체감 차이가 큽니다 — 11개 정규식이 매 렌더 → result/text 변경 시만 실행됩니다.

### 2. IndexedDB 호출 통합 — 자체 SWR-lite

`SWR` / `React Query` 풀 도입 대신 **외부 의존성 0의 50줄짜리 자체 hook**(`src/lib/idb-cache.js`)으로 같은 효과를 얻습니다.

**제공 API**
- `useIndexedQuery(key, fetcher)` — 키 기반 캐시 + in-flight dedupe + 구독자 자동 알림
- `mutateIndexedQuery(key, valueOrUpdater)` — 캐시 직접 갱신 (재질의 없이 모든 사용처 갱신)
- `clearIndexedQueryCache(key?)` — 캐시 초기화

**HistoryCard 변경**

| 이전 | 이후 |
|---|---|
| `useState(history) + useEffect → getAnalysesByStudent` | `useIndexedQuery(historyKey, fetcher)` |
| `useState(studentList) + useEffect → getAllStudents` | `useIndexedQuery('students:all', fetcher)` |
| 저장 후 `setHistory + setStudentList` 두 번 | `mutateIndexedQuery` 두 번 (재질의 없이 즉시 갱신) |
| 삭제 후 `setHistory(prev => filter)` | `mutateIndexedQuery(key, prev => filter)` |

**효과**
- 같은 학생 ID로 다시 들어와도 IndexedDB 재질의 안 함 (캐시 히트)
- 동일한 키를 동시에 호출하면 한 번만 fetch (in-flight dedupe)
- 저장 후 `setHistory`/`setStudentList` 두 state 갱신이 mutate 호출 두 번으로 정리되어 코드 가독성 향상
- `useState` 2개 + `useEffect` 2개 제거

### 3. Context 도입 (prop drilling 해소) — 적용 안 함

사용자 본인이 *"v15 단계에서는 과한 변경"*이라고 평가했으므로 적용하지 않았습니다. 향후 카드 컴포넌트가 더 늘어나면 그때 `AnalysisResultContext` 형태로 도입하는 게 적절합니다.

## 누적 변경 요약 (v15 → v17)

- **v15 → v16 (이전 라운드)**: 단일 파일 분할, 26개 모듈, dead code 3건 제거
- **v16 → v16.1**: 단위 테스트 86개, 매직 넘버 → `data/constants.js`, `stripBoldMarkup` 헬퍼 통합, IIFE → 작은 컴포넌트 추출 (`RewriteCard`/`SummaryCell`/`StructureStageBox`)
- **v16.1 → v17 (이번)**: `useMemo` 도입, IndexedDB 캐시 hook 도입, HistoryCard 데이터 레이어 통합

## 단일 파일 아티팩트

`dist/haksenbu_analyzer_single.jsx` — 4,422줄. Claude.ai 아티팩트 환경에서 그대로 미리보기 가능.

빌드:
```bash
node _build_single.cjs
```

## 의존성

`react`, `lucide-react`. Tailwind CSS는 클래스명 기반.
테스트만 추가 의존성: `vitest`.

## 검증 결과

- 30개 모듈 import 정합성 통과
- JSX 파싱 통과 (모든 .jsx 파일 + 단일 파일)
- 단일 파일 최상위 식별자 100개 중복 0건
- Vitest 86개 전부 통과
