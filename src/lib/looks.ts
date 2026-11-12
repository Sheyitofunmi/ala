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

/** Drawn to one side like a curtain, so the wearer can be seen. */
export function gathered(sim: ClothSim, x0: number, x1: number): PinSpec[] {
  const out: PinSpec[] = [];
  for (let c = 0; c < sim.cols; c++) {
    const u = c / (sim.cols - 1);
    out.push({ i: sim.idx(c, 0), to: [x0 + (x1 - x0) * u, 2.06, 0.34 + 0.095 * Math.sin(u * Math.PI * 2 * 10.5)] });
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
