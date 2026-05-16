// IndexedDB 히스토리 저장소 (의존성 0, 자체 wrapper)
// 같은 학생ID로 누적된 분석 결과를 시간순으로 추적해 점수·DNA 변화를 시각화한다.

const DB_NAME = 'haksenbu_analyzer';
const DB_VERSION = 1;
const STORE_NAME = 'analyses';

/**
 * IndexedDB 핸들 열기 (한 번 열고 캐시)
 */
let _dbPromise = null;
export const openDb = () => {
  if (_dbPromise) return _dbPromise;
  _dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB 미지원 브라우저'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        // 학생ID로 빠르게 조회하기 위한 인덱스
        store.createIndex('studentId', 'studentId', { unique: false });
        // 시간순 정렬용
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
  return _dbPromise;
};

/**
 * 분석 결과 저장
 * @param {Object} record { studentId, studentName, label, activityType, grade, originalText, summary }
 */
export const saveAnalysis = async (record) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const fullRecord = {
      ...record,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
    };
    const req = store.add(fullRecord);
    req.onsuccess = () => resolve({ ...fullRecord, id: req.result });
    req.onerror = () => reject(req.error);
  });
};

/**
 * 학생ID로 모든 분석 결과 조회 (시간순 오름차순)
 */
export const getAnalysesByStudent = async (studentId) => {
  if (!studentId) return [];
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const idx = store.index('studentId');
    const req = idx.getAll(IDBKeyRange.only(studentId));
    req.onsuccess = () => {
      const list = (req.result || []).sort((a, b) => a.timestamp - b.timestamp);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
};

/**
 * 모든 학생ID 목록 (중복 제거 + 최근 분석순)
 */
export const getAllStudents = async () => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const req = store.getAll();
    req.onsuccess = () => {
      const all = req.result || [];
      // studentId별 그룹핑 + 가장 최근 분석 시각으로 정렬
      const map = new Map();
      all.forEach((r) => {
        const cur = map.get(r.studentId);
        if (!cur || cur.lastTimestamp < r.timestamp) {
          map.set(r.studentId, {
            studentId: r.studentId,
            studentName: r.studentName || r.studentId,
            count: (cur?.count || 0) + 1,
            lastTimestamp: Math.max(cur?.lastTimestamp || 0, r.timestamp),
          });
        } else {
          cur.count += 1;
        }
      });
      resolve(Array.from(map.values()).sort((a, b) => b.lastTimestamp - a.lastTimestamp));
    };
    req.onerror = () => reject(req.error);
  });
};

/**
 * 단일 분석 삭제
 */
export const deleteAnalysis = async (id) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const req = tx.objectStore(STORE_NAME).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
};

/**
 * 학생ID로 모든 기록 삭제
 */
export const deleteStudent = async (studentId) => {
  const records = await getAnalysesByStudent(studentId);
  for (const r of records) {
    await deleteAnalysis(r.id);
  }
};

// summarizeForHistory에서 사용하는 DNA 점수 fallback 상수
import {
  DNA_FALLBACK_SCORE_SATISFIED,
  DNA_FALLBACK_SCORE_UNSATISFIED,
} from '../data/constants';

/**
 * 분석 결과에서 히스토리에 저장할 요약만 추출 (전체 result는 너무 크므로)
 */
export const summarizeForHistory = (result, complianceViolations) => {
  return {
    overallScore: result?.overallScore,
    satisfiedCount: result?.satisfiedCount,
    topTierMetCount: result?.topTierMetCount,
    researchDepth: result?.researchDepth?.score,
    multiPerspectiveAvg: result?.multiPerspectiveEvaluation?.consensus?.averageScore,
    rewrittenLength: result?.rewrittenVersion?.length || 0,
    complianceViolations: complianceViolations?.matches?.length || 0,
    complianceCritical: complianceViolations?.summary?.critical || 0,
    // DNA 점수 7개 (변화 추적용) — qualityScore 누락 시 satisfied 기준 fallback
    dnaScores: (result?.dnaChecklist || []).map((d) => ({
      id: d.id,
      name: d.name,
      score: d.qualityScore ?? (d.satisfied ? DNA_FALLBACK_SCORE_SATISFIED : DNA_FALLBACK_SCORE_UNSATISFIED),
    })),
  };
};
