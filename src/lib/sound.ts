// Everything here is synthesised — no audio files. A loom at work, cloth moving
// against itself, and a slow talking-drum pulse under the dark chapters.

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noise: AudioBuffer | null = null;
let rustle: { src: AudioBufferSourceNode; gain: GainNode; filter: BiquadFilterNode } | null = null;
let loom: ReturnType<typeof setTimeout> | null = null;
let drum: ReturnType<typeof setTimeout> | null = null;
let on = false;
let air = 0; // how much the cloth is moving, 0..1

function makeNoise(c: AudioContext) {
  const b = c.createBuffer(1, c.sampleRate * 3, c.sampleRate);
  const d = b.getChannelData(0);
  // pink-ish: cheap one-pole filter over white, which sits better under speech
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.035 * w) / 1.035;
    d[i] = last * 3.2;
  }
  return b;
}

/** One pass of the beater: a wooden knock with a little string in it. */
function clack(t: number, gain: number) {
  if (!ctx || !master || !noise) return;
  const body = ctx.createOscillator();
  const bodyGain = ctx.createGain();
  body.type = "triangle";
  body.frequency.setValueAtTime(190 + Math.random() * 40, t);
  body.frequency.exponentialRampToValueAtTime(72, t + 0.07);
  bodyGain.gain.setValueAtTime(0, t);
  bodyGain.gain.linearRampToValueAtTime(gain * 0.5, t + 0.004);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  body.connect(bodyGain).connect(master);
  body.start(t);
  body.stop(t + 0.16);

  const tick = ctx.createBufferSource();
  const tickFilter = ctx.createBiquadFilter();
  const tickGain = ctx.createGain();
  tick.buffer = noise;
  tick.loop = true;
  tickFilter.type = "bandpass";
  tickFilter.frequency.value = 2400 + Math.random() * 900;
  tickFilter.Q.value = 1.4;
  tickGain.gain.setValueAtTime(gain * 0.3, t);
  tickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  tick.connect(tickFilter).connect(tickGain).connect(master);
  tick.start(t);
  tick.stop(t + 0.06);
}

/** Dùndún: a membrane whose pitch bends as the strings are squeezed. */
function beat(t: number, from: number, to: number, gain: number) {
  if (!ctx || !master || !noise) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  const lp = ctx.createBiquadFilter();
  o.type = "sine";
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(to, t + 0.19);
  lp.type = "lowpass";
  lp.frequency.value = 900;
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
  o.connect(lp).connect(g).connect(master);
  o.start(t);
  o.stop(t + 0.45);

  const skin = ctx.createBufferSource();
  const bp = ctx.createBiquadFilter();
  const sg = ctx.createGain();
  skin.buffer = noise;
  skin.loop = true;
  bp.type = "bandpass";
  bp.frequency.value = 1100;
  bp.Q.value = 0.8;
  sg.gain.setValueAtTime(gain * 0.5, t);
  sg.gain.exponentialRampToValueAtTime(0.0001, t + 0.06);
  skin.connect(bp).connect(sg).connect(master);
  skin.start(t);
  skin.stop(t + 0.08);
}

function scheduleLoom() {
  if (!ctx || !on) return;
  // a weaver's rhythm is even but never machine-even
  clack(ctx.currentTime + 0.02, 0.1);
  loom = setTimeout(scheduleLoom, 620 + Math.random() * 260);
}

function scheduleDrum() {
  if (!ctx || !on) return;
  const t = ctx.currentTime + 0.02;
  beat(t, 128, 96, 0.09);
  beat(t + 0.34, 104, 142, 0.055);
  drum = setTimeout(scheduleDrum, 2400 + Math.random() * 900);
}

export const sound = {
  get on() {
    return on;
  },
  /** Must be called from a click: browsers will not start audio otherwise. */
  toggle() {
    if (on) {
      on = false;
      if (loom) clearTimeout(loom);
      if (drum) clearTimeout(drum);
      if (master && ctx) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.setTargetAtTime(0, ctx.currentTime, 0.2);
      }
      return false;
    }
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      ctx = new AC();
      noise = makeNoise(ctx);
      master = ctx.createGain();
      master.gain.value = 0;
      const warm = ctx.createBiquadFilter();
      warm.type = "lowpass";
      warm.frequency.value = 5200;
      master.connect(warm).connect(ctx.destination);

      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      src.buffer = noise;
      src.loop = true;
      filter.type = "bandpass";
      filter.frequency.value = 1500;
      filter.Q.value = 0.6;
      gain.gain.value = 0;
      src.connect(filter).connect(gain).connect(master);
      src.start();
      rustle = { src, gain, filter };
    }
    void ctx.resume();
    on = true;
    master!.gain.setTargetAtTime(0.5, ctx.currentTime, 0.6);
    scheduleLoom();
    scheduleDrum();
    return true;
  },
  /** Fed every frame with how fast the cloth is moving. */
  setAir(v: number) {
    air += (v - air) * 0.15;
    if (!on || !ctx || !rustle) return;
    rustle.gain.gain.setTargetAtTime(Math.min(0.1, air * 0.1), ctx.currentTime, 0.1);
    rustle.filter.frequency.setTargetAtTime(900 + air * 2600, ctx.currentTime, 0.2);
  },
  /** A single soft pass of the beater, when the cloth is re-pinned. */
  pin() {
    if (!on || !ctx) return;
    clack(ctx.currentTime + 0.01, 0.07);
  },
};
