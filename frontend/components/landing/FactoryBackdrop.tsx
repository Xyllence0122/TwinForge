"use client";

import { motion } from "framer-motion";

/**
 * Animated factory backdrop for the hero — an abstract production line
 * rendered in SVG: conveyor lanes, moving pallets, pulsing machine nodes
 * and a scanning beam, all in brand colors. Pure vector, no textures.
 */
export function FactoryBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Blueprint grid + radial glow */}
      <div className="grid-bg absolute inset-0 opacity-60" />
      <div className="absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-primary/10 blur-[140px]" />
      <div className="absolute right-[8%] top-[38%] h-64 w-64 rounded-full bg-accent/10 blur-[110px]" />

      <svg
        className="absolute inset-x-0 bottom-0 h-[46%] w-full opacity-50"
        viewBox="0 0 1200 320"
        preserveAspectRatio="xMidYMax slice"
        fill="none"
      >
        {/* Conveyor lanes */}
        {[120, 200, 280].map((y, lane) => (
          <g key={y}>
            <line x1="0" y1={y} x2="1200" y2={y} stroke="rgba(59,130,246,0.25)" strokeWidth="1.5" />
            {/* Moving pallets */}
            {[0, 1, 2, 3].map((i) => (
              <motion.rect
                key={i}
                width="26"
                height="10"
                rx="2"
                y={y - 14}
                fill={i % 2 ? "rgba(34,211,238,0.55)" : "rgba(59,130,246,0.55)"}
                initial={{ x: -40 - i * 300 }}
                animate={{ x: 1240 }}
                transition={{
                  duration: 16 + lane * 4,
                  delay: i * (4 + lane),
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            ))}
          </g>
        ))}

        {/* Machine nodes */}
        {[
          [150, 80],
          [420, 60],
          [700, 90],
          [980, 70],
        ].map(([x, y], i) => (
          <g key={x}>
            <rect x={x - 28} y={y} width="56" height="42" rx="6" stroke="rgba(148,163,184,0.4)" strokeWidth="1.5" fill="rgba(15,23,42,0.5)" />
            <motion.circle
              cx={x}
              cy={y - 10}
              r="4"
              fill="#10B981"
              animate={{ opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 2.2, delay: i * 0.5, repeat: Infinity }}
            />
            {/* Data uplink */}
            <motion.line
              x1={x}
              y1={y - 18}
              x2={x}
              y2={y - 58}
              stroke="rgba(34,211,238,0.5)"
              strokeWidth="1"
              strokeDasharray="3 5"
              animate={{ strokeDashoffset: [0, -32] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "linear" }}
            />
          </g>
        ))}
      </svg>

      {/* Scanning beam */}
      <motion.div
        className="absolute inset-y-0 w-40 bg-gradient-to-r from-transparent via-accent/[0.05] to-transparent"
        animate={{ x: ["-12vw", "112vw"] }}
        transition={{ duration: 11, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}
