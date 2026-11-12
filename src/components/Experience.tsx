"use client";

import dynamic from "next/dynamic";
import Lenis from "lenis";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { CHAPTERS, PIECES, stage } from "@/lib/stage";
import { ClothDefs, FigureAdire, FigureAlaari, FigureSanyan, Piece } from "./Figures";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

type Look = { no: string; name: string; gloss: string; prose: string; specs: [string, string][] };

const LOOKS: Record<string, Look> = {
  ala: {
    no: "N° 00",
    name: "Àlà",
    gloss: "the white cloth",
    prose:
      "Before the garment there is the length. Two metres forty by one sixty, woven by hand, cut by no one. Everything the house makes begins as this.",
    specs: [["Length", "2.40 m"], ["Width", "1.60 m"], ["Cuts", "0"]],
  },
  alaari: {
    no: "N° 01",
    name: "Àlàárì",
    gloss: "the crimson",
    prose:
      "Strip-woven a hand wide, crimson shot with gold. Worn as ìró and bùbá under a fan-pleated gèlè, with coral at the throat and a fan in the hand.",
    specs: [["Cloth", "Àlàárì"], ["Strips", "24"], ["Worn with", "Gèlè, coral, abẹ̀bẹ̀"]],
  },
  adire: {
    no: "N° 02",
    name: "Àdìrẹ",
    gloss: "the indigo",
    prose:
      "Drawn by hand in paste, then given to the dye, so no two lengths agree. Cut wide as a boubou and left to move. Gold hoops, one long strand.",
    specs: [["Cloth", "Àdìrẹ"], ["Dye", "Indigo, by hand"], ["Worn with", "Hoops, a small bag"]],
  },
  sanyan: {
    no: "N° 03",
    name: "Sányán",
    gloss: "the wild silk",
    prose:
      "The colour wild silk comes. Cut as agbádá, one wide robe over both shoulders, the chest worked by hand. Fìlà set to one side. A staff, because he can.",
    specs: [["Cloth", "Sányán"], ["Cut", "Agbádá"], ["Worn with", "Fìlà, coral, ọ̀pá"]],
  },
};

const INDEX = ["Curtain", "Àlà", "Àlàárì", "Àdìrẹ", "Sányán", "Tuntun", "Weave", "Yours"];
const INDEX_NO = ["—", "00", "01", "02", "03", "04", "—", "—"];

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

export default function Experience() {
  const { chapter, held, ready, grabbing, piece } = useStage();
  const track = useRef<HTMLDivElement>(null);
  const lenis = useRef<Lenis | null>(null);
  const [note, setNote] = useState(false);
  const ch = CHAPTERS[chapter];
  const id = ch.id;

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const l = new Lenis({ autoRaf: true, lerp: reduce ? 1 : 0.09, smoothWheel: !reduce });
    lenis.current = l;
    const onScroll = () => {
      const els = track.current?.children;
      if (!els) return;
      const mid = window.scrollY + window.innerHeight * 0.5;
      let c = 0;
      for (let i = 0; i < els.length; i++) if ((els[i] as HTMLElement).offsetTop <= mid) c = i;
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
    const s = document.documentElement.style;
    s.setProperty("--bg", ch.bg);
    s.setProperty("--fg", ch.fg);
    s.setProperty("--accent", ch.accent);
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", ch.bg);
  }, [ch]);

  const go = (i: number) => {
    const el = track.current?.children[i] as HTMLElement | undefined;
    if (!el) return;
    const y = el.offsetTop + (i === 0 ? 0 : el.offsetHeight * 0.3);
    if (lenis.current) lenis.current.scrollTo(y, { duration: 1.6 });
    else window.scrollTo({ top: y });
  };

  const look = LOOKS[id];

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
        {Object.entries(LOOKS).map(([k, l]) => (
          <div key={k} className={`title title-${k} ${id === k ? "on" : ""}`} aria-hidden>
            <span>{l.name}</span>
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
          <button className="mark" onClick={() => go(0)} aria-label="ÀLÀ, back to the beginning">
            ÀLÀ
          </button>
          <p className="bar-mid">Collection 01 <i>·</i> Three Cloths</p>
          <p className="held" aria-live="polite">
            Held <b>{String(held).padStart(2, "0")}</b>×
          </p>
        </header>

        <section className={`hero ${id === "curtain" ? "on" : ""}`} aria-hidden={id !== "curtain"}>
          <h1>
            <span className="sr">ÀLÀ. </span>Cloth <em>remembers.</em>
          </h1>
          <p className="hero-sub">A house of handwoven cloth. Lagos.</p>
          <p className="hint">
            <span>Hold the cloth. Drag it. Let go.</span>
            <span>Scroll to unpin it</span>
          </p>
        </section>

        {look && (
          <article key={id} className={`card card-${id}`}>
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
              N° 04 <i /> <span>new, in Yorùbá</span>
            </p>
            <h2 className="sr">Tuntun</h2>
            <p className="prose">
              The same three cloths, cut for now. Choose a piece and the length beside it takes its colour.
            </p>
            <ul className="pieces">
              {PIECES.map((p, i) => (
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
              The weave <i /> <span>strip by strip</span>
            </p>
            <p className="prose big">
              Woven a hand wide on a narrow loom, then sewn edge to edge. Twenty-four strips make one length.
            </p>
            <p className="prose">Where you held it, it has kept you.</p>
            <dl>
              <div><dt>Strip</dt><dd>10 cm</dd></div>
              <div><dt>Fibre</dt><dd>Cotton, hand-spun</dd></div>
              <div><dt>Gold</dt><dd>Supplementary weft</dd></div>
            </dl>
          </article>
        )}

        {id === "yours" && (
          <article className="card card-yours">
            <p className="no">
              Yours <i /> <span>the record</span>
            </p>
            <p className="prose big">
              {held === 0
                ? "Under every colour, the white cloth. This one has not been held yet. Go back and hold it."
                : `Under every colour, the white cloth keeps count. You held it ${held} ${held === 1 ? "time" : "times"}. It will not be washed.`}
            </p>
            <div className="acts">
              <button onClick={() => setNote((n) => !n)} aria-expanded={note}>
                Request a fitting
              </button>
              <button
                className="quiet"
                onClick={() => {
                  stage.sim?.rinse();
                  stage.set({ held: 0 });
                }}
              >
                Wash it anyway
              </button>
            </div>
            <p className={`note ${note ? "on" : ""}`}>
              <span>
                Fittings are by introduction only, in Lagos. ÀLÀ is a concept house: nothing here is for sale, and the figures are drawn, not photographed.
              </span>
            </p>
            <p className="credit">
              Concept, illustration and build <a href="https://seyidev.com" target="_blank" rel="noreferrer">seyidev.com</a>
            </p>
          </article>
        )}

        <nav className="index" aria-label="Chapters">
          {INDEX.map((n, i) => (
            <button key={n} className={i === chapter ? "on" : ""} onClick={() => go(i)} aria-current={i === chapter}>
              <span className="l">{n}</span>
              <span className="n">{INDEX_NO[i]}</span>
              <i />
            </button>
          ))}
        </nav>
      </div>

      <div className="grain" aria-hidden />
      <div className="intro" aria-hidden />
      <Cursor />

      <div className="track" ref={track}>
        {CHAPTERS.map((c) => (
          <div key={c.id} data-id={c.id} />
        ))}
      </div>
    </main>
  );
}
