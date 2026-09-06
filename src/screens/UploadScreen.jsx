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

/* ─────────────────────────────────────────────────────────
   CROP / ZOOM MODAL
   Shown right after picking or capturing ANY photo (main
   slots + extra photos). User frames the shot before it's
   saved — this both improves OCR accuracy (tight, sharp crop)
   and lets them fix a crooked/too-wide photo on the spot.
   ───────────────────────────────────────────────────────── */

const BOX_W = 340;
const BOX_H = 340;

function ImageCropModal({ file, onCancel, onConfirm }) {
  const [srcUrl] = useState(() => URL.createObjectURL(file));
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [pos, setPos] = useState({ left: 0, top: 0 });
  const [ready, setReady] = useState(false);
  const imgRef = useRef(null);
  const dragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });
  const pinchRef = useRef({ pinching: false, startDist: 0, startZoom: 1 });

  const baseScale = natural.w && natural.h
    ? Math.max(BOX_W / natural.w, BOX_H / natural.h)
    : 1;
  const dispW = natural.w * baseScale * zoom;
  const dispH = natural.h * baseScale * zoom;

  const clamp = (left, top, w, h) => ({
    left: Math.min(0, Math.max(left, BOX_W - w)),
    top: Math.min(0, Math.max(top, BOX_H - h)),
  });

  const handleImgLoad = (e) => {
    const w = e.target.naturalWidth;
    const h = e.target.naturalHeight;
    setNatural({ w, h });
    const bs = Math.max(BOX_W / w, BOX_H / h);
    const dw = w * bs;
    const dh = h * bs;
    setPos({ left: (BOX_W - dw) / 2, top: (BOX_H - dh) / 2 });
    setReady(true);
  };

  const applyZoom = (newZoom) => {
    const z = Math.min(4, Math.max(1, newZoom));
    const newDispW = natural.w * baseScale * z;
    const newDispH = natural.h * baseScale * z;
    setPos((p) => clamp(p.left, p.top, newDispW, newDispH));
    setZoom(z);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    applyZoom(zoom + (e.deltaY < 0 ? 0.15 : -0.15));
  };

  const startDrag = (x, y) => { dragRef.current = { dragging: true, lastX: x, lastY: y }; };
  const moveDrag = (x, y) => {
    if (!dragRef.current.dragging) return;
    const dx = x - dragRef.current.lastX;
    const dy = y - dragRef.current.lastY;
    dragRef.current.lastX = x;
    dragRef.current.lastY = y;
    setPos((p) => clamp(p.left + dx, p.top + dy, dispW, dispH));
  };
  const endDrag = () => { dragRef.current.dragging = false; };

  const touchDist = (t0, t1) => Math.hypot(t0.clientX - t1.clientX, t0.clientY - t1.clientY);

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      pinchRef.current = { pinching: true, startDist: touchDist(e.touches[0], e.touches[1]), startZoom: zoom };
    } else if (e.touches.length === 1) {
      startDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && pinchRef.current.pinching) {
      const d = touchDist(e.touches[0], e.touches[1]);
      applyZoom(pinchRef.current.startZoom * (d / pinchRef.current.startDist));
    } else if (e.touches.length === 1) {
      moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }
  };
  const handleTouchEnd = () => { endDrag(); pinchRef.current.pinching = false; };

  const cleanup = () => URL.revokeObjectURL(srcUrl);

  const handleConfirm = () => {
    const factor = dispW / natural.w;
    const srcX = (0 - pos.left) / factor;
    const srcY = (0 - pos.top) / factor;
    const srcW = BOX_W / factor;
    const srcH = BOX_H / factor;

    const outW = Math.min(1600, Math.round(srcW));
    const outH = Math.round(outW * (srcH / srcW));

    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(imgRef.current, srcX, srcY, srcW, srcH, 0, 0, outW, outH);

    canvas.toBlob((blob) => {
      const croppedFile = new File([blob], file.name || "photo.jpg", { type: "image/jpeg" });
      cleanup();
      onConfirm(croppedFile);
    }, "image/jpeg", 0.92);
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, background: "rgba(15,12,25,0.92)", zIndex: 1000,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        touchAction: "none", padding: 16,
      }}
    >
      <p style={{ color: "#fff", marginBottom: 12, fontSize: 14, textAlign: "center" }}>
        Drag to reposition · Scroll or pinch to zoom
      </p>

      <div
        style={{
          position: "relative", width: BOX_W, height: BOX_H, overflow: "hidden",
          borderRadius: 12, border: "2px solid #fff", background: "#111", cursor: "grab",
        }}
        onWheel={handleWheel}
        onMouseDown={(e) => startDrag(e.clientX, e.clientY)}
        onMouseMove={(e) => moveDrag(e.clientX, e.clientY)}
        onMouseUp={endDrag}
        onMouseLeave={endDrag}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imgRef}
          src={srcUrl}
          onLoad={handleImgLoad}
          alt="Crop preview"
          draggable={false}
          style={{
            position: "absolute",
            left: pos.left,
            top: pos.top,
            width: dispW || "auto",
            height: dispH || "auto",
            userSelect: "none",
            opacity: ready ? 1 : 0,
          }}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button onClick={() => applyZoom(zoom - 0.3)} style={cropBtnStyle}>−</button>
        <button onClick={() => applyZoom(1)} style={{ ...cropBtnStyle, width: "auto", padding: "0 14px", fontSize: 13 }}>
          {Math.round(zoom * 100)}%
        </button>
        <button onClick={() => applyZoom(zoom + 0.3)} style={cropBtnStyle}>+</button>
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 20 }}>
        <button
          onClick={() => { cleanup(); onCancel(); }}
          style={{ padding: "10px 22px", borderRadius: 8, border: "1px solid #999", background: "transparent", color: "#fff", cursor: "pointer" }}
        >
          Cancel
        </button>
        <button
          onClick={handleConfirm}
          disabled={!ready}
          style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "#2c8f5f", color: "#fff", fontWeight: 600, cursor: "pointer", opacity: ready ? 1 : 0.5 }}
        >
          ✓ Use Photo
        </button>
      </div>
    </div>
  );
}

