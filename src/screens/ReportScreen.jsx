import { useState } from "react";
import "./ReportScreen.css";
import { generateReportPdf } from "../utils/generateReportPdf";
import { db } from "../firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";

const CONFIDENCE_SCORE_MAP = { high: 95, medium: 78, manual: 100, low: 55, none: 0 };

function computeOverallStatus(rows, isExemptCase) {
  if (isExemptCase) {
    return { label: "EXEMPT", color: "#7a6c90", bg: "#eee9df" };
  }
  const notFound = rows.filter((r) => !r.found);
  if (notFound.length === 0) {
    return { label: "LIKELY COMPLIANT", color: "#2fa66b", bg: "#e7f5ee" };
  }
  const criticalMissing = notFound.some((r) =>
    ["mrp", "mfgDate", "manufacturer"].includes(r.key)
  );
  if (criticalMissing) {
    return { label: "NON-COMPLIANT", color: "#e14b3a", bg: "#fbeae7" };
  }
  return { label: "REVIEW REQUIRED", color: "#e8a23d", bg: "#fbf1e3" };
}

function formatDateTime(ms) {
  if (!ms) return null;
  const d = new Date(ms);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}

function ReportScreen({
  images,
  productInfo,
  declarationRows,
  findings,
  officerName,
  ocrCompletedAt,
  findingsReviewedAt,
  onBack,
  onDashboard,
}) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);
  const [markedForReview, setMarkedForReview] = useState(true);

  const rows = declarationRows || [];
  const allFindings = findings || [];
  const product = productInfo || {};
  const isExemptCase = Boolean(product.isExempt);

  const totalFields = rows.length;
  const validCount = rows.filter((r) => r.found).length;
  const notFoundRows = rows.filter((r) => !r.found);
  const score = totalFields ? Math.round((validCount / totalFields) * 100) : 0;

  const overallStatus = computeOverallStatus(rows, isExemptCase);
  const confirmedFindings = allFindings.filter((f) => f.status === "confirmed");

  const imagesAnalyzed = ["front", "back", "label", "mrp"].filter(
    (k) => images?.[k]?.file
  ).length;

  const avgConfidence = totalFields
    ? Math.round(
        rows.reduce((sum, r) => sum + (CONFIDENCE_SCORE_MAP[r.confidence] || 0), 0) /
          totalFields
      )
    : 0;

  const previewUrl =
    images?.label?.previewUrl ||
    images?.front?.previewUrl ||
    images?.mrp?.previewUrl ||
    images?.back?.previewUrl;

  const reportDate = product.inspectionDate
    ? new Date(product.inspectionDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  const now = new Date();
  const inspectionId = `INSP-26034-${String(now.getTime()).slice(-6)}`;

  const ocrTime = formatDateTime(ocrCompletedAt);
  const reviewTime = formatDateTime(findingsReviewedAt);

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await generateReportPdf({
        productInfo: product,
        declarationRows: rows,
        findings: allFindings,
        previewUrl,
        inspectionId,
        reportDate,
        score,
        validCount,
        totalFields,
        overallStatusLabel: overallStatus.label,
      });
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate PDF. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFinalizeReport = async () => {
    const confirmed = window.confirm(
      "Finalizing will save this report permanently. Continue?"
    );
    if (!confirmed) return;

    setIsFinalizing(true);
    try {
      await addDoc(collection(db, "inspections"), {
        inspectionId,
        productName: product.productName || "Unnamed Product",
        manufacturer: product.manufacturer || "Not specified",
        category: product.category || "Not specified",
        inspectionType: product.inspectionType || "Not specified",
        isImported: Boolean(product.isImported),
        isExempt: isExemptCase,
        overallStatus: overallStatus.label,
        score: isExemptCase ? null : score,
        validCount: isExemptCase ? null : validCount,
        totalFields: isExemptCase ? null : totalFields,
        declarationRows: rows,
        confirmedFindings,
        reportDate,
        officerName: officerName || "Unnamed Officer",
        markedForReview,
        ocrCompletedAt: ocrCompletedAt || null,
        findingsReviewedAt: findingsReviewedAt || null,
        createdAt: Timestamp.now(),
      });
      setIsFinalized(true);
      alert("Report finalized and saved successfully.");
    } catch (err) {
      console.error("Failed to save report:", err);
      alert("Could not save the report. Please check your connection and try again.");
    } finally {
      setIsFinalizing(false);
    }
  };

  if (isExemptCase) {
    return (
      <div className="rpt-page">
        <div className="rpt-topbar">
          <button className="rpt-back-link" onClick={onBack}>← Back to Analysis</button>
        </div>
        <div className="rpt-header">
          <div>
            <p className="rpt-eyebrow">COMPLIANCE RECORD · FINAL AUDIT</p>
            <h1>Inspection Report</h1>
            <p className="rpt-description">This product is exempt from Rule 6 mandatory declarations.</p>
          </div>
          <div className="rpt-status-pill" style={{ color: overallStatus.color, background: overallStatus.bg }}>
            EXEMPT
          </div>
        </div>
        <div className="rpt-card" style={{ padding: "28px" }}>
          <p>
            This package falls under an exempt category under Rule 3 / Rule 26 of the
            Legal Metrology (Packaged Commodities) Rules, 2011. No mandatory
            declaration checks apply, and no compliance findings were generated.
          </p>
        </div>
        <div className="rpt-bottombar">
          <button className="rpt-back-link" onClick={onBack}>← Return to Analysis</button>
          <button className="rpt-finalize-btn" onClick={onDashboard}>Return to Dashboard →</button>
        </div>
      </div>
    );
  }

  return (
    <div className="rpt-page">

      <div className="rpt-topbar">
        <button className="rpt-back-link" onClick={onBack}>← Back to Analysis</button>
      </div>

      <div className="rpt-header">
        <div>
          <p className="rpt-eyebrow">COMPLIANCE RECORD · FINAL AUDIT &nbsp;•&nbsp; FORM LMR-01 (SCHEDULE IV)</p>
          <h1>Inspection Report</h1>
          <p className="rpt-description">
            Review the completed inspection record, compliance findings, and
            declaration status before finalizing the legal record.
          </p>
        </div>
        <div className="rpt-header-right">
          <div className="rpt-status-pill" style={{ color: overallStatus.color, background: overallStatus.bg }}>
            {overallStatus.label === "LIKELY COMPLIANT" ? "✓ " : "⚠ "}
            {overallStatus.label}
          </div>
          <span className="rpt-stage-label">Stage 06 / 06 · Final Submission</span>
        </div>
      </div>

      {/* Summary bar */}
      <div className="rpt-card rpt-summary-bar">
        <div className="rpt-summary-left">
          <div className="rpt-product-icon">📦</div>
          <div>
            <div className="rpt-code-badge">{product.category || "PACKAGED COMMODITY"}</div>
            <div className="rpt-sample-id">Sample ID: #{inspectionId}</div>
            <h2 className="rpt-product-name">{product.productName || "Unnamed Product"}</h2>
            <div className="rpt-meta-row">
              <div>
                <span>INSPECTION ID</span>
                <strong>{inspectionId}</strong>
              </div>
              <div>
                <span>INSPECTION DATE</span>
                <strong>{reportDate}</strong>
              </div>
              <div>
                <span>INSPECTING OFFICER</span>
                <strong>{officerName || "Unnamed Officer"}</strong>
              </div>
            </div>
          </div>
        </div>

        <div className="rpt-summary-divider" />

        <div className="rpt-summary-right">
          <span className="rpt-score-label">COMPLIANCE SCORE</span>
          <div className="rpt-score-row">
            <span className="rpt-score-number">{score}</span>
            <span className="rpt-score-max">/100</span>
            <div
              className="rpt-compliant-pill"
              style={{ color: overallStatus.color, background: overallStatus.bg }}
            >
              {overallStatus.label}
            </div>
          </div>
          <span className="rpt-score-sub">{validCount} of {totalFields} declarations clear</span>
          <div className="rpt-score-bar">
            <div
              className="rpt-score-fill"
              style={{ width: `${score}%`, background: overallStatus.color }}
            />
          </div>
          <p className="rpt-score-note">
            System-generated statutory assessment under Legal Metrology (Packaged Commodities) Rules, 2011.
          </p>
        </div>
      </div>

      <div className="rpt-two-col">

        {/* Compliance Findings */}
        <div className="rpt-card rpt-findings-card">
          <div className="rpt-card-header">
            <div>
              <h3>Compliance Findings</h3>
              <p>Verification of mandatory declarations under Rule 6 of PCR, 2011</p>
            </div>
            <span className="rpt-tag">{totalFields} FIELDS EXAMINED</span>
          </div>

          {rows.map((row) => (
            <div className="rpt-finding-row" key={row.key}>
              <div>
                <span className="rpt-finding-label">
                  {row.label}
                  <span className="rpt-finding-rule">{row.rule}</span>
                </span>
                <div className={`rpt-finding-value ${!row.found ? "muted" : ""}`}>
                  {row.value || `Not detected${row.value === null ? "" : ""}`}
                  {!row.found && (
                    <span className="rpt-finding-subnote">Not detected in uploaded specimen</span>
                  )}
                </div>
              </div>
              <div className={`rpt-pill ${row.found ? "green" : "amber"}`}>
                {row.found ? "✓ Detected" : "⚠ Not Detected"}
              </div>
            </div>
          ))}

          {notFoundRows.length > 0 && (
            <div className="rpt-warning-box">
              <div className="rpt-warning-icon">⚠</div>
              <div>
                <strong>
                  Potential Non-Compliance:{" "}
                  {notFoundRows.map((r) => r.label).join(", ")}
                </strong>
                <p>
                  {notFoundRows.length === 1
                    ? `${notFoundRows[0].label} declaration was not detected on the uploaded specimen.`
                    : "The above declarations were not detected on the uploaded specimen."}
                </p>
                <p className="rpt-citation">
                  <strong>Statutory Reference:</strong>{" "}
                  {notFoundRows.map((r) => r.rule).join(", ")} — Requires
                  inspecting officer manual verification or supplementary
                  photographic evidence before final sign-off.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="rpt-right-col">
          <div className="rpt-card">
            <div className="rpt-card-header">
              <h3>Inspection Evidence</h3>
              <span className="rpt-tag">SPECIMEN VIEW</span>
            </div>

            <div className="rpt-evidence-image-wrap">
              {previewUrl ? (
                <img src={previewUrl} alt="Specimen" className="rpt-evidence-image" />
              ) : (
                <div className="rpt-evidence-placeholder">No image available</div>
              )}
              <div className="rpt-evidence-caption">
                <span>Specimen #{inspectionId}</span>
                <span>Product Photograph</span>
              </div>
            </div>

            <div className="rpt-evidence-meta">
              <div>
                <span>OCR Extraction Confidence</span>
                <strong>{avgConfidence}% (Client-side)</strong>
              </div>
              <div>
                <span>Images Analyzed</span>
                <strong>{imagesAnalyzed} of 4 uploaded views</strong>
              </div>
              <div>
                <span>OCR Engine</span>
                <strong>Tesseract.js (client-side)</strong>
              </div>
            </div>
          </div>

          <div className="rpt-card rpt-directive-card">
            <div className="rpt-directive-header">
              <span className="rpt-directive-check">✓</span>
              <h3>Inspector Action Directive</h3>
            </div>
            <p>
              {notFoundRows.length > 0
                ? `Verify whether the mandatory declaration(s) for ${notFoundRows
                    .map((r) => r.label)
                    .join(", ")} are affixed elsewhere on the package, or request
                  supplementary photographic evidence before final sign-off.`
                : "All mandatory declarations were detected. No further verification action is required."}
            </p>

            <div className="rpt-directive-status">
              <span>STATUS DETERMINATION</span>
              <label className="rpt-checkbox-label">
                <input
                  type="checkbox"
                  checked={markedForReview}
                  onChange={(e) => setMarkedForReview(e.target.checked)}
                />
                Mark for Secondary Review
              </label>
            </div>

            <p className="rpt-directive-footnote">
              This report is generated from image analysis, OCR extraction and
              rule-based compliance verification. Final enforcement decisions
              remain subject to authorized inspector review.
              {ocrTime && ` OCR completed ${ocrTime.date}, ${ocrTime.time}.`}
              {reviewTime && ` Findings reviewed ${reviewTime.date}, ${reviewTime.time}.`}
            </p>
          </div>
        </div>
      </div>

      <div className="rpt-bottombar">
        <button className="rpt-back-link" onClick={onBack}>← Return to Analysis</button>

        <span className="rpt-standard-badge">
          🛡 LEGAL METROLOGY (PACKAGED COMMODITIES) RULES, 2011
        </span>

        <div className="rpt-bottom-actions">
          <button className="rpt-download-btn" onClick={handleDownloadPdf} disabled={isDownloading}>
            {isDownloading ? "Generating..." : "⬇ Download PDF"}
          </button>
          <button
            className="rpt-finalize-btn"
            onClick={handleFinalizeReport}
            disabled={isFinalizing || isFinalized}
          >
            {isFinalized ? "Report Finalized ✓" : isFinalizing ? "Saving..." : "Finalize Report →"}
          </button>
        </div>
      </div>

      <button className="rpt-dashboard-link" onClick={onDashboard}>
        RETURN TO DASHBOARD
      </button>
    </div>
  );
}

export default ReportScreen;