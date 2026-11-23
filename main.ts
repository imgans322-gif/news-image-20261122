// The World in One Image — Sunday 22 November 2026.
// A front-page poster of the day's biggest stories, drawn pixel by pixel
// with a small software rasteriser and a 5x7 bitmap font, then written as
// a PNG to $MAKEFUN_OUTPUT_DIR/entry.png (the grader's /output).
// No network, no clock, no randomness: two runs write the same bytes.
//
// The day (22 Nov 2026), as reported that day:
//  - COP31 climate talks in Antalya, Turkey end in collapse: the summit
//    closes with no agreement after the EU rejects a final text that
//    never mentions fossil fuels, two days past its deadline.
//  - Suspected Ukrainian sea drones strike a Russian warship at the
//    Benghazi naval base in Libya; a second ship is also reported hit.
//  - A Russian strike partly collapses a block of flats in Dymer, near
//    Kyiv: two killed, and rescuers search the rubble for the missing.
//  - Mexican special forces capture cartel boss "El Chapo Isidro" in
//    Sinaloa after a raid and firefight that leave 11 people dead.
//  - US Democrats secure at least 258 House seats, their largest
//    majority since 1992, after flipping a North Carolina seat.
//  Ticker: Europe and Japan's BepiColombo probe enters orbit around
//  Mercury; Rohingya welcome the World Court genocide verdict; an
//  Indonesia candy-factory fire leaves 3 dead and dozens missing; 24
//  die as a boat capsizes in Nigeria.
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { deflateSync } from "node:zlib";

const W = 1024, H = 1024;
const px = new Uint8Array(W * H * 3);

// ---------------------------------------------------------------- raster --
function setPx(x, y, c) {
  if (x < 0 || y < 0 || x >= W || y >= H) return;
  const i = (y * W + x) * 3;
  px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2];
}
function fillRect(x, y, w, h, c) {
  for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) setPx(i, j, c);
}
function fillCircle(cx, cy, rad, c) {
  for (let j = cy - rad; j <= cy + rad; j++) for (let i = cx - rad; i <= cx + rad; i++) {
    const dx = i - cx, dy = j - cy;
    if (dx * dx + dy * dy <= rad * rad) setPx(i, j, c);
  }
}
function ring(cx, cy, rad, thick, c) {
  for (let j = cy - rad - thick; j <= cy + rad + thick; j++)
    for (let i = cx - rad - thick; i <= cx + rad + thick; i++) {
      const d = Math.sqrt((i - cx) * (i - cx) + (j - cy) * (j - cy));
      if (d >= rad - thick && d <= rad + thick) setPx(i, j, c);
    }
}
function line(x0, y0, x1, y1, c, thick = 1) {
  const dx = x1 - x0, dy = y1 - y0, steps = Math.max(Math.abs(dx), Math.abs(dy), 1);
  for (let s = 0; s <= steps; s++) {
    const x = Math.round(x0 + (dx * s) / steps), y = Math.round(y0 + (dy * s) / steps);
    for (let a = 0; a < thick; a++) for (let b = 0; b < thick; b++) setPx(x + a, y + b, c);
  }
}
function fillPoly(pts, c) {
  let minY = Infinity, maxY = -Infinity;
  for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
  for (let y = Math.ceil(minY); y <= Math.floor(maxY); y++) {
    const xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length];
      if ((y1 <= y && y2 > y) || (y2 <= y && y1 > y)) xs.push(x1 + ((y - y1) / (y2 - y1)) * (x2 - x1));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.ceil(xs[k]); x <= xs[k + 1]; x++) setPx(x, y, c);
  }
}

