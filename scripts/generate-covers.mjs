// Generates a 1200×630 cover for every article that has a `cover` block in its frontmatter.
// Output: public/covers/<slug>.png (social sharing) and public/covers/<slug>.webp (on-site).
// Usage: node scripts/generate-covers.mjs
import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load as loadYaml } from 'js-yaml';
import { Resvg } from '@resvg/resvg-js';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const articlesDir = path.join(root, 'src/content/articles');
const outDir = path.join(root, 'public/covers');
const fontDir = path.join(root, 'scripts/fonts');

const W = 1200;
const H = 630;
const SERIF = 'Fraunces 144pt'; // family name inside the static Google Fonts TTF
const SANS = 'Inter';

const PALETTES = {
  lime: { bg: '#d7ff3a', fg: '#0b0b0c', muted: '#3d4a10', accent: '#0b0b0c', bar: '#0b0b0c', track: 'rgba(11,11,12,0.12)', neg: '#ff5a1f' },
  orange: { bg: '#ff5a1f', fg: '#0b0b0c', muted: '#4a1806', accent: '#0b0b0c', bar: '#0b0b0c', track: 'rgba(11,11,12,0.14)', neg: '#0b0b0c' },
  blue: { bg: '#2f5bff', fg: '#f6f3ec', muted: '#c9d4ff', accent: '#d7ff3a', bar: '#d7ff3a', track: 'rgba(246,243,236,0.16)', neg: '#ff5a1f' },
  ink: { bg: '#0b0b0c', fg: '#f6f3ec', muted: '#9a968c', accent: '#d7ff3a', bar: '#d7ff3a', track: 'rgba(246,243,236,0.12)', neg: '#ff5a1f' },
};

const esc = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Greedy word wrap by approximate character width. */
function wrap(text, maxChars, maxLines) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    lines.length = maxLines;
    lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '…');
  }
  return lines;
}

// Chart area: right half of the canvas.
const CX = 650;
const CY = 150;
const CW = 490;
const CH = 380;

function chartTitle(title, p) {
  return `<text x="${CX}" y="${CY}" font-family="${SANS}" font-weight="700" font-size="17" letter-spacing="2.5" fill="${p.muted}">${esc(title.toUpperCase())}</text>`;
}

function bars(chart, p) {
  const items = chart.items;
  const max = Math.max(...items.map((i) => Number(i.value)));
  const rowH = Math.min(110, (CH - 30) / items.length);
  const barH = Math.min(46, rowH - 46);
  return items
    .map((item, i) => {
      const y = CY + 40 + i * rowH;
      const w = Math.max(6, (Number(item.value) / max) * CW);
      return `
      <text x="${CX}" y="${y + 18}" font-family="${SANS}" font-weight="500" font-size="21" fill="${p.fg}">${esc(item.label)}</text>
      <rect x="${CX}" y="${y + 30}" width="${CW}" height="${barH}" rx="6" fill="${p.track}"/>
      <rect x="${CX}" y="${y + 30}" width="${w.toFixed(1)}" height="${barH}" rx="6" fill="${p.bar}"/>
      <text x="${CX + CW}" y="${y + 18}" text-anchor="end" font-family="${SERIF}" font-weight="800" font-size="26" fill="${p.fg}">${esc(item.display)}</text>`;
    })
    .join('');
}

/** Signed changes: bar length = magnitude, colour = sign (growth uses the bar colour, declines the negative one). */
function diverging(chart, p) {
  const items = chart.items;
  const maxAbs = Math.max(...items.map((i) => Math.abs(Number(i.value))));
  const baseX = CX + 200;
  const span = CW - 200 - 90;
  const rowH = (CH - 40) / items.length;
  const barH = Math.min(40, rowH - 30);
  const rows = items
    .map((item, i) => {
      const v = Number(item.value);
      const y = CY + 50 + i * rowH;
      const w = Math.max(4, (Math.abs(v) / maxAbs) * span);
      return `
      <text x="${CX}" y="${y + barH / 2 + 7}" font-family="${SANS}" font-weight="500" font-size="21" fill="${p.fg}">${esc(item.label)}</text>
      <rect x="${baseX}" y="${y}" width="${w.toFixed(1)}" height="${barH}" rx="6" fill="${v < 0 ? p.neg : p.bar}"/>
      <text x="${baseX + w + 12}" y="${y + barH / 2 + 9}" font-family="${SERIF}" font-weight="800" font-size="26" fill="${p.fg}">${esc(item.display)}</text>`;
    })
    .join('');
  return `<line x1="${baseX}" y1="${CY + 35}" x2="${baseX}" y2="${CY + CH}" stroke="${p.fg}" stroke-width="2" opacity="0.4"/>${rows}`;
}

function timeline(chart, p) {
  const items = chart.items;
  const start = Math.min(...items.map((i) => Number(i.from)));
  // Leave room after the last segment so open-ended labels stay inside the canvas.
  const end = Math.max(...items.map((i) => Number(i.to))) + 2;
  const scale = (yr) => CX + ((yr - start) / (end - start)) * CW;
  const rowH = (CH - 60) / items.length;
  const rows = items
    .map((item, i) => {
      const y = CY + 50 + i * rowH;
      const x1 = scale(Number(item.from));
      const x2 = scale(Number(item.to));
      const range = item.open ? `${item.from}–` : `${item.from}–${item.to}`;
      return `
      <text x="${x1}" y="${y + 20}" font-family="${SANS}" font-weight="700" font-size="22" fill="${p.fg}">${esc(item.label)}</text>
      <text x="${x1}" y="${y + 46}" font-family="${SANS}" font-weight="500" font-size="18" fill="${p.muted}">${esc(range)}</text>
      <rect x="${x1}" y="${y + 58}" width="${Math.max(8, x2 - x1).toFixed(1)}" height="20" rx="5" fill="${i === items.length - 1 ? p.bar : p.fg}" fill-opacity="${i === items.length - 1 ? 1 : 0.35}"/>`;
    })
    .join('');
  const ticks = [start, Math.round((start + end) / 2), end]
    .map((yr) => `<text x="${scale(yr)}" y="${CY + CH + 8}" text-anchor="middle" font-family="${SANS}" font-weight="500" font-size="16" fill="${p.muted}">${yr}</text>`)
    .join('');
  return rows + ticks;
}

