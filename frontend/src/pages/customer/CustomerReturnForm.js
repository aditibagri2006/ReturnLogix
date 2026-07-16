import { useState } from "react";
import { useNavigate } from "react-router-dom";
import CustomerNav from "../../components/CustomerNav";
import { useAuth } from "../../context/AuthContext";
import { API_BASE } from "../../api";
import { AIRecommendationCard } from "../../components/AIInsights";

const CATEGORIES = ["Electronics", "Fashion", "Home & Kitchen", "Beauty", "Sports"];
const RETURN_TYPES = ["Refund", "Replacement", "Exchange"];
const CARRIERS = ["Delhivery", "BlueDart", "Ecom Express"];

function CustomerReturnForm() {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Customer-facing fields only. Seller ID and Reverse Logistics Cost
  // (internal-only) are never collected here.
  const [productName, setProductName] = useState("");
  const [itemId, setItemId] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [returnType, setReturnType] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [customerRating, setCustomerRating] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [deliveryDate, setDeliveryDate] = useState("");
  const [pickupPincode, setPickupPincode] = useState("");
  const [returnReason, setReturnReason] = useState("");

  const [prediction, setPrediction] = useState(null);
  const [predicting, setPredicting] = useState(false);
  const [predictError, setPredictError] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const aiFieldsReady =
    productCategory && returnType && customerRating && refundAmount && carrierName;

  const predictReturnStatus = async () => {
    if (!aiFieldsReady) {
      setPredictError("Fill in category, return type, rating, refund amount and carrier first.");
      return;
    }
    setPredicting(true);
    setPredictError("");
    setPrediction(null);
    try {
      const response = await fetch(`${API_BASE}/predict-return-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_category: productCategory,
          // customer_segment isn't something a customer should set -
          // it's an internal classification. Defaulted here to match
          // what the backend will use on final submit.
          customer_segment: "New",
          return_type: returnType,
          customer_rating: Number(customerRating),
          refund_amount: Number(refundAmount),
          carrier_name: carrierName,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Prediction failed");
      setPrediction(data);
    } catch (err) {
      setPredictError(err.message);
    } finally {
      setPredicting(false);
    }
  };

  const validate = () => {
    if (productName.trim() === "") return "Product name is required";
    if (!/^\d+$/.test(itemId)) return "Item ID must contain only numbers";
    if (!productCategory) return "Select a product category";
    if (!returnType) return "Select a return type";
    if (!carrierName) return "Select a carrier";
    if (!customerRating || customerRating < 1 || customerRating > 5)
      return "Rating must be between 1 and 5";
    if (refundAmount === "" || Number(refundAmount) < 0) return "Enter a valid refund amount";
    if (!/^\d{6}$/.test(pickupPincode)) return "Pincode must be exactly 6 digits";
    if (returnReason.trim().length < 10) return "Return reason must be at least 10 characters";
    if (!dispatchDate || !deliveryDate) return "Both dispatch and delivery dates are required";
    if (new Date(deliveryDate) < new Date(dispatchDate))
      return "Delivery date cannot be before dispatch date";
    return "";
  };

  const submitReturn = async (e) => {
    e.preventDefault();
    const error = validate();
    if (error) {
      setMessage(error);
      setMessageType("error");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const response = await fetch(`${API_BASE}/customer/return`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: user.uname,
          customer_email: user.uemail,
          product_name: productName,
          item_id: itemId,
          product_category: productCategory,
          return_type: returnType,
          customer_rating: Number(customerRating),
          refund_amount: Number(refundAmount),
          carrier_name: carrierName,
          dispatch_date: dispatchDate,
          delivery_date: deliveryDate,
          return_reason: returnReason,
          pickup_pincode: pickupPincode,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Could not submit return");
        setMessageType("error");
        return;
      }

      setMessage(
        `Return #${data.return_request_id} submitted. AI suggested status: ${data.predicted_status}.`
      );
      setMessageType("success");
      setTimeout(() => navigate("/customer/my-returns"), 1400);
    } catch (err) {
      setMessage("Could not reach the server. Is the backend running?");
      setMessageType("error");
    } finally {
      setSubmitting(false);
    }
  };



  return (
    <>
      <CustomerNav />
      <div className="page-wrapper">
        <div className="form-page">
          <div className="form-card">
            <h2 className="form-card-title">Submit a Return Request</h2>
            <p className="form-card-subtitle">
              Fill in your product details below. Our AI will instantly suggest a likely outcome.
            </p>

            {message && (
              <div
                className={`badge ${messageType === "success" ? "badge-approved" : "badge-rejected"}`}
                style={{ marginBottom: "1.25rem", width: "100%" }}
              >
                {message}
              </div>
            )}

            <div className="form-section-title">Your Details</div>
            <div className="rl-form-grid">
              <div className="form-group">
                <label className="form-label">Customer Name</label>
                <input className="form-input" value={user.uname} disabled />
              </div>
              <div className="form-group">
                <label className="form-label">Customer Email</label>
                <input className="form-input" value={user.uemail} disabled />
              </div>
            </div>

            <div className="form-divider" />
            <div className="form-section-title">Product & Return Details</div>

            <form onSubmit={submitReturn}>
              <div className="rl-form-grid">
                <div className="form-group">
                  <label className="form-label">Product Name</label>
                  <input
                    className="form-input"
                    placeholder="e.g. Wireless Headphones"
                    value={productName}
                    onChange={(e) => setProductName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Item ID</label>
                  <input
                    className="form-input"
                    placeholder="Numeric item ID"
                    value={itemId}
                    onChange={(e) => setItemId(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Product Category</label>
                  <select
                    className="form-select"
                    value={productCategory}
                    onChange={(e) => setProductCategory(e.target.value)}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Return Type</label>
                  <select
                    className="form-select"
                    value={returnType}
                    onChange={(e) => setReturnType(e.target.value)}
                  >
                    <option value="">Select return type</option>
                    {RETURN_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Carrier</label>
                  <select
                    className="form-select"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                  >
                    <option value="">Select carrier</option>
                    {CARRIERS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Your Rating (1-5)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    max="5"
                    value={customerRating}
                    onChange={(e) => setCustomerRating(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Refund Amount Requested (₹)</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Pickup Pincode</label>
                  <input
                    className="form-input"
                    placeholder="6-digit pincode"
                    value={pickupPincode}
                    onChange={(e) => setPickupPincode(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Dispatch Date</label>
                  <input
                    className="form-input-date"
                    type="date"
                    value={dispatchDate}
                    onChange={(e) => setDispatchDate(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Delivery Date</label>
                  <input
                    className="form-input-date"
                    type="date"
                    value={deliveryDate}
                    onChange={(e) => setDeliveryDate(e.target.value)}
                  />
                </div>

                <div className="form-group full">
                  <label className="form-label">Return Reason</label>
                  <textarea
                    className="form-input"
                    rows="3"
                    placeholder="Describe why you're returning this item (min. 10 characters)"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  />
                </div>
              </div>

              <div className="rl-form-actions" style={{ justifyContent: "space-between" }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={predictReturnStatus}
                  disabled={predicting}
                >
                  {predicting ? "Predicting..." : "🤖 Predict Return Status"}
                </button>
                <button type="submit" className="btn-submit" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Return"}
                </button>
              </div>
            </form>

            {predictError && (
              <p style={{ color: "var(--red-500)", marginTop: "1rem", fontSize: ".875rem" }}>
                {predictError}
              </p>
            )}

            {prediction && (
              <AIRecommendationCard
                prediction={prediction.predicted_status}
                confidence={prediction.confidence}
                factors={{
                  category: productCategory,
                  returnType,
                  rating: Number(customerRating),
                  refundAmount,
                  carrier: carrierName,
                  segment: "New",
                }}
                showRiskIndicators={false}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default CustomerReturnForm;
