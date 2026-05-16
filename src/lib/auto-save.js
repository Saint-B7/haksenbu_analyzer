const KEY_TEXT   = 'haksenbu.draft.text';
const KEY_CAREER = 'haksenbu.draft.careerGoal';
const KEY_MAJOR  = 'haksenbu.draft.desiredMajor';

function globalStorage() {
  return typeof localStorage !== 'undefined' ? localStorage : null;
}

export function saveDraft({ text, careerGoal, desiredMajor }, _storage = globalStorage()) {
  if (!_storage) return;
  _storage.setItem(KEY_TEXT,   text);
  _storage.setItem(KEY_CAREER, careerGoal);
  _storage.setItem(KEY_MAJOR,  desiredMajor);
}

export function loadDraft(_storage = globalStorage()) {
  if (!_storage) return { text: '', careerGoal: '', desiredMajor: '' };
  return {
    text:         _storage.getItem(KEY_TEXT)   ?? '',
    careerGoal:   _storage.getItem(KEY_CAREER) ?? '',
    desiredMajor: _storage.getItem(KEY_MAJOR)  ?? '',
  };
}

export function clearDraft(_storage = globalStorage()) {
  if (!_storage) return;
  _storage.removeItem(KEY_TEXT);
  _storage.removeItem(KEY_CAREER);
  _storage.removeItem(KEY_MAJOR);
}

/**
 * delay ms 디바운스된 saveDraft를 반환한다.
 * 반환된 함수 시그니처: (draft, _storage?) => void
 */
export function createDebouncedSave(delay = 3000) {
  let timer = null;
  return (draft, _storage) => {
    clearTimeout(timer);
    timer = setTimeout(() => saveDraft(draft, _storage), delay);
  };
}
