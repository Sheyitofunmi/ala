// Everything here is synthesised — there is not one audio file in the project.
//
// Four voices:
//   dùndún   a pressure drum. Yorùbá is tonal, and the dùndún reproduces the
//            tones of speech, so the phrase it plays is not decoration: it is
//            the house saying its own name.
//   cloth    friction while you drag the length, a struck note when you let go.
//            Pitch comes from the simulation, not from a loop.
//   ṣẹ̀kẹ̀rẹ̀   a beaded gourd that rises and falls with the wind in the scene.
//   loom     the beater, on a weaver's uneven rhythm.

type Ctx = {
  ac: AudioContext;
  master: GainNode;
  noise: AudioBuffer;
  rustle: { gain: GainNode; filter: BiquadFilterNode };
  bow: { osc: OscillatorNode; gain: GainNode; filter: BiquadFilterNode };
};

let C: Ctx | null = null;
let on = false;
let timers: ReturnType<typeof setTimeout>[] = [];
let air = 0;
let gustLevel = 0;
let tuning = 0;

/**
 * Tone letters, as Yorùbá marks them: do (low, grave), re (mid, unmarked),
 * mi (high, acute). The drum glides between them the way a voice does.
 */
type Tone = "L" | "M" | "H";
type Syllable = [tone: Tone, beats: number];

/** "Àlà — aṣọ ń rántí."  Àlà: low, low. Aṣọ: mid, mid. Ń: high. Rántí: high, high. */
const PHRASE: (Syllable | null)[] = [
  ["L", 1.1],
  ["L", 1.5],
  null,
  ["M", 0.85],
  ["M", 0.85],
  ["H", 0.7],
  ["H", 0.85],
  ["H", 1.7],
];

/** Each cloth sits at its own pitch, so scrolling moves the music. */
const TUNINGS = [
  { root: 112, beat: 0.3, bright: 1 }, // curtain — dark, plain
  { root: 112, beat: 0.3, bright: 1 }, // àlà
  { root: 138, beat: 0.25, bright: 1.35 }, // àlàárì — bright, quick
  { root: 94, beat: 0.4, bright: 0.72 }, // àdìrẹ — low, slow
  { root: 126, beat: 0.36, bright: 0.95 }, // sányán — open
  { root: 150, beat: 0.23, bright: 1.4 }, // tuntun — fastest
  { root: 104, beat: 0.46, bright: 0.8 }, // weave — almost still
  { root: 112, beat: 0.32, bright: 0.9 }, // yours
];

function makeNoise(ac: AudioContext) {
  const b = ac.createBuffer(1, ac.sampleRate * 3, ac.sampleRate);
  const d = b.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    last = (last + 0.035 * w) / 1.035;
    d[i] = last * 3.2;
  }
  return b;
}

