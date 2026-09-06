import { useEffect, useRef, useState } from "react";
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

/* ───────────── Zoom modal for verifying label text against detected info ───────────── */

function ImageZoomModal({ src, onClose }) {
  const [scale, setScale] = useState(1);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  const clampScale = (s) => Math.min(4, Math.max(1, s));

  const handleWheel = (e) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.2 : -0.2;
    setScale((s) => {
      const next = clampScale(s + delta);
      if (next === 1) setPos({ x: 0, y: 0 });
      return next;
    });
  };

  const handleMouseDown = (e) => {
    if (scale === 1) return;
    dragging.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e) => {
    if (!dragging.current) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setPos((p) => ({ x: p.x + dx, y: p.y + dy }));
  };

  const stopDragging = () => { dragging.current = false; };

  const zoomIn = () => setScale((s) => clampScale(s + 0.5));
  const zoomOut = () => setScale((s) => {
    const next = clampScale(s - 0.5);
    if (next === 1) setPos({ x: 0, y: 0 });
    return next;
  });
  const reset = () => { setScale(1); setPos({ x: 0, y: 0 }); };

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 12, 25, 0.92)",
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        touchAction: "none",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
          cursor: scale > 1 ? (dragging.current ? "grabbing" : "grab") : "default",
        }}
      >
        <img
          src={src}
          alt="Zoomed product"
          draggable={false}
          style={{
            maxWidth: "90%",
            maxHeight: "90%",
            transform: `translate(${pos.x}px, ${pos.y}px) scale(${scale})`,
            transition: dragging.current ? "none" : "transform 0.1s ease-out",
            userSelect: "none",
          }}
        />
      </div>

      <button
        onClick={onClose}
        aria-label="Close zoom"
        style={{
          position: "absolute",
          top: 20,
          right: 20,
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "none",
          background: "rgba(255,255,255,0.15)",
          color: "#fff",
          fontSize: 20,
          cursor: "pointer",
        }}
      >
        ✕
      </button>

      <div
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          gap: 10,
          background: "rgba(255,255,255,0.1)",
          padding: "8px 12px",
          borderRadius: 999,
        }}
      >
        <button onClick={zoomOut} style={zoomBtnStyle}>−</button>
        <button onClick={reset} style={{ ...zoomBtnStyle, width: "auto", padding: "0 14px", fontSize: 13 }}>
          {Math.round(scale * 100)}%
        </button>
        <button onClick={zoomIn} style={zoomBtnStyle}>+</button>
      </div>
    </div>
  );
}

const zoomBtnStyle = {
  width: 36,
  height: 36,
  borderRadius: "50%",
  border: "none",
  background: "rgba(255,255,255,0.2)",
  color: "#fff",
  fontSize: 18,
  cursor: "pointer",
};

function ScanScreen({ images, productInfo, onBack, onContinue }) {
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState("Starting analysis...");
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);
  const [result, setResult] = useState(null);
  const [imageEntries, setImageEntries] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [zoomOpen, setZoomOpen] = useState(false); // NEW

  useEffect(() => {
    let cancelled = false;

    async function analyze() {
      const fixedEntries = ["front", "back", "label", "mrp"]
        .map((key) => images?.[key])
        .filter((entry) => entry && entry.file);

      // NEW: also analyze any extra photos added on the upload screen
      const extraEntries = Array.isArray(images?.extra)
        ? images.extra.filter((entry) => entry && entry.file)
        : [];

      const entries = [...fixedEntries, ...extraEntries];

      setImageEntries(entries);

      if (entries.length === 0) {
        setError("No images available to analyze. Go back and upload photos.");
        return;
      }

      try {
        const allRawTexts = [];
        const allDeclarations = [];

        for (let i = 0; i < entries.length; i++) {
          setCurrentIndex(i);
          setStatusText(`Reading image ${i + 1} of ${entries.length}...`);

          const ocrResult = await runOCR(entries[i].file, (pct) => {
            if (!cancelled) {
              const overallPct = Math.round(((i + pct / 100) / entries.length) * 100);
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

  const previewUrl = !done && imageEntries.length > 0
    ? imageEntries[currentIndex]?.previewUrl
    : images?.label?.previewUrl ||
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
          <div
            className="scn-image-wrap"
            style={{ position: "relative", cursor: previewUrl ? "zoom-in" : "default" }}
            onClick={() => previewUrl && setZoomOpen(true)}
          >
            {previewUrl ? (
              <img src={previewUrl} alt="Product" className="scn-image" />
            ) : (
              <div className="scn-image-placeholder">No image uploaded</div>
            )}

            {/* NEW: zoom hint button, top-right of the image */}
            {previewUrl && (
              <button
                onClick={(e) => { e.stopPropagation(); setZoomOpen(true); }}
                aria-label="Zoom image"
                title="Zoom image"
                style={{
                  position: "absolute",
                  top: 12,
                  right: 12,
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  border: "none",
                  background: "rgba(0,0,0,0.55)",
                  color: "#fff",
                  fontSize: 16,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                🔍
              </button>
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

              {/* NEW: quick way to go add/retake photos for missing fields instead of
                  restarting the whole flow from scratch */}
              {notFoundLabels.length > 0 && (
                <button
                  onClick={onBack}
                  style={{
                    marginTop: 12,
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: 8,
                    border: "1px solid #d8cfc0",
                    background: "#fff",
                    color: "#333",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  + Add More Photos to Improve Detection
                </button>
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

      {zoomOpen && previewUrl && (
        <ImageZoomModal src={previewUrl} onClose={() => setZoomOpen(false)} />
      )}
    </div>
  );
}

export default ScanScreen;