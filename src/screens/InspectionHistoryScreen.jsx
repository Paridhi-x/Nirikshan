import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "../firebaseConfig";
import "./DashboardScreen.css";
import "./InspectionHistoryScreen.css";

const MONTHS = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

function parseDisplayDate(str) {
  if (!str) return new Date(0);
  const parts = str.trim().split(" ");
  if (parts.length !== 3) return new Date(0);
  const [day, mon, year] = parts;
  const month = MONTHS[mon.toUpperCase()];
  if (month === undefined) return new Date(0);
  return new Date(Number(year), month, Number(day));
}

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

const IconCheck = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" width={p.size || 12} height={p.size || 12}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
  </svg>
);
const IconAlert = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 14} height={p.size || 14}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
  </svg>
);
const IconClock = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 12} height={p.size || 12}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z" />
  </svg>
);
const IconScale = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width={p.size || 20} height={p.size || 20}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17m0-17c-1.6 0-3.2.45-4.7 1.3M12 3c1.6 0 3.2.45 4.7 1.3M4.3 8.3 2 13a2.8 2.8 0 0 0 4.9 0L4.3 8.3Zm15.4 0L17.4 13a2.8 2.8 0 0 0 4.9 0l-2.6-4.7ZM4.3 8.3h15.4M8.7 20h6.6" />
  </svg>
);
const IconSearch = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 15} height={p.size || 15}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
  </svg>
);

const PAGE_SIZE = 10;

export default function InspectionHistoryScreen({ onBack, onLogout }) {
  const [inspections, setInspections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

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

  const byFilter =
    filter === "flagged" ? flaggedList :
    filter === "pending" ? pendingList :
    filter === "compliant" ? compliantList :
    inspections;

  const searchLower = search.trim().toLowerCase();
  const filteredList = searchLower
    ? byFilter.filter(
        (row) =>
          row.productName?.toLowerCase().includes(searchLower) ||
          row.inspectionId?.toLowerCase().includes(searchLower) ||
          row.manufacturer?.toLowerCase().includes(searchLower)
      )
    : byFilter;

  const totalPages = Math.max(1, Math.ceil(filteredList.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredList.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const changeFilter = (f) => {
    setFilter(f);
    setPage(1);
  };

  const changeSearch = (v) => {
    setSearch(v);
    setPage(1);
  };

  return (
    <div className="nk-root">
      {/* HEADER */}
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
        <div className="eyebrow">INSPECTION HISTORY</div>

        <div className="page-top">
          <div>
            <h2 className="serif">All Inspections</h2>
            <p>Complete record of logged inspections, searchable and filterable, under the Legal Metrology (Packaged Commodities) Rules, 2011.</p>
          </div>
          <button className="btn-dark-sm" onClick={onBack}>← Back to Dashboard</button>
        </div>

        {/* STATS strip */}
        <div className="stats-panel" style={{ marginBottom: 20 }}>
          <div className="stat-col">
            <span className="stat-label">TOTAL LOGGED</span>
            <div className="stat-value-row">
              <span className="stat-value serif">{total}</span>
            </div>
          </div>
          <div className="stat-col">
            <span className="stat-label green">COMPLIANT</span>
            <div className="stat-value-row">
              <span className="stat-value green serif">{compliantList.length}</span>
            </div>
          </div>
          <div className="stat-col">
            <span className="stat-label red">FLAGGED</span>
            <div className="stat-value-row">
              <span className="stat-value red serif">{flaggedList.length}</span>
            </div>
          </div>
          <div className="stat-col">
            <span className="stat-label amber">PENDING</span>
            <div className="stat-value-row">
              <span className="stat-value amber serif">{pendingList.length}</span>
            </div>
          </div>
        </div>

        {/* MAIN PANEL */}
        <div className="panel">
          <div className="panel-header" style={{ flexWrap: "wrap", gap: 12 }}>
            <div className="ih-search-wrap">
              <IconSearch />
              <input
                type="text"
                placeholder="Search by product, inspection ID or manufacturer…"
                value={search}
                onChange={(e) => changeSearch(e.target.value)}
                className="ih-search-input"
              />
            </div>
            <div className="filters">
              <span className="flabel">Filter:</span>
              <button className={`fbtn ${filter === "all" ? "active" : ""}`} onClick={() => changeFilter("all")}>
                All ({total})
              </button>
              <button className={`fbtn ${filter === "compliant" ? "active" : ""}`} onClick={() => changeFilter("compliant")}>
                Compliant ({compliantList.length})
              </button>
              <button className={`fbtn ${filter === "flagged" ? "active" : ""}`} onClick={() => changeFilter("flagged")}>
                Flagged ({flaggedList.length})
              </button>
              <button className={`fbtn ${filter === "pending" ? "active" : ""}`} onClick={() => changeFilter("pending")}>
                Pending ({pendingList.length})
              </button>
            </div>
          </div>

          {loading ? (
            <p style={{ color: "var(--muted-2)", fontSize: 13 }}>Loading inspections…</p>
          ) : filteredList.length === 0 ? (
            <p style={{ color: "var(--muted-2)", fontSize: 13, textAlign: "center", padding: "24px 0" }}>
              No inspections match this search/filter.
            </p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>COMMODITY / PRODUCT</th>
                    <th>INSPECTION ID</th>
                    <th>DATE</th>
                    <th>STATUTORY STATUS</th>
                    <th className="right">SCORE</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((row) => (
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
                        {row.score != null ? `${row.score}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="ih-pagination">
                <button
                  className="fbtn"
                  disabled={safePage === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  ← Prev
                </button>
                <span className="ih-page-label">
                  Page {safePage} of {totalPages}
                </span>
                <button
                  className="fbtn"
                  disabled={safePage === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next →
                </button>
              </div>
            </>
          )}
        </div>
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
        </div>
        <div className="foot-bottom">
          <span>© 2026 Department of Consumer Affairs, Ministry of Consumer Affairs, Food &amp; Public Distribution, Government of India.</span>
        </div>
      </footer>
    </div>
  );
}