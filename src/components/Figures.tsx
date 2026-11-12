// Original, faceless figures. Flat shapes, the house's three cloths as pattern
// fills, and a little hand-drawn line for the folds. No one in particular.

const CORAL = "#e2512c";
const GOLD = "#e0b24a";
const LINE = { fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

/** Pattern swatches, shared by every figure on the page. */
export function ClothDefs() {
  const alaari = (
    <>
      <rect width="24" height="10" fill="#8c1524" />
      <rect x="0" width="3.2" height="10" fill={GOLD} />
      <rect x="6.4" width="1.4" height="10" fill="#1d1113" />
      <rect x="10.4" width="1.3" height="10" fill="#efe2c4" />
      <rect x="14" width="6.5" height="10" fill="#5a0b18" />
    </>
  );
  const sanyan = (
    <>
      <rect width="22" height="10" fill="#c79c5f" />
      <rect x="0" width="4.4" height="10" fill="#f3e8cb" />
      <rect x="8.6" width="1.3" height="10" fill="#5e3a1c" />
      <rect x="12.2" width="1.3" height="10" fill="#5e3a1c" />
      <rect x="17" width="0.8" height="10" fill="#e6cf9c" />
    </>
  );
  const pale = "#e3e9f4";
  return (
    <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden focusable="false">
      <defs>

        <pattern id="pA" width="24" height="10" patternUnits="userSpaceOnUse">{alaari}</pattern>
        <pattern id="pAd" width="24" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(38)">{alaari}</pattern>
        <pattern id="pAh" width="24" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(90)">{alaari}</pattern>
        <pattern id="pG" width="9" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-24)">
          <rect width="9" height="10" fill={GOLD} />
          <rect x="0" width="2.2" height="10" fill="#8c1524" />
          <rect x="5" width="0.9" height="10" fill="#fbe9b4" />
        </pattern>
        <pattern id="pS" width="22" height="10" patternUnits="userSpaceOnUse">{sanyan}</pattern>
        <pattern id="pSd" width="22" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(-32)">{sanyan}</pattern>
        <pattern id="pD" width="52" height="52" patternUnits="userSpaceOnUse">
          <rect width="52" height="52" fill="#17286e" />
          <rect x="1.5" y="1.5" width="49" height="49" fill="none" stroke={pale} strokeWidth="1.6" />
          <circle cx="26" cy="26" r="15" fill="none" stroke={pale} strokeWidth="2.6" />
          <circle cx="26" cy="26" r="8" fill="none" stroke={pale} strokeWidth="2.2" />
          <circle cx="26" cy="26" r="2.6" fill={pale} />
          <circle cx="8" cy="8" r="2" fill={pale} />
          <circle cx="44" cy="8" r="2" fill={pale} />
          <circle cx="8" cy="44" r="2" fill={pale} />
          <circle cx="44" cy="44" r="2" fill={pale} />
        </pattern>
        <pattern id="pD2" width="26" height="26" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">
          <rect width="26" height="26" fill="#1c3185" />
          <path d="M0 13H26M13 0V26" stroke={pale} strokeWidth="1.5" />
          <circle cx="6.5" cy="6.5" r="2.4" fill={pale} />
          <circle cx="19.5" cy="19.5" r="2.4" fill={pale} />
          <path d="M16 3.5l7 7M23 3.5l-7 7M3 16.5l7 7M10 16.5l-7 7" stroke={pale} strokeWidth="1.4" />
        </pattern>
        <linearGradient id="gShade" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".34" />
          <stop offset=".22" stopColor="#000" stopOpacity="0" />
          <stop offset=".58" stopColor="#fff" stopOpacity=".16" />
          <stop offset=".8" stopColor="#000" stopOpacity=".1" />
          <stop offset="1" stopColor="#000" stopOpacity=".42" />
        </linearGradient>
        <linearGradient id="gSkin" x1="0" y1="0" x2="1" y2="0.2">
          <stop offset="0" stopColor="#fff" stopOpacity=".18" />
          <stop offset=".45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".3" />
        </linearGradient>
        <filter id="fWeft" x="-5%" y="-5%" width="110%" height="110%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9 0.04" numOctaves="2" seed="7" result="n" />
          <feColorMatrix in="n" type="saturate" values="0" result="g" />
          <feComponentTransfer in="g" result="t">
            <feFuncA type="linear" slope=".22" intercept="0" />
          </feComponentTransfer>
          <feComposite in="t" in2="SourceGraphic" operator="in" />
        </filter>
      </defs>
    </svg>
  );
}

