"use client";

export function RadiusViz({
  inside,
  radius,
  distance,
}: {
  inside: boolean;
  radius: number;
  distance: number;
}) {
  return (
    <svg
      viewBox="0 0 400 260"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <radialGradient id="r-g">
          <stop offset="0%" stopColor="rgba(184,149,106,.25)" />
          <stop offset="60%" stopColor="rgba(184,149,106,.10)" />
          <stop offset="100%" stopColor="rgba(184,149,106,0)" />
        </radialGradient>
      </defs>
      <circle
        cx="200"
        cy="130"
        r="95"
        fill="url(#r-g)"
        stroke="rgba(184,149,106,.4)"
        strokeDasharray="3 4"
      />
      <circle
        cx="200"
        cy="130"
        r="60"
        fill="rgba(184,149,106,.04)"
        stroke="rgba(184,149,106,.2)"
        strokeDasharray="2 4"
      />
      <g transform="translate(200 130)">
        <circle r="10" fill="var(--navy-800)" />
        <circle r="5" fill="#fff" />
        <text
          y="-18"
          textAnchor="middle"
          fontSize="10"
          fontFamily="var(--font-mono)"
          fill="var(--navy-800)"
        >
          NS · {radius}m
        </text>
      </g>
      {inside ? (
        <g transform="translate(220 145)">
          <circle r="9" fill="rgba(90,125,111,.2)" />
          <circle r="5" fill="var(--sage)" />
          <text
            y="22"
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--sage)"
          >
            Anda · {distance}m
          </text>
        </g>
      ) : (
        <g transform="translate(330 60)">
          <circle r="9" fill="rgba(168,105,115,.2)" />
          <circle r="5" fill="var(--rose)" />
          <text
            y="-12"
            textAnchor="middle"
            fontSize="10"
            fontFamily="var(--font-mono)"
            fill="var(--rose)"
          >
            Anda · {distance}m
          </text>
        </g>
      )}
    </svg>
  );
}
