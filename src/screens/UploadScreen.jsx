import { useState, useRef } from "react";
import "./UploadScreen.css";

const VIEW_CONFIG = [
  { key: "front", index: "01", title: "Front of package", desc: "Upload or capture image", required: true, icon: "+" },
  { key: "back", index: "02", title: "Back of package", desc: "Upload or capture image", required: false, icon: "+" },
  { key: "label", index: "03", title: "Label close-up", desc: "Capture mandatory declarations", required: false, icon: "+" },
  { key: "mrp", index: "04", title: "MRP area", desc: "Capture price declaration clearly", required: false, icon: "₹" },
];

function UploadScreen({ onBack, onContinue }) {
  const [images, setImages] = useState({});
  const fileInputRefs = useRef({});

  const handleFileSelect = (key, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const previewUrl = URL.createObjectURL(file);
    setImages((prev) => ({ ...prev, [key]: { file, previewUrl } }));
  };

  const triggerUpload = (key) => {
    fileInputRefs.current[key]?.click();
  };

  const uploadedCount = Object.keys(images).length;
  const canContinue = Boolean(images.front || images.label);

  return (
    <div className="upload-page">
      <header className="upload-header">
        <div className="upload-brand">
          <div className="upload-brand-mark">N</div>
          <div>
            <div className="upload-brand-name">NIRIKSHAN</div>
            <div className="upload-brand-subtitle">LEGAL METROLOGY</div>
          </div>
        </div>
        <div className="upload-step">
          <span>NEW INSPECTION</span>
          <strong>02 / 06</strong>
        </div>
      </header>

      <main className="upload-main">
        <section className="upload-heading">
          <div className="upload-eyebrow">PRODUCT DOCUMENTATION</div>
          <h1>Add product photographs</h1>
          <p>
            Add photographs for each package view available. More views
            improve declaration coverage. The label close-up and MRP area
            matter most.
          </p>
        </section>

        <section className="package-views">
          {VIEW_CONFIG.map((view) => (
            <div className="package-view-card" key={view.key}>
              <div className="view-card-top">
                <span>{view.index}</span>
                <span className={view.required ? "view-required" : ""}>
                  {view.required ? "REQUIRED" : "RECOMMENDED"}
                </span>
              </div>

              <div className="view-upload-area">
                {images[view.key] ? (
                  <div className="view-preview">
                    <img
                      src={images[view.key].previewUrl}
                      alt={view.title}
                      className="preview-image"
                    />
                    <span className="preview-filename">
                      {images[view.key].file.name}
                    </span>
                    <button
                      className="upload-image-button"
                      onClick={() => triggerUpload(view.key)}
                    >
                      REPLACE
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="upload-icon">{view.icon}</div>
                    <h2>{view.title}</h2>
                    <p>{view.desc}</p>
                    <button
                      className="upload-image-button"
                      onClick={() => triggerUpload(view.key)}
                    >
                      ADD IMAGE
                    </button>
                  </>
                )}

                <input
                  type="file"
                  accept="image/*"
                  ref={(el) => (fileInputRefs.current[view.key] = el)}
                  onChange={(e) => handleFileSelect(view.key, e)}
                  style={{ display: "none" }}
                />
              </div>
            </div>
          ))}
        </section>

        <div className="upload-actions">
          <button className="upload-back-button" onClick={onBack}>
            ← BACK
          </button>

          <div className="upload-progress">
            {uploadedCount} / 4 VIEWS ADDED
          </div>

          <button
            className="upload-continue-button"
            disabled={!canContinue}
            onClick={() => onContinue(images)}
          >
            CONTINUE TO ANALYSIS
            <span>→</span>
          </button>
        </div>
      </main>

      <footer className="upload-footer">
        <span>DEPARTMENT OF CONSUMER AFFAIRS</span>
        <span>LEGAL METROLOGY · PRODUCT INSPECTION</span>
        <span>NIRIKSHAN · v1.0</span>
      </footer>
    </div>
  );
}

export default UploadScreen;