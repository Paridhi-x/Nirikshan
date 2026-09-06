import { useState } from "react";
import heroImage from "../assets/inspection-hero.png";
import "./LoginScreen.css";

const IconScale = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" width={p.size || 18} height={p.size || 18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17m0-17c-1.6 0-3.2.45-4.7 1.3M12 3c1.6 0 3.2.45 4.7 1.3M4.3 8.3 2 13a2.8 2.8 0 0 0 4.9 0L4.3 8.3Zm15.4 0L17.4 13a2.8 2.8 0 0 0 4.9 0l-2.6-4.7ZM4.3 8.3h15.4M8.7 20h6.6" />
  </svg>
);
const IconScan = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 18} height={p.size || 18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M20.25 3.75v4.5m0-4.5h-4.5m4.5 0L15 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15m11.25 5.25v-4.5m0 4.5h-4.5m4.5 0L15 15" />
  </svg>
);
const IconExtract = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 18} height={p.size || 18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
  </svg>
);
const IconVerify = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 18} height={p.size || 18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M12 3c3.14 0 5.856 1.14 8.16 3.052a.75.75 0 0 1 .34.598v5.35c0 4.13-2.9 7.8-8.5 9.5-5.6-1.7-8.5-5.37-8.5-9.5v-5.35a.75.75 0 0 1 .34-.598C6.144 4.14 8.86 3 12 3Z" />
  </svg>
);
const IconReport = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 18} height={p.size || 18}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75M3.75 6.75h16.5M3.75 3.75h16.5v16.5H3.75V3.75Z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 12h1.5m-1.5 3h1.5m-1.5 3h1.5" />
  </svg>
);
const IconArrow = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width={p.size || 14} height={p.size || 14}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12h15m0 0-6-6m6 6-6 6" />
  </svg>
);
const IconLock = (p) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" width={p.size || 15} height={p.size || 15}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
  </svg>
);

