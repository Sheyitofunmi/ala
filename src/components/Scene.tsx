"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ClothSim } from "@/lib/cloth";
import { createFabric } from "@/lib/fabric";
import { CLOTH_H, CLOTH_W, canopy, curtain, gathered, hung, loom } from "@/lib/looks";
import { sound } from "@/lib/sound";
import { CHAPTERS, PIECES, stage } from "@/lib/stage";

function World() {
  const { camera, gl, size } = useThree();
  const small = size.width < 760;

  const sim = useMemo(() => {
    const s = small ? new ClothSim(54, 37, CLOTH_W, CLOTH_H) : new ClothSim(76, 51, CLOTH_W, CLOTH_H);
    s.place((u, v, o) => {
      o[0] = (u - 0.5) * 2.02;
      o[1] = 2.06 - v * CLOTH_H * 0.9;
      o[2] = 0.3 + 0.03 * Math.sin(u * Math.PI * 18) + v * v * 0.95;
    });
    s.setPins(curtain(s), 0.01);
    return s;
    // the grid is chosen once; resizing does not rebuild the cloth
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const geometry = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const dyn = (a: THREE.BufferAttribute) => a.setUsage(THREE.DynamicDrawUsage);
    g.setAttribute("position", dyn(new THREE.BufferAttribute(sim.pos, 3)));
    g.setAttribute("normal", dyn(new THREE.BufferAttribute(sim.normals, 3)));
    g.setAttribute("aStain", dyn(new THREE.BufferAttribute(sim.stain, 1)));
    g.setAttribute("uv", new THREE.BufferAttribute(sim.uv, 2));
    g.setIndex(new THREE.BufferAttribute(sim.index, 1));
    g.setDrawRange(0, sim.indexCount);
    return g;
  }, [sim]);

  const material = useMemo(() => createFabric(0, CLOTH_W, CLOTH_H), []);
  const key = useRef<THREE.DirectionalLight>(null!);
  const rim = useRef<THREE.DirectionalLight>(null!);
  const hemi = useRef<THREE.HemisphereLight>(null!);

  const rig = useRef({
    cam: new THREE.Vector3(...CHAPTERS[0].cam),
    look: new THREE.Vector3(...CHAPTERS[0].look),
    key: new THREE.Vector3(...CHAPTERS[0].key),
    light: 0,
    wind: new THREE.Vector3(),
    intro: 0,
  });
  const ptr = useRef({ x: 0, y: 0, sx: 0, sy: 0, wantGrab: false, depth: 0, touch: false, has: false });
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const prevDir = useRef(new THREE.Vector3(0, 0, -1));
  const tmp = useMemo(() => ({ a: new THREE.Vector3(), b: new THREE.Vector3(), c: new THREE.Vector3(), ndc: new THREE.Vector2() }), []);

  // direction: every chapter is the same length of cloth, pinned differently
  useEffect(() => {
    stage.sim = sim;
    let current = -1;
    const apply = () => {
      const ch = stage.get().chapter;
      if (ch === current) return;
      current = ch;
      const id = CHAPTERS[ch].id;
      const narrow = window.innerWidth / window.innerHeight < 1;
      if (id === "curtain") sim.setPins(curtain(sim), 1.7);
      else if (id === "ala") sim.setPins(canopy(sim), 1.9);
      else if (id === "adire") sim.setPins(narrow ? gathered(sim, -1.18, -0.42) : gathered(sim, -2.0, -0.52), 1.8);
      else if (id === "alaari" || id === "sanyan" || id === "tuntun")
        sim.setPins(narrow ? gathered(sim, 0.42, 1.18) : gathered(sim, 0.52, 2.0), 1.8);
      else if (id === "weave") sim.setPins(loom(sim), 1.8);
      else sim.setPins(hung(sim), 1.9);
    };
    apply();
    return stage.subscribe(apply);
  }, [sim]);

  useEffect(() => {
    const p = ptr.current;
    const set = (e: PointerEvent) => {
      p.x = (e.clientX / window.innerWidth) * 2 - 1;
      p.y = -(e.clientY / window.innerHeight) * 2 + 1;
      p.touch = e.pointerType === "touch";
      p.has = true;
    };
    const down = (e: PointerEvent) => {
      if ((e.target as HTMLElement).closest("button, a")) return;
      set(e);
      p.wantGrab = true;
    };
    const up = () => {
      p.wantGrab = false;
      if (sim.grabbing) sim.release();
      stage.set({ grabbing: false });
    };
    window.addEventListener("pointermove", set, { passive: true });
    window.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
    window.addEventListener("blur", up);
    return () => {
      window.removeEventListener("pointermove", set);
      window.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      window.removeEventListener("blur", up);
    };
  }, [sim]);

  useEffect(() => {
    gl.toneMapping = THREE.ACESFilmicToneMapping;
    gl.toneMappingExposure = 1.0;
  }, [gl]);

  useFrame((state, rawDt) => {
    const dt = Math.min(rawDt, 1 / 30);
    const t = state.clock.elapsedTime;
    const r = rig.current;
    const p = ptr.current;
    const st = stage.get();
    const ch = CHAPTERS[st.chapter];
    const aspect = size.width / size.height;

    // camera
    const k = 1 - Math.exp(-dt * 1.55);
    const { a, b, c, ndc } = tmp;
    a.set(...ch.cam);
    b.set(...ch.look);
    if (aspect < 1 && ch.id !== "weave") {
      // portrait: stand further back so the whole length still fits
      const s = THREE.MathUtils.clamp(0.8 / aspect, 1, 1.9);
      b.x *= 0.1;
      a.x *= 0.4;
      a.sub(b).multiplyScalar(ch.id === "curtain" || ch.id === "yours" ? s : 1.25).add(b);
    }
    r.cam.lerp(a, k);
    r.look.lerp(b, k);
    p.sx += (p.x - p.sx) * (1 - Math.exp(-dt * 3));
    p.sy += (p.y - p.sy) * (1 - Math.exp(-dt * 3));
    camera.position.copy(r.cam);
    camera.lookAt(r.look);
    camera.translateX(p.sx * 0.09);
    camera.translateY(p.sy * 0.05);
    camera.lookAt(r.look);
    camera.updateMatrixWorld();

    // light
    r.intro = Math.min(1, r.intro + dt * 0.45);
    const intro = r.intro * r.intro * (3 - 2 * r.intro);
    r.light += (ch.light - r.light) * (1 - Math.exp(-dt * 2.2));
    c.set(...ch.key);
    r.key.lerp(c, 1 - Math.exp(-dt * 1.4));
    key.current.position.copy(r.key);
    key.current.intensity = THREE.MathUtils.lerp(3.6, 2.5, r.light) * intro;
    rim.current.intensity = THREE.MathUtils.lerp(1.5, 0.35, r.light) * intro;
    hemi.current.intensity = THREE.MathUtils.lerp(0.34, 1.1, r.light) * intro;

    // the cloth itself changes: dye wicks down from the pinned edge
    const u = material.userData.u;
    const want = ch.id === "tuntun" ? PIECES[st.piece].cloth : ch.cloth;
    if (want !== u.uTo.value && u.uMix.value >= 1) {
      u.uFrom.value = u.uTo.value;
      u.uTo.value = want;
      u.uMix.value = 0;
    }
    if (u.uMix.value < 1) u.uMix.value = Math.min(1, u.uMix.value + dt / (ch.id === "tuntun" ? 1.2 : 2.4));

    // weather
    c.set(...ch.wind);
    r.wind.lerp(c, 1 - Math.exp(-dt * 1.2));
    sim.wind = [r.wind.x, r.wind.y, r.wind.z];
    sim.gust = ch.gust;

    // the hand
    if (p.has) {
      ndc.set(p.x, p.y);
      ray.setFromCamera(ndc, camera);
      const o = ray.ray.origin, d = ray.ray.direction;
      if (p.wantGrab) {
        p.wantGrab = false;
        const [i, depth] = sim.pick(o.x, o.y, o.z, d.x, d.y, d.z, 0.12);
        if (i >= 0 && sim.grab(i)) {
          p.depth = depth;
          stage.set({ grabbing: true, held: st.held + 1 });
        }
      }
      if (sim.grabbing) {
        sim.grabTarget = [o.x + d.x * p.depth, o.y + d.y * p.depth, o.z + d.z * p.depth];
      } else if (!p.touch) {
        const pd = prevDir.current;
        sim.brush(o.x, o.y, o.z, [pd.x, pd.y, pd.z], [d.x, d.y, d.z]);
        const [i] = sim.pick(o.x, o.y, o.z, d.x, d.y, d.z, 0.08);
        stage.set({ near: i >= 0 });
      }
      prevDir.current.copy(d);
    }

    sim.step(dt, t);

    // the rustle follows how fast the cloth is actually moving
    let moved = 0;
    for (let i = 0; i < sim.n; i += 17) {
      const j = i * 3;
      moved += Math.abs(sim.pos[j] - sim.prev[j]) + Math.abs(sim.pos[j + 1] - sim.prev[j + 1]) + Math.abs(sim.pos[j + 2] - sim.prev[j + 2]);
    }
    sound.setAir(Math.min(1, (moved / (sim.n / 17)) * 90));

    geometry.attributes.position.needsUpdate = true;
    geometry.attributes.normal.needsUpdate = true;
    geometry.attributes.aStain.needsUpdate = true;

    if (!st.ready && t > 0.15) stage.set({ ready: true });
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={["#fff6e8", "#3a322a", 0.2]} />
      <directionalLight
        ref={key}
        castShadow
        color="#fff3e2"
        position={CHAPTERS[0].key}
        shadow-mapSize={small ? [1024, 1024] : [2048, 2048]}
        shadow-bias={-0.0022}
        shadow-normalBias={0}
        shadow-radius={3}
      >
        <orthographicCamera attach="shadow-camera" args={[-2.6, 2.6, 2.9, -1.2, 0.5, 14]} />
      </directionalLight>
      <directionalLight ref={rim} color="#e9eef5" position={[-2.8, 2.6, -3.6]} intensity={1} />
      <mesh geometry={geometry} material={material} castShadow receiveShadow frustumCulled={false} />
    </>
  );
}

export default function Scene() {
  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      camera={{ fov: 30, near: 0.05, far: 40, position: CHAPTERS[0].cam }}
    >
      <World />
    </Canvas>
  );
}
