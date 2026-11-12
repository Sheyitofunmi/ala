// Position-based cloth: one rectangular length, verlet integration,
// distance constraints, capsule colliders, animated pins, and a dye field
// that records where the cloth has been held.

export type Capsule = [ax: number, ay: number, az: number, bx: number, by: number, bz: number, r: number];

export type PinSpec = {
  i: number;
  to: [number, number, number];
  way?: [number, number, number];
};

type Pin = {
  fx: number; fy: number; fz: number;
  wx: number; wy: number; wz: number; hasWay: boolean;
  tx: number; ty: number; tz: number;
  t: number; dur: number;
};

const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);

export class ClothSim {
  readonly cols: number;
  readonly rows: number;
  readonly n: number;
  width: number;
  height: number;

  pos: Float32Array;
  prev: Float32Array;
  normals: Float32Array;
  uv: Float32Array;
  index: Uint32Array;
  stain: Float32Array;
  private wet: Float32Array;
  private tmp: Float32Array;
  private tmpWet: Float32Array;
  private pinned: Uint8Array;
  private pins = new Map<number, Pin>();

  private cA: Uint32Array;
  private cB: Uint32Array;
  private cRest: Float32Array;
  private cStiff: Float32Array;
  private cCount = 0;

  capsules: Capsule[] = [];
  wind: [number, number, number] = [0, 0, 0];
  gust = 0.5;
  thickness = 0.014;

  // grab state
  private grabIdx: number[] = [];
  private grabOff: number[] = [];
  private grabW: number[] = [];
  grabTarget: [number, number, number] = [0, 0, 0];
  grabbing = false;

  private dead: Uint8Array;
  indexCount = 0;
  version = 0;

