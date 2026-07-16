import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function CustomerNav() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/customer/dashboard" className="brand">
        📦 ReturnLogix <span style={{ color: "var(--gray-400)", fontWeight: 500 }}>· Customer</span>
      </Link>

      <Link to="/customer/dashboard" className={isActive("/customer/dashboard") ? "active" : ""}>
        Dashboard
      </Link>
      <Link to="/customer/submit-return" className={isActive("/customer/submit-return") ? "active" : ""}>
        Submit Return
      </Link>
      <Link to="/customer/my-returns" className={isActive("/customer/my-returns") ? "active" : ""}>
        My Returns
      </Link>

      <span style={{ marginLeft: "1.25rem", color: "var(--gray-500)", fontSize: ".875rem" }}>
        {user?.uname}
      </span>
      <button className="btn-logout" onClick={logout} style={{ marginLeft: ".75rem" }}>
        Logout
      </button>
    </nav>
  );
}

export default CustomerNav;
