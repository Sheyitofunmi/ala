/**
 * Films the site on real hardware.
 *
 * Playwright drives a GPU-backed Chromium through a choreographed pass — the
 * opening, a drag that stains the cloth, each dye, the pieces tying themselves
 * — and records it. Nothing is sped up or cut afterwards: what the camera sees
 * is the site running.
 *
 *   node scripts/record.mjs <short|long> <vertical|landscape> <outdir> <url>
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const [, , cutArg = "short", frameArg = "vertical", outDir = "./film", url = "http://localhost:3399"] = process.argv;
const long = cutArg === "long";
const vertical = frameArg === "vertical";

// Recorded at half size with a 2× scale factor, so the video is crisp without
// asking the compositor to paint a 1080-wide viewport.
const size = vertical ? { width: 540, height: 960 } : { width: 960, height: 540 };
const video = vertical ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 };

mkdirSync(outDir, { recursive: true });

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

/** Scroll the way a person does: short pushes, not one long slide. */
async function roll(page, distance, ms) {
  const steps = Math.max(1, Math.round(ms / 50));
  const per = distance / steps;
  for (let i = 0; i < steps; i++) {
    await page.mouse.wheel(0, per);
    await wait(50);
  }
}

/** Go to a chapter and let the cloth settle there. */
async function toChapter(page, i, settle) {
  const target = await page.evaluate((n) => {
    const t = document.querySelector(".track").children[n];
    return t.offsetTop + (n === 0 ? 0 : t.offsetHeight * 0.3);
  }, i);
  const from = await page.evaluate(() => window.scrollY);
  await roll(page, target - from, Math.min(2600, Math.max(700, Math.abs(target - from) * 0.55)));
  await wait(settle);
}

/** Take hold of the cloth and pull, so the dye has somewhere to go. */
async function pull(page, from, to, ms = 1400) {
  await page.mouse.move(from.x, from.y, { steps: 12 });
  await wait(260);
  await page.mouse.down();
  const steps = Math.max(2, Math.round(ms / 40));
  for (let i = 1; i <= steps; i++) {
    const k = i / steps;
    const ease = k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    await page.mouse.move(from.x + (to.x - from.x) * ease, from.y + (to.y - from.y) * ease);
    await wait(40);
  }
  await wait(360);
  await page.mouse.up();
  await wait(700);
}

const browser = await chromium.launch({
  headless: false,
  args: [
    "--autoplay-policy=no-user-gesture-required",
    "--force-device-scale-factor=2",
    "--hide-scrollbars",
    "--disable-features=CalculateNativeWinOcclusion",
  ],
});
const context = await browser.newContext({
  viewport: size,
  deviceScaleFactor: 2,
  recordVideo: { dir: outDir, size: video },
  reducedMotion: "no-preference",
});
const page = await context.newPage();
await page.goto(url, { waitUntil: "networkidle" });

const mid = { x: size.width / 2, y: size.height / 2 };
const settle = long ? 2600 : 1500;

// ── the opening: the length falls open on its own ─────────────────────────
await wait(long ? 7000 : 5200);

// the cursor drifts across it, and the cloth leans over to meet the hand
await page.mouse.move(mid.x - 120, mid.y + 40, { steps: 30 });
await page.mouse.move(mid.x + 80, mid.y - 20, { steps: 30 });
await wait(900);

// ── the mark ──────────────────────────────────────────────────────────────
await pull(page, { x: mid.x, y: mid.y }, { x: mid.x + size.width * 0.26, y: mid.y + size.height * 0.2 }, 1600);
if (long) {
  await pull(page, { x: mid.x - 40, y: mid.y - 60 }, { x: mid.x - size.width * 0.22, y: mid.y + size.height * 0.16 }, 1500);
}
await wait(long ? 1800 : 900);

// ── Àlà: the undyed length, given to the air ──────────────────────────────
await toChapter(page, 1, settle + 800);

// ── the three cloths ──────────────────────────────────────────────────────
for (const chapter of [2, 3, 4]) {
  await toChapter(page, chapter, settle);
  if (long) {
    // dwell, and take hold of this one too so the dye lands on every colour
    await pull(page, { x: size.width * 0.8, y: size.height * 0.45 }, { x: size.width * 0.58, y: size.height * 0.66 }, 1200);
    await wait(1200);
  }
}

// ── Tuntun: the cloth ties itself ─────────────────────────────────────────
await toChapter(page, 5, settle);
const pieces = long ? [1, 2, 3, 4, 0] : [2, 3];
for (const p of pieces) {
  await page.evaluate((n) => document.querySelectorAll(".pieces button")[n]?.click(), p);
  await wait(long ? 4200 : 3400);
}

// ── the weave, close enough to count the threads ──────────────────────────
await toChapter(page, 6, settle + 600);

if (long) {
  // the house speaks Yorùbá too
  await page.evaluate(() => document.querySelector(".lang")?.click());
  await wait(3200);
  await page.evaluate(() => document.querySelector(".lang")?.click());
  await wait(1200);
}

// ── Yours: the record of what you did to it ───────────────────────────────
await toChapter(page, 7, settle);
if (long) {
  await page.evaluate(() => {
    const b = [...document.querySelectorAll(".card-yours .acts button")][0];
    b?.click();
  });
  await wait(3600);
  await page.evaluate(() => document.querySelector(".sheet .quiet")?.click());
  await wait(1600);
}
await wait(1600);

await context.close();
await browser.close();
console.log("filmed →", outDir);
