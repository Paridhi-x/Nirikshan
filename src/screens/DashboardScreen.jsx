import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "./DashboardScreen.css";
import AnalyticsPanel from "./AnalyticsPanel";

const MONTHS = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

// Reliable reference source for the Legal Metrology (Packaged Commodities)
// Rules, 2011 — used by the "View Framework" quick link below. Official
// .gov.in / .nic.in PDF hosts have been intermittently unreachable on this
// network, so a stable non-government mirror (legal blog with full rule
// text/analysis) is used instead.
const PCR_2011_PDF_URL = "https://blog.ipleaders.in/legal-metrology-packaged-commodities-rules-2011/";

function parseDisplayDate(str) {
  if (!str) return new Date(0);
  const parts = str.trim().split(" ");
  if (parts.length !== 3) return new Date(0);
  const [day, mon, year] = parts;
  const month = MONTHS[mon.toUpperCase()];
  if (month === undefined) return new Date(0);
  return new Date(Number(year), month, Number(day));
}

/* ---------- deterministic swatch colors ---------- */
const SWATCH_PALETTE = [
  "#7f9c7a", "#d1a24a", "#b7a98f", "#5f9a83",
  "#a68b64", "#6f8fa6", "#9c7fae", "#a67f6a",
];
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}
function getSwatchColor(row) {
  if (row.swatchColor) return row.swatchColor;
  const seed = row.inspectionId || row.productName || row.id || "x";
  return SWATCH_PALETTE[hashString(seed) % SWATCH_PALETTE.length];
}

/* ---------- flat line icons ---------- */
const IconCamera = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 16} height={p.size || 16}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.25 2.25 0 0 1 8.905 4.5h6.19a2.25 2.25 0 0 1 2.078 1.675l.415 1.663c.055.221.207.406.413.5.212.098.397.238.545.416A3 3 0 0 1 21 10.5v6.75A2.25 2.25 0 0 1 18.75 19.5H5.25A2.25 2.25 0 0 1 3 17.25V10.5a3 3 0 0 1 1.549-2.63.977.977 0 0 0 .409-.417l.409-1.663Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 13.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);
const IconAlert = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 14} height={p.size || 14}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);
const IconDoc = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 16} height={p.size || 16}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);
const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" width={p.size || 12} height={p.size || 12}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);
const IconClock = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 12} height={p.size || 12}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />
  </svg>
);
const IconDownload = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 14} height={p.size || 14}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12M12 16.5V3" />
  </svg>
);
const IconTrend = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 14} height={p.size || 14}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.28m5.94 2.28-2.28 5.94" />
  </svg>
);
const IconScale = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width={p.size || 20} height={p.size || 20}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17m0-17c-1.6 0-3.2.45-4.7 1.3M12 3c1.6 0 3.2.45 4.7 1.3M4.3 8.3 2 13a2.8 2.8 0 0 0 4.9 0L4.3 8.3Zm15.4 0L17.4 13a2.8 2.8 0 0 0 4.9 0l-2.6-4.7ZM4.3 8.3h15.4M8.7 20h6.6" />
  </svg>
);
/* --------------------------------------------------------------------- */

