import { useEffect, useState } from "react";
import "./ScanScreen.css";
import { runOCR, extractDeclarations } from "../utils/ocrRules";

const RULE_LABELS = {
  manufacturer: "Rule 6(1)(a)",
  genericName: "Rule 6(1)(b)",
  netQuantity: "Rule 6(1)(c)",
  mfgDate: "Rule 6(1)(e)",
  mrp: "Rule 6(1)(f)",
  consumerCare: "Rule 6(1)(g)",
  countryOfOrigin: "Rule 6(1) — Country of Origin",
};

function mergeDeclarations(allDeclarations) {
  const fieldKeys = [
    "manufacturer",
    "genericName",
    "netQuantity",
    "mfgDate",
    "mrp",
    "consumerCare",
    "countryOfOrigin",
  ];

  const merged = {};

  for (const key of fieldKeys) {
    let best = null;
    for (const decl of allDeclarations) {
      const candidate = decl[key];
      if (!candidate || !candidate.found) continue;
      if (!best) {
        best = candidate;
      } else {
        const confidenceRank = { high: 3, medium: 2, low: 1, manual: 4 };
        const bestRank = confidenceRank[best.confidence] || 0;
        const candRank = confidenceRank[candidate.confidence] || 0;
        if (candRank > bestRank) best = candidate;
      }
    }
    merged[key] = best || {
      found: false,
      value: null,
      confidence: "none",
      rule: RULE_LABELS[key],
    };
  }

  return merged;
}

function ScanScreen({ images, onBack, onContinue }) {
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
          setStatusText(
            `Reading image ${i + 1} of ${imageEntries.length} (OCR)...`
          );

          const ocrResult = await runOCR(imageEntries[i].file, (pct) => {
            if (!cancelled) {
              const overallPct = Math.round(
                ((i + pct / 100) / imageEntries.length) * 100
              );
              setProgress(overallPct);
            }
          });

          if (cancelled) return;

          allRawTexts.push(ocrResult.rawText);
          allDeclarations.push(extractDeclarations(ocrResult));
        }

        setStatusText("Checking declarations against Legal Metrology rules...");

        const mergedDeclarations = mergeDeclarations(allDeclarations);

        if (!cancelled) {
          setResult({
            rawText: allRawTexts.join("\n\n--- NEXT IMAGE ---\n\n"),
            declarations: mergedDeclarations,
            ocrCompletedAt: Date.now(),
          });
          setProgress(100);
          setDone(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || "OCR failed. Try clearer images.");
        }
      }
    }

    analyze();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const detectedCount = result
    ? Object.values(result.declarations).filter((d) => d.found).length
    : 0;

  const previewUrl =
    images?.label?.previewUrl ||
    images?.mrp?.previewUrl ||
    images?.front?.previewUrl ||
    images?.back?.previewUrl;

  return (
    <div className="scan-page">
      <header className="scan-header">
        <div className="scan-brand">
          <div className="scan-brand-mark">N</div>
          <div>
            <div className="scan-brand-name">NIRIKSHAN</div>
            <div className="scan-brand-subtitle">LEGAL METROLOGY</div>
          </div>
        </div>
        <div className="scan-step">
          <span>NEW INSPECTION</span>
          <strong>03 / 06</strong>
        </div>
      </header>

      <main className="scan-main">
        <section className="scan-heading">
          <div className="scan-eyebrow">AI-POWERED INSPECTION</div>
          <h1>Analysing the product</h1>
          <p>
            NIRIKSHAN is reading all uploaded photographs, extracting
            declarations and preparing them for compliance verification.
          </p>
        </section>

        <section className="analysis-workspace">
          <div className="analysis-image-panel">
            <div className="analysis-panel-header">
              <span>PRODUCT IMAGE</span>
              <span>PREVIEW</span>
            </div>

            <div className="analysis-image-placeholder">
              {previewUrl ? (
                <img src={previewUrl} alt="Uploaded product" className="real-scan-image" />
              ) : (
                <div className="scan-frame">
                  <span style={{ fontSize: 11, color: "#7A6C90" }}>No image uploaded</span>
                </div>
              )}
            </div>

            <div className="image-analysis-status">
              <span className="analysis-status-dot"></span>
              {error ? "IMAGE ISSUE" : "IMAGE QUALITY ACCEPTABLE"}
            </div>
          </div>

          <div className="analysis-status-panel">
            <div className="analysis-panel-header">
              <span>ANALYSIS STATUS</span>
              <span className="live-status">
                {error ? "ERROR" : done ? "COMPLETE" : "PROCESSING"}
              </span>
            </div>

            <div className="analysis-progress-section">
              <div className="analysis-progress-number">
                {progress}
                <span>%</span>
              </div>

              <div className="analysis-progress-copy">
                <strong>{error ? "Analysis failed" : statusText}</strong>
                <span>{error ? error : "Scanning all uploaded images via Tesseract.js"}</span>
              </div>
            </div>

            <div className="analysis-progress-bar">
              <div className="analysis-progress-fill" style={{ width: `${progress}%` }}></div>
            </div>

            <div className="detected-section">
              <div className="detected-heading">
                <span>FIELDS DETECTED</span>
                <strong>{detectedCount}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="analysis-note">
          <div className="analysis-note-number">AI</div>
          <div>
            <strong>Multi-image label analysis</strong>
            <p>
              Every uploaded photograph is scanned individually. The most
              confident value found for each field, across all images, is
              used for compliance verification.
            </p>
          </div>
        </section>

        {result?.rawText && (
          <section
            style={{
              marginTop: "20px",
              padding: "17px 20px",
              border: "1px solid #453361",
              background: "#221631",
            }}
          >
            <div style={{ fontSize: "9px", color: "#7A6C90", marginBottom: "10px", letterSpacing: "1px" }}>
              DEBUG — RAW OCR TEXT (remove before final submission)
            </div>
            <pre
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: "10px",
                color: "#B7A8CE",
                fontFamily: "monospace",
                maxHeight: "250px",
                overflowY: "auto",
                margin: 0,
              }}
            >
              {result.rawText}
            </pre>
          </section>
        )}

        <div className="scan-actions">
          <button className="scan-back-button" onClick={onBack}>
            ← BACK TO PRODUCT IMAGES
          </button>

          <button
            className="scan-continue-button"
            disabled={!done}
            onClick={() => onContinue(result)}
          >
            REVIEW EXTRACTED DETAILS
            <span>→</span>
          </button>
        </div>
      </main>

      <footer className="scan-footer">
        <span>DEPARTMENT OF CONSUMER AFFAIRS</span>
        <span>LEGAL METROLOGY · AI INSPECTION</span>
        <span>NIRIKSHAN · v1.0</span>
      </footer>
    </div>
  );
}

export default ScanScreen;