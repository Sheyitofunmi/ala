# ÀLÀ — Cloth remembers

A concept site for an invented Lagos fashion house built around three handwoven cloths:
àlàárì (crimson strip-weave), àdìrẹ (indigo resist-dye) and sányán (wild silk).

One length of cloth is simulated in real time and follows you through the whole page.
It opens as a curtain, is drawn aside for each look, changes dye as you scroll,
and keeps a mark wherever you hold it.

## What is in it

- **Real-time cloth**: a position-based solver written for this site (`src/lib/cloth.ts`):
  verlet integration, distance and bend constraints, animated pins, wind, and a dye
  field that wicks outward from wherever the cloth is held.
- **Procedural textiles** (`src/lib/fabric.ts`, `src/lib/weave.ts`): the plain weave,
  the strip-woven stripes, the gold supplementary thread and the hand-drawn àdìrẹ
  motifs are all generated in the shader. There are no image textures.
- **Original illustration** (`src/components/Figures.tsx`): every figure is a faceless
  vector drawing made for this project. No photographs and no real people.
- **Tuntun**: the same three cloths cut as a suit, a corset and mini, a gown, wide
  trousers and accessories. Choosing a piece re-dyes the 3D length.

## Stack

Next.js (App Router), React Three Fiber, three.js, Lenis, TypeScript. Fonts are
self-hosted through Fontsource (Bodoni Moda, Spectral, IBM Plex Mono).

## Run it

```bash
npm install
npm run dev
```

ÀLÀ is a concept house. Nothing here is for sale.
