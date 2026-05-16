const KEY_GRADE    = 'haksenbu.grade';
const KEY_ACTIVITY = 'haksenbu.activityType';

export const PREF_DEFAULTS = { grade: '3학년', activityType: '세특' };

function globalStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

/**
 * 저장된 학년·항목 선택값을 읽는다.
 * _storage 파라미터는 테스트에서 mock 객체를 주입하기 위한 용도이며,
 * 프로덕션 코드에서는 인자 없이 호출한다.
 */
export function getPrefs(_storage = globalStorage()) {
  if (!_storage) return { ...PREF_DEFAULTS };
  return {
    grade:        _storage.getItem(KEY_GRADE)    ?? PREF_DEFAULTS.grade,
    activityType: _storage.getItem(KEY_ACTIVITY) ?? PREF_DEFAULTS.activityType,
  };
}

/**
 * 학년·항목 선택값을 저장한다.
 */
export function savePrefs({ grade, activityType }, _storage = globalStorage()) {
  if (!_storage) return;
  _storage.setItem(KEY_GRADE,    grade);
  _storage.setItem(KEY_ACTIVITY, activityType);
}