// ------------------------------------------------------------- 5x7 font --
const FONT = {
  A: [".###.", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  B: ["####.", "#...#", "#...#", "####.", "#...#", "#...#", "####."],
  C: [".####", "#....", "#....", "#....", "#....", "#....", ".####"],
  D: ["####.", "#...#", "#...#", "#...#", "#...#", "#...#", "####."],
  E: ["#####", "#....", "#....", "####.", "#....", "#....", "#####"],
  F: ["#####", "#....", "#....", "####.", "#....", "#....", "#...."],
  G: [".####", "#....", "#....", "#.###", "#...#", "#...#", ".###."],
  H: ["#...#", "#...#", "#...#", "#####", "#...#", "#...#", "#...#"],
  I: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "#####"],
  J: ["..###", "...#.", "...#.", "...#.", "...#.", "#..#.", ".##.."],
  K: ["#...#", "#..#.", "#.#..", "##...", "#.#..", "#..#.", "#...#"],
  L: ["#....", "#....", "#....", "#....", "#....", "#....", "#####"],
  M: ["#...#", "##.##", "#.#.#", "#.#.#", "#...#", "#...#", "#...#"],
  N: ["#...#", "##..#", "#.#.#", "#..##", "#...#", "#...#", "#...#"],
  O: [".###.", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  P: ["####.", "#...#", "#...#", "####.", "#....", "#....", "#...."],
  Q: [".###.", "#...#", "#...#", "#...#", "#.#.#", "#..#.", ".##.#"],
  R: ["####.", "#...#", "#...#", "####.", "#.#..", "#..#.", "#...#"],
  S: [".####", "#....", "#....", ".###.", "....#", "....#", "####."],
  T: ["#####", "..#..", "..#..", "..#..", "..#..", "..#..", "..#.."],
  U: ["#...#", "#...#", "#...#", "#...#", "#...#", "#...#", ".###."],
  V: ["#...#", "#...#", "#...#", "#...#", "#...#", ".#.#.", "..#.."],
  W: ["#...#", "#...#", "#...#", "#.#.#", "#.#.#", "##.##", "#...#"],
  X: ["#...#", ".#.#.", "..#..", "..#..", "..#..", ".#.#.", "#...#"],
  Y: ["#...#", "#...#", ".#.#.", "..#..", "..#..", "..#..", "..#.."],
  Z: ["#####", "....#", "...#.", "..#..", ".#...", "#....", "#####"],
  "0": [".###.", "#..##", "#.#.#", "##..#", "#...#", "#...#", ".###."],
  "1": ["..#..", ".##..", "..#..", "..#..", "..#..", "..#..", "#####"],
  "2": [".###.", "#...#", "....#", "..##.", ".#...", "#....", "#####"],
  "3": ["####.", "....#", "....#", ".###.", "....#", "....#", "####."],
  "4": ["...#.", "..##.", ".#.#.", "#..#.", "#####", "...#.", "...#."],
  "5": ["#####", "#....", "####.", "....#", "....#", "#...#", ".###."],
  "6": [".###.", "#....", "#....", "####.", "#...#", "#...#", ".###."],
  "7": ["#####", "....#", "...#.", "..#..", "..#..", "..#..", "..#.."],
  "8": [".###.", "#...#", "#...#", ".###.", "#...#", "#...#", ".###."],
  "9": [".###.", "#...#", "#...#", ".####", "....#", "....#", ".###."],
  " ": [".....", ".....", ".....", ".....", ".....", ".....", "....."],
  ".": [".....", ".....", ".....", ".....", ".....", ".##..", ".##.."],
  ",": [".....", ".....", ".....", ".....", ".##..", ".##..", ".#..."],
  "'": ["..#..", "..#..", ".#...", ".....", ".....", ".....", "....."],
  "-": [".....", ".....", ".....", "#####", ".....", ".....", "....."],
  ":": [".....", ".##..", ".##..", ".....", ".##..", ".##..", "....."],
  "!": ["..#..", "..#..", "..#..", "..#..", "..#..", ".....", "..#.."],
  "?": [".###.", "#...#", "....#", "..##.", "..#..", ".....", "..#.."],
  "%": ["##..#", "##.#.", "....#", "...#.", "..#..", ".#...", "#..##"],
  "/": ["....#", "....#", "...#.", "..#..", ".#...", "#....", "#...."],
  "+": [".....", "..#..", "..#..", "#####", "..#..", "..#..", "....."],
  "(": ["...##", "..#..", ".#...", ".#...", ".#...", "..#..", "...##"],
  ")": ["##...", "..#..", "...#.", "...#.", "...#.", "..#..", "##..."],
  "&": [".##..", "#..#.", "#.#..", ".#...", "#.#.#", "#..#.", ".##.#"],
};

function textWidth(str, s, bold = false) {
  if (!str.length) return 0;
  return str.length * 6 * s - s + (bold ? s : 0);
}
function drawText(str, x, y, s, c, bold = false) {
  let cx = x;
  for (const ch of str.toUpperCase()) {
    const glyph = FONT[ch] || FONT[" "];
    for (let row = 0; row < 7; row++)
      for (let col = 0; col < 5; col++)
        if (glyph[row][col] === "#") {
          fillRect(cx + col * s, y + row * s, s, s, c);
          if (bold) fillRect(cx + col * s + Math.max(1, s >> 1), y + row * s, s, s, c);
        }
    cx += 6 * s;
  }
  return cx - x;
}
function drawCentered(str, cx, y, s, c, bold = false) {
  return drawText(str, Math.round(cx - textWidth(str, s, bold) / 2), y, s, c, bold);
}
// Word-wrap inside maxW; returns the y just past the last line drawn.
function drawWrapped(str, x, y, maxW, s, c, lineGap = 2, bold = false) {
  const words = str.toUpperCase().split(" ");
  let cur = "", cy = y;
  const flush = () => { if (cur) { drawText(cur, x, cy, s, c, bold); cy += (7 + lineGap) * s; cur = ""; } };
  for (const w of words) {
    const trial = cur ? cur + " " + w : w;
    if (textWidth(trial, s, bold) <= maxW) cur = trial;
    else { flush(); cur = w; }
  }
  flush();
  return cy;
}

// -------------------------------------------------------------- palette --
const PAPER = [247, 243, 234];
const INK = [18, 26, 38];
const RED = [176, 32, 40];
const BLUE = [28, 78, 142];
const GREEN = [22, 110, 72];
const GOLD = [196, 138, 20];
const GREY = [96, 104, 116];
const PANEL = [255, 253, 247];
const WHITE = [255, 255, 255];

fillRect(0, 0, W, H, PAPER);

// ------------------------------------------------------------- masthead --
fillRect(0, 0, W, 10, RED);
drawCentered("THE WORLD IN ONE IMAGE", W / 2, 28, 4, GREY, true);
drawCentered("SUNDAY 22 NOVEMBER 2026", W / 2, 66, 7, INK, true);
fillRect(48, 128, W - 96, 4, INK);
fillRect(48, 138, W - 96, 2, INK);

// ---------------------------------------------------------------- lead --
// A blue disc holding a white globe, cracked down the middle.
fillCircle(888, 282, 96, BLUE);
ring(888, 282, 68, 4, WHITE);
line(820, 282, 956, 282, WHITE, 3);
line(888, 214, 888, 350, WHITE, 3);
line(852, 232, 880, 268, PAPER, 7);
line(880, 268, 862, 300, PAPER, 7);
line(862, 300, 890, 330, PAPER, 7);

drawText("CLIMATE SUMMIT - ANTALYA, TURKEY", 48, 158, 4, RED, true);
drawText("COP31 TALKS", 48, 198, 10, INK, true);
drawText("COLLAPSE", 48, 288, 10, INK, true);
drawWrapped(
  "The UN climate summit ends with no deal after the EU rejects a text that never mentions fossil fuels.",
  48, 384, 700, 3, INK, 2
);
fillRect(48, 472, W - 96, 3, INK);

// -------------------------------------------------------------- panels --
function panel(x, y, w, h, accent) {
  fillRect(x, y, w, h, PANEL);
  fillRect(x, y, w, 6, accent);
  fillRect(x, y, 2, h, [214, 208, 196]);
  fillRect(x + w - 2, y, 2, h, [214, 208, 196]);
  fillRect(x, y + h - 2, w, 2, [214, 208, 196]);
}
// Panel frame: icon top-left, kicker beside it, headline, then caption.
function story(x, y, accent, kicker, headline, caption) {
  panel(x, y, 452, 228, accent);
  drawText(kicker, x + 88, y + 26, 3, accent, true);
  drawWrapped(headline, x + 20, y + 74, 412, 4, INK, 2, true);
  drawWrapped(caption, x + 20, y + 158, 412, 3, INK, 2);
}

// Panel 1: Benghazi sea drones — a ship and a small drone above it.
{
  const x = 48, y = 488;
  story(x, y, BLUE, "LIBYA - BENGHAZI", "SEA DRONES HIT RUSSIAN WARSHIP",
    "A vessel is hit at Benghazi naval base.");
  fillPoly([[x + 16, y + 44], [x + 76, y + 44], [x + 66, y + 58], [x + 26, y + 58]], INK);
  fillRect(x + 30, y + 34, 22, 10, BLUE);
  line(x + 30, y + 16, x + 62, y + 16, INK, 3);
  line(x + 46, y + 8, x + 46, y + 24, INK, 3);
  fillCircle(x + 26, y + 8, 4, RED);
  fillCircle(x + 66, y + 8, 4, RED);
  fillCircle(x + 26, y + 24, 4, RED);
  fillCircle(x + 66, y + 24, 4, RED);
}
// Panel 2: Kyiv flats — a tower block with a cracked corner.
{
  const x = 524, y = 488;
  story(x, y, RED, "UKRAINE", "FLATS BLOCK HIT NEAR KYIV",
    "Two killed as rescuers search the rubble.");
  fillRect(x + 24, y + 14, 46, 54, GREY);
  for (let r = 0; r < 3; r++) for (let cix = 0; cix < 3; cix++)
    fillRect(x + 31 + cix * 13, y + 21 + r * 15, 8, 9, GOLD);
  fillPoly([[x + 52, y + 14], [x + 70, y + 14], [x + 70, y + 32], [x + 60, y + 26], [x + 64, y + 40], [x + 52, y + 36]], PAPER);
  line(x + 70, y + 44, x + 78, y + 56, RED, 4);
  line(x + 62, y + 52, x + 72, y + 66, RED, 4);
}
// Panel 3: Mexico cartel boss — a star badge.
{
  const x = 48, y = 728;
  story(x, y, GREEN, "MEXICO - SINALOA", "EL CHAPO ISIDRO CAPTURED",
    "Raid firefight leaves 11 people dead.");
  const cx = x + 46, cy = y + 40;
  const star = [];
  for (let i = 0; i < 10; i++) {
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const rad = i % 2 === 0 ? 27 : 12;
    star.push([Math.round(cx + rad * Math.cos(ang)), Math.round(cy + rad * Math.sin(ang))]);
  }
  fillPoly(star, GOLD);
  ring(cx, cy, 30, 2, INK);
}
// Panel 4: US House — a capitol dome on columns.
{
  const x = 524, y = 728;
  story(x, y, BLUE, "US POLITICS", "DEMOCRATS WIN BIG HOUSE MAJORITY",
    "At least 258 seats, a best since 1992.");
  fillCircle(x + 46, y + 34, 17, BLUE);
  fillRect(x + 29, y + 34, 34, 5, BLUE);
  fillRect(x + 44, y + 12, 4, 8, BLUE);
  for (let i = 0; i < 4; i++) fillRect(x + 24 + i * 13, y + 44, 6, 16, BLUE);
  fillRect(x + 18, y + 62, 56, 5, BLUE);
}

// -------------------------------------------------------------- ticker --
fillRect(0, 968, W, 56, INK);
drawCentered("BEPICOLOMBO ENTERS ORBIT AROUND MERCURY + ROHINGYA WELCOME WORLD COURT VERDICT", W / 2, 978, 2, WHITE, false);
drawCentered("INDONESIA FACTORY FIRE: 3 DEAD, DOZENS MISSING + 24 DEAD AS BOAT CAPSIZES IN NIGERIA", W / 2, 1000, 2, WHITE, false);

// ------------------------------------------------------------- PNG out --
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
const raw = Buffer.alloc((W * 3 + 1) * H);
for (let y = 0; y < H; y++) {
  raw[y * (W * 3 + 1)] = 0;
  Buffer.from(px.buffer, y * W * 3, W * 3).copy(raw, y * (W * 3 + 1) + 1);
}
const ihdr = Buffer.alloc(13);
ihdr.writeUInt32BE(W, 0);
ihdr.writeUInt32BE(H, 4);
ihdr[8] = 8; // bit depth
ihdr[9] = 2; // colour type: truecolour RGB
const png = Buffer.concat([
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
  chunk("IHDR", ihdr),
  chunk("IDAT", deflateSync(raw, { level: 9 })),
  chunk("IEND", Buffer.alloc(0)),
]);
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "/output";
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "entry.png"), png);
