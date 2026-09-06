import { useState } from "react";
import "./FindingsScreen.css";

function buildFindingsFromRows(rows) {
  return rows
    .filter((row) => !row.found || row.warning)
    .map((row, idx) => ({
      id: `f${idx + 1}`,
      severity: !row.found && (row.key === "mfgDate" || row.key === "mrp" || row.key === "manufacturer")
        ? "critical"
        : "review",
      title: !row.found
        ? `${row.label} not clearly declared`
        : `${row.label} — formatting issue`,
      evidenceStatus: !row.found ? "NOT DETECTED" : "DETECTED WITH WARNING",
      evidenceTitle: row.label,
      evidenceText: !row.found
        ? `No clearly identifiable "${row.label.toLowerCase()}" information was detected in the uploaded product image via OCR.`
        : row.warning || `"${row.label}" was detected but does not fully match the required format.`,
      requirementNumber: row.rule || "RULE 6",
      requirementTitle: "Mandatory declaration",
      requirementText: row.requirement,
      ruleRef: "LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011",
      status: "pending",
    }));
}

function FindingsScreen({ declarationRows, onBack, onContinue }) {
  const [findings, setFindings] = useState(() =>
    buildFindingsFromRows(declarationRows || [])
  );
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const confirmedCount = findings.filter((f) => f.status === "confirmed").length;
  const dismissedCount = findings.filter((f) => f.status === "dismissed").length;
  const pendingCount = findings.filter((f) => f.status === "pending").length;
  const allReviewed = pendingCount === 0;

  const handleConfirm = (id) =>
    setFindings((prev) => prev.map((f) => (f.id === id ? { ...f, status: "confirmed" } : f)));

  const handleDismiss = (id) =>
    setFindings((prev) => prev.map((f) => (f.id === id ? { ...f, status: "dismissed" } : f)));

  const handleConfirmAll = () => {
    setFindings((prev) =>
      prev.map((f) => (f.status === "pending" ? { ...f, status: "confirmed" } : f))
    );
  };

  const startEdit = (finding) => {
    setEditingId(finding.id);
    setEditText(finding.evidenceText);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditText("");
  };

  const saveEdit = (id) => {
    setFindings((prev) =>
      prev.map((f) => (f.id === id ? { ...f, evidenceText: editText } : f))
    );
    setEditingId(null);
    setEditText("");
  };

  const handleGenerateReport = () => {
    onContinue(findings, Date.now());
  };

  if (findings.length === 0) {
    return (
      <div className="findings-page">
        <header className="findings-header">
          <div className="findings-brand">
            <div className="findings-brand-mark">N</div>
            <div>
              <div className="findings-brand-name">NIRIKSHAN</div>
              <div className="findings-brand-subtitle">LEGAL METROLOGY</div>
            </div>
          </div>
          <div className="findings-step">
            <span>INSPECTION FINDINGS</span>
            <strong>05 / 06</strong>
          </div>
        </header>

        <main className="findings-main">
          <section className="findings-heading">
            <div className="findings-eyebrow">COMPLIANCE ASSESSMENT</div>
            <h1>No violations found</h1>
            <p>All mandatory declarations were detected successfully.</p>
          </section>

          <div className="findings-actions">
            <button className="findings-back-button" onClick={onBack}>
              ← BACK TO REVIEW
            </button>

            <button className="findings-continue-button" onClick={handleGenerateReport}>
              GENERATE INSPECTION REPORT
              <span>→</span>
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="findings-page">
      <header className="findings-header">
        <div className="findings-brand">
          <div className="findings-brand-mark">N</div>
          <div>
            <div className="findings-brand-name">NIRIKSHAN</div>
            <div className="findings-brand-subtitle">LEGAL METROLOGY</div>
          </div>
        </div>
        <div className="findings-step">
          <span>INSPECTION FINDINGS</span>
          <strong>05 / 06</strong>
        </div>
      </header>

      <main className="findings-main">
        <section className="findings-heading">
          <div className="findings-eyebrow">COMPLIANCE ASSESSMENT</div>

          <div className="result-title-row">
            <div>
              <h1>Review findings</h1>
              <p>
                NIRIKSHAN identified {findings.length} potential declaration
                issues requiring inspector verification.
              </p>
            </div>

            <div className="result-badge">
              <span className="result-badge-dot"></span>
              {findings.length} FLAGGED
            </div>
          </div>
        </section>

        <section className="result-summary">
          <div className="result-summary-stats">
            <div>
              <span>TOTAL FINDINGS</span>
              <strong>{findings.length}</strong>
            </div>
            <div>
              <span>CONFIRMED</span>
              <strong className="confirmed-number">{confirmedCount}</strong>
            </div>
            <div>
              <span>DISMISSED</span>
              <strong className="dismissed-number">{dismissedCount}</strong>
            </div>
            <div>
              <span>PENDING</span>
              <strong className="pending-number">{pendingCount}</strong>
            </div>
          </div>
        </section>

        {pendingCount > 0 && (
          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "16px" }}>
            <button
              onClick={handleConfirmAll}
              style={{
                border: "1px solid #2FA66B",
                background: "transparent",
                color: "#2FA66B",
                padding: "9px 16px",
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "1px",
                cursor: "pointer",
              }}
            >
              CONFIRM ALL ({pendingCount})
            </button>
          </div>
        )}

        <section className="findings-list">
          {findings.map((finding, index) => (
            <div
              className={`finding-card severity-${finding.severity} status-${finding.status}`}
              key={finding.id}
            >
              <div className="finding-card-header">
                <div>
                  <span className={`finding-label label-${finding.severity}`}>
                    {String(index + 1).padStart(2, "0")} ·{" "}
                    {finding.severity === "critical" ? "POTENTIAL VIOLATION" : "NEEDS REVIEW"}
                  </span>
                  <h2>{finding.title}</h2>
                </div>

                <div className={`finding-status-badge status-${finding.status}`}>
                  {finding.status === "pending" && "PENDING"}
                  {finding.status === "confirmed" && "✓ CONFIRMED"}
                  {finding.status === "dismissed" && "✕ DISMISSED"}
                </div>
              </div>

              <div className="finding-content">
                <div className="finding-column">
                  <div className="column-label">DETECTED INFORMATION</div>
                  <div className="evidence-box">
                    <span className="evidence-status">{finding.evidenceStatus}</span>
                    <strong>{finding.evidenceTitle}</strong>

                    {editingId === finding.id ? (
                      <div className="edit-area">
                        <textarea
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          rows={4}
                        />
                        <div className="edit-actions">
                          <button className="edit-cancel" onClick={cancelEdit}>
                            CANCEL
                          </button>
                          <button className="edit-save" onClick={() => saveEdit(finding.id)}>
                            SAVE
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p>{finding.evidenceText}</p>
                    )}
                  </div>
                </div>

                <div className="finding-column">
                  <div className="column-label">APPLICABLE REQUIREMENT</div>
                  <div className="requirement-box">
                    <div className="requirement-number">{finding.requirementNumber}</div>
                    <strong>{finding.requirementTitle}</strong>
                    <p>{finding.requirementText}</p>
                    <span className="rule-reference">{finding.ruleRef}</span>
                  </div>
                </div>
              </div>

              <div className="finding-actions">
                <button
                  className="finding-confirm"
                  disabled={finding.status === "confirmed"}
                  onClick={() => handleConfirm(finding.id)}
                >
                  CONFIRM FINDING
                </button>
                <button
                  className="finding-dismiss"
                  disabled={finding.status === "dismissed"}
                  onClick={() => handleDismiss(finding.id)}
                >
                  DISMISS FINDING
                </button>
                <button className="finding-edit" onClick={() => startEdit(finding)}>
                  EDIT FINDING
                </button>
              </div>
            </div>
          ))}
        </section>

        <div className="findings-actions">
          <button className="findings-back-button" onClick={onBack}>
            ← BACK TO REVIEW
          </button>

          <div className="findings-continue-wrap">
            {!allReviewed && (
              <span className="continue-hint">
                {pendingCount} finding{pendingCount > 1 ? "s" : ""} still need review
              </span>
            )}

            <button
              className="findings-continue-button"
              disabled={!allReviewed}
              onClick={handleGenerateReport}
            >
              GENERATE INSPECTION REPORT
              <span>→</span>
            </button>
          </div>
        </div>
      </main>

      <footer className="findings-footer">
        <span>DEPARTMENT OF CONSUMER AFFAIRS</span>
        <span>LEGAL METROLOGY · INSPECTION FINDINGS</span>
        <span>NIRIKSHAN · v1.0</span>
      </footer>
    </div>
  );
}

export default FindingsScreen;