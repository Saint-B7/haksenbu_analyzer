/**
 * 향후 Apple Developer 가입 후 활성화할 공증(notarization) 스크립트
 *
 * 활성화 방법:
 *   1. npm i -D @electron/notarize
 *   2. electron-builder.yml 루트의 afterSign 주석 해제:
 *        afterSign: build/notarize.js
 *   3. mac.identity 를 실제 Developer ID 로 변경
 *   4. 아래 환경변수를 .env 또는 GitHub Secrets 에 등록:
 *        APPLE_ID=<Apple ID 이메일>
 *        APPLE_APP_SPECIFIC_PASSWORD=<앱 전용 암호>
 *        APPLE_TEAM_ID=<팀 ID>
 *   5. 아래 코드 주석 해제
 */

/* eslint-disable */
// const { notarize } = require('@electron/notarize');

exports.default = async function notarizing(context) {
  // const { electronPlatformName, appOutDir } = context;
  // if (electronPlatformName !== 'darwin') return;
  //
  // const appName = context.packager.appInfo.productFilename;
  // await notarize({
  //   appBundleId: 'com.baeseongin.haksenbu-analyzer',
  //   appPath: `${appOutDir}/${appName}.app`,
  //   appleId: process.env.APPLE_ID,
  //   appleIdPassword: process.env.APPLE_APP_SPECIFIC_PASSWORD,
  //   teamId: process.env.APPLE_TEAM_ID,
  // });
};
