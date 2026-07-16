import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import { API_BASE } from "../api";

// This page now serves the Employee Portal only. The Customer Portal
// has its own login/signup at pages/customer/CustomerAuth.js since
// Phase 1. Note: there is no `role` column yet (Phase 6 candidate), so
// any account created via the Customer Portal's signup form can also
// sign in here for now - see the Phase 2 summary for details.
function Login() {
  const navigate = useNavigate();
  const { login } = useEmployeeAuth();

  const [uemail, setUemail] = useState("");
  const [upassword, setUpassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!uemail.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(uemail)) return "Enter a valid email address";
    if (!upassword) return "Password is required";
    return "";
  };

  const signin = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setMessage(error);
      setMessageType("error");
      return;
    }

    setLoading(true);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/user/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uemail, upassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Invalid email or password");
        setMessageType("error");
        return;
      }

      // Kept for backward compatibility with the original, still-reachable
      // /return-form and /returns-table pages.
      localStorage.setItem("isLoggedIn", "true");

      login({ uid: data.uid, uname: data.uname, uemail: data.uemail }, remember);
      navigate("/employee/dashboard");
    } catch (err) {
      setMessage("Could not reach the server. Is the backend running?");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-content">
          <div className="login-brand">📦 ReturnLogix</div>
          <p className="login-tagline">Employee Portal — manage and review return requests</p>

          <div className="login-features">
            <div className="login-feature-item">
              <span className="feature-icon">📊</span>
              Real-time dashboard &amp; analytics
            </div>
            <div className="login-feature-item">
              <span className="feature-icon">🤖</span>
              AI-assisted approval workflow
            </div>
            <div className="login-feature-item">
              <span className="feature-icon">⚡</span>
              Fast search, filters &amp; bulk actions
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2>Employee Sign In</h2>
            <p>Sign in with your company account to continue</p>
          </div>

          {message && (
            <div
              className={`badge ${messageType === "success" ? "badge-approved" : "badge-rejected"}`}
              style={{ marginBottom: "1.25rem", width: "100%" }}
            >
              {message}
            </div>
          )}

          <form onSubmit={signin}>
            <div className="form-group">
              <label className="form-label">Work Email</label>
              <input
                className="form-input"
                type="email"
                placeholder="you@company.com"
                value={uemail}
                onChange={(e) => setUemail(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="Enter your password"
                value={upassword}
                onChange={(e) => setUpassword(e.target.value)}
              />
            </div>

            <div className="form-row-between">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                />
                Remember me on this device
              </label>
            </div>

            <button className="btn-primary" type="submit" disabled={loading}>
              {loading ? (
                <span className="btn-loading">
                  <span className="spinner" /> Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="login-footer-text">
            <Link to="/">← Back to portal selection</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
