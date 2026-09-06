const MONTHS = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

function parseDisplayDate(str) {
  if (!str) return null;
  const parts = str.trim().split(" ");
  if (parts.length !== 3) return null;
  const [day, mon, year] = parts;
  const month = MONTHS[mon.toUpperCase()];
  if (month === undefined) return null;
  return new Date(Number(year), month, Number(day));
}

function toDayKey(date) {
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function shortLabel(date) {
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return days[date.getDay()];
}

// Builds the last 7 calendar days (today at the end) with compliance rate
// for whichever inspections fall on each day.
function buildTrend(inspections) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const byDay = {};
  inspections.forEach((row) => {
    const d = parseDisplayDate(row.date);
    if (!d) return;
    const key = toDayKey(d);
    if (!byDay[key]) byDay[key] = { total: 0, compliant: 0 };
    byDay[key].total += 1;
    if (row.status === "compliant") byDay[key].compliant += 1;
  });

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = toDayKey(d);
    const entry = byDay[key];
    days.push({
      label: shortLabel(d),
      total: entry ? entry.total : 0,
      rate: entry && entry.total > 0 ? Math.round((entry.compliant / entry.total) * 100) : null,
    });
  }
  return days;
}

// Groups flagged inspections by their flagReason (the specific rule cited)
// and returns the top N most common violation categories.
function buildTopViolations(inspections, limit = 5) {
  const counts = {};
  inspections
    .filter((row) => row.status === "flagged")
    .forEach((row) => {
      const reason = row.flagReason || "Unspecified declaration issue";
      counts[reason] = (counts[reason] || 0) + 1;
    });

  return Object.entries(counts)
    .map(([reason, count]) => ({ reason, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function rateColor(rate) {
  if (rate === null) return "#e6e1d4"; // no data — neutral grey
  if (rate >= 80) return "#1f6b41"; // green
  if (rate >= 50) return "#a8711f"; // amber
  return "#a3372a"; // red
}

export default function AnalyticsPanel({ inspections }) {
  const trend = buildTrend(inspections);
  const topViolations = buildTopViolations(inspections);
  const maxViolationCount = topViolations.length ? topViolations[0].count : 1;

  const chartHeight = 90;

  return (
    <div className="main-grid" style={{ marginTop: 20 }}>
      {/* COMPLIANCE TREND */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow small" style={{ marginBottom: 2 }}>ANALYTICS</div>
            <h3 className="serif">Compliance Rate — Last 7 Days</h3>
          </div>
        </div>

        {inspections.length === 0 ? (
          <p style={{ color: "var(--muted-2)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
            No data yet to chart.
          </p>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 12, height: chartHeight + 30, padding: "8px 4px 0" }}>
            {trend.map((day, idx) => {
              const barHeight = day.rate === null ? 4 : Math.max(4, (day.rate / 100) * chartHeight);
              return (
                <div key={idx} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--muted-2)" }}>
                    {day.rate !== null ? `${day.rate}%` : "—"}
                  </div>
                  <div
                    style={{
                      width: "100%",
                      maxWidth: 34,
                      height: barHeight,
                      background: rateColor(day.rate),
                      borderRadius: "4px 4px 0 0",
                      transition: "height 0.3s ease",
                    }}
                    title={day.total > 0 ? `${day.total} inspection${day.total > 1 ? "s" : ""}` : "No inspections"}
                  />
                  <div style={{ fontSize: 11, color: "var(--muted-2)", fontWeight: 600 }}>{day.label}</div>
                </div>
              );
            })}
          </div>
        )}

        <div className="table-footer" style={{ marginTop: 16 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11.5 }}>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: "#1f6b41", display: "inline-block" }} />
              80%+ compliant
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: "#a8711f", display: "inline-block" }} />
              50–79%
            </span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 2, background: "#a3372a", display: "inline-block" }} />
              Below 50%
            </span>
          </span>
        </div>
      </div>

      {/* TOP VIOLATION CATEGORIES */}
      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="eyebrow small" style={{ marginBottom: 2, color: "var(--rust)" }}>ANALYTICS</div>
            <h3 className="serif">Top Violation Categories</h3>
          </div>
        </div>

        {topViolations.length === 0 ? (
          <p style={{ color: "var(--muted-2)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
            No flagged violations recorded yet.
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14, padding: "4px 0" }}>
            {topViolations.map((v, idx) => (
              <div key={idx}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12.5, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: "var(--ink)" }}>{v.reason}</span>
                  <span style={{ color: "var(--muted-2)", fontWeight: 700 }}>{v.count}</span>
                </div>
                <div style={{ background: "var(--line-soft)", borderRadius: 4, height: 8, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(v.count / maxViolationCount) * 100}%`,
                      height: "100%",
                      background: "#a3372a",
                      borderRadius: 4,
                      transition: "width 0.3s ease",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}