import { Link } from "react-router-dom";

function PortalSelect() {
  return (
    <div className="portal-select-page">
      <div className="portal-select-header">
        <div className="portal-select-brand">📦 ReturnLogix</div>
        <p>Reverse Logistics Return Management System</p>
      </div>

      <div className="portal-select-cards">
        <Link to="/customer/login" className="portal-card">
          <div className="portal-card-icon">🧑‍💻</div>
          <h2>Customer Portal</h2>
          <p>Submit return requests and track their status</p>
          <span className="portal-card-cta">Continue as Customer →</span>
        </Link>

        <Link to="/employee/login" className="portal-card">
          <div className="portal-card-icon">🏢</div>
          <h2>Employee Portal</h2>
          <p>Review, approve and manage all return requests</p>
          <span className="portal-card-cta">Continue as Employee →</span>
        </Link>
      </div>
    </div>
  );
}

export default PortalSelect;