export default function DashboardScreen({ onLogout, onNewInspection, onViewHistory }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const q = query(collection(db, "inspections"));
    const unsub = onSnapshot(q, (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      rows.sort((a, b) => {
        const dateDiff = parseDisplayDate(b.date) - parseDisplayDate(a.date);
        if (dateDiff !== 0) return dateDiff;
        const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
        const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
        return aTime - bTime;
      });
      setInspections(rows);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const total = inspections.length;
  const flaggedList = inspections.filter((i) => i.status === "flagged");
  const pendingList = inspections.filter((i) => i.status === "pending");
  const compliantList = inspections.filter((i) => i.status === "compliant");
  const complianceRate = total ? Math.round((compliantList.length / total) * 100) : 0;

  const filteredList =
    filter === "flagged" ? flaggedList : filter === "pending" ? pendingList : inspections;
  const visibleRows = filteredList.slice(0, 4);

  const openFramework = () => {
    window.open(PCR_2011_PDF_URL, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="nk-root">
      {/* HEADER (simplified — no govbar, no nav) */}
      <div className="header">
        <div className="brand">
          <div className="logo"><IconScale size={20} /></div>
          <div>
            <h1 className="serif">NIRIKSHAN</h1>
            <div className="tag">Legal Metrology Compliance Desk</div>
          </div>
        </div>
        <div className="header-right">
          <div className="who">
            <div className="meta">
              <b>Inspector LM / 02481</b>
              HQ Delhi Central Circle
            </div>
          </div>
          <div className="signout" onClick={onLogout} style={{ cursor: "pointer" }}>
            Sign Out
          </div>
        </div>
      </div>

      {/* PAGE */}
      <div className="page">
        <div className="eyebrow">INSPECTION DESK · ZONE 04</div>

        <div className="page-top">
          <div>
            <h2 className="serif">Inspection Overview</h2>
            <p>Commodity compliance tracking, statutory notices, and legal verification under Rule 32.</p>
          </div>
          <button className="btn-primary" onClick={onNewInspection}>
            + New Inspection
          </button>
        </div>

        {/* STATS — single panel, columns divided by lines */}
        <div className="stats-panel">
          <div className="stat-col">
            <span className="stat-label">INSPECTIONS LOGGED</span>
            <div className="stat-value-row">
              <span className="stat-value serif">{total}</span>
              <span className="stat-note green">+12% this week</span>
            </div>
            <div className="stat-desc">Total logged</div>
          </div>

          <div className="stat-col">
            <span className="stat-label red">FLAGGED VIOLATIONS</span>
            <div className="stat-value-row">
              <span className="stat-value red serif">{flaggedList.length}</span>
              <span className="stat-note red">Requires Notice</span>
            </div>
            <div className="stat-desc">Statutory notices pending</div>
          </div>

          <div className="stat-col">
            <span className="stat-label amber">PENDING VERIFICATION</span>
            <div className="stat-value-row">
              <span className="stat-value amber serif">{String(pendingList.length).padStart(2, "0")}</span>
              <span className="stat-note amber">In Review</span>
            </div>
            <div className="stat-desc">Awaiting Controller sign-off</div>
          </div>

          <div className="stat-col">
            <span className="stat-label green">COMPLIANCE RATE</span>
            <div className="stat-value-row">
              <span className="stat-value green serif">{complianceRate}%</span>
              <span className="stat-note green">Standard</span>
            </div>
            <div className="stat-desc">Across market samples</div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="main-grid">
          <div>
            <div className="panel">
              <div className="panel-header">
                <div>
                  <div className="eyebrow small" style={{ marginBottom: 2 }}>RECENT ACTIVITY</div>
                  <h3 className="serif">Recent Inspections</h3>
                </div>
                <div className="filters">
                  <span className="flabel">Filter:</span>
                  <button className={`fbtn ${filter === "all" ? "active" : ""}`} onClick={() => setFilter("all")}>
                    All ({total})
                  </button>
                  <button className={`fbtn ${filter === "flagged" ? "active" : ""}`} onClick={() => setFilter("flagged")}>
                    Flagged ({flaggedList.length})
                  </button>
                  <button className={`fbtn ${filter === "pending" ? "active" : ""}`} onClick={() => setFilter("pending")}>
                    Pending ({pendingList.length})
                  </button>
                  <button className="fbtn link" onClick={onViewHistory}>VIEW ALL →</button>
                </div>
              </div>

              {loading ? (
                <p style={{ color: "var(--muted-2)", fontSize: 13 }}>Loading inspections…</p>
              ) : total === 0 ? (
                <p style={{ color: "var(--muted-2)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
                  No inspections logged yet.
                </p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>COMMODITY / PRODUCT</th>
                      <th>INSPECTION ID</th>
                      <th>DATE</th>
                      <th>STATUTORY STATUS</th>
                      <th className="right">ACTION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <div className="prod-cell">
                            <div className="swatch" style={{ backgroundColor: getSwatchColor(row) }}>
                              {row.swatch || row.productName?.slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <div className="prod-name">{row.productName}</div>
                              <div className="prod-sub">{row.productSub}</div>
                            </div>
                          </div>
                        </td>
                        <td className="idcell">{row.inspectionId}</td>
                        <td className="datecell">{row.date}</td>
                        <td>
                          {row.status === "compliant" && (
                            <span className="status-badge ok" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <IconCheck /> COMPLIANT
                            </span>
                          )}
                          {row.status === "flagged" && (
                            <span className="status-badge flag" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <IconAlert /> FLAGGED{row.flagReason ? ` · ${row.flagReason}` : ""}
                            </span>
                          )}
                          {row.status === "pending" && (
                            <span className="status-badge pending" style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                              <IconClock /> PENDING REVIEW
                            </span>
                          )}
                        </td>
                        <td className="right">
                          <span className={`action-link ${row.status === "flagged" ? "rust" : ""}`}>
                            {row.status === "compliant" && "View Inspection →"}
                            {row.status === "flagged" && "Review Notice →"}
                            {row.status === "pending" && "Audit Evidence →"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {total > 0 && (
                <div className="table-footer">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <IconTrend /> Weekly Compliance Average: <b>{complianceRate}%</b> across {total} market samples
                  </span>
                  <span className="lockpill">TAMPER-PROOF AUDIT LOCK</span>
                </div>
              )}
            </div>

            {/* LEGISLATIVE FOUNDATION */}
            <div className="legis">
              <div className="left">
                <div className="icon"><IconScale size={18} /></div>
                <div>
                  <div className="eyebrow2">LEGISLATIVE FOUNDATION</div>
                  <h4 className="serif">The Legal Metrology Act, 2009 &amp; Packaged Commodities Rules, 2011</h4>
                  <p>Act No. 1 of 2010 · Gazette Notification G.S.R. 202(E) · Ministry of Consumer Affairs</p>
                </div>
              </div>
              <button className="btn-dark-sm" onClick={openFramework}>View Framework →</button>
            </div>
          </div>

          {/* RIGHT SIDEBAR */}
          <div>
            <div className="panel side-block">
              <h3 className="serif" style={{ fontSize: 19, margin: "0 0 14px", fontWeight: 600 }}>Quick Actions</h3>

              <div className="qa-item" style={{ cursor: "pointer" }} onClick={onNewInspection}>
                <div>
                  <div className="qa-title">New Inspection <span className="qa-arrow">→</span></div>
                  <div className="qa-desc">Upload or scan commodity label photos</div>
                </div>
              </div>
              <div className="qa-item" style={{ cursor: "pointer" }} onClick={() => setFilter("flagged")}>
                <div>
                  <div className="qa-title">Review Flagged ({flaggedList.length}) <span className="qa-arrow">→</span></div>
                  <div className="qa-desc">Generate Form-1 notice or hearing notice</div>
                </div>
              </div>
              <div className="qa-item">
                <div>
                  <div className="qa-title">Evidence Chain Audit <span className="qa-arrow">→</span></div>
                  <div className="qa-desc">Access signed digital certificates and hashes</div>
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="mandate-head">
                <h3 className="serif">PCR Rule 6(1) Declarations</h3>
                <span className="badge-count">8 Mandates</span>
              </div>

              <ul className="mandate-list">
                <li><span className="chk"><IconCheck /></span><span><b>Name &amp; Address</b> of Manufacturer / Packer / Importer</span></li>
                <li><span className="chk"><IconCheck /></span><span><b>Net Quantity</b> in standard SI units (g, kg, ml, l)</span></li>
                <li><span className="chk"><IconCheck /></span><span><b>MRP (incl. of all taxes)</b> with explicit unit sale price</span></li>
                <li><span className="chk"><IconCheck /></span><span><b>Month &amp; Year of Packing</b> or pre-packaging</span></li>
                <li><span className="chk"><IconCheck /></span><span><b>Consumer Care Details</b> (Phone, Email &amp; Postal address)</span></li>
              </ul>

              <div className="dl-link" style={{ cursor: "pointer" }} onClick={openFramework}>
                <span>Download Legal Metrology Gazette Reference PDF</span>
                <IconDownload />
              </div>
            </div>
          </div>
        </div>

        <AnalyticsPanel inspections={inspections} />

      </div>

      {/* FOOTER */}
      <footer>
        <div className="foot-top">
          <div className="foot-brand">
            <div className="logo"><IconScale size={16} /></div>
            <div>
              <h5 className="serif">NIRIKSHAN INSPECTION SUITE</h5>
              <p>Legal Metrology Compliance &amp; Regulatory Enforcement Platform</p>
            </div>
          </div>
          <div className="foot-links">
            <span>Legal Metrology Act, 2009</span>
            <span>Packaged Commodities Rules, 2011</span>
            <span>Form-1 Regulatory Notice Format</span>
            <span>Enforcement Tech Support</span>
          </div>
        </div>
        <div className="foot-bottom">
          <span>© 2026 Department of Consumer Affairs, Ministry of Consumer Affairs, Food &amp; Public Distribution, Government of India.</span>
          <span>Designed for Sovereign Enforcement · Hosted on National Informatics Cloud Infrastructure</span>
        </div>
      </footer>
    </div>
  );
}