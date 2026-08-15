import { cn } from "@/lib/utils";

/** Plano de despiece — disco de freno ventilado, vista explosionada. Firma visual de la marca. */
/** Redondeo a 2 decimales — evita que Math.cos/sin difiera en el último bit entre server y cliente y dispare falsos hydration mismatch. */
function r(n: number) {
  return Math.round(n * 100) / 100;
}

export function BlueprintRotor({ className }: { className?: string }) {
  const holes = Array.from({ length: 5 }).map((_, i) => {
    const angle = (i / 5) * Math.PI * 2 - Math.PI / 2;
    return { cx: r(200 + Math.cos(angle) * 78), cy: r(200 + Math.sin(angle) * 78) };
  });
  const vents = Array.from({ length: 28 }).map((_, i) => {
    const angle = (i / 28) * Math.PI * 2;
    const x1 = r(200 + Math.cos(angle) * 106);
    const y1 = r(200 + Math.sin(angle) * 106);
    const x2 = r(200 + Math.cos(angle) * 130);
    const y2 = r(200 + Math.sin(angle) * 130);
    return { x1, y1, x2, y2 };
  });

  return (
    <svg
      viewBox="0 0 400 400"
      className={cn("h-full w-full max-w-md text-neutral-500", className)}
      fill="none"
      stroke="currentColor"
    >
      {/* rotor — gira despacio en el sentido que marca la flecha */}
      <g className="rotor-spin">
        <circle cx="200" cy="200" r="150" strokeWidth="1.25" />
        <circle cx="200" cy="200" r="130" strokeWidth="0.75" opacity="0.5" />
        <circle cx="200" cy="200" r="106" strokeWidth="0.75" opacity="0.5" />
        <circle cx="200" cy="200" r="42" strokeWidth="1.25" />
        <circle cx="200" cy="200" r="10" strokeWidth="1" className="text-primary" opacity="0.8" />
        {vents.map((v, i) => (
          <line key={i} x1={v.x1} y1={v.y1} x2={v.x2} y2={v.y2} strokeWidth="0.75" opacity="0.4" />
        ))}
        {holes.map((h, i) => (
          <circle key={i} cx={h.cx} cy={h.cy} r="8" strokeWidth="1" />
        ))}
      </g>

      {/* flecha de sentido de giro */}
      <path
        d="M 200 52 A 140 140 0 0 1 320 116"
        strokeWidth="0.75"
        strokeDasharray="1 4"
        opacity="0.4"
      />
      <path d="M 313 106 L 325 118 L 309 122 Z" opacity="0.55" fill="currentColor" stroke="none" />

      {/* pinza de freno — pieza explosionada, separada con línea líder */}
      <line x1="298" y1="128" x2="340" y2="70" strokeWidth="0.75" strokeDasharray="2 3" opacity="0.5" />
      <g transform="translate(352, 62)">
        <rect x="-32" y="-44" width="64" height="88" rx="9" strokeWidth="1.25" className="text-primary" opacity="0.9" />
        <circle cx="-13" cy="-18" r="6" strokeWidth="1" />
        <circle cx="13" cy="-18" r="6" strokeWidth="1" />
        <circle cx="0" cy="20" r="9" strokeWidth="1.25" opacity="0.7" />
      </g>
      <circle cx="352" cy="62" r="10" strokeWidth="0.75" opacity="0.7" />
      <text
        x="352"
        y="62"
        textAnchor="middle"
        dominantBaseline="central"
        className="font-mono text-[9px]"
        fill="currentColor"
        stroke="none"
        opacity="0.85"
      >
        01
      </text>

      {/* línea de cota vertical */}
      <line x1="52" y1="50" x2="52" y2="350" strokeWidth="0.75" opacity="0.6" />
      <line x1="45" y1="50" x2="59" y2="50" strokeWidth="0.75" opacity="0.6" />
      <line x1="45" y1="350" x2="59" y2="350" strokeWidth="0.75" opacity="0.6" />
      <text
        x="40"
        y="200"
        textAnchor="middle"
        className="font-mono text-[10px]"
        fill="currentColor"
        stroke="none"
        opacity="0.7"
        transform="rotate(-90 40 200)"
      >
        ⌀300MM
      </text>

      {/* radio del cubo */}
      <line x1="200" y1="200" x2="242" y2="200" strokeWidth="0.6" opacity="0.5" strokeDasharray="2 3" />
      <text
        x="248"
        y="203"
        className="font-mono text-[8px]"
        fill="currentColor"
        stroke="none"
        opacity="0.6"
      >
        R42
      </text>
    </svg>
  );
}
