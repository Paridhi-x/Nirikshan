import { useState, useEffect } from "react";
import "./NewInspectionScreen.css";

const MONTHS_SHORT = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];

// Converts "2026-09-06" -> "06 SEP 2026" to match DashboardScreen's
// parseDisplayDate format (DD MON YYYY).
function toDisplayDate(isoDate) {
  if (!isoDate) return "";
  const [year, month, day] = isoDate.split("-");
  const monthName = MONTHS_SHORT[Number(month) - 1] || "";
  return `${day} ${monthName} ${year}`;
}

function NewInspectionScreen({ onBack, onContinue }) {
  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [category, setCategory] = useState("");
  const [inspectionType, setInspectionType] = useState("");
  const [inspectionDate, setInspectionDate] = useState("2026-09-06");
  const [isImported, setIsImported] = useState(false);
  const [isExempt, setIsExempt] = useState(false);

  // --- Geo-tagging: capture the officer's location as soon as this
  // screen opens, so it can be attached to the inspection record and
  // final report as proof of where the check took place. ---
  const [location, setLocation] = useState(null); // { lat, lng, accuracy, capturedAt }
  const [locationStatus, setLocationStatus] = useState("loading"); // loading | success | error | unsupported

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setLocationStatus("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          capturedAt: Date.now(),
        });
        setLocationStatus("success");
      },
      () => {
        setLocationStatus("error");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  const handleContinue = () => {
    onContinue({
      productName: productName.trim() || "Unnamed Product",
      manufacturer: manufacturer.trim() || "Not specified",
      category: category || "Not specified",
      inspectionType: inspectionType || "Not specified",
      inspectionDate,
      date: toDisplayDate(inspectionDate), // field DashboardScreen actually reads
      isImported,
      isExempt,
      location, // null if capture failed/denied — handled downstream
    });
  };

  const formattedDate = inspectionDate
    ? new Date(inspectionDate).toLocaleDateString("en-GB", {
        day: "2-digit", month: "2-digit", year: "numeric",
      }).split("/").join("-")
    : "";

  return (
    <div className="nis-page">

      <div className="nis-topbar">
        <button className="nis-back-link" onClick={onBack}>← Back to Dashboard</button>
      </div>

      <div className="nis-header">
        <div>
          <p className="nis-eyebrow"><span className="nis-eyebrow-dot" /> INSPECTION INITIATION</p>
          <h1>Create an Inspection</h1>
          <p className="nis-description">
            Enter the basic details of the packaged commodity before beginning the inspection.
          </p>
        </div>

        <div className="nis-steps">
          <span className="nis-step active">01 Details</span>
          <span className="nis-step-arrow">→</span>
          <span className="nis-step">02 Product Scan</span>
          <span className="nis-step-arrow">→</span>
          <span className="nis-step">03 Verification</span>
        </div>
      </div>

      {/* GEO-TAG STATUS STRIP */}
      <div
        style={{
          display: "flex", alignItems: "center", gap: 10,
          padding: "10px 16px", borderRadius: 8, marginBottom: 20,
          fontSize: 12.5, fontWeight: 600,
          background:
            locationStatus === "success" ? "#e7f2ea" :
            locationStatus === "loading" ? "#f7ecd8" : "#fbe8e4",
          color:
            locationStatus === "success" ? "#17512f" :
            locationStatus === "loading" ? "#a8711f" : "#a3372a",
        }}
      >
        {locationStatus === "loading" && "📍 Capturing inspection location…"}
        {locationStatus === "success" && location && (
          <>
            📍 Location captured: {location.lat.toFixed(5)}°N, {location.lng.toFixed(5)}°E
            {" "}(±{Math.round(location.accuracy)}m)
          </>
        )}
        {locationStatus === "error" && "⚠ Location access denied — inspection will proceed without geo-tag. Enable location permission for evidentiary compliance."}
        {locationStatus === "unsupported" && "⚠ Geolocation not supported on this device — inspection will proceed without geo-tag."}
      </div>

      <div className="nis-card">

        <div className="nis-section">
          <div className="nis-section-heading">
            <span className="nis-section-num">01</span>
            <div>
              <h2>Inspection Details</h2>
              <p>Enter the information available at the time of inspection.</p>
            </div>
          </div>

          <div className="nis-grid">
            <div className="nis-field">
              <label>
                INSPECTION ID
                <span className="nis-badge">AUTO GENERATED</span>
              </label>
              <div className="nis-input readonly">LM / 02482</div>
            </div>

            <div className="nis-field">
              <label>
                INSPECTION DATE
                <span className="nis-hint">DD-MM-YYYY</span>
              </label>
              <div className="nis-date-wrap">
                <input
                  type="date"
                  value={inspectionDate}
                  onChange={(e) => setInspectionDate(e.target.value)}
                  className="nis-date-native"
                />
                <div className="nis-input date-display">
                  {formattedDate}
                  <span className="nis-cal-icon">📅</span>
                </div>
              </div>
            </div>

            <div className="nis-field">
              <label>PRODUCT CATEGORY <span className="nis-required">*</span></label>
              <select
                className="nis-input select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select product category</option>
                <option>Packaged Food</option>
                <option>Personal Care</option>
                <option>Household Goods</option>
                <option>Beverages</option>
                <option>Other Packaged Commodity</option>
              </select>
            </div>

            <div className="nis-field">
              <label>INSPECTION TYPE <span className="nis-required">*</span></label>
              <select
                className="nis-input select"
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value)}
              >
                <option value="">Select inspection type</option>
                <option>Routine Inspection</option>
                <option>Market Surveillance</option>
                <option>Complaint Based</option>
                <option>Follow-up Inspection</option>
              </select>
            </div>
          </div>
        </div>

        <div className="nis-section">
          <div className="nis-section-heading">
            <span className="nis-section-num">02</span>
            <div>
              <h2>Product Information</h2>
              <p>Add known product details. Additional information can be extracted during product scanning.</p>
            </div>
          </div>

          <div className="nis-grid">
            <div className="nis-field">
              <label>PRODUCT / BRAND NAME</label>
              <div className="nis-input-icon-wrap">
                <span className="nis-input-icon">📦</span>
                <input
                  type="text"
                  className="nis-input with-icon"
                  placeholder="e.g., Annapurna Superfine Basmati Rice"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>
            </div>

            <div className="nis-field">
              <label>MANUFACTURER / PACKER / IMPORTER</label>
              <div className="nis-input-icon-wrap">
                <span className="nis-input-icon">🏢</span>
                <input
                  type="text"
                  className="nis-input with-icon"
                  placeholder="e.g., Bharat Agro Products Pvt. Ltd., Okhla Phase III"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="nis-section">
          <div className="nis-section-heading">
            <span className="nis-section-num">03</span>
            <div>
              <h2>Regulatory Applicability</h2>
              <p>Select conditions that affect the applicable Legal Metrology checks.</p>
            </div>
          </div>

          <label className="nis-check-card">
            <input
              type="checkbox"
              checked={isImported}
              onChange={(e) => setIsImported(e.target.checked)}
            />
            <div className="nis-check-text">
              <strong>Imported Product</strong>
              <span>Country of Origin declaration required.</span>
            </div>
            <span className="nis-tag">Rule 6</span>
          </label>

          <label className="nis-check-card">
            <input
              type="checkbox"
              checked={isExempt}
              onChange={(e) => setIsExempt(e.target.checked)}
            />
            <div className="nis-check-text">
              <strong>Exempt Category</strong>
              <span>Applicable exemption under the relevant rule.</span>
            </div>
            <span className="nis-tag amber">Rule 3 &amp; Rule 26 Exemption</span>
          </label>

          <p className="nis-footnote">
            Legal Metrology (Packaged Commodities) Rules, 2011 • Applicable declarations will be verified during product analysis.
          </p>
        </div>

        <div className="nis-bottombar">
          <button className="nis-back-link" onClick={onBack}>← Back</button>
          <button className="nis-continue-btn" onClick={handleContinue}>
            Continue to Product Scan →
          </button>
        </div>

      </div>
    </div>
  );
}

export default NewInspectionScreen;