export default function LoginScreen({ onLogin }) {
  const [showModal, setShowModal] = useState(false);
  const [officerId, setOfficerId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!officerId.trim()) return;
    onLogin(officerId.trim());
  };

  return (
    <div className="lp-root">
      {/* TOP GOVT BAR */}
      <div className="lp-govbar">
        <div className="left">
          <span className="tag-badge">LM ENFORCEMENT NET</span>
          <span>National Consumer Helpline <b>1915</b> (08:00 AM – 08:00 PM)</span>
        </div>
        <div className="right">
          <span>📶 SSL 256-bit GovVault</span>
          <span>Gazette G.S.R. 202(E)</span>
        </div>
      </div>

      {/* HEADER */}
      <div className="lp-header">
        <div className="lp-header-left">
          <div className="lp-gov-icon"><IconScale size={20} /></div>
          <div>
            <div className="lp-eyebrow-sm">DEPARTMENT OF CONSUMER AFFAIRS</div>
            <div className="lp-header-sub">MINISTRY OF CONSUMER AFFAIRS, FOOD &amp; PUBLIC DISTRIBUTION</div>
            <div className="lp-header-sub-2">Government of India · Legal Metrology Division</div>
          </div>
        </div>
        <div className="lp-header-right">
          <div className="lp-brand-name">
            <span className="serif">NIRIKSHAN</span>
            <span className="ver">V3.4.1</span>
          </div>
          <div className="lp-header-sub-2" style={{ textAlign: "right" }}>Legal Metrology Compliance System</div>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          Inspector Access
        </button>
      </div>

      {/* HERO */}
      <div className="lp-hero">
        <div className="lp-hero-text">
          <div className="lp-eyebrow">LEGAL METROLOGY · DIGITAL INSPECTION</div>
          <h1 className="serif">
            Accurate Measurements.
            <br />
            Fair Trade.
            <br />
            <em>Rigorous Enforcement.</em>
          </h1>
          <p>
            Digitally verify packaged commodities against Legal Metrology requirements — faster, cleaner and evidence-backed.
          </p>
          <div className="lp-hero-actions">
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              Start New Inspection <IconArrow />
            </button>
            <a href="#" className="lp-link">View Inspection History →</a>
          </div>
        </div>

        <div className="lp-hero-image">
          <div
            className="lp-photo-placeholder"
            style={{
              backgroundImage: `url(${heroImage})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          ></div>
          <div className="lp-badge lp-badge-top">INSPECTOR LABEL · AUG 2026</div>
          <div className="lp-badge lp-badge-left">✓ Ask Quantity</div>
          <div className="lp-badge lp-badge-right">✓ Manufacturer Details</div>
        </div>
      </div>

      {/* PROCESS */}
      <div className="lp-process">
        <div className="lp-eyebrow" style={{ justifyContent: "center" }}>STANDARD OPERATING PROCEDURE</div>
        <h2 className="serif">End-to-End Legal Metrology Enforcement Cycle</h2>
        <p className="lp-process-sub">
          Every sample logged creates a tamper-proof digital audit trail in accordance with Rule 32 of Legal Metrology Enforcement Framework.
        </p>
        <div className="lp-flow-caption">
          SCAN PRODUCT · EXTRACT DECLARATIONS · CHECK LEGAL RULES · DETECT VIOLATIONS · SAVE EVIDENCE · GENERATE REPORT
        </div>

        <div className="lp-steps">
          <div className="lp-step-card">
            <div className="lp-step-head">
              <div className="lp-step-icon"><IconScan /></div>
              <span className="lp-step-badge">STEP 01</span>
            </div>
            <h3>01 SCAN</h3>
            <p>Capture packaging images or live camera stream from inspector tablets for cartons, pouches, bottles, and tins.</p>
            <div className="lp-step-foot">Multi-angle capture</div>
          </div>

          <div className="lp-step-card">
            <div className="lp-step-head">
              <div className="lp-step-icon"><IconExtract /></div>
              <span className="lp-step-badge">STEP 02</span>
            </div>
            <h3>02 EXTRACT</h3>
            <p>Optical parsing of 8 mandatory declarations: MRP, Net Quantity, Packer details, Origin, Batch, and Consumer Care.</p>
            <div className="lp-step-foot">Indic OCR support</div>
          </div>

          <div className="lp-step-card">
            <div className="lp-step-head">
              <div className="lp-step-icon"><IconVerify /></div>
              <span className="lp-step-badge">STEP 03</span>
            </div>
            <h3>03 VERIFY</h3>
            <p>Validate against PCR 2011 &amp; legal text checklists, unit standards (g, kg, ml, l), and deception package proportions.</p>
            <div className="lp-step-foot">Mandatory rules check</div>
          </div>

          <div className="lp-step-card">
            <div className="lp-step-head">
              <div className="lp-step-icon"><IconReport /></div>
              <span className="lp-step-badge">STEP 04</span>
            </div>
            <h3>04 REPORT</h3>
            <p>Generate tamper-proof challan &amp; Form-1 notice with digital signatures, forwarding secure files to State Controllers.</p>
            <div className="lp-step-foot">Tamper-proof certificate</div>
          </div>
        </div>
      </div>

      {/* LEGISLATIVE FOUNDATION */}
      <div className="lp-legis">
        <div className="left">
          <div className="icon"><IconScale size={18} /></div>
          <div>
            <div className="lp-eyebrow-sm">LEGISLATIVE FOUNDATION</div>
            <h4 className="serif">The Legal Metrology Act, 2009 &amp; Packaged Commodities Rules, 2011</h4>
            <p>Act No. 1 of 2010 · Gazette Notification G.S.R. 202(E) · Ministry of Consumer Affairs</p>
          </div>
        </div>
        <button className="btn-primary">View Legal Framework <IconArrow /></button>
      </div>

      {/* STATS */}
      <div className="lp-stats">
        <div className="lp-stat">
          <div className="lp-stat-value">48,290</div>
          <div className="lp-stat-label">INSPECTIONS LOGGED</div>
        </div>
        <div className="lp-stat">
          <div className="lp-stat-value">94.2%</div>
          <div className="lp-stat-label">EVIDENCE INTEGRITY SCORE</div>
        </div>
        <div className="lp-stat">
          <div className="lp-stat-value">12,410</div>
          <div className="lp-stat-label">NOTICES GENERATED</div>
        </div>
        <div className="lp-stat">
          <div className="lp-stat-value">824</div>
          <div className="lp-stat-label">ACTIVE FIELD OFFICERS</div>
        </div>
      </div>

      {/* FOOTER */}
      <footer className="lp-footer">
        <div className="lp-footer-grid">
          <div>
            <h5>DEPARTMENT OF CONSUMER AFFAIRS</h5>
            <p>Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi</p>
            <p>Helpline: 1915 (Toll Free) · 08:00–20:00</p>
          </div>
          <div>
            <h5>STATUTORY RULES</h5>
            <p>Legal Metrology Act, 2009</p>
            <p>Packaged Commodities Rules, 2011</p>
            <p>General Rules, 2011 (Verification)</p>
            <p>National Standards of Weights &amp; Measures</p>
          </div>
          <div>
            <h5>ENFORCEMENT TOOLS</h5>
            <p>Barcode &amp; QR Verification Utility</p>
            <p>E-Commerce Marketplace Crawler</p>
            <p>State Controller Dashboard</p>
            <p>Compounding Challan Repository</p>
          </div>
          <div>
            <h5>TECHNICAL ARCHITECTURE</h5>
            <p>Engineered for high-assurance public audit and statutory enforcement. Hosted on National Informatics Center (NIC) Cloud Infrastructure.</p>
            <button className="btn-dark-sm">Read India Metrology (RIM) Whitepaper</button>
          </div>
        </div>
        <div className="lp-footer-bottom">
          <span>© 2026 Department of Consumer Affairs, Government of India. All Rights Reserved.</span>
          <div className="lp-footer-links">
            <span>Privacy Policy</span>
            <span>Terms of Enforcement Use</span>
            <span>NIC Security Audit Certificate</span>
            <span>Report a Listing</span>
          </div>
        </div>
      </footer>

      {/* LOGIN MODAL */}
      {showModal && (
        <div className="lp-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="lp-modal" onClick={(e) => e.stopPropagation()}>
            <div className="lp-modal-icon"><IconLock size={20} /></div>
            <h3 className="serif">Inspector Sign In</h3>
            <p className="lp-modal-sub">Enter your credentials to access the Inspection Desk.</p>
            <form onSubmit={handleSubmit}>
              <label>Officer ID</label>
              <input
                type="text"
                placeholder="e.g. LM / 02481"
                value={officerId}
                onChange={(e) => setOfficerId(e.target.value)}
                autoFocus
              />
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
                Sign In <IconArrow />
              </button>
            </form>
            <div className="lp-modal-close" onClick={() => setShowModal(false)}>Cancel</div>
          </div>
        </div>
      )}
    </div>
  );
}