  constructor(cols: number, rows: number, width: number, height: number) {
    this.cols = cols;
    this.rows = rows;
    const n = (this.n = cols * rows);
    this.pos = new Float32Array(n * 3);
    this.prev = new Float32Array(n * 3);
    this.normals = new Float32Array(n * 3);
    this.uv = new Float32Array(n * 2);
    this.stain = new Float32Array(n);
    this.wet = new Float32Array(n);
    this.tmp = new Float32Array(n);
    this.tmpWet = new Float32Array(n);
    this.pinned = new Uint8Array(n);
    this.dead = new Uint8Array(n);
    const max = n * 6;
    this.cA = new Uint32Array(max);
    this.cB = new Uint32Array(max);
    this.cRest = new Float32Array(max);
    this.cStiff = new Float32Array(max);
    this.index = new Uint32Array((cols - 1) * (rows - 1) * 6);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        this.uv[i * 2] = c / (cols - 1);
        this.uv[i * 2 + 1] = 1 - r / (rows - 1);
      }
    }
    this.width = width;
    this.height = height;
    this.configure(width, height);
  }

  /** Re-cut the same grid as a different length: new size, optional opening. */
  configure(width: number, height: number, hole?: (u: number, v: number) => boolean) {
    const { cols, rows } = this;
    this.width = width;
    this.height = height;
    this.cCount = 0;
    this.pins.clear();
    this.pinned.fill(0);
    this.release();
    const dead = this.dead;
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) dead[r * cols + c] = hole && hole(c / (cols - 1), r / (rows - 1)) ? 1 : 0;
    const dx = width / (cols - 1);
    const dy = height / (rows - 1);
    const diag = Math.hypot(dx, dy);
    const add = (a: number, b: number, rest: number, k: number) => {
      if (dead[a] || dead[b]) return;
      const c = this.cCount++;
      this.cA[c] = a; this.cB[c] = b; this.cRest[c] = rest; this.cStiff[c] = k;
    };
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        if (c + 1 < cols) add(i, i + 1, dx, 1);
        if (r + 1 < rows) add(i, i + cols, dy, 1);
        if (c + 1 < cols && r + 1 < rows) {
          add(i, i + cols + 1, diag, 0.75);
          add(i + 1, i + cols, diag, 0.75);
        }
        if (c + 2 < cols && !dead[i + 1]) add(i, i + 2, dx * 2, 0.22);
        if (r + 2 < rows && !dead[i + cols]) add(i, i + cols * 2, dy * 2, 0.22);
      }
    }
    let k = 0;
    for (let r = 0; r < rows - 1; r++) {
      for (let c = 0; c < cols - 1; c++) {
        const a = r * cols + c, b = a + cols, d = a + 1, e = b + 1;
        if (dead[a] || dead[b] || dead[d] || dead[e]) continue;
        this.index[k++] = a; this.index[k++] = b; this.index[k++] = d;
        this.index[k++] = d; this.index[k++] = b; this.index[k++] = e;
      }
    }
    this.indexCount = k;
    this.version++;
  }

  idx(c: number, r: number) {
    return r * this.cols + c;
  }

  /** Lay every particle out explicitly (used once, before the first frame). */
  place(fn: (u: number, v: number, out: [number, number, number]) => void) {
    const o: [number, number, number] = [0, 0, 0];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i = this.idx(c, r) * 3;
        fn(c / (this.cols - 1), r / (this.rows - 1), o);
        this.pos[i] = this.prev[i] = o[0];
        this.pos[i + 1] = this.prev[i + 1] = o[1];
        this.pos[i + 2] = this.prev[i + 2] = o[2];
      }
    }
  }

  /** Replace the pin set. Pins travel from wherever the cloth is now. */
  setPins(specs: PinSpec[], dur = 1.6) {
    this.pins.clear();
    this.pinned.set(this.dead);
    for (const s of specs) {
      if (this.dead[s.i]) continue;
      const p = s.i * 3;
      this.pinned[s.i] = 1;
      this.pins.set(s.i, {
        fx: this.pos[p], fy: this.pos[p + 1], fz: this.pos[p + 2],
        wx: s.way ? s.way[0] : 0, wy: s.way ? s.way[1] : 0, wz: s.way ? s.way[2] : 0,
        hasWay: !!s.way,
        tx: s.to[0], ty: s.to[1], tz: s.to[2],
        t: 0, dur: s.way ? dur * 2 : dur,
      });
    }
  }

  private updatePins(h: number) {
    const pos = this.pos, prev = this.prev;
    this.pins.forEach((p, i) => {
      if (p.t < p.dur) p.t = Math.min(p.dur, p.t + h);
      const k = p.t / p.dur;
      let x: number, y: number, z: number;
      if (p.hasWay) {
        if (k < 0.5) {
          const e = ease(k * 2);
          x = p.fx + (p.wx - p.fx) * e; y = p.fy + (p.wy - p.fy) * e; z = p.fz + (p.wz - p.fz) * e;
        } else {
          const e = ease((k - 0.5) * 2);
          x = p.wx + (p.tx - p.wx) * e; y = p.wy + (p.ty - p.wy) * e; z = p.wz + (p.tz - p.wz) * e;
        }
      } else {
        const e = ease(k);
        x = p.fx + (p.tx - p.fx) * e; y = p.fy + (p.ty - p.fy) * e; z = p.fz + (p.tz - p.fz) * e;
      }
      const j = i * 3;
      pos[j] = prev[j] = x; pos[j + 1] = prev[j + 1] = y; pos[j + 2] = prev[j + 2] = z;
    });
  }

  /** Nearest particle to a ray, or -1. Returns [index, depthAlongRay]. */
  pick(ox: number, oy: number, oz: number, dx: number, dy: number, dz: number, radius = 0.1): [number, number] {
    const pos = this.pos;
    let best = -1, bestScore = Infinity, bestT = 0;
    for (let i = 0; i < this.n; i++) {
      if (this.dead[i]) continue;
      const j = i * 3;
      const px = pos[j] - ox, py = pos[j + 1] - oy, pz = pos[j + 2] - oz;
      const t = px * dx + py * dy + pz * dz;
      if (t < 0.05) continue;
      const qx = px - dx * t, qy = py - dy * t, qz = pz - dz * t;
      const d2 = qx * qx + qy * qy + qz * qz;
      if (d2 > radius * radius) continue;
      const score = Math.sqrt(d2) * 4 + t; // prefer the nearest layer
      if (score < bestScore) { bestScore = score; best = i; bestT = t; }
    }
    return [best, bestT];
  }

  grab(i: number) {
    this.grabIdx.length = 0; this.grabOff.length = 0; this.grabW.length = 0;
    const c0 = i % this.cols, r0 = (i / this.cols) | 0;
    const R = 3;
    const p = i * 3;
    for (let r = Math.max(0, r0 - R); r <= Math.min(this.rows - 1, r0 + R); r++) {
      for (let c = Math.max(0, c0 - R); c <= Math.min(this.cols - 1, c0 + R); c++) {
        const d = Math.hypot(c - c0, r - r0);
        if (d > R) continue;
        const k = this.idx(c, r);
        if (this.pinned[k]) continue;
        const q = k * 3;
        this.grabIdx.push(k);
        this.grabOff.push(this.pos[q] - this.pos[p], this.pos[q + 1] - this.pos[p + 1], this.pos[q + 2] - this.pos[p + 2]);
        this.grabW.push(1 - d / (R + 1));
      }
    }
    this.grabTarget = [this.pos[p], this.pos[p + 1], this.pos[p + 2]];
    this.grabbing = this.grabIdx.length > 0;
    return this.grabbing;
  }

  release() {
    this.grabbing = false;
    this.grabIdx.length = 0;
  }

  /** A hand passing close to the cloth drags it a little. */
  brush(ox: number, oy: number, oz: number, d0: [number, number, number], d1: [number, number, number], radius = 0.13) {
    const pos = this.pos;
    const ddx = d1[0] - d0[0], ddy = d1[1] - d0[1], ddz = d1[2] - d0[2];
    if (ddx * ddx + ddy * ddy + ddz * ddz < 1e-10) return;
    for (let i = 0; i < this.n; i++) {
      if (this.pinned[i]) continue;
      const j = i * 3;
      const px = pos[j] - ox, py = pos[j + 1] - oy, pz = pos[j + 2] - oz;
      const t = px * d1[0] + py * d1[1] + pz * d1[2];
      if (t < 0.05) continue;
      const qx = px - d1[0] * t, qy = py - d1[1] * t, qz = pz - d1[2] * t;
      const d2 = qx * qx + qy * qy + qz * qz;
      if (d2 > radius * radius) continue;
      const f = (1 - Math.sqrt(d2) / radius) * 0.55;
      pos[j] += ddx * t * f + d1[0] * 0.004 * f;
      pos[j + 1] += ddy * t * f + d1[1] * 0.004 * f;
      pos[j + 2] += ddz * t * f + d1[2] * 0.004 * f;
    }
  }

  rinse() {
    this.stain.fill(0);
    this.wet.fill(0);
  }

  private integrate(h: number, time: number) {
    const pos = this.pos, prev = this.prev, nor = this.normals, pinned = this.pinned;
    const g = -9.81 * h * h;
    const damp = 0.988;
    const [wx, wy, wz] = this.wind;
    const windOn = wx !== 0 || wy !== 0 || wz !== 0;
    for (let i = 0; i < this.n; i++) {
      if (pinned[i]) continue;
      const j = i * 3;
      const x = pos[j], y = pos[j + 1], z = pos[j + 2];
      let vx = (x - prev[j]) * damp, vy = (y - prev[j + 1]) * damp, vz = (z - prev[j + 2]) * damp;
      vy += g;
      if (windOn) {
        const gust = 1 - this.gust + this.gust * (0.5 + 0.5 * Math.sin(time * 1.3 + x * 2.1 + y * 1.3) * Math.sin(time * 0.57 + z * 1.7 - y * 0.6) + 0.35 * Math.sin(time * 3.1 + y * 4.0));
        const nx = nor[j], ny = nor[j + 1], nz = nor[j + 2];
        const d = (nx * wx + ny * wy + nz * wz) * gust * 1.25 * h * h;
        vx += nx * d; vy += ny * d; vz += nz * d;
      }
      prev[j] = x; prev[j + 1] = y; prev[j + 2] = z;
      pos[j] = x + vx; pos[j + 1] = y + vy; pos[j + 2] = z + vz;
    }
  }

  private solve() {
    const pos = this.pos, pinned = this.pinned;
    const cA = this.cA, cB = this.cB, cRest = this.cRest, cStiff = this.cStiff;
    for (let c = 0; c < this.cCount; c++) {
      const a = cA[c], b = cB[c];
      const wa = pinned[a] ? 0 : 1, wb = pinned[b] ? 0 : 1;
      const w = wa + wb;
      if (w === 0) continue;
      const i = a * 3, j = b * 3;
      const dx = pos[j] - pos[i], dy = pos[j + 1] - pos[i + 1], dz = pos[j + 2] - pos[i + 2];
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (len < 1e-7) continue;
      const rest = cRest[c];
      let k = cStiff[c];
      // bend constraints only resist folding, never stretching
      if (k < 0.5 && len > rest) continue;
      if (k < 0.5) k *= 0.6;
      const diff = ((len - rest) / len) * k / w;
      const ox = dx * diff, oy = dy * diff, oz = dz * diff;
      if (wa) { pos[i] += ox; pos[i + 1] += oy; pos[i + 2] += oz; }
      if (wb) { pos[j] -= ox; pos[j + 1] -= oy; pos[j + 2] -= oz; }
    }
  }

  private applyGrab() {
    if (!this.grabbing) return;
    const pos = this.pos, prev = this.prev;
    const [gx, gy, gz] = this.grabTarget;
    for (let g = 0; g < this.grabIdx.length; g++) {
      const j = this.grabIdx[g] * 3;
      const w = this.grabW[g] * 0.45;
      const tx = gx + this.grabOff[g * 3], ty = gy + this.grabOff[g * 3 + 1], tz = gz + this.grabOff[g * 3 + 2];
      pos[j] += (tx - pos[j]) * w; pos[j + 1] += (ty - pos[j + 1]) * w; pos[j + 2] += (tz - pos[j + 2]) * w;
      prev[j] += (pos[j] - prev[j]) * 0.3; prev[j + 1] += (pos[j + 1] - prev[j + 1]) * 0.3; prev[j + 2] += (pos[j + 2] - prev[j + 2]) * 0.3;
    }
  }

  private collide() {
    const pos = this.pos, prev = this.prev, pinned = this.pinned;
    const caps = this.capsules, th = this.thickness;
    for (let i = 0; i < this.n; i++) {
      if (pinned[i]) continue;
      const j = i * 3;
      let x = pos[j], y = pos[j + 1], z = pos[j + 2];
      if (y < th) {
        y = th;
        prev[j] += (x - prev[j]) * 0.16; prev[j + 2] += (z - prev[j + 2]) * 0.16; prev[j + 1] = y;
      }
      if (y < 1.95 && x > -0.62 && x < 0.62 && z > -0.5 && z < 0.5) {
        for (let c = 0; c < caps.length; c++) {
          const k = caps[c];
          const abx = k[3] - k[0], aby = k[4] - k[1], abz = k[5] - k[2];
          const l2 = abx * abx + aby * aby + abz * abz;
          let t = l2 > 0 ? ((x - k[0]) * abx + (y - k[1]) * aby + (z - k[2]) * abz) / l2 : 0;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          const dx = x - (k[0] + abx * t), dy = y - (k[1] + aby * t), dz = z - (k[2] + abz * t);
          const d2 = dx * dx + dy * dy + dz * dz;
          const r = k[6] + th;
          if (d2 < r * r && d2 > 1e-10) {
            const d = Math.sqrt(d2), s = (r - d) / d;
            x += dx * s; y += dy * s; z += dz * s;
            prev[j] += (x - prev[j]) * 0.3; prev[j + 1] += (y - prev[j + 1]) * 0.3; prev[j + 2] += (z - prev[j + 2]) * 0.3;
          }
        }
      }
      pos[j] = x; pos[j + 1] = y; pos[j + 2] = z;
    }
  }

  private computeNormals() {
    const pos = this.pos, nor = this.normals, cols = this.cols, rows = this.rows;
    for (let r = 0; r < rows; r++) {
      const ru = r > 0 ? r - 1 : r, rd = r < rows - 1 ? r + 1 : r;
      for (let c = 0; c < cols; c++) {
        const cl = c > 0 ? c - 1 : c, cr = c < cols - 1 ? c + 1 : c;
        const a = (r * cols + cl) * 3, b = (r * cols + cr) * 3, u = (ru * cols + c) * 3, d = (rd * cols + c) * 3;
        const ax = pos[b] - pos[a], ay = pos[b + 1] - pos[a + 1], az = pos[b + 2] - pos[a + 2];
        const bx = pos[d] - pos[u], by = pos[d + 1] - pos[u + 1], bz = pos[d + 2] - pos[u + 2];
        let nx = by * az - bz * ay, ny = bz * ax - bx * az, nz = bx * ay - by * ax;
        const l = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1;
        nx /= l; ny /= l; nz /= l;
        const i = (r * cols + c) * 3;
        nor[i] = nx; nor[i + 1] = ny; nor[i + 2] = nz;
      }
    }
  }

  /** Dye wicks outward while the fibre is still wet, then sets for good. */
  private wick(dt: number) {
    const s = this.stain, w = this.wet, ts = this.tmp, tw = this.tmpWet, cols = this.cols, rows = this.rows;
    if (this.grabbing) {
      for (let g = 0; g < this.grabIdx.length; g++) {
        const i = this.grabIdx[g];
        const k = this.grabW[g];
        s[i] = Math.min(1, s[i] + dt * 1.1 * k * k);
        w[i] = Math.min(1, w[i] + dt * 3 * k);
      }
    }
    let any = false;
    for (let i = 0; i < this.n; i++) if (w[i] > 0.004) { any = true; break; }
    if (!any) return;
    const decay = Math.exp(-dt * 0.42);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const l = c > 0 ? i - 1 : i, rr = c < cols - 1 ? i + 1 : i, u = r > 0 ? i - cols : i, d = r < rows - 1 ? i + cols : i;
        const avgW = (w[l] + w[rr] + w[u] + w[d]) * 0.25;
        const avgS = (s[l] + s[rr] + s[u] + s[d]) * 0.25;
        tw[i] = Math.max(w[i], avgW * 0.93) * decay;
        const gain = avgS - s[i];
        ts[i] = gain > 0 ? s[i] + gain * Math.min(1, w[i] * 9 * dt) : s[i];
      }
    }
    s.set(ts); w.set(tw);
  }

  /** Let the cloth find its drape before anyone sees it. */
  settle(steps: number) {
    for (let i = 0; i < steps; i++) this.step(1 / 60, i / 60);
  }

  step(dt: number, time: number) {
    const sub = 2, iters = 7;
    const h = dt / sub;
    for (let k = 0; k < sub; k++) {
      this.updatePins(h);
      this.integrate(h, time);
      for (let it = 0; it < iters; it++) {
        this.solve();
        this.applyGrab();
        if (it >= iters - 3) this.collide();
      }
    }
    this.computeNormals();
    this.wick(dt);
  }
}
