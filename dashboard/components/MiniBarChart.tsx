export default function MiniBarChart({
  data,
  height = 80,
}: {
  data: { label: string; value: number }[];
  height?: number;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const barWidth = 100 / data.length;

  return (
    <div style={{ width: "100%" }}>
      <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" style={{ width: "100%", height }}>
        {data.map((d, i) => {
          const barHeight = (d.value / max) * (height - 16);
          return (
            <rect
              key={i}
              x={i * barWidth + barWidth * 0.15}
              y={height - barHeight - 14}
              width={barWidth * 0.7}
              height={barHeight}
              rx={1}
              fill="#5ac8fa"
              opacity={0.85}
            />
          );
        })}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4 }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: 9, color: "#54585f", flex: 1, textAlign: "center" }}>
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}