/** The weft, raked across a garment so flat fill reads as woven cloth. */
const Weft = ({ d }: { d: string }) => (
  <path d={d} fill="#efe4cc" filter="url(#fWeft)" style={{ mixBlendMode: "overlay" }} opacity=".85" />
);
/** Light down one side of a garment, shadow down the other. */
const Shade = ({ d, o = 1 }: { d: string; o?: number }) => <path d={d} fill="url(#gShade)" opacity={o} />;

const beads = (d: string, w = 8) => <path d={d} {...LINE} stroke={CORAL} strokeWidth={w} strokeDasharray={`${w * 0.9} ${w * 0.55}`} />;

/** Àlàárì: ìró and bùbá, a fan-pleated gèlè, a sash, coral, a fan in the hand. */
export function FigureAlaari() {
  const skin = "#6a3924";
  return (
    <svg viewBox="0 0 400 640" role="img" aria-label="Faceless illustration of a woman in crimson strip-woven cloth with a tall head tie, coral beads and a hand fan">
      <path d="M172 282C118 290 66 326 34 452l78 22 16-60-10 226h174l-10-226 16 60 78-22C344 326 292 290 238 282c-16 22-48 22-66 0Z" fill="url(#pA)" />
      <Weft d="M172 282C118 290 66 326 34 452l78 22 16-60-10 226h174l-10-226 16 60 78-22C344 326 292 290 238 282c-16 22-48 22-66 0Z" />
      <Shade d="M172 282C118 290 66 326 34 452l78 22 16-60-10 226h174l-10-226 16 60 78-22C344 326 292 290 238 282c-16 22-48 22-66 0Z" o={.9} />
      <g {...LINE} stroke="#2e040c" opacity=".55">
        <path d="M128 414c4-34 12-64 22-84M282 414c-4-34-12-64-22-84M70 380c10 26 26 50 44 70M330 380c-10 26-26 50-44 70" strokeWidth="3" />
        <path d="M156 352c-6 90-10 190-8 286M248 352c6 90 10 190 8 286M196 338v300M214 338v300M176 348c-4 96-6 196-4 290M232 348c4 96 6 196 4 290" strokeWidth="1.6" opacity=".5" />
        <path d="M100 462c8-24 20-48 34-66M310 462c-8-24-20-48-34-66" strokeWidth="2" opacity=".7" />
      </g>
      <path d="M150 286l46 14-46 340H84Z" fill="url(#pG)" />
      <Weft d="M150 286l46 14-46 340H84Z" />
      <Shade d="M150 286l46 14-46 340H84Z" o={.7} />
      <path d="M150 286l46 14M126 306l-22 326M138 296l-14 340" {...LINE} stroke="#5a0b18" strokeWidth="2.4" opacity=".8" />
      <path d="M183 232h44l9 54c-16 18-44 18-62 0Z" fill={skin} />
      <ellipse cx="205" cy="186" rx="50" ry="60" fill={skin} />
      <ellipse cx="205" cy="186" rx="50" ry="60" fill="url(#gSkin)" />
      <path d="M183 232h44l9 54c-16 18-44 18-62 0Z" fill="url(#gSkin)" />
      {beads("M176 284c14 30 44 30 58 0")}
      {beads("M170 290c18 46 52 46 70 0")}
      {beads("M164 298c22 64 60 64 82 0")}
      <path d="M140 172C78 152 58 72 118 40c42-44 132-44 174 0 60 32 40 112-22 132-22-30-108-30-130 0Z" fill="url(#pAd)" />
      <path d="M205 150L118 40M205 150l-48-126M205 150V8M205 150l48-126M205 150l87-110M205 150L86 96M205 150l119-54" {...LINE} stroke="#3a0610" strokeWidth="3" opacity=".6" />
      <path d="M140 172c22-30 108-30 130 0-30-14-100-14-130 0Z" fill="#5a0b18" />
      <path d="M140 172c22-30 108-30 130 0" {...LINE} stroke="#f0c75a" strokeWidth="2.5" opacity=".8" />
      <Weft d="M140 172C78 152 58 72 118 40c42-44 132-44 174 0 60 32 40 112-22 132-22-30-108-30-130 0Z" />
      <Shade d="M140 172C78 152 58 72 118 40c42-44 132-44 174 0 60 32 40 112-22 132-22-30-108-30-130 0Z" o={.8} />
      <circle cx="153" cy="216" r="8" fill={GOLD} stroke="#2b170d" strokeWidth="2.5" />
      <circle cx="257" cy="216" r="8" fill={GOLD} stroke="#2b170d" strokeWidth="2.5" />
      <rect x="323" y="540" width="15" height="74" rx="6" fill="#2b170d" />
      <circle cx="330" cy="500" r="56" fill="url(#pG)" stroke="#2b170d" strokeWidth="5" />
      <circle cx="330" cy="500" r="30" {...LINE} stroke="#2b170d" strokeWidth="3" />
      <ellipse cx="336" cy="548" rx="19" ry="14" fill={skin} />
      <ellipse cx="72" cy="466" rx="18" ry="14" fill={skin} />
    </svg>
  );
}

