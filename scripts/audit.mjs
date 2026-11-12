/**
 * Live audit. Walks the deployed site at both desktop and phone size, exercises
 * every interaction, and reports anything broken: console errors, blank
 * chapters, missing copy, overflow, dead controls, failed requests.
 *
 *   node scripts/audit.mjs https://ala-gx12.vercel.app
 */
import { chromium, devices } from "playwright";

const URL = process.argv[2] ?? "http://localhost:3399";
const fails = [];
const notes = [];
const fail = (m) => fails.push(m);
const note = (m) => notes.push(m);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const CHAPTERS = ["curtain", "ala", "alaari", "adire", "sanyan", "tuntun", "weave", "yours"];

async function run(label, opts) {
  const browser = await chromium.launch();
  const ctx = await browser.newContext(opts);
  const page = await ctx.newPage();

  const errors = [];
  page.on("pageerror", (e) => errors.push(`${label}: uncaught — ${e.message}`));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(`${label}: console — ${m.text().slice(0, 160)}`);
  });
  page.on("requestfailed", (r) => {
    const u = r.url();
    if (!u.startsWith("data:")) errors.push(`${label}: request failed — ${u.slice(0, 120)} (${r.failure()?.errorText})`);
  });

  const res = await page.goto(URL, { waitUntil: "networkidle" });
  if (!res || res.status() >= 400) fail(`${label}: page returned ${res?.status()}`);

  // ── the curtain must lift ────────────────────────────────────────────────
  await wait(2600);
  const loaderGone = await page.evaluate(() => document.querySelector(".loader")?.dataset.gone === "1");
  if (!loaderGone) fail(`${label}: loader never cleared`);

  // ── no sideways scroll anywhere ──────────────────────────────────────────
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (overflow > 2) fail(`${label}: page scrolls sideways by ${overflow}px`);

  // ── every chapter must paint something ───────────────────────────────────
  for (let i = 0; i < CHAPTERS.length; i++) {
    await page.evaluate((n) => {
      const t = document.querySelector(".track").children[n];
      // the chapter is picked by the viewport's midpoint, so aim that, not the top
      window.scrollTo(0, t.offsetTop + t.offsetHeight * 0.4 - window.innerHeight * 0.5);
    }, i);
    await wait(2600);

    const state = await page.evaluate(() => {
      const stage = document.querySelector(".stage");
      const css = getComputedStyle(document.documentElement);
      const vis = (el) => {
        if (!el) return 0;
        const s = getComputedStyle(el);
        const m = s.filter.match(/opacity\(([\d.]+)\)/);
        const f = m ? parseFloat(m[1]) : 1;
        return parseFloat(s.opacity) * f;
      };
      const card = document.querySelector(".card");
      const title = document.querySelector(".title.on");
      return {
        chapter: stage?.dataset.chapter,
        bg: css.getPropertyValue("--bg").trim(),
        edge: parseFloat(css.getPropertyValue("--edge")) || 0,
        cardText: card?.innerText?.trim().length ?? 0,
        cardVis: +vis(card).toFixed(2),
        titleVis: +vis(title).toFixed(2),
        hasCanvas: !!document.querySelector(".gl canvas"),
        indexOn: document.querySelectorAll(".index button.on").length,
      };
    });

    if (state.chapter !== CHAPTERS[i]) fail(`${label}/${CHAPTERS[i]}: stage says "${state.chapter}"`);
    if (!state.hasCanvas) fail(`${label}/${CHAPTERS[i]}: no canvas`);
    if (state.indexOn !== 1) fail(`${label}/${CHAPTERS[i]}: ${state.indexOn} chapters marked current`);
    if (i > 0 && state.cardText < 20) fail(`${label}/${CHAPTERS[i]}: card has no copy (${state.cardText} chars)`);
    if (state.cardVis < 0.3) fail(`${label}/${CHAPTERS[i]}: card is ${state.cardVis} visible — reads as blank`);
    if (!state.bg) fail(`${label}/${CHAPTERS[i]}: no background colour set`);
    note(`${label}/${CHAPTERS[i]}: bg ${state.bg} · card ${state.cardVis} · edge ${state.edge.toFixed(2)}`);
  }

  // ── nothing may sit off the right edge ───────────────────────────────────
  const clipped = await page.evaluate(() => {
    const w = window.innerWidth;
    const out = [];
    for (const el of document.querySelectorAll(".card, .bar, .index, .pieces, .hero h1")) {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && (r.right > w + 2 || r.left < -2)) out.push(`${el.className} [${Math.round(r.left)}…${Math.round(r.right)}] of ${w}`);
    }
    return out;
  });
  clipped.forEach((c) => fail(`${label}: clipped horizontally — ${c}`));

  // ── the cloth must respond to being held ─────────────────────────────────
  await page.evaluate(() => {
    const t = document.querySelector(".track").children[0];
    window.scrollTo(0, t.offsetTop);
  });
  await wait(1800);
  const before = await page.evaluate(() => document.querySelector(".held b")?.textContent);
  const box = page.viewportSize();
  let held = before;
  for (const [fx, fy] of [[0.5, 0.45], [0.42, 0.55], [0.58, 0.4]]) {
    await page.mouse.move(box.width * fx, box.height * fy, { steps: 8 });
    await page.mouse.down();
    await page.mouse.move(box.width * (fx + 0.12), box.height * (fy + 0.12), { steps: 14 });
    await page.mouse.up();
    await wait(600);
    held = await page.evaluate(() => document.querySelector(".held b")?.textContent);
    if (held !== before) break;
  }
  if (held === before) fail(`${label}: dragging the cloth never registered (held stayed ${before})`);
  else note(`${label}: held ${before} → ${held}`);

  // ── language ─────────────────────────────────────────────────────────────
  const enText = await page.evaluate(() => document.querySelector(".hero-sub")?.textContent);
  await page.click(".lang");
  await wait(500);
  const yoText = await page.evaluate(() => document.querySelector(".hero-sub")?.textContent);
  const htmlLang = await page.evaluate(() => document.documentElement.lang);
  if (enText === yoText) fail(`${label}: language toggle changed nothing`);
  if (htmlLang !== "yo") fail(`${label}: html lang is "${htmlLang}" after switching to Yorùbá`);
  await page.click(".lang");
  await wait(400);

  // ── sound ────────────────────────────────────────────────────────────────
  await page.click(".switch:not(.lang)");
  await wait(800);
  const pressed = await page.evaluate(() => document.querySelector(".switch:not(.lang)")?.getAttribute("aria-pressed"));
  if (pressed !== "true") fail(`${label}: sound toggle did not turn on (aria-pressed=${pressed})`);
  await page.click(".switch:not(.lang)");
  await wait(400);

  // ── the pieces ───────────────────────────────────────────────────────────
  await page.evaluate(() => {
    const t = document.querySelector(".track").children[5];
    window.scrollTo(0, t.offsetTop + t.offsetHeight * 0.45);
  });
  await wait(1600);
  const count = await page.evaluate(() => document.querySelectorAll(".pieces button").length);
  if (count !== 5) fail(`${label}: expected 5 pieces, found ${count}`);
  for (let i = 0; i < count; i++) {
    await page.evaluate((n) => document.querySelectorAll(".pieces button")[n].click(), i);
    await wait(400);
    const on = await page.evaluate((n) => document.querySelectorAll(".pieces button")[n].getAttribute("aria-pressed"), i);
    if (on !== "true") fail(`${label}: piece ${i} did not become current`);
  }

  // ── the fitting form ─────────────────────────────────────────────────────
  await page.evaluate(() => {
    const t = document.querySelector(".track").children[7];
    window.scrollTo(0, t.offsetTop + t.offsetHeight * 0.45);
  });
  await wait(1600);
  await page.evaluate(() => document.querySelector(".card-yours .acts button")?.click());
  await wait(700);
  if (!(await page.$(".sheet-body"))) {
    fail(`${label}: fitting form never opened`);
  } else {
    // empty submit must be refused, not sent
    await page.evaluate(() => document.querySelector('.sheet-body button[type="submit"]').click());
    await wait(500);
    const errs = await page.evaluate(() => document.querySelectorAll(".sheet-body em").length);
    if (errs < 3) fail(`${label}: empty form showed only ${errs} errors, expected 3`);

    await page.fill('.sheet-body input[name="name"]', "Test Person");
    await page.fill('.sheet-body input[name="email"]', "not-an-email");
    await page.fill(".sheet-body textarea", "A length of àlàárì, for December.");
    await page.evaluate(() => document.querySelector('.sheet-body button[type="submit"]').click());
    await wait(500);
    const badMail = await page.evaluate(() => document.querySelectorAll(".sheet-body em").length);
    if (badMail !== 1) fail(`${label}: a malformed email produced ${badMail} errors, expected 1`);

    await page.fill('.sheet-body input[name="email"]', "test@example.com");
    const [resp] = await Promise.all([
      page.waitForResponse((r) => r.url().includes("/api/fitting"), { timeout: 15000 }).catch(() => null),
      page.evaluate(() => document.querySelector('.sheet-body button[type="submit"]').click()),
    ]);
    if (!resp) fail(`${label}: form submit never reached /api/fitting`);
    else if (!resp.ok()) fail(`${label}: /api/fitting returned ${resp.status()}`);
    else {
      await wait(900);
      const done = await page.evaluate(() => !!document.querySelector(".sheet-done"));
      if (!done) fail(`${label}: form accepted but never confirmed to the visitor`);
      else note(`${label}: fitting form round-trip ok (${resp.status()})`);
    }
    await page.keyboard.press("Escape");
    await wait(400);
    if (await page.$(".sheet-body")) fail(`${label}: Escape did not close the form`);
  }

  // ── keyboard can reach the chapters ──────────────────────────────────────
  const focusable = await page.evaluate(() => {
    const el = document.querySelector(".index button");
    el?.focus();
    const s = getComputedStyle(document.activeElement, ":focus-visible");
    return { tag: document.activeElement?.tagName, outline: s.outlineStyle };
  });
  if (focusable.tag !== "BUTTON") fail(`${label}: chapter buttons are not focusable`);

  errors.forEach(fail);
  await browser.close();
}

await run("desktop", { viewport: { width: 1440, height: 900 } });
await run("phone", { ...devices["iPhone 13"], isMobile: false, hasTouch: false });

console.log("\n──────── notes ────────");
notes.forEach((n) => console.log("  " + n));
console.log(`\n──────── ${fails.length ? `${fails.length} PROBLEM(S)` : "CLEAN"} ────────`);
fails.forEach((f) => console.log("  ✗ " + f));
process.exit(fails.length ? 1 : 0);
