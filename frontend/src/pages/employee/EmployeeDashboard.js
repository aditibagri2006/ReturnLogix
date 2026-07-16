import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import EmployeeNav from "../../components/EmployeeNav";
import KpiCard from "../../components/KpiCard";
import AnalyticsCharts from "../../components/AnalyticsCharts";
import { KpiSkeleton, ChartSkeleton } from "../../components/Skeleton";
import ErrorState from "../../components/ErrorState";
import { API_BASE } from "../../api";

function computeTrend(series, valueKey) {
  // Real month-over-month comparison from actual dispatch-date
  // aggregates - not a fabricated number. Only shown when we have at
  // least two months of data to compare.
  if (!series || series.length < 2) return null;
  const last = series[series.length - 1][valueKey];
  const prev = series[series.length - 2][valueKey];
  if (!prev) return null;
  const pct = Math.round(((last - prev) / prev) * 100);
  if (pct === 0) return { direction: "flat", label: "vs last month" };
  return {
    direction: pct > 0 ? "up" : "down",
    label: `${Math.abs(pct)}% vs last month`,
  };
}

function EmployeeDashboard() {
  const [metrics, setMetrics] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [needsReview, setNeedsReview] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const [metricsRes, analyticsRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE}/employee/dashboard-metrics`),
        fetch(`${API_BASE}/employee/analytics`),
        fetch(`${API_BASE}/employee/returns?status=Pending&limit=20&sort_by=id&sort_dir=desc`),
      ]);
      if (!metricsRes.ok || !analyticsRes.ok || !pendingRes.ok) throw new Error("Request failed");
      setMetrics(await metricsRes.json());
      setAnalytics(await analyticsRes.json());
      const pendingData = await pendingRes.json();
      setNeedsReview(pendingData.data || []);
    } catch (err) {
      console.error("Dashboard load failed:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const lowConfidence = needsReview.filter((r) => r.ai_confidence < 60);
  const highRisk = needsReview.filter((r) => r.is_high_risk);

  const printReport = () => {
    if (!metrics) return;
    const win = window.open("", "_blank");
    win.document.write(`
      <html>
        <head><title>Return Management — Summary Report</title>
        <style>
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; color: #1f2937; }
          .report-header {
            background: linear-gradient(135deg, #6d28d9, #9333ea);
            color: #fff; padding: 32px 40px;
          }
          .report-header h1 { margin: 0 0 6px; font-size: 22px; }
          .report-header p { margin: 0; opacity: .85; font-size: 13px; }
          .report-body { padding: 32px 40px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 14px; text-align: left; font-size: 14px; }
          th { text-transform: uppercase; letter-spacing: .04em; font-size: 11px; color: #6b7280; }
          tr:last-child td { border-bottom: none; }
          td:last-child { text-align: right; font-weight: 700; }
          .report-footer { padding: 20px 40px; color: #9ca3af; font-size: 11px; border-top: 1px solid #e5e7eb; }
        </style>
        </head>
        <body>
          <div class="report-header">
            <h1>📦 ReturnLogix — Summary Report</h1>
            <p>Generated ${new Date().toLocaleString()}</p>
          </div>
          <div class="report-body">
            <table>
              <tr><th>Metric</th><th>Value</th></tr>
              <tr><td>Total Returns</td><td>${metrics.total}</td></tr>
              <tr><td>Pending</td><td>${metrics.pending}</td></tr>
              <tr><td>Approved</td><td>${metrics.approved}</td></tr>
              <tr><td>Rejected</td><td>${metrics.rejected}</td></tr>
              <tr><td>AI Suggested (awaiting confirmation)</td><td>${metrics.ai_suggested}</td></tr>
              <tr><td>High Risk (heuristic)</td><td>${metrics.high_risk}</td></tr>
              <tr><td>Average Resolution Time</td><td>${metrics.avg_resolution_days} days</td></tr>
              <tr><td>Total Refund Amount</td><td>₹${Number(metrics.total_refund_amount).toLocaleString()}</td></tr>
            </table>
          </div>
          <div class="report-footer">ReturnLogix Return Management System — internal report, not for external distribution.</div>
        </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  if (error) {
    return (
      <>
        <EmployeeNav metrics={null} />
        <div className="page-wrapper">
          <ErrorState message="We couldn't load the dashboard. Please check your connection and try again." onRetry={load} />
        </div>
      </>
    );
  }

  if (loading || !metrics) {
    return (
      <>
        <EmployeeNav metrics={null} />
        <div className="page-wrapper">
          <div className="dashboard-header">
            <h1>Employee Dashboard</h1>
            <p>Live overview of all return activity</p>
          </div>
          <KpiSkeleton />
          <div className="section-header"><h2>🤖 AI Insights</h2></div>
          <div className="ai-insights-grid">
            <div className="ai-insight-card skeleton-bone" style={{ height: "84px" }} />
            <div className="ai-insight-card skeleton-bone" style={{ height: "84px" }} />
            <div className="ai-insight-card skeleton-bone" style={{ height: "84px" }} />
          </div>
          <div className="section-header"><h2>📊 Analytics</h2></div>
          <ChartSkeleton />
        </div>
      </>
    );
  }

  return (
    <>
      <EmployeeNav metrics={metrics} />
      <div className="page-wrapper">
        <div className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
          <div>
            <h1>Employee Dashboard</h1>
            <p>Live overview of all return activity</p>
          </div>
          <button className="btn-secondary" onClick={printReport}>📄 Download Report</button>
        </div>

        <div className="kpi-grid">
          <KpiCard icon="📦" label="Total Returns" value={metrics.total} colorClass="kpi-purple"
            trend={computeTrend(analytics?.monthly_returns, "count")} />
          <KpiCard icon="⏳" label="Pending" value={metrics.pending} colorClass="kpi-yellow" />
          <KpiCard icon="✅" label="Approved" value={metrics.approved} colorClass="kpi-green" />
          <KpiCard icon="❌" label="Rejected" value={metrics.rejected} colorClass="kpi-red" />
          <KpiCard icon="🤖" label="AI Suggested Returns" value={metrics.ai_suggested} colorClass="kpi-indigo"
            sublabel="Awaiting employee confirmation" />
          <KpiCard icon="⚠️" label="High Risk Returns" value={metrics.high_risk} colorClass="kpi-orange"
            sublabel="Low rating or large refund" />
          <KpiCard icon="⏱️" label="Avg Resolution Time" value={`${metrics.avg_resolution_days}d`} colorClass="kpi-teal" />
          <KpiCard icon="💰" label="Total Refund Amount" value={`₹${Number(metrics.total_refund_amount).toLocaleString()}`}
            colorClass="kpi-blue" trend={computeTrend(analytics?.refund_trend, "amount")} />
        </div>

        <div className="section-header">
          <h2>🤖 AI Insights</h2>
          <Link to="/employee/returns?status=Pending" className="btn-secondary">Review All Pending →</Link>
        </div>

        <div className="ai-insights-grid">
          <div className="ai-insight-card">
            <div className="ai-insight-title">Needs Manual Review</div>
            <div className="ai-insight-value">{needsReview.length}</div>
            <p>Returns currently in "Pending" status</p>
          </div>
          <div className="ai-insight-card">
            <div className="ai-insight-title">Low Confidence Predictions</div>
            <div className="ai-insight-value">{lowConfidence.length}</div>
            <p>AI confidence under 60% among pending returns</p>
          </div>
          <div className="ai-insight-card">
            <div className="ai-insight-title">High Risk (Pending)</div>
            <div className="ai-insight-value">{highRisk.length}</div>
            <p>Low customer rating or refund over ₹30,000</p>
          </div>
        </div>

        <div className="section-header">
          <h2>📊 Analytics</h2>
        </div>
        <AnalyticsCharts data={analytics} />
      </div>
    </>
  );
}

export default EmployeeDashboard;