/** Àdìrẹ: a wide indigo boubou, a wrapped head tie, hoops, one long strand. */
export function FigureAdire() {
  const skin = "#3f2318";
  return (
    <svg viewBox="0 0 400 640" role="img" aria-label="Faceless illustration of a woman in a wide indigo resist-dyed gown with a wrapped head tie and gold hoops">
      <path d="M150 300C90 320 40 420 20 640h360C360 420 310 320 250 300c-20 22-80 22-100 0Z" fill="url(#pD)" />
      <Weft d="M150 300C90 320 40 420 20 640h360C360 420 310 320 250 300c-20 22-80 22-100 0Z" />
      <Shade d="M150 300C90 320 40 420 20 640h360C360 420 310 320 250 300c-20 22-80 22-100 0Z" o={.95} />
      <g {...LINE} stroke="#070e2e" opacity=".5">
        <path d="M96 400c-18 70-30 150-34 240M304 400c18 70 30 150 34 240M200 330v310" strokeWidth="3.4" />
        <path d="M140 352c-14 86-24 184-28 288M260 352c14 86 24 184 28 288M168 336c-8 96-14 200-14 304M232 336c8 96 14 200 14 304" strokeWidth="1.8" opacity=".6" />
        <path d="M60 470c-10 54-16 112-18 170M340 470c10 54 16 112 18 170" strokeWidth="2.2" opacity=".5" />
      </g>
      <path d="M138 294c30-14 94-14 124 0-28 28-96 28-124 0Z" fill={skin} />
      <path d="M136 296c32-16 96-16 128 0" {...LINE} stroke="#e3e9f4" strokeWidth="2.6" strokeDasharray="5 5" opacity=".85" />
      <path d="M186 226h36l6 66h-48Z" fill={skin} />
      <ellipse cx="204" cy="182" rx="46" ry="58" fill={skin} />
      <ellipse cx="204" cy="182" rx="46" ry="58" fill="url(#gSkin)" />
      <path d="M186 226h36l6 66h-48Z" fill="url(#gSkin)" />
      {beads("M178 294c-30 120 82 120 52 0", 7)}
      <path d="M156 170C120 120 140 40 190 20c60-26 110 40 72 90 28 20 8 60-10 62-16-32-74-34-96-2Z" fill="url(#pD2)" />
      <Weft d="M156 170C120 120 140 40 190 20c60-26 110 40 72 90 28 20 8 60-10 62-16-32-74-34-96-2Z" />
      <Shade d="M156 170C120 120 140 40 190 20c60-26 110 40 72 90 28 20 8 60-10 62-16-32-74-34-96-2Z" o={.85} />
      <path d="M156 170c10-50 50-84 106-60M190 20c20 26 34 60 30 96M150 100c30-8 70-6 100 10M172 46c14 30 20 70 16 112" {...LINE} stroke="#070e2e" strokeWidth="3.2" opacity=".7" />
      <circle cx="262" cy="112" r="15" fill="#1c3185" stroke="#e3e9f4" strokeWidth="2.4" />
      <circle cx="156" cy="226" r="17" {...LINE} stroke="#f0c75a" strokeWidth="5.5" />
      <circle cx="252" cy="226" r="17" {...LINE} stroke="#f0c75a" strokeWidth="5.5" />
      <rect x="282" y="486" width="92" height="56" rx="10" fill="url(#pAh)" stroke="#2b0a10" strokeWidth="3" />
      <ellipse cx="300" cy="492" rx="18" ry="13" fill={skin} />
      <path d="M287 470c8-6 20-6 28 0" {...LINE} stroke={GOLD} strokeWidth="5" />
    </svg>
  );
}

