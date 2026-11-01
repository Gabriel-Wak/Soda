import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { FLAVORS, SHIFT_MS, type Flavor } from "@/lib/flavors";

const TILT = THREE.MathUtils.degToRad(15);
const SPRING_K = 60;
const SPRING_DAMP = 11;
const REPEL_RADIUS = 1.1;
const REPEL_FORCE = 9;

const W = 1024;
const H = 512;
/** Label centers around the cylinder: front and back. */
const LABEL_XS = [256, 768];
/** Printable band width per label. */
const MAX_W = 430;

const SCRIPT = "'Pacifico', cursive";
const SANS = "'Space Grotesk', sans-serif";

/** Letterspaced text centered on x — canvas tracking is not universally supported. */
function fillTracked(g: CanvasRenderingContext2D, text: string, x: number, y: number, tracking: number) {
  const chars = [...text];
  const widths = chars.map((ch) => g.measureText(ch).width);
  const total = widths.reduce((a, b) => a + b, 0) + tracking * (chars.length - 1);
  const prev = g.textAlign;
  g.textAlign = "left";
  let cursor = x - total / 2;
  chars.forEach((ch, i) => {
    g.fillText(ch, cursor, y);
    cursor += (widths[i] ?? 0) + tracking;
  });
  g.textAlign = prev;
}

/** Shrink the font size until the line fits the printable band. */
function fitFont(g: CanvasRenderingContext2D, text: string, weight: string, family: string, size: number) {
  let s = size;
  while (s > 20 && g.measureText(text).width > MAX_W) {
    s -= 2;
    g.font = `${weight} ${s}px ${family}`;
  }
  return s;
}

/** White arched plate the fruit sits in. */
function drawPlate(g: CanvasRenderingContext2D, x: number, y: number, f: Flavor) {
  const w = 176;
  const h = 112;
  const r = 46;
  const l = x - w / 2;
  const t = y - h / 2;
  g.beginPath();
  g.moveTo(l, y + h / 2);
  g.lineTo(l, t + r);
  g.quadraticCurveTo(l, t, l + r, t);
  g.lineTo(l + w - r, t);
  g.quadraticCurveTo(l + w, t, l + w, t + r);
  g.lineTo(l + w, y + h / 2);
  g.closePath();
  g.fillStyle = "#ffffff";
  g.fill();
  g.lineWidth = 9;
  g.strokeStyle = f.antarctica ? "#d22027" : f.accent;
  g.stroke();
}

function drawBerry(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fillStyle = "#d22027";
  g.fill();
  g.beginPath();
  g.arc(x - r * 0.32, y - r * 0.36, r * 0.3, 0, Math.PI * 2);
  g.fillStyle = "rgba(255,255,255,0.92)";
  g.fill();
}

/** Guaraná leaf, drawn so it slips out past the plate. */
function drawLeaf(g: CanvasRenderingContext2D, x: number, y: number) {
  g.save();
  g.translate(x, y);
  g.rotate(-0.55);
  g.beginPath();
  g.ellipse(0, 0, 32, 12, 0, 0, Math.PI * 2);
  g.fillStyle = "#178048";
  g.fill();
  g.lineWidth = 4;
  g.strokeStyle = "#ffffff";
  g.stroke();
  g.beginPath();
  g.moveTo(-25, 0);
  g.lineTo(25, 0);
  g.lineWidth = 3;
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.stroke();
  g.restore();
}

function drawFlag(g: CanvasRenderingContext2D, x: number, y: number) {
  const w = 62;
  const h = 44;
  g.save();
  g.translate(x, y);
  g.beginPath();
  g.rect(-w / 2, -h / 2, w, h);
  g.fillStyle = "#009c3b";
  g.fill();
  g.lineWidth = 3;
  g.strokeStyle = "#ffffff";
  g.stroke();
  g.beginPath();
  g.moveTo(0, -h / 2 + 7);
  g.lineTo(w / 2 - 7, 0);
  g.lineTo(0, h / 2 - 7);
  g.lineTo(-(w / 2 - 7), 0);
  g.closePath();
  g.fillStyle = "#ffdf00";
  g.fill();
  g.beginPath();
  g.arc(0, 0, 11, 0, Math.PI * 2);
  g.fillStyle = "#002776";
  g.fill();
  g.save();
  g.beginPath();
  g.arc(0, 0, 11, 0, Math.PI * 2);
  g.clip();
  g.beginPath();
  g.arc(0, 15, 21, Math.PI * 1.12, Math.PI * 1.88);
  g.lineWidth = 3.5;
  g.strokeStyle = "#ffffff";
  g.stroke();
  g.restore();
  g.restore();
}

