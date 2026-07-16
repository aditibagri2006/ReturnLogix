import { useEffect, useState } from "react";
import { API_BASE } from "../api";
import { AIRecommendationCard } from "./AIInsights";
import { SkeletonBlock } from "./Skeleton";
import ErrorState from "./ErrorState";
import { useToast } from "../context/ToastContext";

const REVIEW_STATUSES = ["Under Review", "Escalated", "Approved", "Rejected"];

function StatusStepper({ detail }) {
  const isFinal = detail.return_status === "Approved" || detail.return_status === "Rejected";
  const isEscalated = detail.review_status === "Escalated";

  const steps = [
    { label: "Submitted", detail: detail.dispatch_date || "—" },
    { label: "AI Predicted", detail: detail.ai_prediction || "—" },
    { label: isEscalated ? "Escalated" : "Under Review", detail: detail.reviewed_by ? `Reviewer: ${detail.reviewed_by}` : "Awaiting reviewer" },
    { label: detail.return_status === "Rejected" ? "Rejected" : "Approved", detail: isFinal ? detail.return_status : "Not yet reached" },
  ];

  const activeIndex = isFinal ? 3 : 2;
  const finalTone = detail.return_status === "Rejected" ? "rejected" : "approved";

  return (
    <div className="status-stepper">
      {steps.map((step, i) => {
        const reached = i <= activeIndex;
        const isLast = i === 3;
        return (
          <div key={step.label} className={`stepper-step ${reached ? "reached" : ""} ${isLast && isFinal ? `final-${finalTone}` : ""}`}>
            <div className="stepper-dot-wrap">
              <span className="stepper-dot">{reached ? "✓" : i + 1}</span>
              {i < steps.length - 1 && <span className={`stepper-line ${i < activeIndex ? "reached" : ""}`} />}
            </div>
            <div className="stepper-label">{step.label}</div>
            <div className="stepper-detail">{step.detail}</div>
          </div>
        );
      })}
    </div>
  );
}

function DetailCard({ title, children, className }) {
  return (
    <div className={`detail-card ${className || ""}`}>
      <div className="detail-card-title">{title}</div>
      {children}
    </div>
  );
}

