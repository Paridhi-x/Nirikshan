import { useState } from "react";
import "./ReportScreen.css";
import { generateReportPdf } from "../utils/generateReportPdf";
import { db } from "../firebaseConfig";
import { collection, addDoc, Timestamp } from "firebase/firestore";

function computeOverallStatus(confirmedFindings, isExemptCase) {
  if (isExemptCase) {
    return { label: "EXEMPT — NO DECLARATIONS REQUIRED", color: "#7a6c90" };
  }
  if (confirmedFindings.length === 0) {
    return { label: "COMPLIANT", color: "#2fa66b" };
  }
  const hasCritical = confirmedFindings.some((f) => f.severity === "critical");
  if (hasCritical) {
    return { label: "NON-COMPLIANT", color: "#e14b3a" };
  }
  return { label: "FLAGGED FOR REVIEW", color: "#e14b3a" };
}

function formatDateTime(ms) {
  if (!ms) return null;
  const d = new Date(ms);
  return {
    date: d.toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" }),
    time: d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
  };
}

function ReportScreen({
  images,
  productInfo,
  declarationRows,
  findings,
  ocrCompletedAt,
  findingsReviewedAt,
  onBack,
  onDashboard,
}) {
  const [reportPreparedAt] = useState(() => Date.now());
  const [isDownloading, setIsDownloading] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isFinalized, setIsFinalized] = useState(false);

  const rows = declarationRows || [];
  const allFindings = findings || [];
  const product = productInfo || {};
  const isExemptCase = Boolean(product.isExempt);

  const totalFields = rows.length;
  const validCount = rows.filter((r) => r.found).length;
  const reviewCount = totalFields - validCount;
  const score = totalFields ? Math.round((validCount / totalFields) * 100) : 0;

  const confirmedFindings = allFindings.filter((f) => f.status === "confirmed");
  const overallStatus = computeOverallStatus(confirmedFindings, isExemptCase);

  const netQtyRow = rows.find((r) => r.key === "netQuantity");
  const previewUrl =
    images?.label?.previewUrl ||
    images?.front?.previewUrl ||
    images?.mrp?.previewUrl ||
    images?.back?.previewUrl;

  const reportDate = product.inspectionDate
    ? new Date(product.inspectionDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : new Date().toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });

  const now = new Date();
  const inspectionId = `INSP-26034-${String(now.getTime()).slice(-6)}`;

  const ocrTime = formatDateTime(ocrCompletedAt);
  const reviewTime = formatDateTime(findingsReviewedAt);
  const preparedTime = formatDateTime(reportPreparedAt);

  const initials = (product.productName || "PR")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

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
        confirmedFindings: confirmedFindings,
        reportDate,
        ocrCompletedAt: ocrCompletedAt || null,
        findingsReviewedAt: findingsReviewedAt || null,
        reportPreparedAt,
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

  return (
    <div className="report-screen">
      <header className="report-header">
        <div className="brand-block">
          <div className="brand-name">NIRIKSHAN</div>
          <div className="brand-subtitle">LEGAL METROLOGY</div>
        </div>

        <div className="report-step">
          <span>INSPECTION REPORT</span>
          <strong>06 / 06</strong>
        </div>
      </header>

      <main className="report-content">
        <section className="report-intro">
          <div>
            <p className="report-eyebrow">COMPLIANCE RECORD</p>
            <h1>Inspection report</h1>
            <p className="report-description">
              Review the completed inspection record, compliance findings and
              corrective action before finalizing the report.
            </p>
          </div>

          <div className="report-status" style={{ borderColor: overallStatus.color, color: overallStatus.color }}>
            <span className="status-dot" style={{ background: overallStatus.color }}></span>
            {overallStatus.label}
          </div>
        </section>

        <section className="report-grid">
          <div className="report-card summary-card">
            <div className="card-heading">
              <span>01</span>
              <h2>INSPECTION SUMMARY</h2>
            </div>

            <div className="summary-product">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt={product.productName || "Inspected product"}
                  className="product-mark"
                  style={{ objectFit: "cover" }}
                />
              ) : (
                <div className="product-mark">{initials}</div>
              )}
              <div>
                <h3>{product.productName || "Unnamed Product"}</h3>
                <p>
                  {product.category || "Packaged Commodity"}
                  {product.manufacturer ? ` · ${product.manufacturer}` : ""}
                </p>
              </div>
            </div>

            <div className="details-grid">
              <div>
                <span>INSPECTION ID</span>
                <strong>{inspectionId}</strong>
              </div>

              <div>
                <span>INSPECTION DATE</span>
                <strong>{reportDate}</strong>
              </div>

              <div>
                <span>NET QUANTITY</span>
                <strong>{netQtyRow?.value || "Not detected"}</strong>
              </div>

              <div>
                <span>DECLARATIONS CHECKED</span>
                <strong>{isExemptCase ? "N/A" : String(totalFields).padStart(2, "0")}</strong>
              </div>
            </div>
          </div>

          <div className="report-card score-card">
            <div className="card-heading">
              <span>02</span>
              <h2>COMPLIANCE SCORE</h2>
            </div>

            {isExemptCase ? (
              <>
                <div className="score-display">
                  <strong style={{ fontSize: 32 }}>N/A</strong>
                  <span>Exempt category — no declarations required</span>
                </div>

                <div className="score-bar">
                  <div className="score-fill" style={{ width: "100%", background: "#7a6c90" }}></div>
                </div>

                <div className="score-meta">
                  <span style={{ color: "#7a6c90" }}>EXEMPT UNDER RULE 3 / 26</span>
                </div>
              </>
            ) : (
              <>
                <div className="score-display">
                  <strong>{score}%</strong>
                  <span>{validCount} of {totalFields} declarations clear</span>
                </div>

                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{
                      width: `${score}%`,
                      background: score >= 80 ? "#2fa66b" : score >= 50 ? "#e8c24a" : "#e14b3a",
                    }}
                  ></div>
                </div>

                <div className="score-meta">
                  <span className="valid-text">{String(validCount).padStart(2, "0")} VALID</span>
                  <span className="review-text">{String(reviewCount).padStart(2, "0")} REVIEW</span>
                </div>
              </>
            )}
          </div>
        </section>

        <section className="report-card findings-card">
          <div className="card-heading">
            <span>03</span>
            <h2>COMPLIANCE FINDINGS</h2>
          </div>

          {isExemptCase ? (
            <div className="finding-row">
              <div className="finding-number">—</div>
              <div className="finding-main">
                <p>
                  This product is exempt from mandatory Rule 6 declarations
                  under Rule 3 / Rule 26 of the Legal Metrology (Packaged
                  Commodities) Rules, 2011. No compliance findings apply.
                </p>
              </div>
            </div>
          ) : confirmedFindings.length === 0 ? (
            <div className="finding-row">
              <div className="finding-number">—</div>
              <div className="finding-main">
                <p>No findings were confirmed by the inspector for this inspection.</p>
              </div>
            </div>
          ) : (
            confirmedFindings.map((finding, idx) => (
              <div className="finding-row" key={finding.id}>
                <div className="finding-number">{String(idx + 1).padStart(2, "0")}</div>

                <div className="finding-main">
                  <div className="finding-title-row">
                    <h3>{finding.title}</h3>
                    <span
                      className="review-badge"
                      style={{
                        borderColor: finding.severity === "critical" ? "#e14b3a" : "#e8c24a",
                        color: finding.severity === "critical" ? "#e14b3a" : "#e8c24a",
                      }}
                    >
                      {finding.severity === "critical" ? "VIOLATION" : "REVIEW"}
                    </span>
                  </div>

                  <p>{finding.evidenceText}</p>

                  <div className="finding-details">
                    <div>
                      <span>DETECTED INFORMATION</span>
                      <strong>{finding.evidenceStatus}</strong>
                    </div>

                    <div>
                      <span>REQUIREMENT</span>
                      <strong>{finding.requirementText}</strong>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </section>

        <section className="report-grid lower-grid">
          <div className="report-card action-card">
            <div className="card-heading">
              <span>04</span>
              <h2>CORRECTIVE ACTION</h2>
            </div>

            <div className="action-content">
              <div className="action-icon">!</div>

              <div>
                <h3>
                  {isExemptCase
                    ? "No action required"
                    : confirmedFindings.length > 0
                    ? "Manual verification required"
                    : "No action required"}
                </h3>
                <p>
                  {isExemptCase
                    ? "This product falls under an exempt category and is not subject to Rule 6 mandatory declarations."
                    : confirmedFindings.length > 0
                    ? "Verify the flagged declarations on the physical package and record the final compliance decision."
                    : "All checked declarations were found compliant. No corrective action is needed at this time."}
                </p>
              </div>
            </div>

            <div className="assignment">
              <span>RESPONSIBLE OFFICER</span>
              <strong>Compliance Review Officer</strong>
            </div>
          </div>

          <div className="report-card audit-card">
            <div className="card-heading">
              <span>05</span>
              <h2>AUDIT TRAIL</h2>
            </div>

            <div className="audit-item">
              <div className="audit-line"></div>
              <div>
                <strong>AI analysis completed (OCR)</strong>
                <span>
                  {ocrTime ? `${ocrTime.date} · ${ocrTime.time}` : "Not recorded"}
                </span>
              </div>
            </div>

            <div className="audit-item">
              <div className="audit-line"></div>
              <div>
                <strong>Findings reviewed by inspector</strong>
                <span>
                  {reviewTime ? `${reviewTime.date} · ${reviewTime.time}` : "Not recorded"}
                </span>
              </div>
            </div>

            <div className="audit-item">
              <div className="audit-line last"></div>
              <div>
                <strong>Report prepared</strong>
                <span>
                  {preparedTime ? `${preparedTime.date} · ${preparedTime.time}` : "Not recorded"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="report-note">
          <div className="note-label">AI ASSISTED RECORD</div>
          <p>
            This report is generated from image analysis, OCR extraction and
            rule-based compliance verification. Final enforcement decisions
            remain subject to authorized inspector review.
          </p>
        </section>

        <div className="report-actions">
          <button className="back-button" onClick={onBack}>
            ← BACK TO FINDINGS
          </button>

          <div className="action-buttons">
            <button
              className="save-button"
              onClick={handleDownloadPdf}
              disabled={isDownloading}
            >
              {isDownloading ? "GENERATING..." : "DOWNLOAD PDF"}
            </button>

            <button
              className="finalize-button"
              onClick={handleFinalizeReport}
              disabled={isFinalizing || isFinalized}
            >
              {isFinalized
                ? "REPORT FINALIZED ✓"
                : isFinalizing
                ? "SAVING..."
                : "FINALIZE REPORT →"}
            </button>
          </div>
        </div>

        <button className="dashboard-link" onClick={onDashboard}>
          RETURN TO DASHBOARD
        </button>
      </main>
    </div>
  );
}

export default ReportScreen;