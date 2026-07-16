import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CustomerNav from "../../components/CustomerNav";
import { useAuth } from "../../context/AuthContext";
import { TableSkeleton } from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import { API_BASE } from "../../api";

function MyReturns() {
  const { user } = useAuth();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(
        `${API_BASE}/customer/returns/${encodeURIComponent(user.uemail)}`
      );
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      setReturns(data.data || []);
    } catch (err) {
      console.error("Could not load returns:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [user.uemail]);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  const clearFilters = () => { setSearch(""); setStatusFilter("All"); };

  const filtered = returns.filter((r) => {
    const matchesSearch =
      (r.product_name || "").toLowerCase().includes(search.toLowerCase()) ||
      String(r.return_request_id).includes(search);
    const matchesStatus = statusFilter === "All" || r.return_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <CustomerNav />
      <div className="page-wrapper">
        <div className="dashboard-header">
          <h1>My Returns</h1>
          <p>Track the status of every return you've submitted</p>
        </div>

        <div className="toolbar">
          <div className="rl-search-wrapper">
            <span className="rl-search-icon">🔍</span>
            <input
              className="rl-search-input"
              placeholder="Search by product or return ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="rl-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>

        <div className="table-card">
          {error ? (
            <ErrorState message="We couldn't load your returns. Please check your connection and try again." onRetry={fetchReturns} />
          ) : loading ? (
            <TableSkeleton rows={4} columns={7} />
          ) : filtered.length === 0 && returns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No returns yet</h3>
              <p>Submit your first return request to see it here.</p>
              <Link to="/customer/submit-return" className="btn-submit" style={{ textDecoration: "none", display: "inline-block" }}>
                + Submit New Return
              </Link>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🔍</div>
              <h3>No returns found</h3>
              <p>Try adjusting your search or filters.</p>
              <button className="btn-secondary" onClick={clearFilters}>Clear Filters</button>
            </div>
          ) : (
            <table className="returns-table">
              <thead>
                <tr>
                  <th>Return ID</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Return Type</th>
                  <th>Reason</th>
                  <th>AI / Current Status</th>
                  <th>Review Stage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <tr key={r.return_request_id}>
                    <td>#{r.return_request_id}</td>
                    <td>{r.product_name}</td>
                    <td>{r.product_category}</td>
                    <td>{r.return_type}</td>
                    <td>{r.return_reason}</td>
                    <td>
                      <span className={`badge badge-${(r.return_status || "").toLowerCase()}`}>
                        {r.return_status}
                      </span>
                    </td>
                    <td>{r.review_status || "—"}</td>
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

export default MyReturns;
