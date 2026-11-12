import * as THREE from "three";

// Plain weave, generated: one tile is two warp ends by two weft picks.
export function makeWeave(size = 128) {
  const h = new Float32Array(size * size);
  const hash = (x: number, y: number) => {
    const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return s - Math.floor(s);
  };
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const tx = (x / size) * 2, ty = (y / size) * 2;
      const ix = Math.floor(tx), iy = Math.floor(ty);
      const fx = tx - ix - 0.5, fy = ty - iy - 0.5;
      const over = (ix + iy) % 2 === 0;
      const warpProfile = Math.cos(fx * Math.PI * 0.96);
      const weftProfile = Math.cos(fy * Math.PI * 0.96);
      const my = 0.5 + 0.5 * Math.cos(fy * Math.PI * 2);
      const mx = 0.5 + 0.5 * Math.cos(fx * Math.PI * 2);
      const warp = warpProfile * (0.5 + (over ? 0.5 : -0.3) * my);
      const weft = weftProfile * (0.5 + (over ? -0.3 : 0.5) * mx);
      // the ply twist: fine diagonal ridges along whichever thread is on top
      const top = warp > weft;
      const twist = top ? Math.sin((fy * 9 + fx * 5) * Math.PI * 2) : Math.sin((fx * 9 - fy * 5) * Math.PI * 2);
      h[y * size + x] = Math.max(warp, weft) + twist * 0.045 + (hash(x, y) - 0.5) * 0.05;
    }
  }
  const normal = new Uint8Array(size * size * 4);
  const albedo = new Uint8Array(size * size * 4);
  const at = (x: number, y: number) => h[((y + size) % size) * size + ((x + size) % size)];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * 2.4;
      const dy = (at(x, y + 1) - at(x, y - 1)) * 2.4;
      const l = Math.hypot(dx, dy, 1);
      const i = (y * size + x) * 4;
      normal[i] = (-dx / l * 0.5 + 0.5) * 255;
      normal[i + 1] = (-dy / l * 0.5 + 0.5) * 255;
      normal[i + 2] = (1 / l * 0.5 + 0.5) * 255;
      normal[i + 3] = 255;
      const v = Math.max(0, Math.min(1, 0.84 + 0.16 * Math.min(1, Math.max(0, at(x, y) * 1.25))));
      albedo[i] = albedo[i + 1] = albedo[i + 2] = v * 255;
      albedo[i + 3] = 255;
    }
  }
  const mk = (data: Uint8Array, srgb: boolean) => {
    const t = new THREE.DataTexture(data, size, size, THREE.RGBAFormat);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.magFilter = THREE.LinearFilter;
    t.minFilter = THREE.LinearMipmapLinearFilter;
    t.generateMipmaps = true;
    t.anisotropy = 8;
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.needsUpdate = true;
    return t;
  };
  return { normalMap: mk(normal, false), map: mk(albedo, true) };
}