function makeLabelTexture(f: Flavor) {
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;

  const grd = g.createLinearGradient(0, 0, 0, H);
  grd.addColorStop(0, f.can);
  grd.addColorStop(0.5, f.accent);
  grd.addColorStop(1, f.can);
  g.fillStyle = f.can;
  g.fillRect(0, 0, W, H);
  g.globalAlpha = 0.32;
  g.fillStyle = grd;
  g.fillRect(0, 110, W, 300);
  g.globalAlpha = 1;

  g.textAlign = "center";
  g.textBaseline = "middle";

  for (const x of LABEL_XS) {
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.font = `600 24px ${SANS}`;
    fillTracked(g, f.top, x, 70, 6);

    drawPlate(g, x, 142, f);
    if (f.antarctica) {
      drawLeaf(g, x + 66, 106);
      drawBerry(g, x, 126, 25);
      drawBerry(g, x - 26, 162, 25);
      drawBerry(g, x + 26, 162, 25);
    } else {
      g.beginPath();
      g.arc(x, 142, 30, 0, Math.PI * 2);
      g.fillStyle = f.fruit;
      g.fill();
      g.beginPath();
      g.arc(x - 10, 132, 9, 0, Math.PI * 2);
      g.fillStyle = "rgba(255,255,255,0.85)";
      g.fill();
    }

    g.fillStyle = "#ffffff";
    g.font = `82px ${SCRIPT}`;
    fitFont(g, f.script, "400", SCRIPT, 82);
    g.fillText(f.script, x, 274);

    g.font = `700 32px ${SANS}`;
    fillTracked(g, f.brand, x, 322, 8);

    if (f.antarctica) drawFlag(g, x, 366);

    g.font = `700 28px ${SANS}`;
    g.fillText("350ml", x, 412);

    g.font = `500 18px ${SANS}`;
    fillTracked(g, `REFRIGERANTE DE ${f.name.toUpperCase()}`, x, 440, 2);
    g.font = `500 16px ${SANS}`;
    fillTracked(g, "CONTÉM AROMATIZANTE", x, 462, 2);
  }

  g.strokeStyle = "rgba(255,255,255,0.5)";
  g.lineWidth = 6;
  g.strokeRect(-10, 40, 1044, 2);
  g.strokeRect(-10, 476, 1044, 2);

  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Procedural condensation normal map: hemispherical droplets baked into normals. */
function makeDropletNormalMap() {
  const s = 512;
  const c = document.createElement("canvas");
  c.width = c.height = s;
  const g = c.getContext("2d")!;
  const img = g.createImageData(s, s);
  const nx = new Float32Array(s * s);
  const ny = new Float32Array(s * s);
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 900; i++) {
    const cx = rnd() * s, cy = rnd() * s;
    const r = 2 + rnd() ** 3 * 14;
    const stretch = 1 + rnd() * 0.6;
    for (let y = -r * stretch; y <= r * stretch; y++) {
      for (let x = -r; x <= r; x++) {
        const dx = x / r, dy = y / (r * stretch);
        const d = dx * dx + dy * dy;
        if (d > 1) continue;
        const px = ((Math.round(cx + x) % s) + s) % s;
        const py = ((Math.round(cy + y) % s) + s) % s;
        nx[py * s + px] = dx * 0.9;
        ny[py * s + px] = dy * 0.9;
      }
    }
  }
  for (let i = 0; i < s * s; i++) {
    const x = nx[i] ?? 0, y = ny[i] ?? 0;
    const z = Math.sqrt(Math.max(0, 1 - x * x - y * y));
    img.data[i * 4] = (x * 0.5 + 0.5) * 255;
    img.data[i * 4 + 1] = (-y * 0.5 + 0.5) * 255;
    img.data[i * 4 + 2] = (z * 0.5 + 0.5) * 255;
    img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 2);
  return t;
}

