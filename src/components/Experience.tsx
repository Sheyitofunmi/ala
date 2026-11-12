"use client";

import dynamic from "next/dynamic";
import Lenis from "lenis";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { COPY, type Lang } from "@/lib/copy";
import { sound } from "@/lib/sound";
import { CHAPTERS, stage } from "@/lib/stage";
import { ClothDefs, FigureAdire, FigureAlaari, FigureSanyan, Piece } from "./Figures";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

const INDEX_NO = ["—", "00", "01", "02", "03", "04", "—", "—"];

/** Chapters are a continuous field, not eight slides: colour moves with scroll. */
const hex = (h: string): [number, number, number] => [
  parseInt(h.slice(1, 3), 16),
  parseInt(h.slice(3, 5), 16),
  parseInt(h.slice(5, 7), 16),
];
const mix = (a: string, b: string, k: number) => {
  const A = hex(a), B = hex(b);
  // mixing through the square of each channel keeps the midpoint from going muddy
  const ch = (i: number) => Math.round(Math.sqrt(A[i] * A[i] * (1 - k) + B[i] * B[i] * k));
  return `rgb(${ch(0)} ${ch(1)} ${ch(2)})`;
};
const LOOK_IDS = ["ala", "alaari", "adire", "sanyan"];

const useStage = () => useSyncExternalStore(stage.subscribe, stage.get, stage.get);

