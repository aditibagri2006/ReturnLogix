import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import EmployeeNav from "../../components/EmployeeNav";
import ReturnDetailsModal from "../../components/ReturnDetailsModal";
import { ConfidenceBadge } from "../../components/AIInsights";
import { TableSkeleton } from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import { useToast } from "../../context/ToastContext";
import { API_BASE } from "../../api";

const CATEGORIES = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports"];
const CARRIERS = ["Delhivery", "BlueDart", "Ecom Express"];
const AI_STATUSES = ["Approved", "Pending", "Rejected"];

function SortableTh({ label, sortKey, sortBy, sortDir, onSort }) {
  const active = sortBy === sortKey;
  return (
    <th className="sortable-th" onClick={() => onSort(sortKey)}>
      {label} {active && (sortDir === "asc" ? "▲" : "▼")}
    </th>
  );
}

function EmployeeReturns() {
  const [searchParams] = useSearchParams();
  const { showToast } = useToast();

  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [status, setStatus] = useState(searchParams.get("status") || "All");
  const [category, setCategory] = useState("All");
  const [carrier, setCarrier] = useState("All");
  const [aiPrediction, setAiPrediction] = useState("All");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("id");
  const [sortDir, setSortDir] = useState("desc");

  const [metrics, setMetrics] = useState(null);
  const [activeModalId, setActiveModalId] = useState(null);

  // Debounce the search box: wait for a short pause in typing before
  // hitting the API, instead of firing a request on every keystroke.
  useEffect(() => {
    const t = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/employee/dashboard-metrics`);
      setMetrics(await response.json());
    } catch (err) {
      console.error("Metrics fetch failed:", err);
    }
  }, []);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const params = new URLSearchParams({
        page, limit: 10, search: debouncedSearch, status, category, carrier,
        ai_prediction: aiPrediction, date_from: dateFrom, date_to: dateTo,
        sort_by: sortBy, sort_dir: sortDir,
      });
      const response = await fetch(`${API_BASE}/employee/returns?${params}`);
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      setRows(data.data || []);
      setTotal(data.total || 0);
      setTotalPages(data.total_pages || 1);
    } catch (err) {
      console.error("Could not load returns:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, status, category, carrier, aiPrediction, dateFrom, dateTo, sortBy, sortDir]);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);
  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  const handleSort = (key) => {
    if (sortBy === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  const quickDecision = async (id, newStatus) => {
    const confirmed = window.confirm(`Mark return #${id} as "${newStatus}"?`);
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_BASE}/employee/returns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          return_status: newStatus,
          review_status: newStatus === "Pending" ? "Under Review" : newStatus,
        }),
      });
      if (!response.ok) throw new Error("Update failed");
      showToast(`Return #${id} marked as ${newStatus}.`, "success");
      fetchReturns();
      fetchMetrics();
    } catch (err) {
      showToast("Could not update that return. Please try again.", "error");
    }
  };

  const exportCSV = () => window.open(`${API_BASE}/export-csv`, "_blank");
  const exportExcel = () => window.open(`${API_BASE}/export-excel`, "_blank");
  const printTable = () => window.print();

  const resetFilters = () => {
    setSearch(""); setDebouncedSearch(""); setStatus("All"); setCategory("All"); setCarrier("All");
    setAiPrediction("All"); setDateFrom(""); setDateTo(""); setPage(1);
  };

  return (
    <>
      <EmployeeNav metrics={metrics} />
      <div className="page-wrapper print-area">
        <div className="dashboard-header no-print">
          <h1>Returns Management</h1>
          <p>{total} return{total !== 1 ? "s" : ""} found</p>
        </div>

        <div className="toolbar no-print">
          <div className="rl-search-wrapper">
            <span className="rl-search-icon">🔍</span>
            <input
              className="rl-search-input"
              placeholder="Search by customer, product, or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select className="rl-filter-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          <select className="rl-filter-select" value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="All">All Categories</option>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select className="rl-filter-select" value={carrier} onChange={(e) => { setCarrier(e.target.value); setPage(1); }}>
            <option value="All">All Carriers</option>
            {CARRIERS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>

          <select className="rl-filter-select" value={aiPrediction} onChange={(e) => { setAiPrediction(e.target.value); setPage(1); }}>
            <option value="All">All AI Predictions</option>
            {AI_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>

          <input
            className="form-input-date" type="date" value={dateFrom}
            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
            style={{ width: "auto" }}
          />
          <span style={{ color: "var(--gray-400)" }}>to</span>
          <input
            className="form-input-date" type="date" value={dateTo}
            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
            style={{ width: "auto" }}
          />

          <button className="btn-secondary" onClick={resetFilters}>Reset</button>
        </div>

        <div className="toolbar no-print" style={{ justifyContent: "flex-end" }}>
          <button className="btn-secondary" onClick={exportCSV}>⬇ Export CSV</button>
          <button className="btn-secondary" onClick={exportExcel}>⬇ Export Excel</button>
          <button className="btn-secondary" onClick={printTable}>🖨 Print</button>
        </div>

        <div className="table-card">
          {error ? (
            <ErrorState message="We couldn't load returns. Please check your connection and try again." onRetry={fetchReturns} />
          ) : loading ? (
            <TableSkeleton rows={8} columns={10} />
          ) : rows.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📭</div>
              <h3>No returns match your filters</h3>
              <p>Try adjusting your search, filters, or date range.</p>
              <button className="btn-secondary" onClick={resetFilters}>Reset Filters</button>
            </div>
          ) : (
            <div className="table-scroll-wrapper">
              <table className="returns-table sticky-header">
                <thead>
                  <tr>
                    <SortableTh label="Return ID" sortKey="id" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <SortableTh label="Customer" sortKey="customer" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <th>Product</th>
                    <th>Category</th>
                    <th>AI Prediction</th>
                    <th>Confidence</th>
                    <th>Current Status</th>
                    <th>Employee Decision</th>
                    <SortableTh label="Dispatch Date" sortKey="dispatch_date" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
                    <th className="no-print sticky-col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.return_request_id} className={r.is_high_risk ? "row-high-risk" : ""}>
                      <td>#{r.return_request_id}</td>
                      <td>{r.customer_name}</td>
                      <td>{r.product_name}</td>
                      <td>{r.product_category}</td>
                      <td>
                        <span className={`badge badge-${(r.ai_prediction || "").toLowerCase()}`}>
                          {r.ai_prediction}
                        </span>
                      </td>
                      <td>
                        <div className="mini-confidence-track">
                          <div
                            className="mini-confidence-fill"
                            style={{
                              width: `${Math.min(r.ai_confidence, 100)}%`,
                              background: r.ai_confidence < 60 ? "var(--yellow-500)" : "var(--purple-500)",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: ".75rem", color: "var(--gray-500)" }}>{r.ai_confidence}%</span>
                        <ConfidenceBadge confidence={r.ai_confidence} />
                      </td>
                      <td>
                        <span className={`badge badge-${(r.return_status || "").toLowerCase()}`}>
                          {r.return_status}
                        </span>
                      </td>
                      <td>{r.review_status || "—"}</td>
                      <td>{r.dispatch_date}</td>
                      <td className="no-print sticky-col">
                        <div className="row-actions">
                          <button className="btn-icon" title="View Details" aria-label={`View details for return ${r.return_request_id}`} onClick={() => setActiveModalId(r.return_request_id)}>👁</button>
                          <button className="btn-icon" title="Approve" aria-label={`Approve return ${r.return_request_id}`} onClick={() => quickDecision(r.return_request_id, "Approved")}>✅</button>
                          <button className="btn-icon danger" title="Reject" aria-label={`Reject return ${r.return_request_id}`} onClick={() => quickDecision(r.return_request_id, "Rejected")}>❌</button>
                          <button className="btn-icon" title="Keep Pending" aria-label={`Keep return ${r.return_request_id} pending`} onClick={() => quickDecision(r.return_request_id, "Pending")}>⏳</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rl-pagination no-print">
          <button className="rl-pagination-btn" onClick={() => setPage((p) => p - 1)} disabled={page <= 1}>← Previous</button>
          <span className="rl-page-info">Page {page} of {totalPages}</span>
          <button className="rl-pagination-btn" onClick={() => setPage((p) => p + 1)} disabled={page >= totalPages}>Next →</button>
        </div>
      </div>

      {activeModalId && (
        <ReturnDetailsModal
          returnId={activeModalId}
          onClose={() => setActiveModalId(null)}
          onUpdated={() => { fetchReturns(); fetchMetrics(); }}
        />
      )}
    </>
  );
}

export default EmployeeReturns;
