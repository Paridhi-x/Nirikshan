import "./DashboardScreen.css";

function DashboardScreen({ onLogout, onNewInspection }) {
  return (
    <div className="dashboard-page">

      {/* ───────────── Header ───────────── */}
      <header className="dashboard-header">

        <div className="dashboard-brand">
          <div className="dashboard-brand-mark">N</div>

          <div>
            <div className="dashboard-brand-name">
              NIRIKSHAN
            </div>

            <div className="dashboard-brand-subtitle">
              LEGAL METROLOGY
            </div>
          </div>
        </div>

        <div className="dashboard-header-right">

          <div className="system-status">
            <span className="status-dot"></span>
            SYSTEM OPERATIONAL
          </div>

          <div className="header-divider"></div>

          <div className="officer-info">
            <span className="officer-name">
              INSPECTOR
            </span>

            <span className="officer-id">
              LM / 02481
            </span>
          </div>

          <button
            className="logout-button"
            onClick={onLogout}
          >
            SIGN OUT
          </button>

        </div>
      </header>


      {/* ───────────── Main ───────────── */}
      <main className="dashboard-main">

        {/* ───────────── Heading ───────────── */}
        <section className="dashboard-heading">

          <div>

            <div className="dashboard-eyebrow">
              INSPECTION DESK
            </div>

            <h1>
              Inspection overview
            </h1>

            <p>
              Monitor recent compliance activity, review flagged commodities,
              and begin a new inspection.
            </p>

          </div>

          <button className="new-inspection-button" onClick={onNewInspection}>
            <span className="plus-symbol">+</span>
            <span>NEW INSPECTION</span>
            <span className="new-arrow">→</span>
          </button>

        </section>


        {/* ───────────── Summary ───────────── */}
        <section className="summary-grid">

          <div className="summary-card">

            <div className="summary-top">
              <span>INSPECTIONS COMPLETED</span>
              <span className="summary-index">01</span>
            </div>

            <div className="summary-number">
              128
            </div>

            <div className="summary-note">
              Total inspections completed
            </div>

          </div>


          <div className="summary-card flagged">

            <div className="summary-top">
              <span>FLAGGED PRODUCTS</span>
              <span className="summary-index">02</span>
            </div>

            <div className="summary-number">
              19
            </div>

            <div className="summary-note">
              Products requiring action
            </div>

          </div>


          <div className="summary-card review">

            <div className="summary-top">
              <span>PENDING REVIEW</span>
              <span className="summary-index">03</span>
            </div>

            <div className="summary-number">
              07
            </div>

            <div className="summary-note">
              Inspections awaiting review
            </div>

          </div>


          <div className="summary-card compliant">

            <div className="summary-top">
              <span>COMPLIANCE RATE</span>
              <span className="summary-index">04</span>
            </div>

            <div className="summary-number">
              84%
            </div>

            <div className="summary-note">
              Based on completed inspections
            </div>

          </div>

        </section>


        {/* ───────────── Workspace ───────────── */}
        <section className="dashboard-workspace">

          {/* Recent inspections */}
          <div className="recent-panel">

            <div className="panel-heading">

              <div>

                <div className="panel-eyebrow">
                  RECENT ACTIVITY
                </div>

                <h2>
                  Recent inspections
                </h2>

              </div>

              <button className="view-all-button">
                VIEW ALL →
              </button>

            </div>


            <div className="inspection-table">

              <div className="table-header">
                <span>PRODUCT</span>
                <span>INSPECTION ID</span>
                <span>DATE</span>
                <span>STATUS</span>
              </div>


              <div className="inspection-row" onClick={() => console.log("Open inspection: LM / 02481")}>

                <div className="product-cell">

                  <div className="product-placeholder">
                    GR
                  </div>

                  <div>
                    <strong>
                      Annapurna Basmati Rice
                    </strong>

                    <span>
                      500 g · Packaged food
                    </span>
                  </div>

                </div>

                <span className="inspection-id">
                  LM / 02481
                </span>

                <span className="inspection-date">
                  04 SEP 2026
                </span>

                <span className="status compliant-status">
                  COMPLIANT
                </span>

              </div>


              <div className="inspection-row" onClick={() => console.log("Open inspection: LM / 02479")}>

                <div className="product-cell">

                  <div className="product-placeholder">
                    HC
                  </div>

                  <div>
                    <strong>
                      Herbal Hair Oil
                    </strong>

                    <span>
                      200 ml · Personal care
                    </span>
                  </div>

                </div>

                <span className="inspection-id">
                  LM / 02479
                </span>

                <span className="inspection-date">
                  04 SEP 2026
                </span>

                <span className="status review-status">
                  REVIEW
                </span>

              </div>


              <div className="inspection-row" onClick={() => console.log("Open inspection: LM / 02476")}>

                <div className="product-cell">

                  <div className="product-placeholder">
                    CL
                  </div>

                  <div>
                    <strong>
                      Classic Laundry Powder
                    </strong>

                    <span>
                      1 kg · Household goods
                    </span>
                  </div>

                </div>

                <span className="inspection-id">
                  LM / 02476
                </span>

                <span className="inspection-date">
                  03 SEP 2026
                </span>

                <span className="status violation-status">
                  FLAGGED
                </span>

              </div>


              <div className="inspection-row" onClick={() => console.log("Open inspection: LM / 02472")}>

                <div className="product-cell">

                  <div className="product-placeholder">
                    TE
                  </div>

                  <div>
                    <strong>
                      Assam Tea
                    </strong>

                    <span>
                      250 g · Packaged food
                    </span>
                  </div>

                </div>

                <span className="inspection-id">
                  LM / 02472
                </span>

                <span className="inspection-date">
                  03 SEP 2026
                </span>

                <span className="status compliant-status">
                  COMPLIANT
                </span>

              </div>

            </div>

          </div>


          {/* Quick actions */}
          <aside className="quick-panel">

            <div className="panel-eyebrow">
              WORKSPACE
            </div>

            <h2>
              Quick actions
            </h2>


            <button className="quick-action primary-action" onClick={onNewInspection}>

              <span className="action-number">
                01
              </span>

              <span className="action-content">

                <strong>
                  New inspection
                </strong>

                <small>
                  Scan or upload a product label
                </small>

              </span>

              <span className="action-arrow">
                →
              </span>

            </button>


            <button className="quick-action">

              <span className="action-number">
                02
              </span>

              <span className="action-content">

                <strong>
                  Inspection history
                </strong>

                <small>
                  Search previous inspections
                </small>

              </span>

              <span className="action-arrow">
                →
              </span>

            </button>


            <button className="quick-action">

              <span className="action-number">
                03
              </span>

              <span className="action-content">

                <strong>
                  Flagged products
                </strong>

                <small>
                  Review reported violations
                </small>

              </span>

              <span className="action-arrow">
                →
              </span>

            </button>


            {/* Framework */}
            <div className="rules-note">

              <span className="rules-note-label">
                GOVERNING FRAMEWORK
              </span>

              <strong>
                Legal Metrology Act, 2009
              </strong>

              <span>
                Packaged Commodities Rules, 2011
              </span>

            </div>

          </aside>

        </section>

      </main>


      {/* ───────────── Footer ───────────── */}
      <footer className="dashboard-footer">

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

export default DashboardScreen;