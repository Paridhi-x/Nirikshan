// TEST-MARKER-12345
import { useState } from "react";
import "./ReviewScreen.css";

const BASE_FIELD_CONFIG = [
  {
    key: "manufacturer",
    label: "MANUFACTURER / PACKER / IMPORTER",
    displayLabel: "Manufacturer / Packer / Importer",
    ruleCode: "Rule 6(1)(a)",
    requirement: "Name and address of manufacturer, packer or importer",
    enterLabel: "Enter Manufacturer",
  },
  {
    key: "genericName",
    label: "COMMON / GENERIC NAME",
    displayLabel: "Common / Generic Name",
    ruleCode: "Rule 6(1)(b)",
    requirement: "Common or generic name of the commodity",
    enterLabel: "Enter Name",
  },
  {
    key: "netQuantity",
    label: "NET QUANTITY",
    displayLabel: "Net Quantity",
    ruleCode: "Rule 6(1)(c)",
    requirement: "Net quantity in standard units of weight, volume or number",
    enterLabel: "Enter Quantity",
  },
  {
    key: "mfgDate",
    label: "MONTH & YEAR OF MFG/PACKING",
    displayLabel: "Month & Year of Mfg/Packing",
    ruleCode: "Rule 6(1)(e)",
    requirement: "Month and year in which the commodity was manufactured or packed",
    enterLabel: "Enter Date",
  },
  {
    key: "mrp",
    label: "RETAIL SALE PRICE (MRP)",
    displayLabel: "Retail Sale Price (MRP)",
    ruleCode: "Rule 6(1)(d)",
    requirement: "MRP inclusive of all taxes",
    enterLabel: "Enter MRP",
  },
  {
    key: "consumerCare",
    label: "CONSUMER CARE DETAILS",
    displayLabel: "Consumer Care Details",
    ruleCode: "Rule 6(1)(g)",
    requirement: "Name, address, telephone/e-mail for consumer complaints",
    enterLabel: "Enter Contact",
  },
];

const COUNTRY_OF_ORIGIN_FIELD = {
  key: "countryOfOrigin",
  label: "COUNTRY OF ORIGIN",
  displayLabel: "Country of Origin",
  ruleCode: "Rule 6(1)(f)",
  requirement: "Required only for imported products, as per Rule 6(1)",
  enterLabel: "Enter Origin",
};

function formatDateTime(ms) {
  if (!ms) return "";
  const d = new Date(ms);
  const date = d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  return `${date}, ${time}`;
}

