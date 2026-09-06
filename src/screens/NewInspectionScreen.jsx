import { useState } from "react";
import "./NewInspectionScreen.css";

function NewInspectionScreen({ onBack, onContinue }) {
  const [productName, setProductName] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [category, setCategory] = useState("");
  const [inspectionType, setInspectionType] = useState("");
  const [inspectionDate, setInspectionDate] = useState("2026-09-05");
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

  return (
    <div className="new-inspection-page">

      {/* Header */}
      <header className="new-inspection-header">

        <div className="new-inspection-brand">
          <div className="new-inspection-brand-mark">N</div>

          <div>
            <div className="new-inspection-brand-name">
              NIRIKSHAN
            </div>

            <div className="new-inspection-brand-subtitle">
              LEGAL METROLOGY
            </div>
          </div>
        </div>

        <div className="inspection-progress">
          <span>NEW INSPECTION</span>
          <strong>01 / 06</strong>
        </div>

      </header>


      {/* Main */}
      <main className="new-inspection-main">

        <section className="new-inspection-intro">

          <div className="new-inspection-eyebrow">
            INSPECTION INITIATION
          </div>

          <h1>
            Create an inspection
          </h1>

        </section>


        {/* Inspection details */}
        <section className="inspection-form">

          <div className="form-section-heading">

            <span>01</span>

            <div>
              <h2>Inspection details</h2>

              <p>
                Enter the information available at the time of inspection.
              </p>
            </div>

          </div>


          <div className="form-grid">

            {/* Inspection ID */}
            <div className="inspection-field">

              <label>
                INSPECTION ID
              </label>

              <div className="field-readonly">
                LM / 02482

                <span>
                  AUTO GENERATED
                </span>
              </div>

            </div>


            {/* Inspection Date */}
            <div className="inspection-field">

              <label>
                INSPECTION DATE
              </label>

              <input
                type="date"
                value={inspectionDate}
                onChange={(e) => setInspectionDate(e.target.value)}
              />

            </div>


            {/* Product Category */}
            <div className="inspection-field">

              <label>
                PRODUCT CATEGORY
              </label>

              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >

                <option value="" disabled>
                  Select product category
                </option>

                <option>
                  Packaged Food
                </option>

                <option>
                  Personal Care
                </option>

                <option>
                  Household Goods
                </option>

                <option>
                  Beverages
                </option>

                <option>
                  Other Packaged Commodity
                </option>

              </select>

            </div>


            {/* Inspection Type */}
            <div className="inspection-field">

              <label>
                INSPECTION TYPE
              </label>

              <select
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value)}
              >

                <option value="" disabled>
                  Select inspection type
                </option>

                <option>
                  Routine Inspection
                </option>

                <option>
                  Market Surveillance
                </option>

                <option>
                  Complaint Based
                </option>

                <option>
                  Follow-up Inspection
                </option>

              </select>

            </div>

          </div>


          {/* Product information */}
          <div className="optional-section">

            <div className="form-section-heading">

              <span>02</span>

              <div>

                <h2>
                  Product information
                </h2>

                <p>
                  Add details if they are already known. These can also be
                  extracted later from the product images.
                </p>

              </div>

            </div>


            <div className="form-grid product-grid">

              <div className="inspection-field">

                <label>
                  PRODUCT / BRAND NAME
                </label>

                <input
                  type="text"
                  placeholder="Enter product or brand name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />

              </div>


              <div className="inspection-field">

                <label>
                  MANUFACTURER / PACKER
                </label>

                <input
                  type="text"
                  placeholder="Enter manufacturer or packer"
                  value={manufacturer}
                  onChange={(e) => setManufacturer(e.target.value)}
                />

              </div>

            </div>

          </div>


          {/* Regulatory applicability */}
          <div className="optional-section">

            <div className="form-section-heading">

              <span>03</span>

              <div>

                <h2>
                  Regulatory applicability
                </h2>

                <p>
                  These affect which Rule 6 declarations are legally
                  required for this package.
                </p>

              </div>

            </div>

            <div style={{ padding: "22px 28px", display: "flex", flexDirection: "column", gap: "16px" }}>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#F4EEDD", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isImported}
                  onChange={(e) => setIsImported(e.target.checked)}
                />
                Imported product (Country of Origin declaration required — Rule 6)
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#F4EEDD", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={isExempt}
                  onChange={(e) => setIsExempt(e.target.checked)}
                />
                Exempt category (e.g. under 10g/10ml, institutional pack, agricultural produce &gt;50kg — Rule 3/26)
              </label>

            </div>

          </div>


          {/* Actions */}
          <div className="new-inspection-actions">

            <button
              className="new-inspection-back"
              onClick={onBack}
            >
              ← BACK TO DASHBOARD
            </button>


            <button
              className="new-inspection-continue"
              onClick={handleContinue}
            >
              CONTINUE TO PRODUCT IMAGES

              <span>
                →
              </span>

            </button>

          </div>

        </section>

      </main>


      {/* Footer */}
      <footer className="new-inspection-footer">

        <span>
          DEPARTMENT OF CONSUMER AFFAIRS
        </span>

        <span>
          LEGAL METROLOGY · INSPECTION WORKSPACE
        </span>

        <span>
          NIRIKSHAN · v1.0
        </span>

      </footer>

    </div>
  );
}

export default NewInspectionScreen;