function burst(t: number, freq: number, q: number, gain: number, decay: number) {
  if (!C) return;
  const src = C.ac.createBufferSource();
  const f = C.ac.createBiquadFilter();
  const g = C.ac.createGain();
  src.buffer = C.noise;
  src.loop = true;
  f.type = "bandpass";
  f.frequency.value = freq;
  f.Q.value = q;
  g.gain.setValueAtTime(gain, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  src.connect(f).connect(g).connect(C.master);
  src.start(t);
  src.stop(t + decay + 0.02);
}

/**
 * One stroke of the dùndún. The drum's pitch is squeezed into place before the
 * stick lands, so each note arrives already gliding toward the next.
 */
function stroke(t: number, from: number, to: number, dur: number, gain: number) {
  if (!C) return;
  const o = C.ac.createOscillator();
  const g = C.ac.createGain();
  const lp = C.ac.createBiquadFilter();
  o.type = "sine";
  o.frequency.setValueAtTime(from, t);
  o.frequency.exponentialRampToValueAtTime(Math.max(30, to), t + dur * 0.8);
  lp.type = "lowpass";
  lp.frequency.setValueAtTime(820, t);
  lp.frequency.exponentialRampToValueAtTime(380, t + dur);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(gain, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur * 1.5);
  o.connect(lp).connect(g).connect(C.master);
  o.start(t);
  o.stop(t + dur * 1.6);
  // the skin, struck
  burst(t, 1050, 0.8, gain * 0.55, 0.05);
}

/** Say the phrase on the drum, in the tuning of whichever cloth is on screen. */
function speak(at: number) {
  if (!C) return;
  const { root, beat } = TUNINGS[tuning];
  const pitch = (tone: Tone) => (tone === "L" ? root * 0.82 : tone === "M" ? root : root * 1.33);
  let t = at;
  let prev = pitch("L");
  for (const syl of PHRASE) {
    if (!syl) {
      t += beat * 1.3;
      continue;
    }
    const [tone, beats] = syl;
    const target = pitch(tone);
    const dur = beat * beats;
    // the glide starts from wherever the last syllable left the skin
    stroke(t, prev * 0.94 + target * 0.06, target, dur, 0.085);
    prev = target;
    t += dur;
  }
  return t - at;
}

function loop(fn: () => number, schedule: () => number) {
  const run = () => {
    if (!on) return;
    fn();
    timers.push(setTimeout(run, schedule()));
  };
  run();
}

export const sound = {
  get on() {
    return on;
  },

  /** Must be called from a click: browsers will not start audio otherwise. */
  toggle() {
    if (on) {
      on = false;
      timers.forEach(clearTimeout);
      timers = [];
      if (C) {
        C.master.gain.cancelScheduledValues(C.ac.currentTime);
        C.master.gain.setTargetAtTime(0, C.ac.currentTime, 0.22);
      }
      return false;
    }

    if (!C) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ac = new AC();
      const noise = makeNoise(ac);
      const master = ac.createGain();
      master.gain.value = 0;
      const warm = ac.createBiquadFilter();
      warm.type = "lowpass";
      warm.frequency.value = 5600;
      master.connect(warm).connect(ac.destination);

      // cloth moving against itself
      const rs = ac.createBufferSource();
      const rf = ac.createBiquadFilter();
      const rg = ac.createGain();
      rs.buffer = noise;
      rs.loop = true;
      rf.type = "bandpass";
      rf.frequency.value = 1500;
      rf.Q.value = 0.6;
      rg.gain.value = 0;
      rs.connect(rf).connect(rg).connect(master);
      rs.start();

      // the length under tension, bowed by the drag
      const bo = ac.createOscillator();
      const bf = ac.createBiquadFilter();
      const bg = ac.createGain();
      bo.type = "sawtooth";
      bo.frequency.value = 110;
      bf.type = "lowpass";
      bf.frequency.value = 500;
      bf.Q.value = 6;
      bg.gain.value = 0;
      bo.connect(bf).connect(bg).connect(master);
      bo.start();

      C = { ac, master, noise, rustle: { gain: rg, filter: rf }, bow: { osc: bo, gain: bg, filter: bf } };
    }

    void C.ac.resume();
    on = true;
    C.master.gain.setTargetAtTime(0.5, C.ac.currentTime, 0.7);

    // the loom, always working
    loop(
      () => {
        burst(C!.ac.currentTime + 0.02, 2400 + Math.random() * 900, 1.4, 0.055, 0.05);
        stroke(C!.ac.currentTime + 0.02, 190, 74, 0.09, 0.045);
        return 0;
      },
      () => (TUNINGS[tuning].beat * 2 + Math.random() * 0.3) * 1000
    );

    // the drum says the name, then leaves a long silence
    timers.push(
      setTimeout(() => {
        loop(
          () => speak(C!.ac.currentTime + 0.05) ?? 0,
          () => 13000 + Math.random() * 7000
        );
      }, 1800)
    );

    return true;
  },

  /** Fed every frame with how fast the cloth is moving, 0..1. */
  setAir(v: number) {
    air += (v - air) * 0.15;
    if (!on || !C) return;
    const b = TUNINGS[tuning].bright;
    C.rustle.gain.gain.setTargetAtTime(Math.min(0.1, air * 0.1), C.ac.currentTime, 0.1);
    C.rustle.filter.frequency.setTargetAtTime((900 + air * 2600) * b, C.ac.currentTime, 0.2);
  },

  /** The ṣẹ̀kẹ̀rẹ̀ follows the wind actually blowing in the scene. */
  setWind(gust: number) {
    if (!on || !C) return;
    const rising = gust > gustLevel + 0.16;
    gustLevel += (gust - gustLevel) * 0.08;
    if (rising && Math.random() < 0.3) {
      const t = C.ac.currentTime + 0.01;
      // a gourd of beads: three uneven rattles, not one
      burst(t, 5200, 0.7, 0.05 * gust, 0.1);
      burst(t + 0.06, 4400, 0.9, 0.035 * gust, 0.08);
      burst(t + 0.11, 6000, 0.6, 0.025 * gust, 0.07);
    }
  },

  /** While the cloth is held: tension becomes pitch. */
  setBow(tension: number, speed: number) {
    if (!on || !C) return;
    const { root, bright } = TUNINGS[tuning];
    const target = root * (1 + tension * 1.6);
    C.bow.osc.frequency.setTargetAtTime(target, C.ac.currentTime, 0.08);
    C.bow.filter.frequency.setTargetAtTime((320 + speed * 2400) * bright, C.ac.currentTime, 0.06);
    C.bow.gain.gain.setTargetAtTime(Math.min(0.055, speed * 0.09), C.ac.currentTime, 0.07);
  },

  /** Let go, and the length rings once at the pitch it was holding. */
  release(tension: number) {
    if (!on || !C) return;
    C.bow.gain.gain.setTargetAtTime(0, C.ac.currentTime, 0.1);
    const { root } = TUNINGS[tuning];
    const t = C.ac.currentTime + 0.01;
    stroke(t, root * (1 + tension * 1.6), root * (1 + tension * 0.5), 0.3, 0.07);
  },

  /** A soft pass of the beater when the cloth is re-pinned. */
  pin() {
    if (!on || !C) return;
    burst(C.ac.currentTime + 0.01, 2000, 1.2, 0.04, 0.06);
  },

  /** Which cloth is on screen; moves the whole piece to its tuning. */
  setTuning(i: number) {
    tuning = Math.max(0, Math.min(TUNINGS.length - 1, i));
  },
};
