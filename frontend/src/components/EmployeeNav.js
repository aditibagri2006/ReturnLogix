import { useState, useRef, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useEmployeeAuth } from "../context/EmployeeAuthContext";
import NotificationBell from "./NotificationBell";

function ProfileMenu({ employee, logout }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="profile-menu-wrapper" ref={ref}>
      <button className="profile-menu-trigger" onClick={() => setOpen((o) => !o)}>
        <span className="profile-avatar">{(employee?.uname || "E")[0].toUpperCase()}</span>
        <span className="profile-name">{employee?.uname}</span>
        <span className="profile-caret">▾</span>
      </button>

      {open && (
        <div className="profile-dropdown">
          <div className="profile-dropdown-name">{employee?.uname}</div>
          <div className="profile-dropdown-role">Employee · Returns Team</div>
          <div className="profile-dropdown-divider" />
          <button className="profile-dropdown-logout" onClick={logout}>
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

function EmployeeNav({ metrics }) {
  const { employee, logout } = useEmployeeAuth();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <Link to="/employee/dashboard" className="brand">
        📦 ReturnLogix <span style={{ color: "var(--gray-400)", fontWeight: 500 }}>· Employee</span>
      </Link>

      <Link to="/employee/dashboard" className={isActive("/employee/dashboard") ? "active" : ""}>
        Dashboard
      </Link>
      <Link to="/employee/returns" className={isActive("/employee/returns") ? "active" : ""}>
        Returns
      </Link>

      {metrics && <NotificationBell metrics={metrics} />}
      <ProfileMenu employee={employee} logout={logout} />
    </nav>
  );
}

export default EmployeeNav;
