"use client";

/**
 * Stylised 3D machine assemblies for the factory twin.
 *
 * Each machine is a small parametric assembly of primitives with:
 *  - a glowing status ring (color = MachineStatus)
 *  - motion driven by useFrame, scaled by simulation speed and paused
 *    when the machine is idle / offline
 *  - pointer interactivity (hover glow + click-to-select)
 */

import { useRef, useState, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { STATUS_COLORS } from "@/lib/constants";
import type { Machine } from "@/lib/types";

export interface Machine3DProps {
  machine: Machine;
  selected: boolean;
  speed: number;
  onSelect: (id: string) => void;
}

/** Motion factor: full speed when running, slow crawl in maintenance. */
function motionFactor(machine: Machine): number {
  switch (machine.status) {
    case "running":
      return machine.activeFault === "conveyor-jam" ? 0.06 : 1;
    case "maintenance":
      return 0.15;
    default:
      return 0;
  }
}

/* ------------------------- shared wrapper ------------------------- */

const METAL = { metalness: 0.65, roughness: 0.35 };
const DARK = "#1E293B";
const MID = "#334155";
const LIGHT = "#64748B";

function MachineBase({
  machine,
  selected,
  onSelect,
  ringRadius,
  children,
}: Machine3DProps & { ringRadius: number; children: ReactNode }) {
  const [hovered, setHovered] = useState(false);
  const ringRef = useRef<THREE.Mesh>(null);
  const color = STATUS_COLORS[machine.status];

  useFrame((state) => {
    // Pulse the status ring when running; steady otherwise.
    if (ringRef.current) {
      const mat = ringRef.current.material as THREE.MeshStandardMaterial;
      const pulse =
        machine.status === "running"
          ? 0.8 + Math.sin(state.clock.elapsedTime * 3) * 0.35
          : machine.status === "offline"
            ? 0.9
            : 0.6;
      mat.emissiveIntensity = pulse + (hovered || selected ? 0.8 : 0);
    }
  });

  return (
    <group
      position={machine.position}
      rotation={[0, machine.rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(machine.id);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = "auto";
      }}
    >
      {/* Status ring on the floor */}
      <mesh ref={ringRef} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ringRadius, ringRadius + 0.16, 48]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Selection halo */}
      {selected && (
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[ringRadius + 0.3, ringRadius + 0.42, 48]} />
          <meshBasicMaterial color="#22D3EE" transparent opacity={0.85} side={THREE.DoubleSide} />
        </mesh>
      )}
      {/* Status beacon */}
      <mesh position={[0, 2.9, 0]}>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.2} />
      </mesh>
      <group scale={hovered || selected ? 1.03 : 1}>{children}</group>
    </group>
  );
}

/* --------------------------- Robot arm ---------------------------- */

export function RobotArm3D(props: Machine3DProps) {
  const shoulder = useRef<THREE.Group>(null);
  const elbow = useRef<THREE.Group>(null);
  const factor = motionFactor(props.machine);

  useFrame((state) => {
    const t = state.clock.elapsedTime * props.speed * factor;
    if (shoulder.current) shoulder.current.rotation.y = Math.sin(t * 0.9) * 1.1;
    if (elbow.current) elbow.current.rotation.z = 0.7 + Math.sin(t * 1.4) * 0.45;
  });

  return (
    <MachineBase {...props} ringRadius={1.35}>
      {/* Pedestal */}
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.7, 0.5, 24]} />
        <meshStandardMaterial color={DARK} {...METAL} />
      </mesh>
      <group ref={shoulder} position={[0, 0.5, 0]}>
        {/* Rotating torso */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <cylinderGeometry args={[0.4, 0.45, 0.7, 20]} />
          <meshStandardMaterial color={MID} {...METAL} />
        </mesh>
        {/* Upper arm */}
        <group ref={elbow} position={[0, 0.75, 0]}>
          <mesh position={[0.7, 0, 0]} castShadow>
            <boxGeometry args={[1.5, 0.34, 0.34]} />
            <meshStandardMaterial color="#3B82F6" metalness={0.55} roughness={0.4} />
          </mesh>
          {/* Forearm + tool head */}
          <group position={[1.45, 0, 0]}>
            <mesh position={[0.45, -0.25, 0]} rotation={[0, 0, -0.9]} castShadow>
              <boxGeometry args={[1.0, 0.26, 0.26]} />
              <meshStandardMaterial color={MID} {...METAL} />
            </mesh>
            <mesh position={[0.78, -0.62, 0]} castShadow>
              <cylinderGeometry args={[0.09, 0.13, 0.35, 12]} />
              <meshStandardMaterial color={LIGHT} {...METAL} />
            </mesh>
          </group>
        </group>
      </group>
    </MachineBase>
  );
}

