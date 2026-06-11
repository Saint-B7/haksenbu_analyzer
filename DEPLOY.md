# 학생부 문장 분석기 — 배포 가이드

> 개발자(배포 담당자) 전용 문서입니다.

---

## 목차

1. [최초 설정 (한 번만)](#1-최초-설정-한-번만)
2. [새 버전 배포 절차](#2-새-버전-배포-절차)
3. [로컬 빌드 명령어 모음](#3-로컬-빌드-명령어-모음)
4. [빌드 실패 시 흔한 원인](#4-빌드-실패-시-흔한-원인)
5. [아이콘 재생성](#5-아이콘-재생성)

---

## 1. 최초 설정 (한 번만)

### 1-1. GitHub 저장소 생성

GitHub에서 저장소를 생성하고 `electron-builder.yml`의 `publish` 섹션을 실제 값으로 교체합니다.

```yaml
# electron-builder.yml — 현재 실제 설정값
publish:
  provider: github
  owner: Saint-B7
  repo: haksenbu_analyzer
  releaseType: release
```

### 1-2. GitHub Secret 등록

GitHub 저장소 → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Name | Value |
|------|-------|
| `GH_TOKEN` | GitHub Personal Access Token (repo 쓰기 권한 필요) |

**PAT 발급 방법:**
1. GitHub → 우측 상단 프로필 → **Settings**
2. 좌측 하단 **Developer settings** → **Personal access tokens** → **Tokens (classic)**
3. **Generate new token (classic)** 클릭
4. 권한 선택: **repo** (전체) 체크
5. 생성된 토큰을 복사해 Secret에 등록

### 1-3. 원격 저장소 연결

```bash
# 이미 origin 이 git@github.com:Saint-B7/haksenbu_analyzer.git 으로 연결돼 있습니다.
# 신규 환경에서 처음 연결하는 경우에만 아래를 사용하세요.
git init
git remote add origin https://github.com/Saint-B7/haksenbu_analyzer.git
git add .
git commit -m "chore: initial commit"
git push -u origin main
```

---

## 2. 새 버전 배포 절차

### 자동화 명령어 (권장)

버전 번호를 올리고 GitHub Actions를 자동 트리거합니다.

```bash
# 패치 버전 (1.0.0 → 1.0.1) — 버그 수정
npm run release:patch

# 마이너 버전 (1.0.0 → 1.1.0) — 기능 추가
npm run release:minor

# 메이저 버전 (1.0.0 → 2.0.0) — 대규모 변경
npm run release:major
```

각 명령은 다음을 순서대로 실행합니다:

1. `npm test` — 전체 테스트 통과 확인
2. `package.json` 버전 자동 증가
3. git commit + tag 생성 (`v1.0.1`)
4. `git push --follow-tags` → GitHub Actions 트리거

### Actions 진행 확인

GitHub 저장소 → **Actions** 탭 → 실행 중인 워크플로 클릭

| 단계 | 소요 시간 | 비고 |
|------|-----------|------|
| 의존성 설치 | ~1분 | npm 캐시 적중 시 단축 |
| 테스트 | ~30초 | |
| Vite 빌드 | ~1분 | |
| Windows exe 빌드 | ~5분 | Electron 바이너리 캐시 후 단축 |
| **합계** | **약 7~10분** | |

> 현재 릴리즈 워크플로(`.github/workflows/release.yml`)는 **Windows 전용**입니다.
> (macOS 빌드는 이번 라운드 범위에서 제외 — 추후 필요 시 매트릭스에 다시 추가)

### 배포 완료 확인

Actions 완료 후 **Releases** 탭에 다음 **3종**이 자동 등록됩니다:

```
haksenbu-analyzer-setup-1.0.1.exe          ← Windows 설치 파일
haksenbu-analyzer-setup-1.0.1.exe.blockmap ← 자동 업데이트 차등 다운로드용
latest.yml                                  ← 자동 업데이트 메타 (★ 반드시 존재해야 함)
```

### 기존 사용자 자동 업데이트 흐름

1. 기존 설치 사용자가 앱을 실행하면 3초 후 업데이트 확인
2. 헤더에 "새 버전 감지됨" 배지 표시
3. 백그라운드 다운로드 진행 ("새 버전 42% 다운로드 중")
4. 완료 후 팝업 → [지금 재시작] 클릭 시 즉시 적용

### 한 줄 배포 절차 (요약)

```
코드 수정 + git commit
  → npm run release:patch
  → GitHub Actions 빌드 완료 대기 (~10분)
  → Releases 에 .exe / latest.yml / blockmap 3종 확인
  → 기존 사용자 앱이 다음 실행 시 자동 업데이트
```

### 자동 업데이트가 안 될 때 체크리스트

1. **Release 에 `latest.yml` 이 있는가?** — 자동 업데이트의 핵심 메타. 없으면 절대 동작하지 않음
2. **`package.json` 의 version 이 사용자 설치본보다 높은가?** — 같거나 낮으면 업데이트로 인식하지 않음
3. **사용자 앱이 자동 업데이트 코드 포함 버전인가?** — updater 미포함 구버전 설치자는 이번 한 번만 수동 설치 필요 (이후부터 자동)
4. **저장소 Secrets 에 `GH_TOKEN`(repo 쓰기 권한) 이 등록돼 있는가?** — 없으면 CI publish 가 실패해 Release 자체가 비어 있음

---

## 3. 로컬 빌드 명령어 모음

```bash
# 개발 서버 (Electron + Vite HMR)
npm run dev

# Vite 프로덕션 빌드만 (electron-builder 실행 안 함)
npm run build

# Windows NSIS 설치 파일 (로컬, GitHub 업로드 없음)
npm run build:win
# → dist/release/haksenbu-analyzer-setup-x.x.x.exe

# macOS Universal DMG (로컬, GitHub 업로드 없음)
npm run build:mac
# → dist/release/haksenbu-analyzer-x.x.x-universal.dmg

# 테스트
npm test

# 아이콘 재생성
npm run icons:gen
```

> **주의 (Claude Code 환경 전용):**  
> Claude Code 터미널에서는 `ELECTRON_RUN_AS_NODE=1`이 자동 설정돼 있어  
> Vite 빌드가 실패할 수 있습니다.  
> 직접 실행 시 앞에 `ELECTRON_RUN_AS_NODE= ` 를 붙이세요.  
> 예: `ELECTRON_RUN_AS_NODE= npm run build:mac`

---

## 4. 빌드 실패 시 흔한 원인

### 테스트 실패

```
FAIL tests/xxx.test.js
```

→ `npm test` 로 실패 케이스 확인 후 코드 수정

### Vite 빌드 실패

```
[vite] error: Cannot find module '...'
```

→ `npm ci` 로 의존성 재설치

### electron-builder 설정 오류

```
Invalid configuration object ... has an unknown property
```

→ `electron-builder.yml` 의 속성명이 현재 버전(v26)에 맞지 않음.  
해당 속성을 제거하거나 [electron-builder 문서](https://www.electron.build/) 에서 올바른 위치 확인.

### macOS Universal ASAR 병합 오류

```
Detected unique file ... not covered by allowList rule
```

→ `dist/release/` 하위의 임시 디렉터리가 `dist/**/*` 글로브에 포함된 경우 발생.  
`electron-builder.yml`의 `files`에 `"!dist/release/**/*"` 가 있는지 확인.  
없으면 추가하고 `dist/release/mac-universal-*` 디렉터리를 삭제 후 재빌드.

### GitHub Actions 빌드 실패

**`GH_TOKEN` 관련:**
```
Error: Resource not accessible by integration
```
→ Secrets 탭에서 `GH_TOKEN` 이 등록되어 있는지, repo 쓰기 권한이 있는지 확인.

**Windows 빌드는 성공, macOS 빌드 실패 (또는 반대):**  
→ `fail-fast: false` 설정으로 나머지 플랫폼은 계속 빌드됩니다.  
실패한 플랫폼의 로그만 확인하세요.

**Electron 바이너리 다운로드 타임아웃:**  
→ Actions를 재실행(Re-run)하면 대부분 해결됩니다.

---

## 5. 아이콘 재생성

---

## 6. Apple Developer 가입 후 코드 사이닝 활성화

현재 빌드는 **ad-hoc 서명** 상태입니다. Apple Developer Program($99/년) 가입 후 아래 절차로 전환하면 사용자가 Gatekeeper 경고 없이 앱을 바로 실행할 수 있습니다.

### 6-1. 준비

1. [developer.apple.com](https://developer.apple.com) 가입 ($99/년)
2. Xcode → Preferences → Accounts → 계정 추가 후 **Developer ID Application** 인증서 발급
3. Keychain Access 에서 인증서와 개인키가 등록됐는지 확인

### 6-2. 환경변수 등록

`.env` (로컬) 또는 GitHub Secrets (CI):

| 변수명 | 설명 |
|--------|------|
| `APPLE_ID` | Apple ID 이메일 주소 |
| `APPLE_APP_SPECIFIC_PASSWORD` | appleid.apple.com → 앱 전용 암호 |
| `APPLE_TEAM_ID` | 개발자 계정 팀 ID (10자리 영문+숫자) |

### 6-3. 코드 변경 (3곳)

**① `electron-builder.yml`** — 루트 `afterSign` 주석 해제, `mac.identity` 변경:

```yaml
afterSign: build/notarize.js   # 주석 해제

mac:
  identity: "Developer ID Application: 홍길동 (XXXXXXXXXX)"  # 실제 값으로 변경
  # identity: null  ← 이 줄 제거 또는 주석 처리
```

**② `build/notarize.js`** — 내부 주석 해제 (exports.default 함수 본문)

**③ 의존성 추가:**

```bash
npm i -D @electron/notarize
```

### 6-4. GitHub Actions 환경변수 전달

`.github/workflows/release.yml` 의 macOS 빌드 스텝에 추가:

```yaml
env:
  GH_TOKEN: ${{ secrets.GH_TOKEN }}
  APPLE_ID: ${{ secrets.APPLE_ID }}
  APPLE_APP_SPECIFIC_PASSWORD: ${{ secrets.APPLE_APP_SPECIFIC_PASSWORD }}
  APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
```

### 6-5. 검증

```bash
ELECTRON_RUN_AS_NODE= npm run build:mac
# 빌드 로그에서 "Notarizing..." 메시지 확인 (약 5~10분 추가 소요)
# 완료 후: spctl --assess --verbose "/Applications/학생부 문장 분석기.app"
# 결과: "accepted" 이면 성공
```

---

커스텀 아이콘 PNG(1024×1024)가 준비된 경우:

1. `build/source-icon.png` 로 저장
2. `scripts/gen-icons.cjs` 상단의 디자인 함수를 수정하거나,  
   아래처럼 외부 PNG를 직접 사용하도록 스크립트를 수정
3. `npm run icons:gen` 실행

현재 임시 아이콘 디자인: **인디고 배경 + 흰색 5각별**  
(외부 npm 의존성 없이 순수 Node.js로 생성됨)
