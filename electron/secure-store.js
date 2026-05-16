// ─────────────────────────────────────────────────────────────────────────────
// API 키 안전 저장소 — safeStorage + electron-store 조합
//
// keytar 대신 safeStorage를 선택한 이유:
//   - keytar: 네이티브 바이너리 의존 → Electron 버전마다 재빌드 필요, 유지보수 종료(deprecated)
//   - safeStorage: Electron 15+에 내장 → 추가 빌드 없이 동작
//
// 동작 원리:
//   1) safeStorage.encryptString(plainKey) → OS가 암호화한 Buffer 반환
//      - macOS: Keychain 마스터 키로 암호화
//      - Windows: DPAPI(Data Protection API)로 암호화
//      - Linux: GNOME/KDE Keyring 또는 AES-256 폴백
//   2) 암호화된 Buffer를 Base64 문자열로 변환해 electron-store JSON 파일에 저장
//   3) 복호화: Base64 → Buffer → safeStorage.decryptString()
//
// 주의: safeStorage는 같은 OS 사용자 계정에서만 복호화 가능 (다른 PC로 파일 복사 불가)
// ─────────────────────────────────────────────────────────────────────────────

import { safeStorage } from 'electron';
import Store from 'electron-store';

// API 키 전용 저장소 (일반 앱 설정과 파일 분리)
const secureStore = new Store({ name: 'secure-data' });

const KEY_FIELD = 'apiKeyEncrypted'; // electron-store 내 필드명

/**
 * API 키를 OS 암호화 저장소에 안전하게 저장
 * @param {string} plainKey — 사용자가 입력한 평문 API 키
 */
export const saveApiKey = (plainKey) => {
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error(
      '이 기기에서 안전한 암호화를 사용할 수 없습니다.\n' +
      'Windows에서는 로그인 계정이 있어야 하고, ' +
      'Linux에서는 GNOME Keyring 또는 KWallet이 필요합니다.'
    );
  }
  const encrypted = safeStorage.encryptString(plainKey);
  secureStore.set(KEY_FIELD, encrypted.toString('base64'));
};

/**
 * 저장된 API 키 복호화 반환 (없으면 null)
 * @returns {string|null}
 */
export const getApiKey = () => {
  const base64 = secureStore.get(KEY_FIELD);
  if (!base64) return null;
  return safeStorage.decryptString(Buffer.from(base64, 'base64'));
};

/**
 * API 키가 저장되어 있는지 여부만 확인 (키 값 반환 안 함)
 * @returns {boolean}
 */
export const hasApiKey = () => Boolean(secureStore.get(KEY_FIELD));

/**
 * 저장된 API 키 삭제
 */
export const deleteApiKey = () => secureStore.delete(KEY_FIELD);
