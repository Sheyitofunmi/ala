import * as THREE from "three";
import { makeWeave } from "./weave";

export type FabricUniforms = {
  uDye: { value: THREE.Color };
  uFrom: { value: number };
  uTo: { value: number };
  uMix: { value: number };
  uSize: { value: THREE.Vector2 };
};
export type Fabric = THREE.MeshPhysicalMaterial & { userData: { u: FabricUniforms } };

let weave: ReturnType<typeof makeWeave> | null = null;

/**
 * One woven material, four cloths: 0 undyed àlà, 1 àlàárì, 2 àdìrẹ, 3 sányán.
 * `size` is the piece in metres, so stripes and motifs stay true to scale.
 */
export function createFabric(pattern: number, width: number, height: number): Fabric {
  if (!weave) weave = makeWeave(128);
  const map = weave.map.clone();
  const normalMap = weave.normalMap.clone();
  map.repeat.set(width * 125, height * 125);
  normalMap.repeat.set(width * 125, height * 125);
  map.needsUpdate = normalMap.needsUpdate = true;
  const u: FabricUniforms = {
    uDye: { value: new THREE.Color("#5c0d14") },
    uFrom: { value: pattern },
    uTo: { value: pattern },
    uMix: { value: 1 },
    uSize: { value: new THREE.Vector2(width, height) },
  };
  const m = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color("#ffffff"),
    roughness: 0.93,
    metalness: 0,
    sheen: 0.32,
    sheenRoughness: 0.55,
    sheenColor: new THREE.Color("#fff4de"),
    map,
    normalMap,
    normalScale: new THREE.Vector2(0.85, 0.85),
    side: THREE.DoubleSide,
    shadowSide: THREE.DoubleSide,
    envMapIntensity: 0.25,
  }) as Fabric;
  m.userData.u = u;
    m.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, u);
      shader.vertexShader = shader.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float aStain;\nvarying float vStain;\nvarying vec2 vCuv;")
        .replace("#include <begin_vertex>", "#include <begin_vertex>\nvStain = aStain;\nvCuv = uv;");
      shader.fragmentShader = shader.fragmentShader
        .replace(
          "#include <common>",
          /* glsl */ `#include <common>
          uniform vec3 uDye;
          uniform float uFrom;
          uniform float uTo;
          uniform float uMix;
          uniform vec2 uSize;
          varying float vStain;
          varying vec2 vCuv;
          float clothGloss = 0.0;
          float h21(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
          float vnoise(vec2 p){
            vec2 i = floor(p), f = fract(p);
            f = f * f * (3.0 - 2.0 * f);
            return mix(mix(h21(i), h21(i + vec2(1.0, 0.0)), f.x), mix(h21(i + vec2(0.0, 1.0)), h21(i + vec2(1.0, 1.0)), f.x), f.y);
          }
          vec3 S(float r, float g, float b){ return pow(vec3(r, g, b) / 255.0, vec3(2.2)); }
          float band(float m, float a, float b, float w){ return smoothstep(a - w, a + w, m) * (1.0 - smoothstep(b - w, b + w, m)); }

          // Àlà: undyed, one red thread at each selvedge
          vec4 patWhite(vec2 p, float slub){
            vec3 c = S(246.0, 240.0, 227.0) * (0.925 + 0.1 * slub);
            float e = abs(vCuv.y - 0.5);
            float sel = smoothstep(0.4780, 0.4792, e) * (1.0 - smoothstep(0.4838, 0.4850, e));
            return vec4(mix(c, S(92.0, 13.0, 20.0), sel * 0.92), 0.0);
          }

          // Àlàárì: crimson strip-weave, a hand wide, with gold supplementary thread
          vec4 patAlaari(vec2 p, float slub){
            float m = abs(fract(p.x / 0.1) - 0.5) * 2.0;
            float w = fwidth(m) * 0.8 + 0.006;
            vec3 c = S(134.0, 20.0, 34.0) * (0.84 + 0.26 * slub);
            float deep = band(m, 0.52, 0.80, w);
            c = mix(c, S(70.0, 9.0, 22.0), deep);
            c = mix(c, S(22.0, 14.0, 18.0), band(m, 0.15, 0.19, w));
            c = mix(c, S(236.0, 224.0, 198.0), band(m, 0.335, 0.356, w));
            float gold = band(m, -0.2, 0.075, w);
            float blk = band(fract(p.y / 0.4), 0.40, 0.60, 0.01);
            vec2 q = p / 0.0125;
            float dia = abs(fract(q.x) - 0.5) + abs(fract(q.y) - 0.5);
            float aa = clamp(1.0 - fwidth(q.x) * 1.2, 0.0, 1.0);
            gold = max(gold, deep * blk * mix(0.45, 1.0 - smoothstep(0.24, 0.32, dia), aa));
            c = mix(c, S(222.0, 176.0, 78.0) * (0.78 + 0.5 * slub), gold);
            c = mix(c, S(38.0, 5.0, 12.0), smoothstep(0.962, 0.99, m));
            return vec4(c, gold);
          }

          // Àdìrẹ: indigo, the pattern drawn in paste before the dye
          vec4 patAdire(vec2 p, float slub){
            p += (vec2(vnoise(p * 34.0), vnoise(p * 34.0 + 7.3)) - 0.5) * 0.007;
            vec2 g = p / 0.2;
            vec2 id = floor(g);
            vec2 f = fract(g) - 0.5;
            float k = h21(id + 3.1);
            float r = length(f);
            float sq = max(abs(f.x), abs(f.y));
            float d;
            if (k < 0.25) { d = max(abs(fract(r * 5.0 + 0.25) - 0.5) / 5.0, r - 0.42); }
            else if (k < 0.5) { d = max(length(fract(f * 5.0) - 0.5) / 5.0 - 0.03, sq - 0.4); }
            else if (k < 0.75) { d = max(min(abs(fract((f.x + f.y) * 4.0) - 0.5), abs(fract((f.x - f.y) * 4.0) - 0.5)) / 4.0, sq - 0.4); }
            else { float pet = cos(atan(f.y, f.x) * 8.0) * 0.5 + 0.5; d = min(abs(r - (0.17 + 0.2 * pet)), r - 0.06); }
            float lw = 0.017 + fwidth(g.x) * 0.5;
            float resist = 1.0 - smoothstep(lw, lw + 0.014 + fwidth(g.x), d);
            resist = max(resist, band(sq, 0.452, 0.476, 0.006 + fwidth(g.x)));
            float tone = vnoise(p * 5.0) * 0.6 + vnoise(p * 80.0) * 0.4;
            vec3 indigo = mix(S(15.0, 26.0, 72.0), S(40.0, 66.0, 134.0), tone * 0.6) * (0.84 + 0.26 * slub);
            vec3 pale = S(216.0, 224.0, 234.0) * (0.88 + 0.14 * slub);
            // where the paste cracked, the dye got in
            float crack = smoothstep(0.62, 0.7, vnoise(p * 150.0) * vnoise(p * 61.0 + 2.0) * 2.2);
            return vec4(mix(indigo, pale, resist * (0.9 - 0.5 * crack)), 0.0);
          }

          // Sányán: wild silk, the colour it comes
          vec4 patSanyan(vec2 p, float slub){
            float m = abs(fract(p.x / 0.1) - 0.5) * 2.0;
            float w = fwidth(m) * 0.8 + 0.006;
            float heather = vnoise(p * vec2(900.0, 40.0)) * 0.5 + vnoise(p * vec2(30.0, 700.0)) * 0.5;
            vec3 c = mix(S(160.0, 112.0, 60.0), S(210.0, 172.0, 112.0), heather) * (0.88 + 0.18 * slub);
            c = mix(c, S(242.0, 232.0, 206.0), band(m, -0.2, 0.115, w));
            c = mix(c, S(86.0, 52.0, 26.0), band(m, 0.30, 0.325, w));
            c = mix(c, S(86.0, 52.0, 26.0), band(m, 0.37, 0.395, w));
            c = mix(c, S(104.0, 70.0, 36.0), smoothstep(0.962, 0.99, m));
            return vec4(c, 0.3);
          }

          vec4 pattern(float id, vec2 p, float slub){
            if (id < 0.5) return patWhite(p, slub);
            if (id < 1.5) return patAlaari(p, slub);
            if (id < 2.5) return patAdire(p, slub);
            return patSanyan(p, slub);
          }`
        )
        .replace(
          "#include <color_fragment>",
          /* glsl */ `#include <color_fragment>
          float lum = diffuseColor.g;
          vec2 pm = vCuv * uSize;
          // hand-spun yarn is never even: long slubs along warp and weft
          float slub = vnoise(vCuv * vec2(16.0, 460.0)) * 0.6 + vnoise(vCuv * vec2(560.0, 11.0)) * 0.4;
          float fibre = vnoise(vCuv * vec2(250.0, 170.0)) * 0.45 + vnoise(vCuv * vec2(46.0, 30.0)) * 0.55;
          vec4 pat = pattern(uTo, pm, slub);
          if (uMix < 0.999) {
            // the new colour arrives the way dye does: wicking down from the pinned edge
            float front = smoothstep(0.0, 0.16, uMix * 1.5 - (1.0 - vCuv.y) - (fibre - 0.5) * 0.3);
            pat = mix(pattern(uFrom, pm, slub), pat, front);
          }
          diffuseColor.rgb = pat.rgb * lum;
          clothGloss = pat.a;
          // where it was held: dye that set, ragged at the edge and darker there (a tide line)
          float sv = vStain + (fibre - 0.5) * 0.26 * smoothstep(0.0, 0.08, vStain);
          float s = smoothstep(0.09, 0.3, sv);
          float tide = s * (1.0 - smoothstep(0.3, 0.55, sv));
          vec3 mark = mix(pat.rgb * 0.16, uDye, 0.6) * (1.0 - 0.38 * tide) * (0.9 + 0.2 * slub);
          diffuseColor.rgb = mix(diffuseColor.rgb, mark, s * 0.95);`
        )
        .replace(
          "#include <roughnessmap_fragment>",
          "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.36, clothGloss);"
        );
    };
  m.customProgramCacheKey = () => "ala-fabric";
  return m;
}

export function resizeFabric(m: Fabric, width: number, height: number) {
  m.userData.u.uSize.value.set(width, height);
  m.map!.repeat.set(width * 125, height * 125);
  m.normalMap!.repeat.set(width * 125, height * 125);
}