/** Sányán: agbádá over both shoulders, fìlà set to one side, coral, a staff. */
export function FigureSanyan() {
  const skin = "#54301f";
  return (
    <svg viewBox="0 0 400 640" role="img" aria-label="Faceless illustration of a man in a wide tan striped robe with a cap, long coral beads and a staff">
      <path d="M150 250C96 258 40 300 10 470L4 640h392l-6-170C360 300 304 258 250 250c-18 18-82 18-100 0Z" fill="url(#pS)" />
      <Weft d="M150 250C96 258 40 300 10 470L4 640h392l-6-170C360 300 304 258 250 250c-18 18-82 18-100 0Z" />
      <Shade d="M150 250C96 258 40 300 10 470L4 640h392l-6-170C360 300 304 258 250 250c-18 18-82 18-100 0Z" o={.9} />
      <g {...LINE} stroke="#3a2010" opacity=".55">
        <path d="M112 300c-30 60-52 150-58 250M288 300c30 60 52 150 58 250M140 430c-8 70-10 140-8 210M260 430c8 70 10 140 8 210" strokeWidth="3.4" />
        <path d="M86 330c-26 62-44 146-50 230M314 330c26 62 44 146 50 230M118 440c-8 66-12 134-12 200M282 440c8 66 12 134 12 200" strokeWidth="1.8" opacity=".6" />
        <path d="M150 262c-14 26-30 46-50 60M250 262c14 26 30 46 50 60" strokeWidth="2.4" opacity=".75" />
      </g>
      <path d="M166 258h68l-8 196h-52Z" fill="#f3e8cb" />
      <path d="M166 258h68l-8 196h-52Z" fill="url(#embroid)" opacity=".85" />
      <Weft d="M166 258h68l-8 196h-52Z" />
      <Shade d="M166 258h68l-8 196h-52Z" o={.5} />
      <g {...LINE} stroke="#8c5a22" strokeWidth="2.6">
        <path d="M200 290l26 30-26 30-26-30ZM200 304l14 16-14 16-14-16ZM200 366l20 24-20 24-20-24ZM182 258v-0M174 454h52" />
        <path d="M200 350v16M200 414v28" />
        <path d="M178 276h44M176 288h48M180 436h40" strokeWidth="1.8" opacity=".7" />
        <path d="M188 318l-6 4M212 318l6 4M188 382l-6 4M212 382l6 4" strokeWidth="1.6" opacity=".6" />
      </g>
      <path d="M184 200h32l6 58h-44Z" fill={skin} />
      <ellipse cx="200" cy="160" rx="44" ry="54" fill={skin} />
      <ellipse cx="200" cy="160" rx="44" ry="54" fill="url(#gSkin)" />
      <path d="M184 200h32l6 58h-44Z" fill="url(#gSkin)" />
      {beads("M178 258c-34 190 78 190 44 0", 8)}
      <path d="M152 134c-4-46 38-66 86-54 26 4 32 26 12 40l-4 20c-26-16-66-18-94-6Z" fill="url(#pSd)" />
      <Weft d="M152 134c-4-46 38-66 86-54 26 4 32 26 12 40l-4 20c-26-16-66-18-94-6Z" />
      <Shade d="M152 134c-4-46 38-66 86-54 26 4 32 26 12 40l-4 20c-26-16-66-18-94-6Z" o={.7} />
      <path d="M152 134c22-22 62-28 98-14M238 80c-2 16-8 30-18 40M176 86c6 18 8 36 6 52" {...LINE} stroke="#3a2010" strokeWidth="3.2" opacity=".7" />
      <rect x="325" y="300" width="10" height="340" rx="5" fill="#26140b" />
      <circle cx="330" cy="292" r="14" fill={GOLD} />
      <path d="M322 318h16M322 330h16" {...LINE} stroke={GOLD} strokeWidth="3" />
      <ellipse cx="330" cy="452" rx="17" ry="14" fill={skin} />
      <ellipse cx="60" cy="478" rx="17" ry="14" fill={skin} />
    </svg>
  );
}

