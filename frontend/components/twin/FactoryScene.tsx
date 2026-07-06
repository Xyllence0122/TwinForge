"use client";

/**
 * The interactive 3D factory. Rendered client-only (see TwinCanvas) since
 * WebGL has no SSR story. Scene graph:
 *
 *   lights → floor + grid → one assembly per machine (dispatch by type)
 *
 * Machine positions come from the asset registry (lib/simulation/fleet.ts),
 * so the twin lays itself out from data — add a machine to the fleet and
 * it appears here automatically.
 */

import { Suspense, useEffect, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { useSimulation } from "@/lib/simulation/store";
import { MACHINE_COMPONENTS } from "./machines3d";

/**
 * Camera orbit controls wired directly from three's examples module —
 * damped orbit, zoom clamps, and a floor-level polar limit.
 */
function CameraControls() {
  const { camera, gl } = useThree();
  const controls = useRef<OrbitControls | null>(null);

  useEffect(() => {
    const c = new OrbitControls(camera, gl.domElement);
    c.target.set(1, 0.5, 0);
    c.enableDamping = true;
    c.dampingFactor = 0.08;
    c.minDistance = 6;
    c.maxDistance = 40;
    c.maxPolarAngle = Math.PI / 2.15;
    controls.current = c;
    return () => c.dispose();
  }, [camera, gl]);

  useFrame(() => controls.current?.update());
  return null;
}

function SceneContent() {
  const machines = useSimulation((s) => s.machines);
  const selectedId = useSimulation((s) => s.selectedMachineId);
  const speed = useSimulation((s) => s.speed);
  const running = useSimulation((s) => s.running);
  const selectMachine = useSimulation((s) => s.selectMachine);

  return (
    <>
      {/* Lighting: cool key + blue fill, matching the brand */}
      <ambientLight intensity={0.35} />
      <directionalLight position={[12, 18, 8]} intensity={1.1} castShadow />
      <pointLight position={[-10, 8, -6]} intensity={0.5} color="#3B82F6" />
      <pointLight position={[10, 6, 8]} intensity={0.35} color="#22D3EE" />

      {/* Factory floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
        <planeGeometry args={[70, 70]} />
        <meshStandardMaterial color="#0A0F1C" metalness={0.3} roughness={0.9} />
      </mesh>
      <gridHelper args={[70, 70, "#1E3A5F", "#16233B"]} position={[0, 0.005, 0]} />

      {/* Machines (data-driven) */}
      {machines.map((m) => {
        const Component = MACHINE_COMPONENTS[m.type];
        return (
          <Component
            key={m.id}
            machine={m}
            selected={selectedId === m.id}
            speed={running ? speed : 0}
            onSelect={(id) => selectMachine(selectedId === id ? null : id)}
          />
        );
      })}

      <CameraControls />
      <fog attach="fog" args={["#070B14", 34, 62]} />
    </>
  );
}

export default function FactoryScene() {
  const selectMachine = useSimulation((s) => s.selectMachine);

  return (
    <Canvas
      shadows
      camera={{ position: [15, 13, 15], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      onPointerMissed={() => selectMachine(null)}
      className="!bg-transparent"
    >
      <Suspense fallback={null}>
        <SceneContent />
      </Suspense>
    </Canvas>
  );
}
