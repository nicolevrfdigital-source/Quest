// Generates the PWA / home-screen icons without any image dependencies.
// Run with `npm run icons`. Output goes to public/icons and public/favicon.svg.
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';

const OUT = new URL('../public/icons/', import.meta.url);
mkdirSync(OUT, { recursive: true });

const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const SAGE_TOP = hex('#b9d1b1');
const SAGE_BOTTOM = hex('#8fb187');
const CREAM = hex('#fffaf0');
const PEACH = hex('#f2b58f');
const BUTTER = hex('#f8dc7c');

function starPolygon(cx, cy, outer, inner, points = 5) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = -Math.PI / 2 + (i * Math.PI) / points;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

function inPolygon(x, y, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Colour of a point in unit coordinates (0..1). `pad` shrinks the art for maskable icons. */
function shade(u, v, pad) {
  const s = 1 - 2 * pad;
  const x = (u - pad) / s;
  const y = (v - pad) / s;
  const t = v;
  let c = SAGE_TOP.map((a, i) => a + (SAGE_BOTTOM[i] - a) * t);
  const d = Math.hypot(x - 0.5, y - 0.52);
  if (d < 0.34) c = CREAM;
  if (inPolygon(x, y, starPolygon(0.5, 0.535, 0.205, 0.088))) c = PEACH;
  // Two little sparkles
  if (Math.hypot(x - 0.79, y - 0.2) < 0.035) c = BUTTER;
  if (Math.hypot(x - 0.2, y - 0.83) < 0.025) c = CREAM;
  return c;
}

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(size, pad = 0) {
  const SS = 4; // 4x4 supersampling for smooth edges
  const raw = Buffer.alloc(size * (size * 3 + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const acc = [0, 0, 0];
      for (let sy = 0; sy < SS; sy++)
        for (let sx = 0; sx < SS; sx++) {
          const c = shade((x + (sx + 0.5) / SS) / size, (y + (sy + 0.5) / SS) / size, pad);
          acc[0] += c[0]; acc[1] += c[1]; acc[2] += c[2];
        }
      const o = y * (size * 3 + 1) + 1 + x * 3;
      for (let i = 0; i < 3; i++) raw[o + i] = Math.round(acc[i] / (SS * SS));
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

writeFileSync(new URL('icon-192.png', OUT), png(192));
writeFileSync(new URL('icon-512.png', OUT), png(512));
writeFileSync(new URL('icon-maskable-512.png', OUT), png(512, 0.1));
writeFileSync(new URL('apple-touch-icon.png', OUT), png(180));

const star = starPolygon(32, 34.2, 13.1, 5.6).map((p) => p.map((n) => n.toFixed(1)).join(',')).join(' ');
writeFileSync(
  new URL('../favicon.svg', OUT),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b9d1b1"/><stop offset="1" stop-color="#8fb187"/></linearGradient></defs><rect width="64" height="64" rx="14" fill="url(#g)"/><circle cx="32" cy="33.3" r="21.8" fill="#fffaf0"/><polygon points="${star}" fill="#f2b58f"/><circle cx="50.6" cy="12.8" r="2.3" fill="#f8dc7c"/></svg>\n`,
);
console.log('Icons written to public/icons');
