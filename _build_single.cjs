// 단일 파일 빌드 스크립트
// 26개 모듈을 의존성 그래프 위상 순으로 결합해 하나의 JSX 파일로 만든다.
// Claude.ai 아티팩트는 단일 파일만 받으므로 미리보기·공유 용도로 필요.
//
// 동작 방식:
//   1) 각 파일의 import 문을 파싱해 의존 그래프 구축
//   2) 위상 정렬로 의존 순서 결정 (lib → data → prompts → components → main)
//   3) 외부 패키지(react, lucide-react) import는 합쳐서 상단에 둠
//   4) 내부 상대경로 import 제거, export 키워드 제거
//   5) HaksenbuAnalyzer.jsx의 default export만 보존

const fs = require('fs');
const path = require('path');

const SRC = '/home/claude/haksenbu/src';
const OUTPUT = '/home/claude/haksenbu/dist/haksenbu_analyzer_single.jsx';

// 모든 .js/.jsx 파일 수집
function walk(dir, out = []) {
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p, out);
    else if (/\.(js|jsx)$/.test(f)) out.push(p);
  }
  return out;
}
const files = walk(SRC);

// 각 파일의 의존성(상대 경로 import 대상) 수집
const deps = {};
const externalImports = new Map(); // 외부 패키지 → import된 심볼 집합
for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  const importLines = src.match(/^\s*import\s+[^;]+from\s+['"][^'"]+['"];?/gm) || [];
  deps[f] = [];
  for (const line of importLines) {
    const fromMatch = line.match(/from\s+['"]([^'"]+)['"]/);
    if (!fromMatch) continue;
    const spec = fromMatch[1];
    if (spec.startsWith('.')) {
      // 상대 경로 → 의존 파일 해석
      const dir = path.dirname(f);
      let target = path.resolve(dir, spec);
      for (const ext of ['', '.js', '.jsx']) {
        if (fs.existsSync(target + ext) && fs.statSync(target + ext).isFile()) {
          deps[f].push(target + ext);
          break;
        }
      }
    } else {
      // 외부 패키지 → 심볼 모음
      const namedMatch = line.match(/\{\s*([^}]+)\s*\}/);
      const defaultMatch = line.match(/import\s+(?:type\s+)?([A-Za-z_$][\w$]*)\s*(?:,|from)/);
      if (!externalImports.has(spec)) {
        externalImports.set(spec, { defaultName: null, names: new Set() });
      }
      const ext = externalImports.get(spec);
      if (defaultMatch && !line.includes('{')) {
        // import X from 'pkg' 형태
        ext.defaultName = ext.defaultName || defaultMatch[1];
      } else if (defaultMatch) {
        // import X, { Y } from 'pkg' 형태
        ext.defaultName = ext.defaultName || defaultMatch[1];
      }
      if (namedMatch) {
        for (const piece of namedMatch[1].split(',')) {
          // alias 보존: "Map as MapIcon" 같은 형태를 그대로 유지해야 단일 파일에서
          // JS 빌트인(Map, Set 등)과의 충돌을 피할 수 있다.
          const trimmed = piece.trim();
          if (trimmed) ext.names.add(trimmed);
        }
      }
    }
  }
}

// 위상 정렬 (DFS)
const sorted = [];
const visited = new Set();
function visit(f) {
  if (visited.has(f)) return;
  visited.add(f);
  for (const d of deps[f] || []) visit(d);
  sorted.push(f);
}
for (const f of files) visit(f);

// 메인 파일을 마지막에 두기 위해 별도 처리
const mainPath = path.join(SRC, 'HaksenbuAnalyzer.jsx');
const sortedWithoutMain = sorted.filter((f) => f !== mainPath);
const orderedFiles = [...sortedWithoutMain, mainPath];

// 각 파일의 본문에서 import 문 + export 키워드 제거 후 결합
function transform(src, isMainFile) {
  // 1) 모든 import 문 제거 (상대·외부 모두)
  let out = src.replace(/^\s*import\s+[^;]+from\s+['"][^'"]+['"];?\s*$/gm, '');
  // 2) 'export const' / 'export let' / 'export var' / 'export function' / 'export class' → 키워드 제거
  out = out.replace(/^export\s+(const|let|var|function|class)\b/gm, '$1');
  // 3) 'export { A, B }' 형태 제거 (이미 모두 한 파일이라 불필요)
  out = out.replace(/^export\s*\{[^}]+\};?\s*$/gm, '');
  // 4) 메인 파일의 'export default function' → 그대로 둠 (단일 default export만 유지)
  //    그 외 파일에 default export는 없다고 가정(실제로 main만 default).
  if (!isMainFile) {
    out = out.replace(/^export\s+default\s+/gm, '');
  }
  // 5) 연속된 빈 줄 정리
  out = out.replace(/\n{3,}/g, '\n\n');
  return out.trim();
}

// 외부 패키지 import 문 생성
function buildExternalImports() {
  const lines = [];
  // react는 default + named 둘 다 가능
  for (const [spec, info] of externalImports.entries()) {
    const namedList = [...info.names].sort();
    if (info.defaultName && namedList.length > 0) {
      lines.push(`import ${info.defaultName}, { ${namedList.join(', ')} } from '${spec}';`);
    } else if (info.defaultName) {
      lines.push(`import ${info.defaultName} from '${spec}';`);
    } else if (namedList.length > 0) {
      lines.push(`import { ${namedList.join(', ')} } from '${spec}';`);
    }
  }
  return lines.join('\n');
}

const header = `// 학생부 문장 분석기 — 단일 파일 빌드 버전 (Claude.ai 아티팩트용)
//
// 본 파일은 src/ 디렉터리의 26개 모듈을 빌드 스크립트로 합친 결과입니다.
// 코드를 수정할 때는 단일 파일이 아닌 src/ 안의 개별 모듈을 수정하고,
// 빌드 스크립트(_build_single.cjs)로 다시 합쳐 주세요.
//
// 의존성: react, lucide-react (Tailwind CSS 클래스 사용)
//
// 개발자 : 배성인
//

`;

const externalImportBlock = buildExternalImports();

const bodyParts = [];
for (const f of orderedFiles) {
  const isMain = f === mainPath;
  const src = fs.readFileSync(f, 'utf8');
  const transformed = transform(src, isMain);
  if (!transformed) continue;
  const rel = path.relative(SRC, f);
  bodyParts.push(`// ═══════════════════════════════════════════════════════════\n// ${rel}\n// ═══════════════════════════════════════════════════════════\n\n${transformed}`);
}

const finalSrc = header + externalImportBlock + '\n\n' + bodyParts.join('\n\n\n');

fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
fs.writeFileSync(OUTPUT, finalSrc, 'utf8');
console.log('✓ 단일 파일 빌드 완료:', OUTPUT);
console.log('  파일 크기:', fs.statSync(OUTPUT).size, 'bytes');
console.log('  포함 모듈:', orderedFiles.length, '개');
