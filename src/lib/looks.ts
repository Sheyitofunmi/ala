import type { ClothSim, PinSpec } from "./cloth";

export const CLOTH_W = 2.4;
export const CLOTH_H = 1.6;

/** The undyed length, as it hangs at the door. */
export function curtain(sim: ClothSim): PinSpec[] {
  const out: PinSpec[] = [];
  for (let c = 0; c < sim.cols; c++) {
    const u = c / (sim.cols - 1);
    out.push({ i: sim.idx(c, 0), to: [(u - 0.5) * 2.02, 2.06, 0.3 + 0.03 * Math.sin(u * Math.PI * 18)] });
  }
  return out;
}

/** Held by its two long edges and given to the air. */
export function canopy(sim: ClothSim): PinSpec[] {
  const out: PinSpec[] = [];
  const last = sim.rows - 1;
  for (let c = 0; c < sim.cols; c++) {
    const u = c / (sim.cols - 1);
    const x = (u - 0.5) * CLOTH_W * 0.9;
    out.push({ i: sim.idx(c, 0), to: [x, 1.86 + 0.1 * Math.sin(u * Math.PI), -0.66] });
    out.push({ i: sim.idx(c, last), to: [x, 1.5 + 0.1 * Math.sin(u * Math.PI), 0.66] });
  }
  return out;
}

/**
 * Drawn to one side like a curtain, so the wearer and the words each keep
 * their own third of the screen. A wide span of pins keeps the hem from
 * fanning back across the text.
 */
export function gathered(sim: ClothSim, x0: number, x1: number): PinSpec[] {
  const out: PinSpec[] = [];
  const mid = (x0 + x1) / 2;
  for (let c = 0; c < sim.cols; c++) {
    const u = c / (sim.cols - 1);
    // pleats crowd toward the outer edge, so the inner edge hangs almost straight
    const e = u * u * (3 - 2 * u);
    out.push({
      i: sim.idx(c, 0),
      to: [x0 + (x1 - x0) * e, 2.06, 0.34 + 0.075 * Math.sin(u * Math.PI * 2 * 9)],
    });
    // a second row of pins just under the first stops it swinging inward
    if (c % 4 === 0) out.push({ i: sim.idx(c, 1), to: [x0 + (x1 - x0) * e + (mid > 0 ? 0.02 : -0.02), 1.98, 0.36] });
  }
  return out;
}

/** Stretched on the frame, the way it left the loom. */
export function loom(sim: ClothSim): PinSpec[] {
  const out: PinSpec[] = [];
  const lr = sim.rows - 1, lc = sim.cols - 1;
  const at = (c: number, r: number): PinSpec => ({
    i: sim.idx(c, r),
    to: [(c / lc - 0.5) * CLOTH_W * 1.004, 2.06 - (r / lr) * CLOTH_H * 1.004, 0.78],
  });
  for (let c = 0; c <= lc; c++) out.push(at(c, 0), at(c, lr));
  for (let r = 1; r < lr; r++) out.push(at(0, r), at(lc, r));
  return out;
}

