'use strict';
/**
 * electron-builder afterSign 훅 — Developer ID 없는 ad-hoc 서명
 *
 * 서명 순서:
 *   1. 개별 Mach-O 파일 (dylib, 실행 파일) — chrome_crashpad_handler 등 포함
 *   2. Electron Framework 번들 (binary + bundle seal)
 *   3. 나머지 framework 번들
 *   4. Helper .app 번들
 *   5. 메인 .app 번들 (마지막)
 *
 * --options runtime: AMFI가 entitlements를 인식하도록 하는 필수 플래그
 * disable-library-validation: Team ID 불일치 우회 (재서명으로 원본 Team ID 상실 보완)
 */

const { execFileSync, execSync } = require('child_process');
const { writeFileSync, unlinkSync } = require('fs');
const path = require('path');
const os = require('os');

const ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.network.client</key><true/>
  <key>com.apple.security.files.user-selected.read-write</key><true/>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key><true/>
  <key>com.apple.security.cs.disable-library-validation</key><true/>
</dict>
</plist>`;

module.exports = async function afterSign({ appOutDir, packager }) {
  // 타깃이 macOS 일 때만 ad-hoc 서명 (Windows/Linux 빌드에서는 건너뜀)
  if (packager.platform.nodeName !== 'darwin') return;

  const appName = packager.appInfo.productName;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`\n[after-sign] ad-hoc 서명 시작: ${appPath}`);

  const entFile = path.join(os.tmpdir(), 'electron-adhoc.plist');
  writeFileSync(entFile, ENTITLEMENTS);

  const sign = (target, extraArgs = []) => execFileSync('codesign', [
    '--force', '--sign', '-',
    '--entitlements', entFile,
    '--options', 'runtime',
    '--timestamp=none',
    ...extraArgs,
    target,
  ], { stdio: 'pipe' });

  try {
    // 1) 개별 Mach-O 파일 서명 (.app/.framework 번들 제외)
    const allFiles = execSync(
      `find "${appPath}" -type f -not -path "*/_CodeSignature/*"`,
      { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);

    let binaryCount = 0;
    for (const f of allFiles) {
      try {
        const info = execSync(`file "${f}"`, { encoding: 'utf8' });
        if (info.includes('Mach-O')) {
          sign(f);
          binaryCount++;
        }
      } catch { /* 개별 실패 무시 */ }
    }
    console.log(`[after-sign] 개별 바이너리 ${binaryCount}개 서명 완료`);

    // 2) Electron Framework 번들 (먼저 — bundle seal 생성)
    const efBundle = path.join(appPath, 'Contents/Frameworks/Electron Framework.framework');
    try {
      sign(efBundle);
      console.log('[after-sign] Electron Framework bundle 서명 완료');
    } catch (e) {
      console.warn('[after-sign] Electron Framework bundle 경고:', e.stderr?.toString().trim());
    }

    // 3) 나머지 .framework 번들
    const frameworks = execSync(
      `find "${appPath}/Contents/Frameworks" -name "*.framework" -maxdepth 1`,
      { encoding: 'utf8' }
    ).trim().split('\n').filter(f => f && !f.endsWith('Electron Framework.framework'));

    for (const fw of frameworks.sort()) {
      try { sign(fw); } catch { /* ignore */ }
    }

    // 4) Helper .app 번들
    const helpers = execSync(
      `find "${appPath}/Contents/Frameworks" -name "*.app" -maxdepth 2`,
      { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);

    for (const h of helpers.sort()) {
      try { sign(h); } catch { /* ignore */ }
    }

    // 5) 메인 앱 번들 (마지막)
    sign(appPath);
    console.log('[after-sign] 메인 앱 번들 서명 완료');

    // 6) 검증
    execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'pipe' });
    console.log('[after-sign] ✓ 서명 검증 통과');

  } finally {
    try { unlinkSync(entFile); } catch { /* ignore */ }
  }
};
