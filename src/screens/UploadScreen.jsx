import { useState, useRef } from "react";
import "./UploadScreen.css";

const VIEW_CONFIG = [
  {
    key: "front",
    index: "01",
    tag: "REQUIRED",
    icon: "📷",
    title: "Front of package",
    description: "Capture the complete front face, brand name, and net quantity display.",
    hint: null,
    footnoteLeft: "Ready for extraction",
    footnoteRight: null,
  },
  {
    key: "back",
    index: "02",
    tag: "RECOMMENDED",
    icon: "📄",
    title: "Back of package",
    description: "Full back panel showing manufacturer details, ingredients, and customer care.",
    hint: null,
    footnoteLeft: "Optional but recommended for full score",
    footnoteRight: "Not captured",
  },
  {
    key: "label",
    index: "03",
    tag: "RECOMMENDED",
    icon: "🔍",
    title: "Label close-up",
    description: "Crisp macro view of statutory declaration area and font height compliance.",
    hint: "Macro focus on font & text",
    hintSub: "Assists Rule 9 numeral height verification",
    footnoteLeft: "Enables high-accuracy OCR extraction",
    footnoteRight: "Not captured",
  },
  {
    key: "mrp",
    index: "04",
    tag: "RECOMMENDED",
    icon: "₹",
    title: "MRP area",
    description: "Clear view of maximum retail price, taxes inclusion, and unit sale price.",
    hint: "Ensure ₹ symbol & date are visible",
    hintSub: "Rule 6(1)(e) & Unit Sale Price check",
    footnoteLeft: "Verifies \"incl. of all taxes\" text",
    footnoteRight: "Not captured",
  },
];

function formatSize(bytes) {
  if (!bytes) return "";
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
}

function UploadScreen({ onBack, onContinue }) {
  const [images, setImages] = useState({});
  const fileInputRefs = useRef({});
  const cameraInputRefs = useRef({});

  const handleFileSelect = (key, e) => {
    const file = e.target.files[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setImages((prev) => ({ ...prev, [key]: { file, previewUrl, size: file.size, name: file.name } }));
  };

  const handleRemove = (key) => {
    setImages((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const uploadedCount = Object.keys(images).length;
  const canContinue = Boolean(images.front);

  return (
    <div className="upl-page">

      <div className="upl-topbar">
        <button className="upl-back-link" onClick={onBack}>← Back to Inspection Details</button>
      </div>

      <div className="upl-header">
        <div>
          <p className="upl-eyebrow"><span className="upl-eyebrow-dot" /> PRODUCT DOCUMENTATION</p>
          <h1>Add product photographs</h1>
          <p className="upl-description">
            Capture clear images of the package so NIRIKSHAN can verify mandatory
            declarations and identify possible statutory violations under the PCR 2011.
          </p>
        </div>

        <div className="upl-steps">
          <span className="upl-step">01 Details</span>
          <span className="upl-step-arrow">→</span>
          <span className="upl-step active">02 Product Photos</span>
          <span className="upl-step-arrow">→</span>
          <span className="upl-step">03 Verification</span>
        </div>
      </div>

      <div className="upl-info-card">
        <span className="upl-info-icon">ⓘ</span>
        <div>
          <p>Multiple views improve declaration detection and evidence chain quality:</p>
          <div className="upl-info-chips">
            <span><strong>Front</strong> → Product identity</span>
            <span><strong>Back</strong> → Manufacturer &amp; declarations</span>
            <span><strong>Label</strong> → Mandatory declarations</span>
            <span><strong>MRP</strong> → Price verification</span>
          </div>
        </div>
      </div>

      <div className="upl-grid">
        {VIEW_CONFIG.map((view) => {
          const img = images[view.key];
          return (
            <div className="upl-card" key={view.key}>
              <div className="upl-card-top">
                <span className="upl-card-index">{view.index}</span>
                <span className={`upl-tag ${view.tag === "REQUIRED" ? "required" : ""}`}>
                  {view.tag}
                </span>
              </div>

              <h3>{view.title}</h3>
              <p className="upl-card-desc">{view.description}</p>

              {img ? (
                <div className="upl-preview-wrap">
                  <img src={img.previewUrl} alt={view.title} className="upl-preview-img" />
                  <span className="upl-captured-badge">✓ Captured • {formatSize(img.size)}</span>
                  <span className="upl-filename-badge">{img.name}</span>
                  <span className="upl-focus-badge">SHARP FOCUS</span>
                </div>
              ) : (
                <div className="upl-dropzone">
                  <div className="upl-dropzone-icon">{view.icon}</div>
                  <strong>{view.hint || "Upload or take photograph"}</strong>
                  <span className="upl-dropzone-sub">
                    {view.hintSub || "JPEG, PNG or HEIC up to 15MB"}
                  </span>

                  <div className="upl-dropzone-actions">
                    <button
                      className="upl-btn-outline"
                      onClick={() => fileInputRefs.current[view.key]?.click()}
                    >
                      ⬆ Upload Image
                    </button>
                    <button
                      className="upl-btn-solid"
                      onClick={() => cameraInputRefs.current[view.key]?.click()}
                    >
                      📷 Camera
                    </button>
                  </div>
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                ref={(el) => (fileInputRefs.current[view.key] = el)}
                onChange={(e) => handleFileSelect(view.key, e)}
                style={{ display: "none" }}
              />
              <input
                type="file"
                accept="image/*"
                capture="environment"
                ref={(el) => (cameraInputRefs.current[view.key] = el)}
                onChange={(e) => handleFileSelect(view.key, e)}
                style={{ display: "none" }}
              />

              <div className="upl-card-footer">
                {img ? (
                  <>
                    <span className="upl-footer-left success">
                      <span className="upl-check-dot">✓</span> {view.footnoteLeft}
                    </span>
                    <div className="upl-footer-actions">
                      <button
                        className="upl-btn-outline small"
                        onClick={() => fileInputRefs.current[view.key]?.click()}
                      >
                        Retake
                      </button>
                      <button
                        className="upl-btn-danger small"
                        onClick={() => handleRemove(view.key)}
                      >
                        Remove
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="upl-footer-left">{view.footnoteLeft}</span>
                    <span className="upl-footer-right">{view.footnoteRight}</span>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="upl-guidelines">
        <span className="upl-guidelines-icon">ⓘ</span>
        <strong>Inspector Guidelines:</strong>
        <span className="upl-guideline-item">✓ Keep full package in frame</span>
        <span className="upl-guideline-item">✓ Ensure label text is sharp</span>
        <span className="upl-guideline-item">✓ Avoid glare and harsh shadows</span>
        <span className="upl-guideline-item">✓ Ensure MRP &amp; dates are legible</span>
      </div>

      <div className="upl-bottombar">
        <button className="upl-back-link" onClick={onBack}>← Back to Step 1</button>

        <div className="upl-progress-block">
          <span>
            {uploadedCount} / 4 photos added
            {canContinue && <> · <span className="upl-progress-dot" /> Required views satisfied</>}
          </span>
          <div className="upl-progress-bar">
            <div className="upl-progress-fill" style={{ width: `${(uploadedCount / 4) * 100}%` }} />
          </div>
        </div>

        <button
          className="upl-continue-btn"
          disabled={!canContinue}
          onClick={() => onContinue(images)}
        >
          Continue to Analysis →
        </button>
      </div>

      <p className="upl-final-footnote">
        Legal Metrology (Packaged Commodities) Rules, 2011 • Verification Environment
      </p>

    </div>
  );
}

export default UploadScreen;