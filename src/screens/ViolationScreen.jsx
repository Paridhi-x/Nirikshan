import "./ViolationScreen.css";

function ViolationScreen({ onBack, onContinue }) {
  return (
    <div className="violation-page">

      {/* Header */}
      <header className="violation-header">

        <div className="violation-brand">
          <div className="violation-brand-mark">N</div>

          <div>
            <div className="violation-brand-name">
              NIRIKSHAN
            </div>

            <div className="violation-brand-subtitle">
              LEGAL METROLOGY
            </div>
          </div>
        </div>

        <div className="violation-step">
          <span>INSPECTION RESULT</span>
          <strong>05 / 05</strong>
        </div>

      </header>


      {/* Main */}
      <main className="violation-main">

        {/* Result heading */}
        <section className="violation-heading">

          <div className="violation-eyebrow">
            COMPLIANCE ASSESSMENT
          </div>

          <div className="result-title-row">

            <div>
              <h1>
                Product requires action
              </h1>

              <p>
                NIRIKSHAN identified a potential declaration violation
                requiring inspector verification.
              </p>
            </div>

            <div className="result-badge">
              <span className="result-badge-dot"></span>
              FLAGGED
            </div>

          </div>

        </section>


        {/* Result summary */}
        <section className="result-summary">

          <div className="result-summary-product">

            <div className="result-product-mark">
              GR
            </div>

            <div>
              <span>INSPECTION LM / 02482</span>

              <h2>
                Annapurna Basmati Rice
              </h2>

              <p>
                500 g · Packaged Food
              </p>
            </div>

          </div>


          <div className="result-summary-stats">

            <div>
              <span>DECLARATIONS CHECKED</span>
              <strong>06</strong>
            </div>

            <div>
              <span>VALID</span>
              <strong className="valid-number">05</strong>
            </div>

            <div>
              <span>REQUIRES REVIEW</span>
              <strong className="review-number">01</strong>
            </div>

          </div>

        </section>


        {/* Violation */}
        <section className="violation-panel">

          <div className="violation-panel-header">

            <div>
              <span>01 · POTENTIAL VIOLATION</span>

              <h2>
                Consumer care details not clearly declared
              </h2>
            </div>

            <div className="severity">
              REVIEW
            </div>

          </div>


          <div className="violation-content">

            {/* Evidence */}
            <div className="violation-column">

              <div className="column-label">
                DETECTED INFORMATION
              </div>

              <div className="evidence-box">

                <span className="evidence-status">
                  LOW CONFIDENCE
                </span>

                <strong>
                  Consumer care information
                </strong>

                <p>
                  No clearly identifiable consumer complaint contact
                  information was detected in the available package images.
                </p>

              </div>

            </div>


            {/* Requirement */}
            <div className="violation-column">

              <div className="column-label">
                APPLICABLE REQUIREMENT
              </div>

              <div className="requirement-box">

                <div className="requirement-number">
                  PC RULES
                </div>

                <strong>
                  Mandatory declaration
                </strong>

                <p>
                  Required consumer-care / complaint contact information
                  should be declared as applicable to the packaged commodity.
                </p>

                <span className="rule-reference">
                  PACKAGED COMMODITIES RULES, 2011
                </span>

              </div>

            </div>

          </div>


          {/* Recommendation */}
          <div className="recommendation">

            <div className="recommendation-icon">
              !
            </div>

            <div>
              <span>INSPECTOR ACTION</span>

              <strong>
                Verify the package label manually
              </strong>

              <p>
                Capture a clearer label image if the required declaration is
                present but was not confidently detected.
              </p>
            </div>

          </div>

        </section>


        {/* Compliance overview */}
        <section className="compliance-overview">

          <div className="overview-heading">
            <span>COMPLIANCE OVERVIEW</span>

            <strong>
              5 / 6 declarations clear
            </strong>
          </div>

          <div className="overview-bar">
            <div className="overview-valid"></div>
            <div className="overview-review"></div>
          </div>

          <div className="overview-legend">

            <span>
              <i className="legend-valid"></i>
              VALID
            </span>

            <span>
              <i className="legend-review"></i>
              REQUIRES REVIEW
            </span>

          </div>

        </section>


        {/* Actions */}
        <div className="violation-actions">

          <button
            className="violation-back-button"
            onClick={onBack}
          >
            ← BACK TO REVIEW
          </button>

          <button
            className="violation-continue-button"
            onClick={onContinue}
          >
            GENERATE INSPECTION REPORT
            <span>→</span>
          </button>

        </div>

      </main>


      {/* Footer */}
      <footer className="violation-footer">

        <span>
          DEPARTMENT OF CONSUMER AFFAIRS
        </span>

        <span>
          LEGAL METROLOGY · INSPECTION RESULT
        </span>

        <span>
          NIRIKSHAN · v1.0
        </span>

      </footer>

    </div>
  );
}

export default ViolationScreen;