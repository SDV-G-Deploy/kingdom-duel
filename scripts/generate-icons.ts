/**
 * Generates the PWA icons in public/icons/ without any image dependencies:
 * a tiny supersampled rasterizer draws the Kingdom Duel prism gem and a
 * minimal PNG encoder writes the files.
 *
 *   npm run icons
 *
 * The output is committed; rerun only when the artwork changes.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { deflateSync } from 'node:zlib';

type Rgba = [number, number, number, number];
type Point = [number, number];

const OUT_DIR = join(process.cwd(), 'public', 'icons');
const SUPERSAMPLE = 4;

function hex(color: string, alpha = 1): Rgba {
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255, alpha];
}

function mix(a: Rgba, b: Rgba, t: number): Rgba {
  const k = Math.min(1, Math.max(0, t));
  return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k, a[3] + (b[3] - a[3]) * k];
}

function gradient(stops: Array<[number, Rgba]>, t: number): Rgba {
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1];
      const [t1, c1] = stops[i];
      return mix(c0, c1, (t - t0) / (t1 - t0));
    }
  }
  return stops[stops.length - 1][1];
}

/** Source-over composite of `top` onto `base`. */
function over(base: Rgba, top: Rgba): Rgba {
  const a = top[3] + base[3] * (1 - top[3]);
  if (a === 0) return [0, 0, 0, 0];
  const channel = (i: number): number => (top[i] * top[3] + base[i] * base[3] * (1 - top[3])) / a;
  return [channel(0), channel(1), channel(2), a];
}

function insidePolygon(point: Point, polygon: readonly Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    if (yi > point[1] !== yj > point[1] && point[0] < ((xj - xi) * (point[1] - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function distanceToSegment(p: Point, a: Point, b: Point): number {
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(p[0] - (a[0] + t * dx), p[1] - (a[1] + t * dy));
}

function distanceToPolygonEdge(p: Point, polygon: readonly Point[]): number {
  let best = Infinity;
  for (let i = 0; i < polygon.length; i++) best = Math.min(best, distanceToSegment(p, polygon[i], polygon[(i + 1) % polygon.length]));
  return best;
}

function insideRoundedRect(x: number, y: number, inset: number, radius: number): boolean {
  const min = inset;
  const max = 1 - inset;
  if (x < min || x > max || y < min || y > max) return false;
  const cx = Math.min(Math.max(x, min + radius), max - radius);
  const cy = Math.min(Math.max(y, min + radius), max - radius);
  return Math.hypot(x - cx, y - cy) <= radius;
}

/**
 * Shades one point in unit space. `maskable` paints a full-bleed background
 * and keeps the gem inside the 80% safe zone.
 */
function shade(x: number, y: number, maskable: boolean): Rgba {
  let color: Rgba = [0, 0, 0, 0];
  const backgroundInside = maskable || insideRoundedRect(x, y, 0.02, 0.22);
  if (backgroundInside) {
    color = gradient([[0, hex('#e9fdff')], [0.45, hex('#7ddfff')], [1, hex('#2b7cff')]], y);
    // Soft glass sheen across the top.
    const sheen = Math.max(0, 1 - Math.hypot((x - 0.3) / 0.55, (y - 0.08) / 0.32));
    color = over(color, [255, 255, 255, 0.55 * sheen]);
    // Candy-green glow at the bottom.
    const glow = Math.max(0, 1 - Math.hypot((x - 0.5) / 0.6, (y - 1.05) / 0.35));
    color = over(color, hex('#7bf28d', 0.55 * glow));
  }

  const scale = maskable ? 0.62 : 0.78;
  const gx = (x - 0.5) / scale + 0.5;
  const gy = (y - 0.5) / scale + 0.5;
  const gem: Point[] = [[0.5, 0.06], [0.93, 0.38], [0.5, 0.95], [0.07, 0.38]];
  const point: Point = [gx, gy];
  const edge = distanceToPolygonEdge(point, gem);

  // Drop shadow under the gem.
  const shadowPoint: Point = [gx, gy - 0.035];
  if (insidePolygon(shadowPoint, gem)) color = over(color, [10, 70, 140, 0.22]);

  if (insidePolygon(point, gem)) {
    const crown = gy < 0.38;
    let fill = crown
      ? gradient([[0.06, hex('#ffffff')], [0.38, hex('#b9f4ff')]], gy)
      : gradient([[0.38, hex('#4fd8ff')], [0.95, hex('#1b5fe0')]], gy);
    // Facets: darken the right half of the pavilion, lighten the left crown.
    if (!crown && gx > 0.5) fill = mix(fill, hex('#163f9e'), 0.28);
    if (crown && gx < 0.5) fill = mix(fill, hex('#ffffff'), 0.35);
    // Table line.
    if (Math.abs(gy - 0.38) < 0.012) fill = mix(fill, hex('#ffffff'), 0.8);
    // Inner glint.
    const glint = Math.max(0, 1 - Math.hypot((gx - 0.36) / 0.09, (gy - 0.24) / 0.05));
    fill = mix(fill, hex('#ffffff'), glint * 0.9);
    color = over(color, fill);
  }

  // White stroke.
  const stroke = 0.035;
  if (edge < stroke) color = over(color, [255, 255, 255, Math.min(1, (stroke - edge) / 0.004)]);

  // Sparkle at the top right of the gem.
  const sx = gx - 0.8;
  const sy = gy - 0.16;
  const sparkle = Math.abs(sx) * Math.abs(sy) < 0.0006 && Math.hypot(sx, sy) < 0.1;
  if (sparkle) color = over(color, [255, 255, 255, 0.95]);

  return color;
}

function render(size: number, maskable: boolean): Uint8Array {
  const pixels = new Uint8Array(size * size * 4);
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const acc = [0, 0, 0, 0];
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const c = shade((px + (sx + 0.5) / SUPERSAMPLE) / size, (py + (sy + 0.5) / SUPERSAMPLE) / size, maskable);
          acc[0] += c[0] * c[3];
          acc[1] += c[1] * c[3];
          acc[2] += c[2] * c[3];
          acc[3] += c[3];
        }
      }
      const n = SUPERSAMPLE * SUPERSAMPLE;
      const offset = (py * size + px) * 4;
      const alpha = acc[3] / n;
      pixels[offset] = alpha ? Math.round(acc[0] / acc[3]) : 0;
      pixels[offset + 1] = alpha ? Math.round(acc[1] / acc[3]) : 0;
      pixels[offset + 2] = alpha ? Math.round(acc[2] / acc[3]) : 0;
      pixels[offset + 3] = Math.round(alpha * 255);
    }
  }
  return pixels;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), Buffer.from(data)]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(size: number, rgba: Uint8Array): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8; // bit depth
  header[9] = 6; // RGBA
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    Buffer.from(rgba.buffer, y * size * 4, size * 4).copy(raw, y * (size * 4 + 1) + 1);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ]);
}

const ICONS: Array<{ file: string; size: number; maskable: boolean }> = [
  { file: 'icon-192.png', size: 192, maskable: false },
  { file: 'icon-512.png', size: 512, maskable: false },
  { file: 'icon-maskable-512.png', size: 512, maskable: true },
  { file: 'apple-touch-icon.png', size: 180, maskable: true },
  { file: 'favicon-32.png', size: 32, maskable: false },
];

mkdirSync(OUT_DIR, { recursive: true });
for (const icon of ICONS) {
  const png = encodePng(icon.size, render(icon.size, icon.maskable));
  writeFileSync(join(OUT_DIR, icon.file), png);
  console.log(`wrote public/icons/${icon.file} (${png.length} bytes)`);
}
