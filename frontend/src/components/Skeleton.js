export function SkeletonBlock({ width, height = "1rem", radius = "var(--radius-sm)", style }) {
  return (
    <div
      className="skeleton-bone"
      style={{ width, height, borderRadius: radius, ...style }}
    />
  );
}

export function KpiSkeleton({ count = 8 }) {
  return (
    <div className="kpi-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="kpi-card skeleton-card" key={i}>
          <div className="kpi-card-top">
            <SkeletonBlock width="40px" height="40px" radius="var(--radius-sm)" />
          </div>
          <SkeletonBlock width="60%" height="1.6rem" style={{ marginBottom: ".5rem" }} />
          <SkeletonBlock width="80%" height=".7rem" />
        </div>
      ))}
    </div>
  );
}

export function ChartSkeleton({ count = 4 }) {
  return (
    <div className="chart-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div className="chart-card skeleton-card" key={i}>
          <SkeletonBlock width="50%" height="1rem" style={{ marginBottom: "1rem" }} />
          <SkeletonBlock width="100%" height="200px" radius="var(--radius-md)" />
        </div>
      ))}
    </div>
  );
}

export function AICardSkeleton() {
  return (
    <div className="ai-rec-card skeleton-card">
      <SkeletonBlock width="45%" height=".8rem" style={{ marginBottom: "1rem" }} />
      <SkeletonBlock width="100%" height="10px" radius="20px" style={{ marginBottom: ".75rem" }} />
      <SkeletonBlock width="35%" height="1.5rem" radius="20px" style={{ marginBottom: "1rem" }} />
      <SkeletonBlock width="100%" height=".8rem" style={{ marginBottom: ".4rem" }} />
      <SkeletonBlock width="90%" height=".8rem" style={{ marginBottom: ".4rem" }} />
      <SkeletonBlock width="70%" height=".8rem" />
    </div>
  );
}

export function TableSkeleton({ rows = 6, cols = 8 }) {
  return (
    <table className="returns-table">
      <tbody>
        {Array.from({ length: rows }).map((_, r) => (
          <tr key={r}>
            {Array.from({ length: cols }).map((_, c) => (
              <td key={c}>
                <SkeletonBlock width={c === 0 ? "40px" : "85%"} height=".9rem" />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export function FiltersSkeleton() {
  return (
    <div className="toolbar">
      <SkeletonBlock width="260px" height="2.6rem" radius="var(--radius-sm)" />
      <SkeletonBlock width="130px" height="2.6rem" radius="var(--radius-sm)" />
      <SkeletonBlock width="130px" height="2.6rem" radius="var(--radius-sm)" />
      <SkeletonBlock width="130px" height="2.6rem" radius="var(--radius-sm)" />
    </div>
  );
}
