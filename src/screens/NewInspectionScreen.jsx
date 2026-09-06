import { useState } from "react";
import "./NewInspectionScreen.css";

function NewInspectionScreen({ onBack, onContinue }) {
  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [category, setCategory] = useState("");
  const [inspectionType, setInspectionType] = useState("");
  const [inspectionDate, setInspectionDate] = useState("2026-09-06");
  const [isImported, setIsImported] = useState(false);
  const [isExempt, setIsExempt] = useState(false);

  const handleContinue = () => {
    onContinue({
      productName: productName.trim() || "Unnamed Product",
      manufacturer: manufacturer.trim() || "Not specified",
      category: category || "Not specified",
      inspectionType: inspectionType || "Not specified",
      inspectionDate,
      isImported,
      isExempt,
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