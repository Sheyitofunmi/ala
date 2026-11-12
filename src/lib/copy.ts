export type Lang = "en" | "yo";

type Look = { no: string; name: string; gloss: string; prose: string; specs: [string, string][] };

type Copy = {
  tagline: [string, string];
  sub: string;
  hintHold: string;
  hintScroll: string;
  collection: string;
  held: string;
  chapters: string;
  looks: Record<string, Look>;
  tuntun: { no: string; gloss: string; prose: string; pieces: { name: string; note: string }[] };
  weave: { title: string; gloss: string; big: string; small: string; specs: [string, string][] };
  yours: {
    title: string;
    gloss: string;
    empty: string;
    counted: (n: number) => string;
    fitting: string;
    wash: string;
    note: string;
    credit: string;
  };
  form: {
    name: string;
    email: string;
    message: string;
    placeholder: string;
    send: string;
    sending: string;
    sent: string;
    failed: string;
    close: string;
    required: string;
    badEmail: string;
  };
  index: string[];
  sound: [string, string];
  langLabel: string;
  loading: string;
};

const EN: Copy = {
  tagline: ["Cloth ", "remembers."],
  sub: "A house of handwoven cloth. Lagos.",
  hintHold: "Hold the cloth. Drag it. Let go.",
  hintScroll: "Scroll to unpin it",
  collection: "Collection 01 · Three Cloths",
  held: "Held",
  chapters: "Chapters",
  looks: {
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
  },
  tuntun: {
    no: "N° 04",
    gloss: "new, in Yorùbá",
    prose: "The same three cloths, cut for now. Choose a piece and the length beside it takes its colour.",
    pieces: [
      { name: "The suit", note: "Double-breasted, in àlàárì" },
      { name: "The corset & mini", note: "Boned àdìrẹ, àlàárì skirt" },
      { name: "The gown", note: "One shoulder, in sányán" },
      { name: "The wide trouser", note: "Àdìrẹ, with a sányán top" },
      { name: "The pieces", note: "Fìlà, coral, a small bag" },
    ],
  },
  weave: {
    title: "The weave",
    gloss: "strip by strip",
    big: "Woven a hand wide on a narrow loom, then sewn edge to edge. Twenty-four strips make one length.",
    small: "Where you held it, it has kept you.",
    specs: [["Strip", "10 cm"], ["Fibre", "Cotton, hand-spun"], ["Gold", "Supplementary weft"]],
  },
  yours: {
    title: "Yours",
    gloss: "the record",
    empty: "Under every colour, the white cloth. This one has not been held yet. Go back and hold it.",
    counted: (n) => `Under every colour, the white cloth keeps count. You held it ${n} ${n === 1 ? "time" : "times"}. It will not be washed.`,
    fitting: "Request a fitting",
    wash: "Wash it anyway",
    note: "Fittings are by introduction only, in Lagos. ÀLÀ is a concept house: nothing here is for sale, and the figures are drawn, not photographed.",
    credit: "Concept, illustration and build",
  },
  form: {
    name: "Your name",
    email: "Email",
    message: "What you are looking for",
    placeholder: "A cloth, an occasion, a date…",
    send: "Send it",
    sending: "Sending",
    sent: "Received. You will hear back.",
    failed: "That did not send. Try again.",
    close: "Close",
    required: "This one is needed",
    badEmail: "Check this address",
  },
  index: ["Curtain", "Àlà", "Àlàárì", "Àdìrẹ", "Sányán", "Tuntun", "Weave", "Yours"],
  sound: ["Sound off", "Sound on"],
  langLabel: "Yorùbá",
  loading: "Warping the loom",
};

