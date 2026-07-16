function KpiCard({ icon, label, value, colorClass, trend, sublabel }) {
  return (
    <div className={`kpi-card ${colorClass || ""}`}>
      <div className="kpi-card-top">
        <span className="kpi-icon">{icon}</span>
        {trend && (
          <span className={`kpi-trend ${trend.direction}`}>
            {trend.direction === "up" ? "▲" : trend.direction === "down" ? "▼" : "•"} {trend.label}
          </span>
        )}
      </div>
      <div className="kpi-value">{value}</div>
      <div className="kpi-label">{label}</div>
      {sublabel && <div className="kpi-sublabel">{sublabel}</div>}
    </div>
  );
}

export default KpiCard;