function ReturnDetailsModal({ returnId, onClose, onUpdated }) {
  const { showToast } = useToast();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [reviewStatus, setReviewStatus] = useState("");
  const [reviewedBy, setReviewedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [showInternal, setShowInternal] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await fetch(`${API_BASE}/employee/returns/${returnId}`);
      if (!response.ok) throw new Error("Request failed");
      const data = await response.json();
      setDetail(data);
      setReviewStatus(data.review_status || "Under Review");
      setReviewedBy(data.reviewed_by || "");
    } catch (err) {
      console.error("Could not load return details:", err);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [returnId]);

  // Close on Escape for keyboard users
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const applyDecision = async (return_status, review_status_override) => {
    const label = return_status || review_status_override;
    const confirmed = window.confirm(`Mark return #${returnId} as "${label}"?`);
    if (!confirmed) return;

    setSaving(true);
    try {
      const body = review_status_override
        ? { review_status: review_status_override }
        : {
            return_status,
            review_status: return_status === "Pending" ? "Under Review" : return_status,
          };

      const response = await fetch(`${API_BASE}/employee/returns/${returnId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error("Update failed");

      showToast(`Return #${returnId} updated: ${label}.`, "success");
      onUpdated?.();
      setDetail((d) => ({ ...d, ...body }));
      setReviewStatus(body.review_status || reviewStatus);
    } catch (err) {
      showToast("Could not update the return. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveReviewFields = async () => {
    setSaving(true);
    try {
      const response = await fetch(`${API_BASE}/employee/returns/${returnId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ review_status: reviewStatus, reviewed_by: reviewedBy }),
      });
      if (!response.ok) throw new Error("Update failed");
      showToast("Review details saved.", "success");
      onUpdated?.();
      setDetail((d) => ({ ...d, review_status: reviewStatus, reviewed_by: reviewedBy }));
    } catch (err) {
      showToast("Could not save review details. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Loading return details">
          <div className="modal-header">
            <SkeletonBlock width="180px" height="1.2rem" />
            <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
          <div className="modal-body">
            <SkeletonBlock width="100%" height="70px" radius="var(--radius-md)" style={{ marginBottom: "1.5rem" }} />
            <div className="modal-grid">
              <div className="modal-col">
                <SkeletonBlock width="100%" height="140px" radius="var(--radius-md)" />
                <SkeletonBlock width="100%" height="160px" radius="var(--radius-md)" />
              </div>
              <div className="modal-col">
                <SkeletonBlock width="100%" height="180px" radius="var(--radius-md)" />
                <SkeletonBlock width="100%" height="120px" radius="var(--radius-md)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Return details error">
          <div className="modal-header">
            <span className="modal-title">Return Details</span>
            <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
          </div>
          <div className="modal-body">
            <ErrorState message="We couldn't load this return's details." onRetry={fetchDetail} />
          </div>
        </div>
      </div>
    );
  }

  const confidence = detail.ai_confidence ?? 0;


  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card modal-card-wide"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={`Return ${detail.return_request_id} details`}
      >
        <div className="modal-header">
          <div>
            <span className="modal-title">Return #{detail.return_request_id}</span>
            <span className="modal-subtitle">{detail.product_name}</span>
          </div>
          <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="modal-body">
          <StatusStepper detail={detail} />

          <div className="modal-grid">
            {/* ---------- LEFT COLUMN: factual data ---------- */}
            <div className="modal-col">
              <DetailCard title="👤 Customer Details">
                <div className="detail-row"><label>Name</label><span>{detail.customer_name}</span></div>
                <div className="detail-row"><label>Email</label><span>{detail.customer_email}</span></div>
                <div className="detail-row"><label>Location</label><span>{detail.customer_city || "—"}, {detail.customer_state || "—"}</span></div>
                <div className="detail-row"><label>Segment</label><span>{detail.customer_segment || "—"}</span></div>
              </DetailCard>

              <DetailCard title="📦 Product Details">
                <div className="detail-row"><label>Product</label><span>{detail.product_name}</span></div>
                <div className="detail-row"><label>Item ID</label><span>{detail.item_id}</span></div>
                <div className="detail-row"><label>Category</label><span>{detail.product_category}</span></div>
                <div className="detail-row"><label>Brand</label><span>{detail.product_brand || "—"}</span></div>
                <div className="detail-row"><label>Return Type</label><span>{detail.return_type}</span></div>
                <div className="detail-row"><label>Customer Rating</label><span>{detail.customer_rating} / 5</span></div>
                <div className="detail-row full"><label>Return Reason</label><span>{detail.return_reason}</span></div>
              </DetailCard>

              <DetailCard title="🚚 Refund & Logistics">
                <div className="detail-row"><label>Refund Amount</label><span>₹{detail.refund_amount}</span></div>
                <div className="detail-row"><label>Carrier</label><span>{detail.carrier_name}</span></div>
                <div className="detail-row"><label>Dispatch Date</label><span>{detail.dispatch_date || "—"}</span></div>
                <div className="detail-row"><label>Delivery Date</label><span>{detail.delivery_date || "—"}</span></div>
                <div className="detail-row"><label>Pickup Date</label><span>{detail.pickup_date || "—"}</span></div>
                <div className="detail-row"><label>Pickup Pincode</label><span>{detail.pickup_pincode}</span></div>
              </DetailCard>

              <div className="detail-card">
                <button className="collapsible-toggle" onClick={() => setShowInternal((v) => !v)}>
                  🔒 Internal Fields (Employee Only) {showInternal ? "▲" : "▼"}
                </button>
                {showInternal && (
                  <div className="collapsible-body">
                    <div className="detail-row"><label>Seller ID</label><span>{detail.seller_id || "—"}</span></div>
                    <div className="detail-row"><label>Reverse Logistics Cost</label><span>₹{detail.reverse_logistics_cost ?? "—"}</span></div>
                    <div className="detail-row"><label>Warehouse</label><span>{detail.warehouse_location || "—"}</span></div>
                    <div className="detail-row"><label>Resolution Days</label><span>{detail.resolution_days ?? "—"}</span></div>
                    <div className="detail-row"><label>Product Price</label><span>{detail.product_price ? `₹${detail.product_price}` : "—"}</span></div>
                  </div>
                )}
              </div>
            </div>

            {/* ---------- RIGHT COLUMN: AI + decisioning ---------- */}
            <div className="modal-col">
              <AIRecommendationCard
                prediction={detail.ai_prediction}
                confidence={confidence}
                factors={{
                  category: detail.product_category,
                  returnType: detail.return_type,
                  rating: detail.customer_rating,
                  refundAmount: detail.refund_amount,
                  carrier: detail.carrier_name,
                  segment: detail.customer_segment,
                }}
                showRiskIndicators
                riskProps={{
                  rating: detail.customer_rating,
                  refundAmount: detail.refund_amount,
                  reviewStatus: detail.review_status,
                }}
              />

              <DetailCard title="✅ Current Decision" className="decision-card">
                <div className="detail-row">
                  <label>Current Status (customer-facing)</label>
                  <span className={`badge badge-${(detail.return_status || "").toLowerCase()}`}>{detail.return_status}</span>
                </div>
                <div className="detail-row"><label>Review Stage</label><span>{detail.review_status}</span></div>
                <div className="detail-row"><label>Assigned Reviewer</label><span>{detail.reviewed_by || "Unassigned"}</span></div>

                <div className="row-actions modal-decision-actions">
                  <button className="btn-submit" disabled={saving} onClick={() => applyDecision("Approved")}>✅ Approve</button>
                  <button className="btn-secondary" disabled={saving} onClick={() => applyDecision("Rejected")}>❌ Reject</button>
                  <button className="btn-secondary" disabled={saving} onClick={() => applyDecision(null, "Escalated")}>🚩 Escalate</button>
                  <button className="btn-secondary" disabled={saving} onClick={() => applyDecision("Pending")}>⏳ Keep Pending</button>
                </div>
              </DetailCard>

              <DetailCard title="🧑‍💼 Update Review Status & Reviewer">
                <div className="form-group">
                  <label className="form-label">Review Status</label>
                  <select className="form-select" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
                    {REVIEW_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Assign Reviewer</label>
                  <input
                    className="form-input"
                    placeholder="Reviewer name"
                    value={reviewedBy}
                    onChange={(e) => setReviewedBy(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Employee Notes</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Add internal notes about this return..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                  <p className="notes-disclaimer">
                    ⚠️ Notes aren't persisted to the database yet — that would need a schema
                    change (a new column) which hasn't been made. They'll be cleared on reload.
                  </p>
                </div>
                <button className="btn-submit" disabled={saving} onClick={saveReviewFields} style={{ width: "100%" }}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </DetailCard>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

export default ReturnDetailsModal;
