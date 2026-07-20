/** Minimal dependency-free SVG bar trend (UX §10: soft, breathing, one hero).
 *  Text alternative included for screen readers (NFR-8). */

export interface DayPoint {
  label: string;
  value: number;
}

export function TrendChart({ points, unit }: { points: DayPoint[]; unit: string }) {
  const max = Math.max(...points.map((p) => p.value), 1);
  const W = 640;
  const H = 140;
  const gap = 6;
  const bw = Math.max(4, W / points.length - gap);

  const summary =
    points.filter((p) => p.value > 0).length === 0
      ? "No activity in this period."
      : points
          .filter((p) => p.value > 0)
          .map((p) => `${p.label}: ${p.value} ${unit}`)
          .join(", ");

  return (
    <div className="chart-wrap">
      <svg
        viewBox={`0 0 ${W} ${H + 24}`}
        width="100%"
        role="img"
        aria-label={`Usage trend. ${summary}`}
      >
        {points.map((p, i) => {
          const h = Math.max(2, (p.value / max) * H);
          const x = i * (bw + gap);
          return (
            <g key={i}>
              <rect
                x={x}
                y={H - h}
                width={bw}
                height={h}
                rx={3}
                fill={p.value > 0 ? "var(--accent)" : "var(--line)"}
                opacity={p.value > 0 ? 0.85 : 0.6}
              />
              {points.length <= 14 && (
                <text
                  x={x + bw / 2}
                  y={H + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="var(--ink-faint)"
                >
                  {p.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