const Head = ({ skin, cx = 100 }: { skin: string; cx?: number }) => (
  <>
    <rect x={cx - 9} y="76" width="18" height="26" fill={skin} />
    <ellipse cx={cx} cy="52" rx="23" ry="29" fill={skin} />
  </>
);
const Limb = ({ d, skin, w = 14 }: { d: string; skin: string; w?: number }) => <path d={d} {...LINE} stroke={skin} strokeWidth={w} />;

/** The same three cloths, cut for now. */
export function Piece({ i }: { i: number }) {
  if (i === 0) {
    const s = "#54301f";
    return (
      <svg viewBox="0 0 200 520" aria-hidden>
        <path d="M60 286h80l14 204h-46l-8-150-8 150H46Z" fill="url(#pA)" />
        <rect x="42" y="490" width="56" height="12" rx="5" fill="#15110e" />
        <rect x="102" y="490" width="56" height="12" rx="5" fill="#15110e" />
        <Head skin={s} />
        <path d="M36 114q64-18 128 0l10 188H26Z" fill="url(#pA)" />
        <path d="M88 100h24l-12 60Z" fill="#f3e8cb" />
        <path d="M100 200L80 104l20 22 20-22Z" fill="#1d1113" />
        <path d="M100 200v102M84 226h.1M84 250h.1M116 226h.1M116 250h.1" {...LINE} stroke="#1d1113" strokeWidth="5" />
        <circle cx="32" cy="308" r="10" fill={s} />
        <circle cx="168" cy="308" r="10" fill={s} />
        <path d="M74 40c-2-24 20-34 46-28 14 2 17 14 6 21l-2 11c-14-8-36-9-50-4Z" fill="url(#pD2)" />
      </svg>
    );
  }
  if (i === 1) {
    const s = "#6a3924";
    return (
      <svg viewBox="0 0 200 520" aria-hidden>
        <Limb d="M86 296l-3 180M114 296l3 180" skin={s} w={17} />
        <path d="M70 478h26l2 14H66ZM104 478h26l4 14h-32Z" fill="#15110e" />
        <Limb d="M70 114l-16 110M130 114l16 110" skin={s} />
        <path d="M66 104q34-8 68 0l-6 28H72Z" fill={s} />
        <Head skin={s} />
        <path d="M70 124q30 12 60 0l-8 56 6 38H72l6-38Z" fill="url(#pD)" />
        <path d="M100 132v84M86 130l-2 86M114 130l2 86" {...LINE} stroke="#e3e9f4" strokeWidth="1.6" opacity=".8" />
        <path d="M72 214h56l20 84H52Z" fill="url(#pA)" />
        <path d="M58 46C40 0 100 6 100 6s70-10 46 44c-22-18-66-20-88-4Z" fill="url(#pAd)" />
        <path d="M58 46c14-22 34-34 42-40M100 6c18 8 34 22 46 44" {...LINE} stroke="#3a0610" strokeWidth="2.4" opacity=".7" />
        {beads("M84 100c8 16 24 16 32 0", 5)}
      </svg>
    );
  }
  if (i === 2) {
    const s = "#3f2318";
    return (
      <svg viewBox="0 0 200 520" aria-hidden>
        <Limb d="M130 112l18 120M70 112l-14 96" skin={s} />
        <path d="M66 104q34-8 68 0l-4 26H70Z" fill={s} />
        <Head skin={s} />
        <circle cx="100" cy="18" r="17" fill="#15110e" />
        <path d="M70 104l60 20-6 80 28 266q16 30 44 36H36l42-302Z" fill="url(#pS)" />
        <path d="M96 210c-8 100-24 200-44 290M124 204c14 110 34 210 56 290" {...LINE} stroke="#4a2c12" strokeWidth="2.6" opacity=".6" />
        <circle cx="76" cy="62" r="6" fill={GOLD} />
        <circle cx="124" cy="62" r="6" fill={GOLD} />
        <path d="M49 196c6-4 12-4 18 0" {...LINE} stroke={GOLD} strokeWidth="5" />
      </svg>
    );
  }
  if (i === 3) {
    const s = "#54301f";
    return (
      <svg viewBox="0 0 200 520" aria-hidden>
        <path d="M74 202h52l52 290h-74l-4-190-4 190H22Z" fill="url(#pD)" />
        <rect x="76" y="188" width="48" height="18" fill={s} />
        <Limb d="M50 186l-6 84M150 186l6 84" skin={s} />
        <Head skin={s} />
        <path d="M52 106q48-12 96 0l6 86H46Z" fill="url(#pS)" />
        <path d="M86 102q14 16 28 0" {...LINE} stroke="#4a2c12" strokeWidth="3" />
        <path d="M74 40c-2-24 20-34 46-28 14 2 17 14 6 21l-2 11c-14-8-36-9-50-4Z" fill="url(#pAd)" />
        <rect x="26" y="492" width="66" height="10" rx="5" fill="#15110e" />
        <rect x="108" y="492" width="66" height="10" rx="5" fill="#15110e" />
      </svg>
    );
  }
  const cap = (y: number, fill: string, tilt: number) => (
    <g transform={`rotate(${tilt} 100 ${y})`}>
      <path d={`M52 ${y}h96l5-48q-12-30-56-26-46-2-52 24Z`} fill={fill} />
      <path d={`M48 ${y - 46}q40-20 104-4`} {...LINE} stroke="#15110e" strokeWidth="2.6" opacity=".55" />
    </g>
  );
  return (
    <svg viewBox="0 0 200 520" aria-hidden>
      {cap(300, "url(#pSd)", 3)}
      {cap(226, "url(#pD2)", -4)}
      {cap(152, "url(#pAd)", 5)}
      <path d="M70 392q30-52 60 0" {...LINE} stroke="#15110e" strokeWidth="6" />
      <rect x="46" y="390" width="108" height="78" rx="12" fill="url(#pA)" stroke="#15110e" strokeWidth="3" />
      <circle cx="100" cy="412" r="7" fill={GOLD} />
      {beads("M30 500q70 26 140 0", 8)}
    </svg>
  );
}
