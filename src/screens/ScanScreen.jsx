import { useEffect, useState } from "react";
import "./ScanScreen.css";
import { runOCR, extractDeclarations } from "../utils/ocrRules";

const FIELD_DISPLAY = [
  { key: "manufacturer", label: "Manufacturer / Packer" },
  { key: "netQuantity", label: "Net Quantity" },
  { key: "mrp", label: "MRP" },
  { key: "mfgDate", label: "Date of Packing" },
  { key: "consumerCare", label: "Consumer Care" },
  { key: "countryOfOrigin", label: "Country of Origin" },
];

function computeScore(declarations, applicableKeys) {
  const keys = applicableKeys.filter((k) => declarations[k]);
  const found = keys.filter((k) => declarations[k].found).length;
  const total = keys.length;
  const score = total ? Math.round((found / total) * 100) : 0;
  const allFound = total > 0 && found === total;
  return { score, found, total, allFound };
}

function ScanScreen({ images, productInfo, onBack, onContinue }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Starting analysis...");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      const imageEntries = ["front", "back", "label", "mrp"]
        .map((key) => images?.[key])
        .filter((entry) => entry && entry.file);

      if (imageEntries.length === 0) {
        setError("No images available to analyze. Go back and upload photos.");
        return;
      }

      try {
        const allRawTexts = [];
        const allDeclarations = [];

        for (let i = 0; i < imageEntries.length; i++) {
          setStatusText(`Reading image ${i + 1} of ${imageEntries.length}...`);

          const ocrResult = await runOCR(imageEntries[i].file, (pct) => {
            if (!cancelled) {
              const overallPct = Math.round(((i + pct / 100) / imageEntries.length) * 100);
              setProgress(overallPct);
            }
          });

          if (cancelled) return;

          allRawTexts.push(ocrResult.rawText);
          allDeclarations.push(extractDeclarations(ocrResult));
        }

        setStatusText("Checking against Legal Metrology requirements...");

        const merged = {};
        const fieldKeys = ["manufacturer", "genericName", "netQuantity", "mfgDate", "mrp", "consumerCare", "countryOfOrigin"];
        for (const key of fieldKeys) {
          let best = null;
          for (const decl of allDeclarations) {
            const candidate = decl[key];
            if (!candidate || !candidate.found) continue;
            if (!best) best = candidate;
            else {
              const rank = { high: 3, medium: 2, low: 1, manual: 4 };
              if ((rank[candidate.confidence] || 0) > (rank[best.confidence] || 0)) best = candidate;
            }
          }
          merged[key] = best || { found: false, value: null, confidence: "none" };
        }

        if (!cancelled) {
          setResult({
            rawText: allRawTexts.join("\n\n--- NEXT IMAGE ---\n\n"),
            declarations: merged,
          });
          setProgress(100);
          setDone(true);
        }
      } catch (err) {
        if (!cancelled) setError(err.message || "OCR failed. Try clearer images.");
      }
    }

    analyze();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const previewUrl =
    images?.label?.previewUrl ||
    images?.mrp?.previewUrl ||
    images?.front?.previewUrl ||
    images?.back?.previewUrl;

  const applicableKeys = productInfo?.isImported
    ? ["manufacturer", "netQuantity", "mrp", "mfgDate", "consumerCare", "countryOfOrigin"]
    : ["manufacturer", "netQuantity", "mrp", "mfgDate", "consumerCare"];

  const declarations = result?.declarations || {};
  const { score, found, total } = done
    ? computeScore(declarations, applicableKeys)
    : { score: 0, found: 0, total: applicableKeys.length };

  const notFoundLabels = FIELD_DISPLAY.filter(
    (f) => applicableKeys.includes(f.key) && declarations[f.key] && !declarations[f.key].found
  );

  const statusLabel =
    notFoundLabels.length === 0 ? "Likely Compliant" : "Needs Review";
  const statusColor = notFoundLabels.length === 0 ? "#2c8f5f" : "#b5822e";
  const statusBg = notFoundLabels.length === 0 ? "#e7f5ee" : "#fbf1e3";

  return (
    <div className="scn-page">

      <div className="scn-topbar">
        <button className="scn-back-link" onClick={onBack}>← Back to Product Photos</button>

        <div className="scn-steps">
          <span className="scn-step done">01 Photos ✓</span>
          <span className="scn-step-sep">|</span>
          <span className="scn-step active">
            02 Analysing <span className="scn-step-dot" />
          </span>
          <span className="scn-step-sep">|</span>
          <span className="scn-step">03 Results ○</span>
        </div>
      </div>

      <p className="scn-eyebrow">COMPLIANCE ANALYSIS</p>
      <h1>Analysing the Product</h1>
      <p className="scn-description">
        Checking the uploaded product image against Legal Metrology requirements.
      </p>

      <div className="scn-two-col">

        <div className="scn-card scn-image-card">
          <div className="scn-image-wrap">
            {previewUrl ? (
              <img src={previewUrl} alt="Product" className="scn-image" />
            ) : (
              <div className="scn-image-placeholder">No image uploaded</div>
            )}

            {done && declarations.manufacturer?.found && (
              <span className="scn-pin" style={{ top: "12%", left: "8%" }}>
                <span className="scn-pin-dot" /> Manufacturer: {declarations.manufacturer.value}
              </span>
            )}
            {done && declarations.netQuantity?.found && (
              <span className="scn-pin" style={{ bottom: "18%", left: "8%" }}>
                <span className="scn-pin-dot" /> Net Qty: {declarations.netQuantity.value}
              </span>
            )}
            {done && declarations.mrp?.found && (
              <span className="scn-pin" style={{ bottom: "6%", right: "8%" }}>
                <span className="scn-pin-dot" /> MRP: {declarations.mrp.value}
              </span>
            )}
          </div>

          <div className="scn-image-caption">
            <span className="scn-check-icon">✓</span>
            {error ? "Image issue detected" : done ? "Image quality verified for legal metrology analysis" : statusText}
          </div>
        </div>

        <div className="scn-card scn-detected-card">
          <h3>DETECTED INFORMATION</h3>

          {!done && !error && (
            <div className="scn-progress-inline">
              <div className="scn-progress-bar">
                <div className="scn-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span>{progress}% · {statusText}</span>
            </div>
          )}

          {error && <p className="scn-error-text">{error}</p>}

          {done && (
            <>
              <div className="scn-detected-list">
                {FIELD_DISPLAY.filter((f) => applicableKeys.includes(f.key)).map((f) => {
                  const d = declarations[f.key] || { found: false, value: null };
                  return (
                    <div className="scn-detected-row" key={f.key}>
                      <span className="scn-detected-label">{f.label}</span>
                      <span className={`scn-detected-value ${d.found ? "" : "muted"}`}>
                        {d.found ? d.value : "Not detected"}
                        {d.found ? <span className="scn-check">✓</span> : <span className="scn-warn">⚠</span>}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="scn-status-block">
                <span className="scn-status-title">COMPLIANCE STATUS</span>
                <div className="scn-status-row">
                  <span className="scn-status-score">{score}</span>
                  <span className="scn-status-max">/ 100</span>
                  <span
                    className="scn-status-pill"
                    style={{ color: statusColor, background: statusBg }}
                  >
                    <span className="scn-status-dot" style={{ background: statusColor }} />
                    {statusLabel}
                  </span>
                </div>
              </div>

              {notFoundLabels.length > 0 && (
                <div className="scn-warning-box">
                  <span className="scn-warning-icon">⚠</span>
                  <span>
                    <strong>
                      {notFoundLabels.map((f) => f.label).join(", ")} declaration
                      {notFoundLabels.length > 1 ? "s" : ""} not detected.
                    </strong>{" "}
                    Rule 6 — Requires review
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="scn-bottombar">
        <button className="scn-back-link" onClick={onBack}>← Back</button>

        <button
          className="scn-continue-btn"
          disabled={!done}
          onClick={() => onContinue(result)}
        >
          View Compliance Results →
        </button>
      </div>
    </div>
  );
}

export default ScanScreen;