/** Hung by its long edge, to be read. */
export function hung(sim: ClothSim): PinSpec[] {
  const out: PinSpec[] = [];
  for (let c = 0; c < sim.cols; c++) {
    const u = c / (sim.cols - 1);
    out.push({ i: sim.idx(c, 0), to: [(u - 0.5) * CLOTH_W * 0.985, 2.06, 0.5] });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 *  Tuntun: the length ties itself.
 *
 *  There is no body in the scene, so each piece is a construction the cloth
 *  holds in the air — wound, pleated or knotted the way it would be on a
 *  person. Every pin travels out and up first (the `way` point) before it
 *  settles, so the move reads as cloth being gathered rather than teleported.
 * ------------------------------------------------------------------ */

type V3 = [number, number, number];

/** Where the tied piece stands, matching the column the hanging cloth used. */
const CX = 1.02;
const TOP = 1.78;

const tri = (x: number) => (2 / Math.PI) * Math.asin(Math.sin(x));

/** A squared tube for tailoring, a round one for wrapping. */
const section = (th: number, r: number, square: number): [number, number] => {
  const s = Math.sin(th), c = Math.cos(th);
  const k = 1 + square * (Math.pow(Math.abs(s), 4) + Math.pow(Math.abs(c), 4) - 0.5);
  return [s * r * k, c * r * k * 0.82];
};

type Winding = {
  /** radius at a point along the top edge */
  r: (u: number) => number;
  /** how far down the edge has fallen by then */
  drop: (u: number) => number;
  turns: number;
  square?: number;
  phase?: number;
  /**
   * The length is 1.6m deep, so a top edge alone always falls to the floor as
   * one shape. A second row of pins partway down gives the piece a waist, a
   * flare or a pair of legs — the silhouette, rather than just the wrapping.
   */
  mid?: { at: number; r: (u: number) => number; y: number; split?: number };
};

function wind(sim: ClothSim, w: Winding): PinSpec[] {
  const out: PinSpec[] = [];
  const square = w.square ?? 0;
  const phase = w.phase ?? Math.PI;
  for (let c = 0; c < sim.cols; c++) {
    const u = c / (sim.cols - 1);
    const th = phase + u * Math.PI * 2 * w.turns;
    const [x, z] = section(th, w.r(u), square);
    const to: V3 = [CX + x, TOP - w.drop(u), z];
    // out to arm's length, then in: the gesture of wrapping something round
    out.push({ i: sim.idx(c, 0), to, way: [CX + x * 2.4, TOP + 0.5 + u * 0.3, z * 2.4] });

    if (w.mid) {
      const m = w.mid;
      const row = Math.round(m.at * (sim.rows - 1));
      let mx: number, mz: number;
      if (m.split) {
        // the cloth divides: first half of the width to one leg, the rest to the other
        const leg = u < 0.5 ? -1 : 1;
        const v = u < 0.5 ? u * 2 : (u - 0.5) * 2;
        const [lx, lz] = section(phase + v * Math.PI * 2, m.r(v), 0.25);
        mx = lx + leg * m.split;
        mz = lz;
      } else {
        [mx, mz] = section(th, m.r(u), square * 0.5);
      }
      out.push({ i: sim.idx(c, row), to: [CX + mx, m.y, mz] });
    }
  }
  return out;
}

/** The suit: squared shoulders, a straight fall, held in at the waist. */
const suit = (sim: ClothSim) =>
  wind(sim, {
    turns: 1.08,
    square: 0.5,
    r: (u) => 0.23 + 0.012 * tri(u * Math.PI * 2 * 6),
    drop: (u) => u * 0.16,
    phase: Math.PI * 0.86,
    mid: { at: 0.46, y: TOP - 0.62, r: () => 0.195 },
  });

/** Corset and mini: bound tight at the waist, released below. */
const corset = (sim: ClothSim) =>
  wind(sim, {
    turns: 2.1,
    square: 0.12,
    r: (u) => 0.125 + 0.1 * Math.max(0, u - 0.62) * 2.6 + 0.012 * tri(u * Math.PI * 2 * 11),
    drop: (u) => u * 0.5,
    // the mini: a sharp flare just below the boning, and nothing after it
    mid: { at: 0.3, y: TOP - 0.52, r: () => 0.26 },
  });

/** The gown: one shoulder, the rest a long diagonal to the floor. */
const gown = (sim: ClothSim) =>
  wind(sim, {
    turns: 1.25,
    r: (u) => 0.1 + u * 0.16 + 0.014 * tri(u * Math.PI * 2 * 9),
    drop: (u) => Math.pow(u, 1.45) * 0.86,
    phase: Math.PI * 1.35,
    // a gown falls from the hip, so the second row sits low and barely wider
    mid: { at: 0.62, y: TOP - 1.0, r: () => 0.3 },
  });

/** Wide trousers: one waist above, and below it the length divides into two legs. */
const trouser = (sim: ClothSim) =>
  wind(sim, {
    turns: 1,
    square: 0.3,
    r: () => 0.175,
    drop: () => 0,
    mid: { at: 0.5, y: TOP - 0.66, r: () => 0.125, split: 0.17 },
  });

/** The pieces: not worn at all — gathered and knotted, the way cloth is carried. */
const bundle = (sim: ClothSim) => {
  const out: PinSpec[] = [];
  for (let c = 0; c < sim.cols; c++) {
    const u = c / (sim.cols - 1);
    // a trefoil: the cloth passed through its own loop twice
    const t = u * Math.PI * 2;
    const r = 0.17;
    const x = r * (Math.sin(t) + 2 * Math.sin(2 * t)) * 0.5;
    const z = r * (Math.cos(t) - 2 * Math.cos(2 * t)) * 0.4;
    const y = TOP - 0.3 + r * Math.sin(3 * t) * 0.55;
    out.push({ i: sim.idx(c, 0), to: [CX + x, y, z], way: [CX + x * 2.6, TOP + 0.6, z * 2.6] });
  }
  return out;
};

const TIES = [suit, corset, gown, trouser, bundle];

export const tie = (sim: ClothSim, piece: number) => TIES[Math.max(0, Math.min(TIES.length - 1, piece))](sim);
