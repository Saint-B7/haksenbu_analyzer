/**
 * electron-builder afterSign 훅
 * Developer ID 없이 ad-hoc 서명을 적용한다.
 *
 * 핵심: 개별 Mach-O 바이너리에는 --preserve-metadata=flags 사용
 *   → 원본 linker-signed 플래그(0x20000)를 보존해야 AMFI가 실행을 허용.
 *   → --force만 쓰면 flags=0x2(adhoc)로 바뀌어 flags=0x20002이 깨지고 SIGTRAP 발생.
 *
 * 서명 순서: 개별 바이너리 → Helper 앱 → 프레임워크 → 메인 앱 번들
 */

'use strict';

const { execFileSync, execSync } = require('child_process');
const { writeFileSync, unlinkSync } = require('fs');
const path = require('path');
const os = require('os');

const ENTITLEMENTS = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key><true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key><true/>
  <key>com.apple.security.cs.disable-library-validation</key><true/>
  <key>com.apple.security.cs.allow-dyld-environment-variables</key><true/>
</dict>
</plist>`;

function signBinary(f, entFile) {
  // linker-signed 플래그를 보존한 채 ad-hoc 재서명
  execFileSync('codesign', [
    '--force', '--sign', '-',
    '--preserve-metadata=identifier,entitlements,flags',
    '--timestamp=none',
    f,
  ], { stdio: 'pipe' });
}

function signBundle(target, entFile) {
  // 앱/프레임워크 번들은 entitlements 포함
  execFileSync('codesign', [
    '--force', '--sign', '-',
    '--entitlements', entFile,
    '--timestamp=none',
    target,
  ], { stdio: 'pipe' });
}

module.exports = async function afterSign({ appOutDir, packager }) {
  if (process.platform !== 'darwin') return;

  const appName = packager.appInfo.productName;
  const appPath = path.join(appOutDir, `${appName}.app`);

  console.log(`\n[after-sign] ad-hoc signing (linker-flags preserved): ${appPath}`);

  const entFile = path.join(os.tmpdir(), 'electron-adhoc.entitlements.plist');
  writeFileSync(entFile, ENTITLEMENTS);

  try {
    // 1) 개별 Mach-O 바이너리 서명 — linker-signed 플래그 보존
    const files = execSync(
      `find "${appPath}" -type f -not -path "*/_CodeSignature/*"`,
      { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);

    for (const f of files) {
      try {
        const info = execSync(`file "${f}"`, { encoding: 'utf8' });
        if (info.includes('Mach-O')) signBinary(f, entFile);
      } catch { /* 개별 실패 무시 */ }
    }

    // 2) Helper .app 번들
    const helpers = execSync(
      `find "${appPath}/Contents/Frameworks" -name "*.app" -maxdepth 2`,
      { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);

    for (const h of helpers.sort()) {
      try { signBundle(h, entFile); } catch { /* ignore */ }
    }

    // 3) .framework 번들
    const frameworks = execSync(
      `find "${appPath}/Contents/Frameworks" -name "*.framework" -maxdepth 1`,
      { encoding: 'utf8' }
    ).trim().split('\n').filter(Boolean);

    for (const fw of frameworks.sort()) {
      try { signBundle(fw, entFile); } catch { /* ignore */ }
    }

    // 4) 메인 앱 번들 (마지막)
    signBundle(appPath, entFile);

    // 5) 검증
    execFileSync('codesign', ['--verify', '--deep', '--strict', appPath], { stdio: 'pipe' });
    console.log('[after-sign] ✓ 서명 검증 통과');

    // 6) flags 확인 (linker-signed 보존 여부) — 결과 없어도 무시
    try {
      const info = execSync(`codesign -dvvv "${appPath}" 2>&1 | grep -i flags || true`, { encoding: 'utf8', shell: true }).trim();
      if (info) console.log('[after-sign] ' + info);
    } catch { /* ignore */ }
  } finally {
    try { unlinkSync(entFile); } catch { /* ignore */ }
  }
};
