#!/usr/bin/env node
// scripts/gen-icons.cjs — 외부 npm 의존성 없이 앱 아이콘 3종 생성
//   build/icon.png  (512×512, 인앱 / 업데이트 알림용)
//   build/icon.ico  (Windows NSIS, PNG-in-ICO Vista+)
//   build/icon.icns (macOS dmg, iconutil 사용 — macOS 전용)
//
// 디자인: 인디고(#4f46e5) 배경 + 흰색 5각별
// 실행: node scripts/gen-icons.cjs  또는  npm run icons:gen
'use strict';

const zlib     = require('zlib');
const fs       = require('fs');
const path     = require('path');
const { execSync } = require('child_process');

const ROOT      = path.join(__dirname, '..');
const BUILD_DIR = path.join(ROOT, 'build');

// ── CRC32 (PNG 체크섬용) ──────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) crc = CRC_TABLE[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG 인코더 (RGB, 압축 6) ──────────────────────────────────────────────────
const PNG_SIG = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);

function pngChunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.allocUnsafe(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function buildPNG(size, pixelFn) {
  const rows = new Array(size);
  for (let y = 0; y < size; y++) {
    const row = Buffer.allocUnsafe(1 + size * 3);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const [r, g, b] = pixelFn(x, y);
      const o = 1 + x * 3;
      row[o] = r; row[o + 1] = g; row[o + 2] = b;
    }
    rows[y] = row;
  }
  const compressed = zlib.deflateSync(Buffer.concat(rows), { level: 6 });
  const ihdr = Buffer.allocUnsafe(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([PNG_SIG, pngChunk('IHDR', ihdr), pngChunk('IDAT', compressed), pngChunk('IEND', Buffer.alloc(0))]);
}

// ── 아이콘 디자인: 인디고 배경 + 흰 5각별 ────────────────────────────────────
const INDIGO = [79, 70, 229];
const WHITE  = [255, 255, 255];

function makePixelFn(size) {
  const cx = size / 2, cy = size / 2;
  const ro = size * 0.370;  // 별 꼭짓점 반지름
  const ri = size * 0.155;  // 별 오목 반지름

  // 10개 꼭짓점 사전 계산 (짝수 인덱스: 바깥, 홀수: 안쪽)
  const pts = Array.from({ length: 10 }, (_, i) => {
    const ang = (Math.PI * 2 * i) / 10 - Math.PI / 2;
    return [cx + (i % 2 === 0 ? ro : ri) * Math.cos(ang),
            cy + (i % 2 === 0 ? ro : ri) * Math.sin(ang)];
  });

  return (x, y) => {
    // Ray-casting 알고리즘
    let inside = false;
    for (let i = 0, j = 9; i < 10; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi))
        inside = !inside;
    }
    return inside ? WHITE : INDIGO;
  };
}

// ── ICO 생성 (PNG-in-ICO, Windows Vista+) ────────────────────────────────────
function buildICO(entries) {
  // entries: [{ size, png }]  size >= 256 → 헤더에 0으로 기재 (ICO 규격)
  const count = entries.length;
  let offset = 6 + 16 * count; // 파일 시작부터 첫 이미지 데이터까지의 오프셋

  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); header.writeUInt16LE(1, 2); header.writeUInt16LE(count, 4);

  const dirEntries = entries.map(({ size, png }) => {
    const e = Buffer.alloc(16);
    e[0] = size >= 256 ? 0 : size;
    e[1] = size >= 256 ? 0 : size;
    e[2] = 0; e[3] = 0;
    e.writeUInt16LE(1, 4);           // planes
    e.writeUInt16LE(32, 6);          // bit count
    e.writeUInt32LE(png.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += png.length;
    return e;
  });

  return Buffer.concat([header, ...dirEntries, ...entries.map(e => e.png)]);
}

// ── ICNS 생성 (macOS iconutil) ────────────────────────────────────────────────
function buildICNS(pngBySize) {
  const iconsetDir = path.join(BUILD_DIR, 'icon.iconset');
  fs.mkdirSync(iconsetDir, { recursive: true });

  // iconutil이 요구하는 파일명 규칙 (size → 파일명 목록)
  const fileMap = [
    [16,   ['icon_16x16.png']],
    [32,   ['icon_16x16@2x.png', 'icon_32x32.png']],
    [64,   ['icon_32x32@2x.png']],
    [128,  ['icon_128x128.png']],
    [256,  ['icon_128x128@2x.png', 'icon_256x256.png']],
    [512,  ['icon_256x256@2x.png', 'icon_512x512.png']],
    [1024, ['icon_512x512@2x.png']],
  ];

  for (const [size, names] of fileMap) {
    const buf = pngBySize[size];
    if (!buf) continue;
    for (const name of names) fs.writeFileSync(path.join(iconsetDir, name), buf);
  }

  // iconutil의 기본 동작: icon.iconset → icon.icns (같은 디렉터리)
  execSync(`iconutil -c icns "${iconsetDir}"`, { stdio: 'pipe' });
  fs.rmSync(iconsetDir, { recursive: true });
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
fs.mkdirSync(BUILD_DIR, { recursive: true });

const ICO_SIZES  = [16, 32, 48, 64, 128, 256];
const ICNS_SIZES = [16, 32, 64, 128, 256, 512, 1024];
const ALL_SIZES  = [...new Set([...ICO_SIZES, ...ICNS_SIZES])].sort((a, b) => a - b);

console.log('아이콘 PNG 생성 중...');
const pngBySize = {};
for (const size of ALL_SIZES) {
  process.stdout.write(`  ${size.toString().padStart(4)}×${size} ... `);
  pngBySize[size] = buildPNG(size, makePixelFn(size));
  process.stdout.write('✓\n');
}

// build/icon.png (512×512)
fs.writeFileSync(path.join(BUILD_DIR, 'icon.png'), pngBySize[512]);
console.log('  → build/icon.png  ✓');

// build/icon.ico (Windows)
const ico = buildICO(ICO_SIZES.map(s => ({ size: s, png: pngBySize[s] })));
fs.writeFileSync(path.join(BUILD_DIR, 'icon.ico'), ico);
console.log(`  → build/icon.ico  ✓  (${(ico.length / 1024).toFixed(1)} KB)`);

// build/icon.icns (macOS 전용)
if (process.platform === 'darwin') {
  buildICNS(pngBySize);
  const icnsPath = path.join(BUILD_DIR, 'icon.icns');
  const icnsSize = fs.statSync(icnsPath).size;
  console.log(`  → build/icon.icns ✓  (${(icnsSize / 1024).toFixed(1)} KB)`);
} else {
  console.log('  ⚠  icon.icns는 macOS 환경에서만 생성 가능 (GitHub Actions macOS 러너에서 자동 처리됩니다)');
}

console.log('\n완료!');