function clock(chart, p) {
  const [before, after] = chart.items;
  const cx = CX + CW / 2;
  const cy = CY + 40 + (CH - 60) / 2;
  const r = 140;
  const full = Number(before.value);
  const arc = (minutes, radius) => {
    const frac = Math.min(0.9999, Number(minutes) / full);
    const a = frac * 2 * Math.PI - Math.PI / 2;
    const x = cx + radius * Math.cos(a);
    const y = cy + radius * Math.sin(a);
    return `M ${cx} ${cy - radius} A ${radius} ${radius} 0 ${frac > 0.5 ? 1 : 0} 1 ${x.toFixed(1)} ${y.toFixed(1)}`;
  };
  return `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${p.track}" stroke-width="34"/>
    <path d="${arc(full, r)}" fill="none" stroke="${p.fg}" stroke-opacity="0.28" stroke-width="34"/>
    <path d="${arc(after.value, r)}" fill="none" stroke="${p.bar}" stroke-width="34" stroke-linecap="round"/>
    <text x="${cx}" y="${cy - 6}" text-anchor="middle" font-family="${SERIF}" font-weight="800" font-size="44" fill="${p.fg}">${esc(after.display)}</text>
    <text x="${cx}" y="${cy + 28}" text-anchor="middle" font-family="${SANS}" font-weight="500" font-size="19" fill="${p.muted}">${esc(after.label)}</text>
    <text x="${cx}" y="${cy + r + 52}" text-anchor="middle" font-family="${SANS}" font-weight="500" font-size="19" fill="${p.muted}">Full circle = ${esc(before.label)}: ${esc(before.display)}</text>`;
}

const CHARTS = { bars, diverging, timeline, clock };

function coverSvg({ category, tone, cover }) {
  const p = PALETTES[tone] ?? PALETTES.ink;
  const statSize = cover.stat.length > 7 ? 120 : 150;
  const labelLines = wrap(cover.label, 26, 3);
  const lanes = Array.from({ length: 9 }, (_, i) => {
    const x = 70 + i * 140;
    return `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${p.fg}" stroke-opacity="0.05" stroke-width="2"/>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${p.bg}"/>
  ${lanes}
  <text x="60" y="78" font-family="${SANS}" font-weight="700" font-size="20" letter-spacing="3" fill="${p.fg}">${esc(category.toUpperCase())}</text>
  <g transform="translate(${W - 230}, 46)">
    <rect width="40" height="40" rx="9" fill="${p.fg}"/>
    <path d="M9 28 L17 19 L22 24 L32 11" fill="none" stroke="${p.bg === '#0b0b0c' ? '#0b0b0c' : p.bg}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="52" y="31" font-family="${SERIF}" font-weight="800" font-size="34" fill="${p.fg}">hopone</text>
  </g>
  <text x="56" y="${290}" font-family="${SERIF}" font-weight="800" font-size="${statSize}" letter-spacing="-4" fill="${p.fg}">${esc(cover.stat)}</text>
  ${labelLines
    .map((l, i) => `<text x="60" y="${352 + i * 42}" font-family="${SANS}" font-weight="500" font-size="32" fill="${p.fg}">${esc(l)}</text>`)
    .join('')}
  <rect x="60" y="${H - 70}" width="64" height="6" rx="3" fill="${p.accent === p.fg ? p.fg : p.accent}"/>
  <text x="140" y="${H - 61}" font-family="${SANS}" font-weight="500" font-size="18" fill="${p.muted}">The business of running</text>
  ${chartTitle(cover.chart.title, p)}
  ${CHARTS[cover.chart.type](cover.chart, p)}
</svg>`;
}

function parseFrontmatter(src) {
  const m = src.match(/^---\n([\s\S]*?)\n---/);
  return m ? loadYaml(m[1]) : {};
}

const fontFiles = (await readdir(fontDir)).filter((f) => f.endsWith('.ttf')).map((f) => path.join(fontDir, f));
await mkdir(outDir, { recursive: true });

const files = (await readdir(articlesDir)).filter((f) => f.endsWith('.md'));
let count = 0;
for (const file of files) {
  const slug = file.replace(/\.md$/, '');
  const data = parseFrontmatter(await readFile(path.join(articlesDir, file), 'utf8'));
  if (!data.cover) {
    console.warn(`skip ${slug}: no cover block`);
    continue;
  }
  const svg = coverSvg({ category: data.category, tone: data.tone ?? 'ink', cover: data.cover });
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: W },
    font: { fontFiles, loadSystemFonts: false, defaultFontFamily: SANS },
  })
    .render()
    .asPng();
  await writeFile(path.join(outDir, `${slug}.png`), png);
  await sharp(png).webp({ quality: 86 }).toFile(path.join(outDir, `${slug}.webp`));
  count++;
  console.log(`✓ ${slug}`);
}
console.log(`${count} cover(s) written to public/covers/`);
