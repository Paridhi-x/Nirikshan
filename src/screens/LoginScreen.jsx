import { useState } from "react";
import "./LoginScreen.css";
import {
  ShieldIcon,
  UserIcon,
  LockIcon,
  EyeIcon,
  EyeOffIcon,
  FingerprintIcon,
  ShieldCheckIcon,
  ScaleIcon,
  DocumentIcon,
  LeafIcon,
  ArrowRightIcon,
} from "../icons";

function LoginScreen({ onLogin }) {
  const [showPassword, setShowPassword] = useState(false);
  const [officerId, setOfficerId] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onLogin) onLogin(officerId.trim() || "Unnamed Officer");
  };

  return (
    <div className="gov-page">

      {/* ───────────── Top header ───────────── */}
      <header className="gov-header">

        <div className="gov-header-left">
          <div className="emblem-badge">
            <ShieldIcon className="emblem-icon" />
          </div>

          <div className="gov-header-divider" />

          <div className="ministry-copy">
            <span className="ministry-line1">Department of</span>
            <strong className="ministry-line2">Consumer Affairs</strong>
            <span className="ministry-line3">
              Ministry of Consumer Affairs, Food &amp; Public Distribution
            </span>
            <span className="ministry-line3">Government of India</span>
          </div>
        </div>

        <div className="gov-header-center">
          <div className="brand-mark-badge">
            <ScaleIcon className="brand-mark-icon" />
          </div>

          <div>
            <div className="brand-title">NIRIKSHAN</div>
            <div className="brand-subtitle">Legal Metrology Compliance System</div>
          </div>
        </div>

        <div className="gov-header-right">
          <UserIcon className="portal-icon" />
          <span>Inspector Portal</span>
        </div>

      </header>


      {/* ───────────── Hero with photo background ───────────── */}
      <main className="gov-hero">

        <div className="hero-photo" />
        <div className="hero-photo-overlay" />

        <div className="hero-text">

          <h1>
            Accurate
            <br />
            Measurements.
            <br />
            Fair Trade.
          </h1>

          <div className="hero-accent-line" />

          <p className="hero-description">
            Supporting transparent markets and protecting consumer rights.
          </p>

        </div>


        <div className="signin-card">

          <div className="signin-card-eyebrow">
            <ShieldIcon className="signin-eyebrow-icon" />
            Secure Access
          </div>

          <h2>Inspector Portal</h2>
          <p className="signin-subtext">Sign in to continue</p>

          <form onSubmit={handleSubmit}>

            <div className="gov-field">
              <div className="gov-input-wrapper">
                <UserIcon className="input-icon" />
                <input
                  type="text"
                  placeholder="Officer ID"
                  value={officerId}
                  onChange={(e) => setOfficerId(e.target.value)}
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div className="gov-field">
              <div className="gov-input-wrapper">
                <LockIcon className="input-icon" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />

                <button
                  type="button"
                  className="eye-toggle"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </div>
            </div>

            <div className="gov-form-options">
              <label className="gov-remember">
                <input type="checkbox" />
                <span>Remember this device</span>
              </label>

              <button type="button" className="gov-forgot">
                Forgot Password?
              </button>
            </div>

            <button type="submit" className="gov-signin-button">
              <ArrowRightIcon className="signin-arrow" />
              <span>Sign In</span>
            </button>

            <div className="gov-or-divider">
              <span>OR</span>
            </div>

            <button type="button" className="gov-biometric-button">
              <FingerprintIcon />
              <span>Sign in with Biometric</span>
            </button>

          </form>

        </div>

      </main>


      {/* ───────────── Quick features strip ───────────── */}
      <section className="quick-strip">

        <div className="quick-strip-item">
          <div className="quick-icon-circle">
            <ShieldCheckIcon />
          </div>
          <div>
            <strong>Verify Compliance</strong>
            <span>Ensure accuracy &amp; transparency</span>
          </div>
        </div>

        <div className="quick-strip-item">
          <div className="quick-icon-circle">
            <ScaleIcon />
          </div>
          <div>
            <strong>Protect Consumers</strong>
            <span>Build trust in the market</span>
          </div>
        </div>

        <div className="quick-strip-item">
          <div className="quick-icon-circle">
            <DocumentIcon />
          </div>
          <div>
            <strong>Track Reports</strong>
            <span>Better monitoring &amp; governance</span>
          </div>
        </div>

        <div className="quick-strip-item">
          <div className="quick-icon-circle">
            <LeafIcon />
          </div>
          <div>
            <strong>A Fairer Tomorrow</strong>
            <span>Through honest measurements</span>
          </div>
        </div>

      </section>


      {/* ───────────── Footer ───────────── */}
      <footer className="gov-footer">

        <div className="gov-footer-left">
          <span>Legal Metrology Act, 2009</span>
          <span className="footer-divider">|</span>
          <span>Legal Metrology (Packaged Commodities) Rules, 2011</span>
        </div>

        <div className="gov-footer-right">
          Measure &bull; Verify &bull; Protect
        </div>

      </footer>

    </div>
  );
}

export default LoginScreen;