function SodaCan({ flavor, pointer }: { flavor: Flavor; pointer: React.RefObject<THREE.Vector2> }) {
  const group = useRef<THREE.Group>(null);
  const vel = useRef(new THREE.Vector2());
  const rot = useRef(new THREE.Vector2());
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        await Promise.all([
          document.fonts.load("90px 'Pacifico'"),
          document.fonts.load("700 32px 'Space Grotesk'"),
        ]);
        await document.fonts.ready;
      } finally {
        if (alive) setFontsReady(true);
      }
    };
    void load();
    return () => {
      alive = false;
    };
  }, []);

  const labels = useMemo(
    () => Object.fromEntries(FLAVORS.map((f) => [f.id, makeLabelTexture(f)])) as Record<Flavor["id"], THREE.CanvasTexture>,
    [fontsReady],
  );
  const normal = useMemo(() => makeDropletNormalMap(), []);
  const bodyMat = useRef<THREE.MeshPhysicalMaterial>(null);

  useEffect(() => {
    if (bodyMat.current) {
      bodyMat.current.map = labels[flavor.id];
      bodyMat.current.needsUpdate = true;
    }
  }, [flavor, labels]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const g = group.current;
    if (!g) return;
    const target = new THREE.Vector2(pointer.current.y * 0.35, pointer.current.x * 0.6);
    // spring physics toward pointer
    const ax = SPRING_K * (target.x - rot.current.x) - SPRING_DAMP * vel.current.x;
    const ay = SPRING_K * (target.y - rot.current.y) - SPRING_DAMP * vel.current.y;
    vel.current.x += ax * dt;
    vel.current.y += ay * dt;
    rot.current.x += vel.current.x * dt;
    rot.current.y += vel.current.y * dt;
    const t = state.clock.elapsedTime;
    g.rotation.set(-rot.current.x, rot.current.y + t * 0.25, TILT);
    g.position.set(rot.current.y * 0.4, Math.sin(t * 1.2) * 0.08 - rot.current.x * 0.3, 0);
  });

  const metal = { color: "#d8dde4", metalness: 1, roughness: 0.22 };
  return (
    <group ref={group}>
      <mesh castShadow>
        <cylinderGeometry args={[0.66, 0.66, 2.3, 96, 1, true]} />
        <meshPhysicalMaterial
          ref={bodyMat}
          map={labels[flavor.id]}
          metalness={0.75}
          roughness={0.28}
          clearcoat={1}
          clearcoatRoughness={0.08}
          normalMap={normal}
          normalScale={new THREE.Vector2(0.55, 0.55)}
          clearcoatNormalMap={normal}
          clearcoatNormalScale={new THREE.Vector2(0.9, 0.9)}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* shoulders & base */}
      <mesh position={[0, 1.25, 0]}>
        <cylinderGeometry args={[0.54, 0.66, 0.2, 96]} />
        <meshStandardMaterial {...metal} />
      </mesh>
      <mesh position={[0, 1.37, 0]}>
        <cylinderGeometry args={[0.55, 0.54, 0.06, 96]} />
        <meshStandardMaterial {...metal} roughness={0.15} />
      </mesh>
      <mesh position={[0, 1.39, 0.18]} rotation={[-Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.08, 0.16, 6, 16]} />
        <meshStandardMaterial {...metal} roughness={0.1} />
      </mesh>
      <mesh position={[0, -1.22, 0]}>
        <cylinderGeometry args={[0.66, 0.56, 0.16, 96]} />
        <meshStandardMaterial {...metal} />
      </mesh>
    </group>
  );
}

interface Particle {
  home: THREE.Vector3;
  pos: THREE.Vector3;
  vel: THREE.Vector3;
  size: number;
  phase: number;
}

function makeParticles(n: number, seed: number): Particle[] {
  let s = seed;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => {
    const a = r() * Math.PI * 2;
    const rad = 1.5 + r() * 2.4;
    const home = new THREE.Vector3(Math.cos(a) * rad, (r() - 0.5) * 4, Math.sin(a) * 1.2 - 0.6);
    return { home, pos: home.clone(), vel: new THREE.Vector3(), size: 0.06 + r() * 0.12, phase: r() * 10 };
  });
}

