/** Kompaktní statistika (druhotné metriky na dashboardu). */
export function MetricCard({
  label,
  value,
  tnum = true,
}: {
  label: string;
  value: string | number;
  tnum?: boolean;
}) {
  return (
    <div className="stat">
      <div className={`stat-value${tnum ? " tnum" : ""}`}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}