function Cursor() {
  const el = useRef<HTMLDivElement>(null);
  const { grabbing, near } = useStage();
  useEffect(() => {
    const move = (e: PointerEvent) => {
      if (e.pointerType === "touch" || !el.current) return;
      el.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      el.current.dataset.on = "1";
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, []);
  return (
    <div ref={el} className="cursor" data-state={grabbing ? "hold" : near ? "near" : "idle"} aria-hidden>
      <i />
      <span>{grabbing ? "Holding" : "Hold"}</span>
    </div>
  );
}

/** The loom is warped before anything is woven: a count, then the cloth drops in. */
function Loader({ lang, ready }: { lang: Lang; ready: boolean }) {
  const [pct, setPct] = useState(0);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    // Time-based, so a slow first frame never leaves anyone staring at a number.
    const start = performance.now();
    const FULL = new URLSearchParams(location.search).has("nointro") ? 1 : 1500;
    let raf = 0;
    const tick = (now: number) => {
      const k = Math.min(1, (now - start) / FULL);
      const eased = 1 - Math.pow(1 - k, 2.2);
      const v = Math.min(ready ? 100 : 92, eased * 100);
      setPct(Math.round(v));
      if (v >= 99.5) {
        setTimeout(() => setGone(true), 650);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [ready]);

  return (
    <div className="loader" data-gone={gone ? "1" : "0"} aria-hidden={gone}>
      <div className="loader-warp" />
      <p className="loader-mark">ÀLÀ</p>
      <p className="loader-pct">
        <b>{String(pct).padStart(3, "0")}</b>
        <span>{COPY[lang].loading}</span>
      </p>
      <div className="loader-rule">
        <i style={{ transform: `scaleX(${pct / 100})` }} />
      </div>
    </div>
  );
}

type FormState = "idle" | "sending" | "sent" | "failed";

function Fitting({ lang, onClose }: { lang: Lang; onClose: () => void }) {
  const t = COPY[lang].form;
  const [state, setState] = useState<FormState>("idle");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const first = useRef<HTMLInputElement>(null);

  useEffect(() => {
    first.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const body = {
      name: String(data.get("name") ?? ""),
      email: String(data.get("email") ?? ""),
      message: String(data.get("message") ?? ""),
      company: String(data.get("company") ?? ""),
    };
    const next: Record<string, string> = {};
    if (!body.name.trim()) next.name = t.required;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(body.email)) next.email = body.email ? t.badEmail : t.required;
    if (!body.message.trim()) next.message = t.required;
    setErrors(next);
    if (Object.keys(next).length) return;

    setState("sending");
    try {
      const res = await fetch("/api/fitting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setState(res.ok ? "sent" : "failed");
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="sheet" role="dialog" aria-modal="true" aria-label={COPY[lang].yours.fitting}>
      <button className="sheet-veil" onClick={onClose} aria-label={t.close} />
      <form className="sheet-body" onSubmit={submit} noValidate>
        <p className="no">
          {COPY[lang].yours.fitting} <i /> <span>{COPY[lang].yours.gloss}</span>
        </p>
        {state === "sent" ? (
          <p className="prose big sheet-done">{t.sent}</p>
        ) : (
          <>
            <label>
              <span>{t.name}</span>
              <input ref={first} name="name" autoComplete="name" aria-invalid={!!errors.name} />
              {errors.name && <em>{errors.name}</em>}
            </label>
            <label>
              <span>{t.email}</span>
              <input name="email" type="email" inputMode="email" autoComplete="email" aria-invalid={!!errors.email} />
              {errors.email && <em>{errors.email}</em>}
            </label>
            <label>
              <span>{t.message}</span>
              <textarea name="message" rows={3} placeholder={t.placeholder} aria-invalid={!!errors.message} />
              {errors.message && <em>{errors.message}</em>}
            </label>
            <label className="trap" aria-hidden>
              Company
              <input name="company" tabIndex={-1} autoComplete="off" />
            </label>
            <div className="acts">
              <button type="submit" disabled={state === "sending"}>
                {state === "sending" ? t.sending : t.send}
              </button>
              <button type="button" className="quiet" onClick={onClose}>
                {t.close}
              </button>
            </div>
            {state === "failed" && <p className="sheet-err">{t.failed}</p>}
          </>
        )}
      </form>
    </div>
  );
}

export default function Experience() {
  const { chapter, held, ready, grabbing, piece } = useStage();
  const track = useRef<HTMLDivElement>(null);
  const lenis = useRef<Lenis | null>(null);
  const [lang, setLang] = useState<Lang>("en");
  const [audio, setAudio] = useState(false);
  const [note, setNote] = useState(false);
  const [form, setForm] = useState(false);
  const [firstMark, setFirstMark] = useState(false);
  const marked = useRef(false);
  const ch = CHAPTERS[chapter];
  const id = ch.id;
  const t = COPY[lang];

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const l = new Lenis({ autoRaf: true, lerp: reduce ? 1 : 0.09, smoothWheel: !reduce });
    lenis.current = l;
    const root = document.documentElement;
    const onScroll = () => {
      const els = track.current?.children;
      if (!els) return;
      const mid = window.scrollY + window.innerHeight * 0.5;
      let c = 0;
      for (let i = 0; i < els.length; i++) if ((els[i] as HTMLElement).offsetTop <= mid) c = i;

      // how far through this chapter we are, so the colour can travel with us
      const here = els[c] as HTMLElement;
      const frac = Math.min(1, Math.max(0, (mid - here.offsetTop) / here.offsetHeight));
      const next = CHAPTERS[Math.min(CHAPTERS.length - 1, c + 1)];
      const cur = CHAPTERS[c];
      // the field only starts turning in the last third of a chapter
      const k = Math.max(0, (frac - 0.62) / 0.38);
      const e = k * k * (3 - 2 * k);
      root.style.setProperty("--bg", mix(cur.bg, next.bg, e));
      root.style.setProperty("--fg", mix(cur.fg, next.fg, e));
      root.style.setProperty("--accent", mix(cur.accent, next.accent, e));
      // words step aside while the field turns
      root.style.setProperty("--edge", String(Math.min(1, e * 1.7)));
      stage.set({ chapter: c });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      l.destroy();
    };
  }, []);

  useEffect(() => {
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", ch.bg);
  }, [ch]);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  // the loom knocks once each time the cloth is re-pinned
  useEffect(() => {
    sound.pin();
  }, [chapter, piece]);

  // the first time anyone leaves a mark, say so once and never again
  useEffect(() => {
    if (held < 1 || marked.current) return;
    marked.current = true;
    setFirstMark(true);
    const t = setTimeout(() => setFirstMark(false), 5200);
    return () => clearTimeout(t);
  }, [held]);

  const go = useCallback((i: number) => {
    const el = track.current?.children[i] as HTMLElement | undefined;
    if (!el) return;
    const y = el.offsetTop + (i === 0 ? 0 : el.offsetHeight * 0.3);
    if (lenis.current) lenis.current.scrollTo(y, { duration: 1.6 });
    else window.scrollTo({ top: y });
  }, []);

  const look = LOOK_IDS.includes(id) ? t.looks[id] : undefined;

  return (
    <main className="stage" data-chapter={id} data-ready={ready ? "1" : "0"} data-holding={grabbing ? "1" : "0"}>
      <ClothDefs />

      {/* everything here lives behind the cloth */}
      <div className="back">
        <div className={`wordmark ${id === "curtain" ? "on" : ""}`} aria-hidden>
          <span>À</span>
          <span>L</span>
          <span>À</span>
        </div>
        {LOOK_IDS.map((k) => (
          <div key={k} className={`title title-${k} ${id === k ? "on" : ""}`} aria-hidden>
            <span>{t.looks[k].name}</span>
          </div>
        ))}
        <div className={`title title-tuntun ${id === "tuntun" ? "on" : ""}`} aria-hidden>
          <span>Tuntun</span>
        </div>
        <div className={`title title-yours ${id === "yours" ? "on" : ""}`} aria-hidden>
          <span>{String(held).padStart(2, "0")}</span>
        </div>

        <figure className={`figure figure-alaari ${id === "alaari" ? "on" : ""}`}><FigureAlaari /></figure>
        <figure className={`figure figure-adire ${id === "adire" ? "on" : ""}`}><FigureAdire /></figure>
        <figure className={`figure figure-sanyan ${id === "sanyan" ? "on" : ""}`}><FigureSanyan /></figure>
      </div>

      <div className="gl">
        <Scene />
      </div>

      <div className="front">
        <header className="bar">
          <button className="mark" onClick={() => go(0)} aria-label="ÀLÀ">
            ÀLÀ
          </button>
          <p className="bar-mid">{t.collection}</p>
          <div className="bar-end">
            <button
              className="switch"
              onClick={() => setAudio(sound.toggle())}
              aria-pressed={audio}
              title={t.sound[audio ? 1 : 0]}
            >
              <span className="sr">{t.sound[audio ? 1 : 0]}</span>
              <i className="bars" data-on={audio ? "1" : "0"} aria-hidden>
                <b /><b /><b /><b />
              </i>
            </button>
            <button className="switch lang" onClick={() => setLang(lang === "en" ? "yo" : "en")}>
              {t.langLabel}
            </button>
            <p className="held" aria-live="polite">
              {t.held} <b>{String(held).padStart(2, "0")}</b>×
            </p>
          </div>
        </header>

        <section className={`hero ${id === "curtain" ? "on" : ""}`} aria-hidden={id !== "curtain"}>
          <h1>
            <span className="sr">ÀLÀ. </span>
            {t.tagline[0]}
            <em>{t.tagline[1]}</em>
          </h1>
          <p className="hero-sub">{t.sub}</p>
          <p className="hint">
            <span>{t.hintHold}</span>
            <span>{t.hintScroll}</span>
          </p>
        </section>

        {look && (
          <article key={id + lang} className={`card card-${id}`}>
            <p className="no">
              {look.no} <i /> <span>{look.gloss}</span>
            </p>
            <h2 className="sr">{look.name}</h2>
            <p className="prose">{look.prose}</p>
            <dl>
              {look.specs.map(([a, b]) => (
                <div key={a}>
                  <dt>{a}</dt>
                  <dd>{b}</dd>
                </div>
              ))}
            </dl>
          </article>
        )}

        {id === "tuntun" && (
          <article className="card card-tuntun">
            <p className="no">
              {t.tuntun.no} <i /> <span>{t.tuntun.gloss}</span>
            </p>
            <h2 className="sr">Tuntun</h2>
            <p className="prose">{t.tuntun.prose}</p>
            <ul className="pieces">
              {t.tuntun.pieces.map((p, i) => (
                <li key={p.name}>
                  <button className={i === piece ? "on" : ""} onClick={() => stage.set({ piece: i })} aria-pressed={i === piece}>
                    <Piece i={i} />
                    <b>{p.name}</b>
                    <small>{p.note}</small>
                  </button>
                </li>
              ))}
            </ul>
          </article>
        )}

        {id === "weave" && (
          <article className="card card-weave">
            <p className="no">
              {t.weave.title} <i /> <span>{t.weave.gloss}</span>
            </p>
            <p className="prose big">{t.weave.big}</p>
            <p className="prose">{t.weave.small}</p>
            <dl>
              {t.weave.specs.map(([a, b]) => (
                <div key={a}>
                  <dt>{a}</dt>
                  <dd>{b}</dd>
                </div>
              ))}
            </dl>
          </article>
        )}

        {id === "yours" && (
          <article className="card card-yours">
            <p className="no">
              {t.yours.title} <i /> <span>{t.yours.gloss}</span>
            </p>
            <p className="prose big">{held === 0 ? t.yours.empty : t.yours.counted(held)}</p>
            <div className="acts">
              <button onClick={() => setForm(true)}>{t.yours.fitting}</button>
              <button
                className="quiet"
                onClick={() => {
                  stage.sim?.rinse();
                  stage.set({ held: 0 });
                }}
              >
                {t.yours.wash}
              </button>
            </div>
            <button className="note-toggle" onClick={() => setNote((n) => !n)} aria-expanded={note}>
              {note ? "—" : "+"} <span>{t.yours.gloss}</span>
            </button>
            <p className={`note ${note ? "on" : ""}`}>
              <span>{t.yours.note}</span>
            </p>
            <p className="credit">
              {t.yours.credit} <a href="https://seyidev.com" target="_blank" rel="noreferrer">seyidev.com</a>
            </p>
          </article>
        )}

        <p className={`mark-note ${firstMark ? "on" : ""}`} aria-live="polite">
          <i />
          {lang === "en" ? "The cloth kept that." : "Aṣọ náà ti pa èyí mọ́."}
        </p>

        <nav className="index" aria-label={t.chapters}>
          {t.index.map((n, i) => (
            <button key={n} className={i === chapter ? "on" : ""} onClick={() => go(i)} aria-current={i === chapter}>
              <span className="l">{n}</span>
              <span className="n">{INDEX_NO[i]}</span>
              <i />
            </button>
          ))}
        </nav>
      </div>

      {form && <Fitting lang={lang} onClose={() => setForm(false)} />}

      <div className="grain" aria-hidden />
      <Loader lang={lang} ready={ready} />
      <Cursor />

      <div className="track" ref={track}>
        {CHAPTERS.map((c) => (
          <div key={c.id} data-id={c.id} />
        ))}
      </div>
    </main>
  );
}