const cropBtnStyle = {
  width: 36, height: 36, borderRadius: "50%", border: "none",
  background: "rgba(255,255,255,0.2)", color: "#fff", fontSize: 18, cursor: "pointer",
};

function UploadScreen({ onBack, onContinue }) {
  const [images, setImages] = useState({});
  const [extraImages, setExtraImages] = useState([]); // NEW: unlimited additional photos
  const [pendingCrop, setPendingCrop] = useState(null); // { kind: "slot" | "extra", key?, file }
  const fileInputRefs = useRef({});
  const cameraInputRefs = useRef({});
  const extraFileRef = useRef(null);
  const extraCameraRef = useRef(null);

  // CHANGED: file selection now opens the crop modal instead of saving directly
  const handleFileSelect = (key, e) => {
    const file = e.target.files[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    setPendingCrop({ kind: "slot", key, file });
  };

  const handleExtraFileSelect = (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setPendingCrop({ kind: "extra", file });
  };

  const handleCropConfirm = (croppedFile) => {
    const previewUrl = URL.createObjectURL(croppedFile);
    if (pendingCrop.kind === "slot") {
      const { key } = pendingCrop;
      setImages((prev) => ({
        ...prev,
        [key]: { file: croppedFile, previewUrl, size: croppedFile.size, name: croppedFile.name },
      }));
    } else {
      setExtraImages((prev) => [
        ...prev,
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, file: croppedFile, previewUrl, size: croppedFile.size, name: croppedFile.name },
      ]);
    }
    setPendingCrop(null);
  };

  const handleRemove = (key) => {
    setImages((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleRemoveExtra = (id) => {
    setExtraImages((prev) => prev.filter((img) => img.id !== id));
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

      {/* NEW: unlimited additional photos, for anything the 4 fixed slots miss
          (e.g. a second angle, a sticker, ingredients panel, warranty seal) */}
      <div className="upl-extra-section" style={{ marginTop: 28 }}>
        <h3 style={{ marginBottom: 4 }}>Additional Photos <span style={{ fontWeight: 400, color: "#8a8073" }}>(optional)</span></h3>
        <p className="upl-card-desc" style={{ marginBottom: 14 }}>
          Add as many extra photos as you need — other angles, stickers, or anything not covered above.
        </p>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 14 }}>
          {extraImages.map((img) => (
            <div key={img.id} style={{ position: "relative", width: 120, height: 120, borderRadius: 10, overflow: "hidden", border: "1px solid #e3dccb" }}>
              <img src={img.previewUrl} alt="Extra evidence" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              <button
                onClick={() => handleRemoveExtra(img.id)}
                aria-label="Remove photo"
                style={{
                  position: "absolute", top: 4, right: 4, width: 24, height: 24, borderRadius: "50%",
                  border: "none", background: "rgba(0,0,0,0.6)", color: "#fff", cursor: "pointer", fontSize: 13,
                }}
              >
                ✕
              </button>
            </div>
          ))}

          <div
            style={{
              width: 120, height: 120, borderRadius: 10, border: "2px dashed #d8cfc0",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              gap: 6, color: "#8a8073",
            }}
          >
            <button
              onClick={() => extraFileRef.current?.click()}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: 24, lineHeight: 1 }}
              aria-label="Upload extra photo"
              title="Upload photo"
            >
              ⬆
            </button>
            <button
              onClick={() => extraCameraRef.current?.click()}
              style={{ border: "none", background: "none", cursor: "pointer", fontSize: 20, lineHeight: 1 }}
              aria-label="Take extra photo"
              title="Take photo"
            >
              📷
            </button>
            <span style={{ fontSize: 11 }}>Add Photo</span>
          </div>
        </div>

        <input
          type="file"
          accept="image/*"
          ref={extraFileRef}
          onChange={handleExtraFileSelect}
          style={{ display: "none" }}
        />
        <input
          type="file"
          accept="image/*"
          capture="environment"
          ref={extraCameraRef}
          onChange={handleExtraFileSelect}
          style={{ display: "none" }}
        />
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
            {extraImages.length > 0 && <> · {extraImages.length} extra</>}
            {canContinue && <> · <span className="upl-progress-dot" /> Required views satisfied</>}
          </span>
          <div className="upl-progress-bar">
            <div className="upl-progress-fill" style={{ width: `${(uploadedCount / 4) * 100}%` }} />
          </div>
        </div>

        <button
          className="upl-continue-btn"
          disabled={!canContinue}
          onClick={() => onContinue({ ...images, extra: extraImages })}
        >
          Continue to Analysis →
        </button>
      </div>

      <p className="upl-final-footnote">
        Legal Metrology (Packaged Commodities) Rules, 2011 • Verification Environment
      </p>

      {pendingCrop && (
        <ImageCropModal
          file={pendingCrop.file}
          onCancel={() => setPendingCrop(null)}
          onConfirm={handleCropConfirm}
        />
      )}

    </div>
  );
}

export default UploadScreen;