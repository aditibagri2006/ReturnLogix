import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { API_BASE } from "../../api";

function CustomerAuth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [tab, setTab] = useState(
    location.pathname === "/customer/signup" ? "signup" : "login"
  );

  const [uname, setUname] = useState("");
  const [uemail, setUemail] = useState("");
  const [upassword, setUpassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);

  const resetMessage = () => {
    setMessage("");
    setMessageType("");
  };

  const switchTab = (next) => {
    setTab(next);
    resetMessage();
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    resetMessage();
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/user/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uname, uemail, upassword }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Signup failed");
        setMessageType("error");
        return;
      }

      setMessage("Account created successfully. Please sign in.");
      setMessageType("success");
      setUpassword("");
      setTab("login");
    } catch (err) {
      setMessage("Could not reach the server. Is the backend running?");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleSignin = async (e) => {
    e.preventDefault();
    resetMessage();
    setLoading(true);
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

      login({ uid: data.uid, uname: data.uname, uemail: data.uemail });
      navigate("/customer/dashboard");
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
          <p className="login-tagline">
            Customer Portal — track and manage your product returns
          </p>

          <div className="login-features">
            <div className="login-feature-item">
              <span className="feature-icon">🚀</span>
              Submit a return in under 2 minutes
            </div>
            <div className="login-feature-item">
              <span className="feature-icon">🤖</span>
              Instant AI-powered status prediction
            </div>
            <div className="login-feature-item">
              <span className="feature-icon">📍</span>
              Track every return in one place
            </div>
          </div>
        </div>
      </div>

      <div className="login-right">
        <div className="login-card">
          <div className="login-card-header">
            <h2>{tab === "login" ? "Welcome back" : "Create your account"}</h2>
            <p>
              {tab === "login"
                ? "Sign in to submit and track your returns"
                : "Sign up to start submitting return requests"}
            </p>
          </div>

          <div className="auth-tabs">
            <button
              type="button"
              className={`auth-tab ${tab === "login" ? "active" : ""}`}
              onClick={() => switchTab("login")}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab ${tab === "signup" ? "active" : ""}`}
              onClick={() => switchTab("signup")}
            >
              Sign Up
            </button>
          </div>

          {message && (
            <div
              className={`badge ${messageType === "success" ? "badge-approved" : "badge-rejected"}`}
              style={{ marginBottom: "1.25rem", width: "100%" }}
            >
              {message}
            </div>
          )}

          {tab === "signup" ? (
            <form onSubmit={handleSignup}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Your full name"
                  value={uname}
                  onChange={(e) => setUname(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={uemail}
                  onChange={(e) => setUemail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Min 8 chars, upper, lower & special char"
                  value={upassword}
                  onChange={(e) => setUpassword(e.target.value)}
                  required
                />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Creating account..." : "Create Account"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignin}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@example.com"
                  value={uemail}
                  onChange={(e) => setUemail(e.target.value)}
                  required
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
                  required
                />
              </div>
              <button className="btn-primary" type="submit" disabled={loading}>
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </form>
          )}

          <p className="login-footer-text">
            {tab === "login" ? (
              <>
                New here?{" "}
                <Link to="#" onClick={(e) => { e.preventDefault(); switchTab("signup"); }}>
                  Create an account
                </Link>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <Link to="#" onClick={(e) => { e.preventDefault(); switchTab("login"); }}>
                  Sign in
                </Link>
              </>
            )}
          </p>
          <p className="login-footer-text">
            <Link to="/">← Back to portal selection</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default CustomerAuth;
