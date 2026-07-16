// Shared AI presentation components for Phase 4.
//
// Everything here is derived only from data the model/backend already
// returns (prediction, confidence, and the 6 real input features:
// product_category, return_type, customer_rating, refund_amount,
// carrier_name, customer_segment). Nothing is invented - there is no
// per-prediction feature-importance / SHAP computation happening
// anywhere in this app, so this deliberately shows the *inputs* the
// model used rather than claiming to know how much each one weighed
// in the decision.

function tierFor(confidence) {
  if (confidence >= 80) return { tier: "high", label: "High Confidence", color: "var(--green-500)" };
  if (confidence >= 60) return { tier: "medium", label: "Medium Confidence", color: "var(--yellow-500)" };
  return { tier: "low", label: "Low Confidence", color: "var(--red-500)" };
}

export function ConfidenceBadge({ confidence }) {
  const { tier, label } = tierFor(confidence);
  return <span className={`confidence-badge confidence-badge-${tier}`}>{label}</span>;
}

export function ConfidenceMeter({ confidence }) {
  const { tier, color } = tierFor(confidence);
  return (
    <div className="ai-meter">
      <div className="ai-meter-track">
        <div
          className={`ai-meter-fill ai-meter-fill-${tier}`}
          style={{ width: `${Math.min(Math.max(confidence, 0), 100)}%`, background: color }}
        />
      </div>
      <span className="ai-meter-value">{confidence}%</span>
    </div>
  );
}

// Internal-facing risk chips. Kept out of the Customer Portal - these
// are review-workflow labels, not something a customer should see
// about their own return.
export function RiskIndicators({ rating, refundAmount, confidence, reviewStatus }) {
  const highRefund = refundAmount != null && Number(refundAmount) > 30000;
  const lowRating = rating != null && Number(rating) <= 2;
  const highRisk = highRefund || lowRating;
  const stillOpen = reviewStatus === "Under Review" || reviewStatus === "Escalated";
  const needsReview = confidence < 60 || highRisk || stillOpen;

  const indicators = [
    { show: highRefund, label: "High Refund Amount", icon: "💰", tone: "warning" },
    { show: lowRating, label: "Low Customer Rating", icon: "⭐", tone: "danger" },
    { show: highRisk, label: "High Risk Return", icon: "⚠️", tone: "danger" },
    { show: needsReview, label: "Needs Manual Review", icon: "🔍", tone: "warning" },
  ].filter((i) => i.show);

  if (indicators.length === 0) {
    return <div className="risk-indicator-empty">✅ No risk flags on this return.</div>;
  }

  return (
    <div className="risk-indicator-list">
      {indicators.map((i) => (
        <span key={i.label} className={`risk-chip risk-chip-${i.tone}`}>
          {i.icon} {i.label}
        </span>
      ))}
    </div>
  );
}

// Explains the prediction using the real inputs the model was given -
// a plain factor list, not a fabricated weighting/explanation.
export function AIRecommendationCard({ prediction, confidence, factors, showRiskIndicators, riskProps }) {
  const isLow = confidence < 60;

  return (
    <div className="ai-rec-card">
      <div className="ai-rec-suggested">
        <span className="ai-rec-suggested-label">AI Suggested Decision</span>
        <span className={`ai-rec-decision ai-rec-decision-${(prediction || "").toLowerCase()}`}>
          {prediction}
        </span>
      </div>

      <ConfidenceMeter confidence={confidence} />
      <div className="ai-rec-badge-row">
        <ConfidenceBadge confidence={confidence} />
      </div>

      {isLow && (
        <div className="ai-alert ai-alert-warning">
          ⚠️ Confidence is below 60% — this prediction is a starting point only.
          {showRiskIndicators ? " Manual review is recommended before finalizing a decision." : " Our team will review this manually."}
        </div>
      )}

      {factors && (
        <div className="ai-factors">
          <div className="ai-factors-title">Factors the model considered</div>
          <ul className="ai-factors-list">
            {factors.category && <li><span>Category</span><span>{factors.category}</span></li>}
            {factors.returnType && <li><span>Return Type</span><span>{factors.returnType}</span></li>}
            {factors.rating != null && <li><span>Customer Rating</span><span>{factors.rating} / 5</span></li>}
            {factors.refundAmount != null && <li><span>Refund Amount</span><span>₹{factors.refundAmount}</span></li>}
            {factors.carrier && <li><span>Carrier</span><span>{factors.carrier}</span></li>}
            {factors.segment && <li><span>Customer Segment</span><span>{factors.segment}</span></li>}
          </ul>
        </div>
      )}

      {showRiskIndicators && (
        <div className="ai-risk-section">
          <div className="ai-factors-title">Risk Analysis</div>
          <RiskIndicators
            rating={riskProps?.rating}
            refundAmount={riskProps?.refundAmount}
            confidence={confidence}
            reviewStatus={riskProps?.reviewStatus}
          />
        </div>
      )}
    </div>
  );
}
