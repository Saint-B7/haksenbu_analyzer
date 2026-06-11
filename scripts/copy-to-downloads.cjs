// ─────────────────────────────────────────────────────────────────────────────
// 빌드된 설치파일(.exe)을 사용자 다운로드 폴더로 자동 복사
//
// 왜 .cjs 인가?
//   package.json 이 "type": "module" 이라 .js 는 ESM 으로 해석되어 require 가 깨진다.
//   기존 빌드 스크립트(after-sign.cjs, gen-icons.cjs)와 동일하게 CommonJS(.cjs)로 작성.
//
// 사용처: build:win 스크립트 끝에서 호출
//   "build:win": "... electron-builder ... && node scripts/copy-to-downloads.cjs"
//
// 동작:
//   dist/release 안의 가장 최근 .exe 산출물을 찾아 ~/Downloads 로 복사한다.
//   .exe 가 없으면(예: macOS 빌드) 경고만 남기고 정상 종료한다.
// ─────────────────────────────────────────────────────────────────────────────

const fs = require('fs');
const path = require('path');
const os = require('os');

// 빌드 산출물 폴더(electron-builder.yml 의 directories.output 와 일치)
const RELEASE_DIR = path.join(__dirname, '..', 'dist', 'release');
// Windows: %USERPROFILE%\Downloads / macOS: ~/Downloads
const DOWNLOADS = path.join(os.homedir(), 'Downloads');

// 산출물 폴더가 아직 없으면(빌드 실패 등) 건너뜀
if (!fs.existsSync(RELEASE_DIR)) {
  console.warn(`[copy] 산출물 폴더가 없습니다: ${RELEASE_DIR} — 건너뜀`);
  process.exit(0);
}

// 가장 최근에 생성된 .exe 산출물 찾기 (mtime 내림차순)
const exeFiles = fs.readdirSync(RELEASE_DIR)
  .filter((f) => f.endsWith('.exe'))
  .map((f) => ({ f, mtime: fs.statSync(path.join(RELEASE_DIR, f)).mtime }))
  .sort((a, b) => b.mtime - a.mtime);

if (exeFiles.length === 0) {
  console.warn('[copy] .exe 산출물이 없습니다 (macOS 빌드 등) — 건너뜀');
  process.exit(0);
}

const src = path.join(RELEASE_DIR, exeFiles[0].f);
const dest = path.join(DOWNLOADS, exeFiles[0].f);
fs.copyFileSync(src, dest);
const sizeMB = (fs.statSync(dest).size / (1024 * 1024)).toFixed(1);
console.log(`[copy] ✓ 다운로드 폴더에 저장됨: ${dest} (${sizeMB} MB)`);