const YO: Copy = {
  tagline: ["Aṣọ ", "ń rántí."],
  sub: "Ilé aṣọ tí a fi ọwọ́ hun. Èkó.",
  hintHold: "Mú aṣọ náà. Fà á. Jọ̀wọ́ rẹ̀ lọ.",
  hintScroll: "Yí síṣàlẹ̀ láti tú u",
  collection: "Àkójọ 01 · Aṣọ Mẹ́ta",
  held: "Mímú",
  chapters: "Àwọn Ìpín",
  looks: {
    ala: {
      no: "Nọ́ 00",
      name: "Àlà",
      gloss: "aṣọ funfun",
      prose:
        "Ṣáájú aṣọ, gígùn ló wà. Mítà méjì ààbọ̀ ní ìlà, mítà kan ààbọ̀ ní fífẹ̀, a fi ọwọ́ hun un, kò sì sí ẹni tí ó gé e. Gbogbo ohun tí ilé yìí ń ṣe bẹ̀rẹ̀ bí èyí.",
      specs: [["Gígùn", "2.40 m"], ["Fífẹ̀", "1.60 m"], ["Gígé", "0"]],
    },
    alaari: {
      no: "Nọ́ 01",
      name: "Àlàárì",
      gloss: "aṣọ pupa",
      prose:
        "A hun un ní ṣóńṣó, fífẹ̀ ọwọ́ kan, pupa tí wúrà là kọjá. A wọ̀ ọ́ bí ìró àti bùbá lábẹ́ gèlè, iyùn sí ọrùn, abẹ̀bẹ̀ sí ọwọ́.",
      specs: [["Aṣọ", "Àlàárì"], ["Ṣóńṣó", "24"], ["Pẹ̀lú", "Gèlè, iyùn, abẹ̀bẹ̀"]],
    },
    adire: {
      no: "Nọ́ 02",
      name: "Àdìrẹ",
      gloss: "aṣọ elú",
      prose:
        "A fi ọwọ́ kọ ọ́ pẹ̀lú èlò, kí a tó tẹ̀ ẹ́ sínú arò, nítorí náà kò sí aṣọ méjì tí ó jọra. A gé e ní fífẹ̀ kí ó lè máa lọ.",
      specs: [["Aṣọ", "Àdìrẹ"], ["Arò", "Elú, pẹ̀lú ọwọ́"], ["Pẹ̀lú", "Yẹtí, àpò kékeré"]],
    },
    sanyan: {
      no: "Nọ́ 03",
      name: "Sányán",
      gloss: "síliki igbó",
      prose:
        "Àwọ̀ tí síliki igbó ti wá. A gé e bí agbádá, aṣọ fífẹ̀ kan lórí èjìká méjèèjì, a fi ọwọ́ ṣe àyà rẹ̀. Fìlà sí ẹ̀gbẹ́ kan. Ọ̀pá, nítorí ó lè.",
      specs: [["Aṣọ", "Sányán"], ["Gígé", "Agbádá"], ["Pẹ̀lú", "Fìlà, iyùn, ọ̀pá"]],
    },
  },
  tuntun: {
    no: "Nọ́ 04",
    gloss: "tuntun",
    prose: "Aṣọ mẹ́ta kan náà, tí a gé fún òde òní. Yan ọ̀kan, aṣọ tí ó wà lẹ́gbẹ̀ẹ́ rẹ̀ yóò gba àwọ̀ rẹ̀.",
    pieces: [
      { name: "Sùútù", note: "Bọ́tínì méjì, ní àlàárì" },
      { name: "Kósẹ́tì àti yẹ̀rí", note: "Àdìrẹ líle, yẹ̀rí àlàárì" },
      { name: "Gáwùnù", note: "Èjìká kan, ní sányán" },
      { name: "Ṣòkòtò fífẹ̀", note: "Àdìrẹ, pẹ̀lú òkè sányán" },
      { name: "Àwọn ohun èlò", note: "Fìlà, iyùn, àpò kékeré" },
    ],
  },
  weave: {
    title: "Ìhunṣọ",
    gloss: "ṣóńṣó kan ṣóńṣó kan",
    big: "A hun un ní fífẹ̀ ọwọ́ kan lórí ọ̀ṣà, lẹ́yìn náà a rán wọn pọ̀ ní etí dé etí. Ṣóńṣó mẹ́rìnlélógún ni ó ṣe aṣọ kan.",
    small: "Níbi tí o ti mú u, ó ti pa ọ́ mọ́.",
    specs: [["Ṣóńṣó", "10 cm"], ["Òwú", "Òwú, a fi ọwọ́ ran"], ["Wúrà", "Òwú àfikún"]],
  },
  yours: {
    title: "Tìrẹ",
    gloss: "àkọsílẹ̀",
    empty: "Lábẹ́ gbogbo àwọ̀, aṣọ funfun. A kò tíì mú èyí. Padà kí o sì mú un.",
    counted: (n) => `Lábẹ́ gbogbo àwọ̀, aṣọ funfun ń ka. O mú un ní ìgbà ${n}. A kò ní fọ̀ ọ́.`,
    fitting: "Béèrè fún ìdiwọ̀n",
    wash: "Fọ̀ ọ́ lọ́nàkọnà",
    note: "Ìdiwọ̀n jẹ́ nípasẹ̀ ìfihàn nìkan, ní Èkó. ÀLÀ jẹ́ ilé èrò: kò sí ohun tí a ń tà níbí, a sì kọ àwòrán àwọn ènìyàn náà, a kò yà wọ́n ní fọ́tò.",
    credit: "Èrò, àwòrán àti ìkọ́",
  },
  form: {
    name: "Orúkọ rẹ",
    email: "Ìmẹ́ìlì",
    message: "Ohun tí ò ń wá",
    placeholder: "Aṣọ, ayẹyẹ, ọjọ́…",
    send: "Fi ránṣẹ́",
    sending: "Ó ń lọ",
    sent: "A ti gbà á. Wàá gbọ́ padà.",
    failed: "Kò lọ. Gbìyànjú lẹ́ẹ̀kan sí i.",
    close: "Tì í",
    required: "A nílò èyí",
    badEmail: "Ṣàyẹ̀wò àdírẹ́sì yìí",
  },
  index: ["Aṣọ Ìkélé", "Àlà", "Àlàárì", "Àdìrẹ", "Sányán", "Tuntun", "Ìhunṣọ", "Tìrẹ"],
  sound: ["Ìró kú", "Ìró ń lọ"],
  langLabel: "English",
  loading: "Ń to ọ̀ṣà",
};

export const COPY: Record<Lang, Copy> = { en: EN, yo: YO };