/* --------------------------- Conveyor ----------------------------- */

export function Conveyor3D(props: Machine3DProps) {
  const items = useRef<THREE.Group>(null);
  const factor = motionFactor(props.machine);
  const LENGTH = 8;

  useFrame((_, delta) => {
    if (!items.current) return;
    items.current.children.forEach((child) => {
      child.position.x += delta * 1.2 * props.speed * factor;
      if (child.position.x > LENGTH / 2 - 0.4) child.position.x = -LENGTH / 2 + 0.4;
    });
  });

  return (
    <MachineBase {...props} ringRadius={4.6}>
      {/* Belt frame */}
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[LENGTH, 0.16, 1.15]} />
        <meshStandardMaterial color={DARK} {...METAL} />
      </mesh>
      {/* Belt surface */}
      <mesh position={[0, 0.65, 0]}>
        <boxGeometry args={[LENGTH - 0.15, 0.05, 0.95]} />
        <meshStandardMaterial color="#0F172A" metalness={0.2} roughness={0.85} />
      </mesh>
      {/* Legs */}
      {[-3.4, -1.2, 1.2, 3.4].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.26, 0.45]}>
            <boxGeometry args={[0.1, 0.55, 0.1]} />
            <meshStandardMaterial color={MID} {...METAL} />
          </mesh>
          <mesh position={[x, 0.26, -0.45]}>
            <boxGeometry args={[0.1, 0.55, 0.1]} />
            <meshStandardMaterial color={MID} {...METAL} />
          </mesh>
        </group>
      ))}
      {/* Moving product boxes */}
      <group ref={items}>
        {[-3, -0.8, 1.4, 3.2].map((x, i) => (
          <mesh key={i} position={[x, 0.85, 0]} castShadow>
            <boxGeometry args={[0.42, 0.32, 0.42]} />
            <meshStandardMaterial color={i % 2 ? "#475569" : "#22D3EE"} metalness={0.3} roughness={0.6} />
          </mesh>
        ))}
      </group>
    </MachineBase>
  );
}

/* ------------------------------ AGV -------------------------------- */

const AGV_PATH: [number, number][] = [
  [0, 0],
  [3.5, 0],
  [3.5, 2.5],
  [-3.5, 2.5],
  [-3.5, 0],
];

export function Agv3D(props: Machine3DProps) {
  const body = useRef<THREE.Group>(null);
  const progress = useRef(0);
  const factor = motionFactor(props.machine);

  useFrame((_, delta) => {
    if (!body.current) return;
    progress.current = (progress.current + delta * 0.08 * props.speed * factor) % 1;
    const segs = AGV_PATH.length;
    const p = progress.current * segs;
    const i = Math.floor(p) % segs;
    const frac = p - Math.floor(p);
    const [ax, az] = AGV_PATH[i];
    const [bx, bz] = AGV_PATH[(i + 1) % segs];
    const x = ax + (bx - ax) * frac;
    const z = az + (bz - az) * frac;
    body.current.position.set(x, 0, z);
    body.current.rotation.y = Math.atan2(bx - ax, bz - az);
  });

  return (
    <MachineBase {...props} ringRadius={1.0}>
      <group ref={body}>
        {/* Chassis */}
        <mesh position={[0, 0.28, 0]} castShadow>
          <boxGeometry args={[0.9, 0.32, 1.3]} />
          <meshStandardMaterial color="#3B82F6" metalness={0.5} roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.5, 0]}>
          <boxGeometry args={[0.8, 0.12, 1.15]} />
          <meshStandardMaterial color={DARK} {...METAL} />
        </mesh>
        {/* Payload */}
        <mesh position={[0, 0.72, 0]} castShadow>
          <boxGeometry args={[0.65, 0.32, 0.85]} />
          <meshStandardMaterial color={MID} metalness={0.3} roughness={0.7} />
        </mesh>
        {/* Wheels */}
        {([[-0.42, 0.45], [0.42, 0.45], [-0.42, -0.45], [0.42, -0.45]] as const).map(([x, z], i) => (
          <mesh key={i} position={[x, 0.14, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.14, 0.14, 0.1, 16]} />
            <meshStandardMaterial color="#0F172A" metalness={0.4} roughness={0.7} />
          </mesh>
        ))}
        {/* Headlight */}
        <mesh position={[0, 0.3, 0.68]}>
          <boxGeometry args={[0.5, 0.06, 0.03]} />
          <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={1.6} />
        </mesh>
      </group>
    </MachineBase>
  );
}

/* ------------------------------ CNC -------------------------------- */