function Swarm({
  count,
  seed,
  pointerWorld,
  kind,
  color,
}: {
  count: number;
  seed: number;
  pointerWorld: React.RefObject<THREE.Vector3>;
  kind: "berry" | "bubble";
  color: string;
}) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const parts = useMemo(() => makeParticles(count, seed), [count, seed]);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const target = useMemo(() => new THREE.Color(color), [color]);

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = state.clock.elapsedTime;
    const m = mesh.current;
    if (!m) return;
    if (mat.current && kind === "berry") mat.current.color.lerp(target, 1 - Math.exp(-dt * (3000 / SHIFT_MS)));
    parts.forEach((p, i) => {
      // float home
      tmp.copy(p.home);
      tmp.y += Math.sin(t * 0.6 + p.phase) * 0.15;
      p.vel.addScaledVector(tmp.sub(p.pos), 2.2 * dt);
      // repel from cursor (xy distance)
      const dx = p.pos.x - pointerWorld.current.x;
      const dy = p.pos.y - pointerWorld.current.y;
      const d = Math.hypot(dx, dy);
      if (d < REPEL_RADIUS && d > 0.001) {
        const f = ((REPEL_RADIUS - d) / REPEL_RADIUS) * REPEL_FORCE * dt;
        p.vel.x += (dx / d) * f;
        p.vel.y += (dy / d) * f;
        p.vel.z += f * 0.3;
      }
      p.vel.multiplyScalar(Math.exp(-2.5 * dt));
      p.pos.addScaledVector(p.vel, dt * 3);
      dummy.position.copy(p.pos);
      dummy.rotation.set(p.phase, t * 0.3 + p.phase, 0);
      dummy.scale.setScalar(kind === "berry" ? p.size * 1.6 : p.size * 0.7);
      dummy.updateMatrix();
      m.setMatrixAt(i, dummy.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, count]}>
      <sphereGeometry args={[1, kind === "berry" ? 24 : 16, kind === "berry" ? 24 : 16]} />
      {kind === "berry" ? (
        <meshPhysicalMaterial ref={mat} color={color} roughness={0.35} clearcoat={0.6} sheen={1} sheenColor="#9fb4ff" />
      ) : (
        <meshPhysicalMaterial transmission={1} thickness={0.2} roughness={0} ior={1.33} color="#ffffff" transparent opacity={0.55} />
      )}
    </instancedMesh>
  );
}

function AmbientRig({ flavor }: { flavor: Flavor }) {
  const key = useRef<THREE.PointLight>(null);
  const rim = useRef<THREE.PointLight>(null);
  const target = useMemo(() => new THREE.Color(flavor.glow), [flavor]);
  useFrame((_, delta) => {
    const k = 1 - Math.exp(-Math.min(delta, 0.05) * (3000 / SHIFT_MS));
    key.current?.color.lerp(target, k);
    rim.current?.color.lerp(target, k);
  });
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[3, 4, 5]} intensity={2.2} />
      <pointLight ref={key} position={[-3, 1, 2]} intensity={30} color={flavor.glow} />
      <pointLight ref={rim} position={[2.5, -1, -2]} intensity={40} color={flavor.glow} />
    </>
  );
}

function PointerTracker({
  pointer,
  pointerWorld,
}: {
  pointer: React.RefObject<THREE.Vector2>;
  pointerWorld: React.RefObject<THREE.Vector3>;
}) {
  const { camera } = useThree();
  const ray = useMemo(() => new THREE.Raycaster(), []);
  const plane = useMemo(() => new THREE.Plane(new THREE.Vector3(0, 0, 1), 0), []);
  useFrame(() => {
    ray.setFromCamera(pointer.current, camera);
    ray.ray.intersectPlane(plane, pointerWorld.current);
  });
  return null;
}

export default function SodaScene({ flavor }: { flavor: Flavor }) {
  const pointer = useRef(new THREE.Vector2(0, 0));
  const pointerWorld = useRef(new THREE.Vector3(99, 99, 0));
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const move = (e: PointerEvent) => {
      pointer.current.set((e.clientX / window.innerWidth) * 2 - 1, -(e.clientY / window.innerHeight) * 2 + 1);
    };
    window.addEventListener("pointermove", move);
    return () => window.removeEventListener("pointermove", move);
  }, []);

  return (
    <div ref={wrap} className="absolute inset-0">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 0, 6], fov: 40 }}
        gl={{ antialias: true, alpha: true, toneMapping: THREE.ACESFilmicToneMapping }}
        onCreated={() => requestAnimationFrame(() => wrap.current?.setAttribute("data-scene-ready", "true"))}
      >
        <AmbientRig flavor={flavor} />
        <Environment resolution={256}>
          <Lightformer intensity={3} position={[0, 5, 0]} scale={[10, 10, 1]} />
          <Lightformer intensity={2} position={[-5, 1, -1]} rotation-y={Math.PI / 2} scale={[20, 1.5, 1]} />
          <Lightformer intensity={2} position={[5, 0, 1]} rotation-y={-Math.PI / 2} scale={[20, 0.6, 1]} />
          <Lightformer intensity={1.5} color={flavor.glow} position={[0, 0, -5]} scale={[10, 10, 1]} />
        </Environment>
        <PointerTracker pointer={pointer} pointerWorld={pointerWorld} />
        <SodaCan flavor={flavor} pointer={pointer} />
        <Swarm kind="berry" count={18} seed={11} pointerWorld={pointerWorld} color={flavor.fruit} />
        <Swarm kind="bubble" count={40} seed={42} pointerWorld={pointerWorld} color="#fff" />
      </Canvas>
    </div>
  );
}
