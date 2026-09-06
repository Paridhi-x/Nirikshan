import { useState } from "react";
import "./FindingsScreen.css";

function buildFindingsFromRows(rows) {
  return rows
    .filter((row) => !row.found || row.warning)
    .map((row, idx) => ({
      id: `f${idx + 1}`,
      severity:
        !row.found &&
        (row.key === "mfgDate" || row.key === "mrp" || row.key === "manufacturer")
          ? "critical"
          : "review",
      title: !row.found
        ? `${row.label} not clearly declared`
        : `${row.label} — formatting issue`,
      evidenceStatus: !row.found ? "NOT DETECTED" : "DETECTED WITH WARNING",
      evidenceTitle: row.label,
      evidenceText: !row.found
        ? `No clearly identifiable “${row.label.toLowerCase()}” information was detected in the uploaded product image via OCR.`
        : row.warning || `“${row.label}” was detected but does not fully match the required format.`,
      requirementNumber: row.rule || "RULE 6",
      requirementTitle: "Mandatory declaration",
      requirementText: row.requirement,
      ruleRef: "LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011",
      status: "pending",
    }));
}

function FindingsScreen({
  declarationRows,
  onBack,
  onContinue,
  onSaveDraft,
  inspectionId = "LMD-2026-0924",
  appVersion = "v2.4",
}) {
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

  const handleSaveDraft = () => {
    if (onSaveDraft) onSaveDraft(findings);
  };

  const noteText = allReviewed
    ? "All findings have been reviewed. Overrides are recorded in the official audit trail."
    : `${pendingCount} finding${pendingCount > 1 ? "s" : ""} require${
        pendingCount === 1 ? "s" : ""
      } manual verification. Any override will be recorded in the official audit trail.`;

  const Header = (
    <header className="findings-header">
      <div className="header-left">
        <button className="back-link" onClick={onBack}>
          <span className="back-arrow">←</span> Back to Analysis
        </button>
        <span className="header-divider">/</span>
        <span className="inspection-id">
          Inspection ID: <strong>{inspectionId}</strong>
        </span>
      </div>
      <div className="header-right">
        <span className="header-step">STEP 05 · INSPECTION FINDINGS</span>
        <span className="header-version">NIRIKSHAN {appVersion}</span>
      </div>
    </header>
  );

  const Footer = (
    <footer className="findings-footer">
      Legal Metrology Division (LMD) Enforcement Portal · Government of India Standards
      Verification
    </footer>
  );

  if (findings.length === 0) {
    return (
      <div className="findings-page">
        {Header}

        <main className="findings-main">
          <div className="findings-eyebrow">STEP 05 · INSPECTION FINDINGS</div>
          <h1 className="findings-title">No violations found</h1>
          <p className="findings-subtitle">
            All mandatory declarations were detected successfully.
          </p>

          <div className="findings-bottom-bar">
            <button className="btn-text-link" onClick={onBack}>
              ← Back to Analysis
            </button>
            <div className="findings-bottom-actions">
              <button className="btn-primary-dark" onClick={handleGenerateReport}>
                Complete Compliance Check <span>→</span>
              </button>
            </div>
          </div>
        </main>

        {Footer}
      </div>
    );
  }

  return (
    <div className="findings-page">
      {Header}

      <main className="findings-main">
        <div className="findings-eyebrow">STEP 05 · INSPECTION FINDINGS</div>
        <h1 className="findings-title">Review findings</h1>
        <p className="findings-subtitle">
          NIRIKSHAN identified{" "}
          <strong>
            {findings.length} potential declaration issue{findings.length !== 1 ? "s" : ""}
          </strong>{" "}
          requiring inspector verification.
        </p>

        <section className="findings-table-card">
          <div className="findings-table-header">
            <span className="findings-table-title">EXTRACTED FINDINGS</span>
            <div className="findings-chips">
              <span className="chip chip-confirmed">
                <i className="chip-dot" />
                {confirmedCount} Confirmed
              </span>
              <span className="chip chip-pending">
                <i className="chip-dot" />
                {pendingCount} Needs Review
              </span>
              {dismissedCount > 0 && (
                <span className="chip chip-dismissed">
                  <i className="chip-dot" />
                  {dismissedCount} Dismissed
                </span>
              )}
              {pendingCount > 0 && (
                <button className="btn-confirm-all" onClick={handleConfirmAll}>
                  Confirm all
                </button>
              )}
            </div>
          </div>

          <div className="findings-columns-header">
            <span>FIELD</span>
            <span>DETECTED INFORMATION</span>
            <span>RULE</span>
            <span>STATUS</span>
            <span>ACTION</span>
          </div>

          {findings.map((finding) => (
            <div
              className={`findings-row status-${finding.status} severity-${finding.severity}`}
              key={finding.id}
            >
              <div className="row-cell row-field" data-label="Field">
                <strong>{finding.evidenceTitle}</strong>
                <span className={`severity-badge sev-${finding.severity}`}>
                  {finding.severity === "critical" ? "Potential violation" : "Needs review"}
                </span>
              </div>

              <div className="row-cell row-detected" data-label="Detected information">
                {editingId === finding.id ? (
                  <div className="edit-area">
                    <textarea
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      rows={3}
                      autoFocus
                    />
                    <div className="edit-actions">
                      <button className="edit-cancel" onClick={cancelEdit}>
                        Cancel
                      </button>
                      <button className="edit-save" onClick={() => saveEdit(finding.id)}>
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span
                      className={`detected-badge ${
                        finding.evidenceStatus === "NOT DETECTED" ? "badge-missing" : "badge-warning"
                      }`}
                    >
                      {finding.evidenceStatus}
                    </span>
                    <p className="detected-text">{finding.evidenceText}</p>
                  </>
                )}
              </div>

              <div className="row-cell row-rule" data-label="Rule">
                <span className="rule-badge">{finding.requirementNumber}</span>
                <p className="rule-text">{finding.requirementText}</p>
              </div>

              <div className="row-cell row-status" data-label="Status">
                {finding.status === "pending" && (
                  <span className="status-badge status-pending">Needs Review</span>
                )}
                {finding.status === "confirmed" && (
                  <span className="status-badge status-confirmed">Confirmed</span>
                )}
                {finding.status === "dismissed" && (
                  <span className="status-badge status-dismissed">Dismissed</span>
                )}
              </div>

              <div className="row-cell row-action" data-label="Action">
                {editingId === finding.id ? null : (
                  <div className="action-links">
                    <button
                      className="action-link action-confirm"
                      disabled={finding.status === "confirmed"}
                      onClick={() => handleConfirm(finding.id)}
                    >
                      Confirm
                    </button>
                    <span className="action-sep">·</span>
                    <button
                      className="action-link action-dismiss"
                      disabled={finding.status === "dismissed"}
                      onClick={() => handleDismiss(finding.id)}
                    >
                      Dismiss
                    </button>
                    <span className="action-sep">·</span>
                    <button className="action-link action-edit" onClick={() => startEdit(finding)}>
                      Edit
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </section>

        <p className="findings-note">
          <span className="note-icon">ⓘ</span>
          {noteText}
        </p>

        <div className="findings-bottom-bar">
          <button className="btn-text-link" onClick={onBack}>
            ← Back to Analysis
          </button>
          <div className="findings-bottom-actions">
            <button className="btn-outline" onClick={handleSaveDraft}>
              Save Draft
            </button>
            <button
              className="btn-primary-dark"
              disabled={!allReviewed}
              onClick={handleGenerateReport}
            >
              Complete Compliance Check <span>→</span>
            </button>
          </div>
        </div>
      </main>

      {Footer}
    </div>
  );
}

export default FindingsScreen;