export function Cnc3D(props: Machine3DProps) {
  const spindle = useRef<THREE.Mesh>(null);
  const factor = motionFactor(props.machine);

  useFrame((state) => {
    const t = state.clock.elapsedTime * props.speed;
    if (spindle.current) {
      spindle.current.position.y = 1.15 + Math.sin(t * 2.2 * Math.max(factor, 0.001)) * 0.25 * factor;
      spindle.current.rotation.y = t * 14 * factor;
    }
  });

  const working = props.machine.status === "running";

  return (
    <MachineBase {...props} ringRadius={1.7}>
      {/* Machine body */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[2.4, 1.8, 2.0]} />
        <meshStandardMaterial color={DARK} {...METAL} />
      </mesh>
      {/* Top gantry */}
      <mesh position={[0, 1.95, 0]}>
        <boxGeometry args={[2.5, 0.3, 2.1]} />
        <meshStandardMaterial color={MID} {...METAL} />
      </mesh>
      {/* Work window (emissive when cutting) */}
      <mesh position={[0, 0.95, 1.01]}>
        <boxGeometry args={[1.5, 0.9, 0.04]} />
        <meshStandardMaterial
          color="#22D3EE"
          emissive="#22D3EE"
          emissiveIntensity={working ? 0.7 : 0.06}
          transparent
          opacity={0.55}
        />
      </mesh>
      {/* Spindle visible above the gantry */}
      <mesh ref={spindle} position={[0, 1.15, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 1.6, 14]} />
        <meshStandardMaterial color={LIGHT} {...METAL} />
      </mesh>
      {/* Control pendant */}
      <mesh position={[1.35, 1.15, 0.6]} rotation={[0, -0.5, 0]}>
        <boxGeometry args={[0.06, 0.5, 0.4]} />
        <meshStandardMaterial color="#0F172A" emissive="#3B82F6" emissiveIntensity={working ? 0.5 : 0.1} />
      </mesh>
    </MachineBase>
  );
}

/* ---------------------------- Storage ------------------------------ */

export function Storage3D(props: Machine3DProps) {
  const crane = useRef<THREE.Group>(null);
  const lift = useRef<THREE.Mesh>(null);
  const factor = motionFactor(props.machine);

  useFrame((state) => {
    const t = state.clock.elapsedTime * props.speed * factor;
    if (crane.current) crane.current.position.z = Math.sin(t * 0.5) * 2.2;
    if (lift.current) lift.current.position.y = 1.1 + Math.abs(Math.sin(t * 0.8)) * 1.1;
  });

  return (
    <MachineBase {...props} ringRadius={2.6}>
      {/* Two shelving racks */}
      {[-1.4, 1.4].map((x) => (
        <group key={x} position={[x, 0, 0]}>
          {[0.5, 1.5, 2.5].map((y) => (
            <mesh key={y} position={[0, y, 0]}>
              <boxGeometry args={[0.9, 0.08, 6]} />
              <meshStandardMaterial color={MID} {...METAL} />
            </mesh>
          ))}
          {[-2.8, 0, 2.8].map((z) => (
            <mesh key={z} position={[0, 1.5, z]}>
              <boxGeometry args={[0.08, 3.0, 0.08]} />
              <meshStandardMaterial color={DARK} {...METAL} />
            </mesh>
          ))}
          {/* Stored totes */}
          {[-2, -0.6, 0.9, 2.2].map((z, i) => (
            <mesh key={z} position={[0, (i % 3) + 0.72, z]} castShadow>
              <boxGeometry args={[0.6, 0.36, 0.6]} />
              <meshStandardMaterial
                color={i % 2 ? "#1D4ED8" : "#475569"}
                metalness={0.3}
                roughness={0.65}
              />
            </mesh>
          ))}
        </group>
      ))}
      {/* Crane running in the aisle */}
      <group ref={crane}>
        <mesh position={[0, 1.6, 0]}>
          <boxGeometry args={[0.18, 3.2, 0.18]} />
          <meshStandardMaterial color="#3B82F6" metalness={0.55} roughness={0.4} />
        </mesh>
        <mesh ref={lift} position={[0, 1.1, 0]} castShadow>
          <boxGeometry args={[0.7, 0.16, 0.7]} />
          <meshStandardMaterial color="#22D3EE" emissive="#22D3EE" emissiveIntensity={0.5} />
        </mesh>
      </group>
    </MachineBase>
  );
}

/** Dispatch table used by the scene. */
export const MACHINE_COMPONENTS = {
  "robot-arm": RobotArm3D,
  conveyor: Conveyor3D,
  agv: Agv3D,
  cnc: Cnc3D,
  storage: Storage3D,
} as const;
