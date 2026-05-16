// IndexedDB(또는 일반 비동기 fetcher) 결과를 키 기반으로 캐시하는 가벼운 hook.
//
// 외부 라이브러리(SWR / React Query) 없이 본질만 자체 구현:
//   - 키 기반 메모리 캐시 → 같은 학생을 다시 봐도 IndexedDB 재질의 안 함
//   - in-flight Promise dedupe → 같은 키를 동시에 호출하면 한 번만 fetch
//   - 캐시 변경 시 구독자에게 자동 알림 → 저장/삭제 후 mutate 한 번이면 모든 사용처 갱신
//
// 사용 예:
//   const { data, loading, error } = useIndexedQuery(
//     studentId ? `history:${studentId}` : null,
//     () => getAnalysesByStudent(studentId),
//   );
//   ...
//   await saveAnalysis(...);
//   mutateIndexedQuery(`history:${studentId}`, [...data, saved]);  // 캐시 갱신 → UI 자동 반영
//
// 주의:
//   - key가 null/falsy면 fetch를 건너뛰고 data=undefined 반환 (학생 ID 미입력 상태 처리)
//   - fetcher는 키 변경 시점의 클로저로 호출되므로 정상 동작 (deps에는 key만 둠)

import { useEffect, useState } from 'react';

// 모듈 전역 캐시 — 페이지 새로고침 전까지 유지
const _cache = new Map();              // key → 마지막 결과
const _inflight = new Map();           // key → 진행 중 Promise (동시 호출 dedupe)
const _subscribers = new Map();        // key → Set<(data) => void>

// 구독자에게 알림
const _notify = (key) => {
  const subs = _subscribers.get(key);
  if (subs) {
    const value = _cache.get(key);
    subs.forEach((cb) => cb(value));
  }
};

/**
 * 키 기반 캐싱 + 구독 hook.
 * @param {string|null} key       null이면 fetch 비활성화
 * @param {() => Promise<T>} fetcher  키가 활성일 때 호출되는 비동기 함수
 * @returns {{data: T|undefined, loading: boolean, error: Error|null}}
 */
export const useIndexedQuery = (key, fetcher) => {
  const [state, setState] = useState(() => ({
    data: key ? _cache.get(key) : undefined,
    loading: !!key && !_cache.has(key),
    error: null,
  }));

  useEffect(() => {
    if (!key) {
      setState({ data: undefined, loading: false, error: null });
      return;
    }

    // (1) 구독 등록 — 캐시 변경 시 setState로 반영
    if (!_subscribers.has(key)) _subscribers.set(key, new Set());
    const onUpdate = (data) => setState((s) => ({ ...s, data }));
    _subscribers.get(key).add(onUpdate);

    // (2) 캐시 히트면 그대로 사용
    if (_cache.has(key)) {
      setState({ data: _cache.get(key), loading: false, error: null });
    } else {
      // (3) 캐시 미스 → fetch (in-flight 있으면 그걸 재사용)
      setState((s) => ({ ...s, loading: true }));
      let p = _inflight.get(key);
      if (!p) {
        p = Promise.resolve()
          .then(() => fetcher())
          .finally(() => { _inflight.delete(key); });
        _inflight.set(key, p);
      }
      p.then((data) => {
        _cache.set(key, data);
        _notify(key);  // 다른 구독자에게도 알림
        // 자기 자신은 _notify로 받지만 안전하게 직접 set
        setState({ data, loading: false, error: null });
      }).catch((error) => {
        setState((s) => ({ ...s, loading: false, error }));
      });
    }

    // (4) 언마운트 시 구독 해제
    return () => {
      const subs = _subscribers.get(key);
      if (subs) {
        subs.delete(onUpdate);
        if (subs.size === 0) _subscribers.delete(key);
      }
    };
  }, [key]);

  return state;
};

/**
 * 캐시값을 직접 갱신하면서 모든 구독자에게 알림.
 * 저장·삭제 후 IndexedDB 재질의 없이 즉시 UI를 갱신할 때 사용.
 *
 * @param {string} key
 * @param {*|((prev) => *)} valueOrUpdater 새 값 또는 갱신 함수
 */
export const mutateIndexedQuery = (key, valueOrUpdater) => {
  if (!key) return;
  const next = (typeof valueOrUpdater === 'function')
    ? valueOrUpdater(_cache.get(key))
    : valueOrUpdater;
  _cache.set(key, next);
  _notify(key);
};

/**
 * 테스트·로그아웃 시 캐시 비우기.
 * 인자가 없으면 전체 캐시를 지움.
 */
export const clearIndexedQueryCache = (key) => {
  if (key === undefined) {
    _cache.clear();
    _inflight.clear();
    return;
  }
  _cache.delete(key);
  _inflight.delete(key);
  _notify(key);
};