function ReviewScreen({ analysis, productInfo, officerName, onBack, onContinue, onSaveDraft }) {
  const declarations = analysis?.declarations || {};
  const isImported = productInfo?.isImported;

  const [treatAsExempt, setTreatAsExempt] = useState(Boolean(productInfo?.isExempt));

  const fieldConfig = isImported
    ? [...BASE_FIELD_CONFIG, COUNTRY_OF_ORIGIN_FIELD]
    : BASE_FIELD_CONFIG;

  const initialRows = fieldConfig.map((field) => {
    const data = declarations[field.key] || { found: false, value: null, rule: "" };
    return {
      ...field,
      ...data,
      originalValue: data.value,
      originalFound: data.found,
    };
  });

  const [rows, setRows] = useState(initialRows);
  const [editingKey, setEditingKey] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [editReason, setEditReason] = useState("");

  const validCount = rows.filter((r) => r.found).length;
  const reviewCount = rows.length - validCount;
  const warningCount = rows.filter((r) => r.found && r.warning).length;

  const startEdit = (row) => {
    setEditingKey(row.key);
    setEditValue(row.value || "");
    setEditReason("");
  };

  const cancelEdit = () => {
    setEditingKey(null);
    setEditValue("");
    setEditReason("");
  };

  const saveEdit = (key) => {
    if (!editReason.trim()) {
      alert("Please provide a reason for this correction before saving.");
      return;
    }

    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? {
              ...r,
              value: editValue.trim() || null,
              found: Boolean(editValue.trim()),
              warning: null,
              confidence: "manual",
              manuallyEdited: true,
              editReason: editReason.trim(),
              editedBy: officerName || "Unnamed Officer",
              editedAt: Date.now(),
            }
          : r
      )
    );
    setEditingKey(null);
    setEditValue("");
    setEditReason("");
  };

  const handleSaveDraft = () => {
    if (onSaveDraft) onSaveDraft(rows);
  };

  const exemptToggle = (
    <label className="exempt-card" htmlFor="exempt-override">
      <input
        type="checkbox"
        id="exempt-override"
        checked={treatAsExempt}
        onChange={(e) => setTreatAsExempt(e.target.checked)}
      />
      <span>
        Treat this product as an exempt category (Rule 3 / 26) — no declaration checks required
      </span>
    </label>
  );

  if (treatAsExempt) {
    return (
      <div className="review-page">
        <header className="review-header">
          <button className="review-back-link" onClick={onBack}>
            <span className="back-arrow">←</span> Back to Analysis
          </button>
          <div className="review-step">STEP 04 / 05 · REVIEW DECLARATIONS</div>
        </header>

        <main className="review-main">
          <div className="review-eyebrow">STEP 04 · MANDATORY DECLARATIONS</div>
          <h1 className="review-title">Exempt category</h1>
          <p className="review-subtitle">
            This product has been marked as exempt from mandatory declarations under Rule 3 /
            Rule 26 of the Legal Metrology (Packaged Commodities) Rules, 2011 (e.g. package under
            10g/10ml, institutional pack, or agricultural produce above 50kg).
          </p>

          {exemptToggle}

          <p className="review-note">
            <span className="note-icon">ⓘ</span>
            No mandatory declarations apply — Rule 6 checks have been skipped. Untick the box
            above if this was marked in error.
          </p>

          <div className="review-bottom-bar">
            <button className="btn-text-link" onClick={onBack}>
              ← Back to Analysis
            </button>
            <div className="review-bottom-actions">
              <button className="btn-outline" onClick={handleSaveDraft}>
                Save Draft
              </button>
              <button className="btn-primary-dark" onClick={() => onContinue([])}>
                Complete Compliance Check <span>→</span>
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="review-page">
      <header className="review-header">
        <button className="review-back-link" onClick={onBack}>
          <span className="back-arrow">←</span> Back to Analysis
        </button>
        <div className="review-step">STEP 04 / 05 · REVIEW DECLARATIONS</div>
      </header>

      <main className="review-main">
        <div className="review-eyebrow">STEP 04 · MANDATORY DECLARATIONS</div>
        <h1 className="review-title">Review extracted details</h1>
        <p className="review-subtitle">
          Verify mandatory product label declarations against Rule 6 of the Legal Metrology
          (Packaged Commodities) Rules, 2011.
          {isImported ? " Country of Origin is checked as this product is marked imported." : ""}
        </p>

        {exemptToggle}

        <section className="declaration-card">
          <div className="declaration-card-header">
            <span className="declaration-card-title">EXTRACTED DECLARATIONS</span>
            <div className="declaration-chips">
              <span className="chip chip-valid">
                <i className="chip-dot" />
                {validCount} Valid
              </span>
              {reviewCount > 0 && (
                <span className="chip chip-review">
                  <i className="chip-dot" />
                  {reviewCount} Needs Review
                </span>
              )}
            </div>
          </div>

          <div className="declaration-columns-header">
            <span>FIELD</span>
            <span>EXTRACTED VALUE</span>
            <span>RULE</span>
            <span>STATUS</span>
            <span>ACTION</span>
          </div>

          {rows.map((row) => {
            const displayRule = row.rule || row.ruleCode;
            return (
              <div
                className={`declaration-row ${!row.found ? "needs-review-row" : ""}`}
                key={row.key}
              >
                <div className="cell cell-field" data-label="Field">
                  {row.displayLabel || row.label}
                </div>

                <div className="cell cell-value" data-label="Extracted value">
                  {editingKey === row.key ? (
                    <div className="edit-area">
                      <input
                        type="text"
                        className="edit-input"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Corrected value"
                        autoFocus
                      />
                      <input
                        type="text"
                        className="edit-input edit-input-reason"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="Reason for correction (required)"
                      />
                      <div className="edit-meta">
                        Will be recorded as corrected by:{" "}
                        <span>{officerName || "Unnamed Officer"}</span>
                      </div>
                      <div className="edit-actions">
                        <button className="edit-save" onClick={() => saveEdit(row.key)}>
                          Save
                        </button>
                        <button className="edit-cancel" onClick={cancelEdit}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      {row.found ? (
                        <span className="value-text">{row.value}</span>
                      ) : (
                        <span className="value-missing">Not detected on label</span>
                      )}

                      {row.warning && (
                        <span className="value-warning">⚠ {row.warning}</span>
                      )}

                      {row.manuallyEdited && (
                        <div className="edit-history">
                          <div>
                            AI detected:{" "}
                            <span>{row.originalFound ? row.originalValue : "Not detected"}</span>
                          </div>
                          <div>
                            Corrected by: <span className="edit-history-officer">{row.editedBy}</span>
                            {" · "}
                            {formatDateTime(row.editedAt)}
                          </div>
                          <div>
                            Reason: <span>{row.editReason}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="cell cell-rule" data-label="Rule">
                  {displayRule}
                </div>

                <div className="cell cell-status" data-label="Status">
                  {row.found ? (
                    <span className="status-pill pill-valid">✓ Valid</span>
                  ) : (
                    <span className="status-pill pill-review">⚠ Needs Review</span>
                  )}
                </div>

                <div className="cell cell-action" data-label="Action">
                  {editingKey === row.key ? null : row.found ? (
                    <button className="action-edit-link" onClick={() => startEdit(row)}>
                      Edit
                    </button>
                  ) : (
                    <button className="action-enter-btn" onClick={() => startEdit(row)}>
                      {row.enterLabel || "Enter Value"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </section>

        <p className="review-note">
          <span className="note-icon">ⓘ</span>
          {reviewCount > 0
            ? `${reviewCount} declaration${reviewCount > 1 ? "s" : ""} require${
                reviewCount === 1 ? "s" : ""
              } manual verification. Any override will be recorded in the official audit trail.`
            : "All mandatory declarations were detected successfully."}
          {warningCount > 0
            ? ` ${warningCount} declaration${warningCount > 1 ? "s" : ""} carry a formatting warning — review before confirming.`
            : ""}
        </p>

        <div className="review-bottom-bar">
          <button className="btn-text-link" onClick={onBack}>
            ← Back to Analysis
          </button>
          <div className="review-bottom-actions">
            <button className="btn-outline" onClick={handleSaveDraft}>
              Save Draft
            </button>
            <button className="btn-primary-dark" onClick={() => onContinue(rows)}>
              Complete Compliance Check <span>→</span>
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default ReviewScreen;