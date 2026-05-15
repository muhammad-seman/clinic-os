import type { ChartPoint } from "@/server/services/dashboard";
import { fmtIDRk } from "./_helpers";

export function RevenueChart({ data }: { data: ChartPoint[] }) {
  const W = 720;
  const H = 200;
  const P = { l: 50, r: 16, t: 10, b: 26 };
  const maxRev = data.reduce((m, d) => (BigInt(d.rev) > m ? BigInt(d.rev) : m), 0n);
  const max = Number(maxRev) * 1.1 || 1;
  const n = data.length;
  const xs = (i: number) => P.l + i * ((W - P.l - P.r) / Math.max(1, n - 1));
  const ys = (v: number) => P.t + (H - P.t - P.b) * (1 - v / max);
  const linePath = (key: "rev" | "profit") =>
    data
      .map(
        (d, i) =>
          `${i === 0 ? "M" : "L"}${xs(i).toFixed(2)},${ys(Number(d[key])).toFixed(2)}`,
      )
      .join(" ");
  const areaPath =
    linePath("rev") +
    ` L${xs(n - 1).toFixed(2)},${H - P.b} L${xs(0).toFixed(2)},${H - P.b} Z`;

  return (
    <div className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(11,29,61,.15)" />
            <stop offset="100%" stopColor="rgba(11,29,61,0)" />
          </linearGradient>
        </defs>
        {[0, 0.25, 0.5, 0.75, 1].map((p, i) => (
          <g key={i}>
            <line
              className="grid"
              x1={P.l}
              x2={W - P.r}
              y1={P.t + (H - P.t - P.b) * p}
              y2={P.t + (H - P.t - P.b) * p}
              strokeDasharray="2 4"
            />
            <text className="axis" x={6} y={P.t + (H - P.t - P.b) * p + 4}>
              {fmtIDRk(BigInt(Math.round(max * (1 - p))))}
            </text>
          </g>
        ))}
        <path d={areaPath} className="area" />
        <path d={linePath("rev")} className="line" />
        <path d={linePath("profit")} className="line alt" />
        {data.map((d, i) => (
          <g key={i}>
            <circle cx={xs(i)} cy={ys(Number(d.rev))} r={3.5} className="dot" />
            <text x={xs(i)} y={H - 6} textAnchor="middle" className="axis">
              {d.label}
            </text>
          </g>
        ))}
      </svg>
    </div>
  );
}
