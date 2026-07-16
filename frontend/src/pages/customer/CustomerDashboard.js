import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CustomerNav from "../../components/CustomerNav";
import { useAuth } from "../../context/AuthContext";
import { SkeletonBlock, TableSkeleton } from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import { API_BASE } from "../../api";

function CustomerDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(
        `${API_BASE}/customer/returns/${encodeURIComponent(user.uemail)}`
      );
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      const rows = data.data || [];

      setStats({
        total: rows.length,
        pending: rows.filter((r) => r.return_status === "Pending").length,
        approved: rows.filter((r) => r.return_status === "Approved").length,
        rejected: rows.filter((r) => r.return_status === "Rejected").length,
      });
      setRecent(rows.slice(0, 5));
    } catch (err) {
      console.error("Dashboard fetch failed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user.uemail]);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  if (error) {
    return (
      <>
        <CustomerNav />
        <div className="page-wrapper">
          <ErrorState message="We couldn't load your dashboard. Please check your connection and try again." onRetry={fetchReturns} />
        </div>
      </>
    );
  }

  return (
    <>
      <CustomerNav />
      <div className="page-wrapper">
        <div className="dashboard-header">
          <h1>Welcome back, {user.uname?.split(" ")[0] || "there"} 👋</h1>
          <p>Here's an overview of your return activity</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card total">
            <div className="stat-card-top">
              <span className="stat-label">Total Returns</span>
              <span className="stat-icon">📦</span>
            </div>
            {loading ? <SkeletonBlock width="50%" height="1.8rem" /> : <div className="stat-value">{stats.total}</div>}
          </div>

          <div className="stat-card pending">
            <div className="stat-card-top">
              <span className="stat-label">Pending</span>
              <span className="stat-icon">⏳</span>
            </div>
            {loading ? <SkeletonBlock width="50%" height="1.8rem" /> : <div className="stat-value">{stats.pending}</div>}
          </div>

          <div className="stat-card approved">
            <div className="stat-card-top">
              <span className="stat-label">Approved</span>
              <span className="stat-icon">✅</span>
            </div>
            {loading ? <SkeletonBlock width="50%" height="1.8rem" /> : <div className="stat-value">{stats.approved}</div>}
          </div>

          <div className="stat-card rejected">
            <div className="stat-card-top">
              <span className="stat-label">Rejected</span>
              <span className="stat-icon">❌</span>
            </div>
            {loading ? <SkeletonBlock width="50%" height="1.8rem" /> : <div className="stat-value">{stats.rejected}</div>}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            gap: "1rem",
            marginBottom: "1.5rem",
          }}
        >
          <Link
            to="/customer/submit-return"
            className="btn-submit"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            + Submit New Return
          </Link>
          <Link
            to="/customer/my-returns"
            className="btn-secondary"
            style={{ textDecoration: "none", display: "inline-block" }}
          >
            View All Returns
          </Link>
        </div>

        <div className="table-card">
          <div style={{ padding: "1.25rem 1.25rem 0" }}>
            <h3 style={{ fontSize: "1rem", color: "var(--gray-900)" }}>Recent Returns</h3>
          </div>

          {loading ? (
            <TableSkeleton rows={3} columns={4} />
          ) : recent.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No returns yet</h3>
              <p>Submit your first return request to see it here.</p>
              <Link to="/customer/submit-return" className="btn-submit" style={{ textDecoration: "none", display: "inline-block" }}>
                + Submit New Return
              </Link>
            </div>
          ) : (
            <table className="returns-table">
              <thead>
                <tr>
                  <th>Return ID</th>
                  <th>Product</th>
                  <th>Reason</th>
                  <th>AI Status</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((r) => (
                  <tr key={r.return_request_id}>
                    <td>#{r.return_request_id}</td>
                    <td>{r.product_name}</td>
                    <td>{r.return_reason}</td>
                    <td>
                      <span className={`badge badge-${(r.return_status || "").toLowerCase()}`}>
                        {r.return_status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}

export default CustomerDashboard;
