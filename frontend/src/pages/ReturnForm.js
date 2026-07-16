import { useState } from "react";
function ReturnForm() {
    const [prediction, setPrediction] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [productCategory, setProductCategory] = useState("");
    const [customerSegment, setCustomerSegment] = useState("");
    const [returnType, setReturnType] = useState("");
    const [customerRating, setCustomerRating] = useState("");
    const [refundAmount, setRefundAmount] = useState("");
    const [carrierName, setCarrierName] = useState("");
    const [customerName, setCustomerName] = useState("");
    const [customerEmail, setCustomerEmail] = useState("");
    const [productName, setProductName] = useState("");
    const [itemId, setItemId] = useState("");
    const [sellerId, setSellerId] = useState("");
    const [dispatchDate, setDispatchDate] = useState("");
    const [deliveryDate, setDeliveryDate] = useState("");
    const [returnReason, setReturnReason] = useState("");
    const [returnStatus, setReturnStatus] = useState("");
    const [reverseLogisticsCost, setReverseLogisticsCost] = useState("");
    const [pickupPincode, setPickupPincode] = useState("");
    const [message, setMessage] = useState("");
    const [messageType, setMessageType] = useState("");
    const predictReturnStatus = async () => {
        if (
            !productCategory ||
            !customerSegment ||
            !returnType ||
            !customerRating ||
            !refundAmount ||
            !carrierName
            ) {
            setError("Please fill all AI prediction fields first.");
            return;
            }
        setLoading(true);
        setError("");
        setPrediction(null);

        try {
            const response = await fetch(
            "http://127.0.0.1:5000/predict-return-status",
            {
                method: "POST",
                headers: {
                "Content-Type": "application/json",
                },
                body: JSON.stringify({
                product_category: productCategory,
                customer_segment: customerSegment,
                return_type: returnType,
                customer_rating: Number(customerRating),
                refund_amount: Number(refundAmount),
                carrier_name: carrierName,
                }),
            }
            );

            const data = await response.json();

            if (!response.ok) {
            throw new Error(data.error || "Prediction failed");
            }

            setPrediction(data);
            setReturnStatus(data.predicted_status);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    const submitReturn = async () => {
        // Customer Name
        if (!/^[A-Za-z ]+$/.test(customerName)) {
           setMessage("Customer name can only contain letters");
           setMessageType("error");
           return;
        }

        // Email
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
            setMessage("Enter valid Email address");
            setMessageType("error");
            return;
        }

        // Product Name
        if (productName.trim() === "") {
            setMessage("Product name can contain only letters, numbers and spaces");
            setMessageType("error");
            return;
        }

        // Item ID
        if (!/^\d+$/.test(itemId)) {
            setMessage("Item ID must contain only numbers");
            setMessageType("error");
            return;
        }

        // Seller ID
        if (!/^\d+$/.test(sellerId)) {
            setMessage("Seller ID must contain only numbers");
            setMessageType("error");
            return;
        }

        // Pincode
        if (!/^\d{6}$/.test(pickupPincode)) {
            setMessage("Pincode must be exactly 6 digits");
            setMessageType("error");
            return;
        }

        // Reverse Logistics Cost
        if (isNaN(reverseLogisticsCost) || Number(reverseLogisticsCost) < 0) {
            setMessage("Enter a valid logistics cost");
            setMessageType("error");
            return;
        }

        // Return Reason
        if (returnReason.trim().length < 10) {
            setMessage("Return reason must be at least 10 characters");
            setMessageType("error");
            return;
        }

        // Dates
        if (new Date(deliveryDate) < new Date(dispatchDate)) {
            setMessage("Delivery date cannot be before dispatch date");
            setMessageType("error");
            return;
        }
        const response = await fetch("http://127.0.0.1:5000/user", {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify({

            customer_name: customerName,
            customer_email: customerEmail,
            product_name: productName,
            item_id: itemId,
            seller_id: sellerId,
            dispatch_date: dispatchDate,
            delivery_date: deliveryDate,
            return_reason: returnReason,
            return_status: returnStatus,
            reverse_logistics_cost: reverseLogisticsCost,
            product_category: productCategory,
            customer_segment: customerSegment,
            return_type: returnType,
            customer_rating: Number(customerRating),
            refund_amount: Number(refundAmount),
            carrier_name: carrierName,
            pickup_pincode: pickupPincode

        })

        });

        const data = await response.json();

        setMessage(data.message);
    }
    
    return (

        <div className="return-form-page">
            <div className="return-form-card">
            <h2>Return Form</h2>
            <div className="form-grid">

                        <input
                            type="text"
                            placeholder="Customer Name"
                            value={customerName}
                            onChange={(e) => setCustomerName(e.target.value)}
                        />

                        <input
                            type="email"
                            placeholder="Customer Email"
                            value={customerEmail}
                            onChange={(e) => setCustomerEmail(e.target.value)}
                        />

                        <input
                            type="text"
                            placeholder="Product Name"
                            value={productName}
                            onChange={(e) => setProductName(e.target.value)}
                        />

                        <input
                            type="text"
                            placeholder="Item ID"
                            value={itemId}
                            onChange={(e) => setItemId(e.target.value)}
                        />

                        <input
                            type="text"
                            placeholder="Seller ID"
                            value={sellerId}
                            onChange={(e) => setSellerId(e.target.value)}
                        />

                        <div className="field-group">
                            <label>Dispatch Date</label>
                            <input
                                type="date"
                                value={dispatchDate}
                                onChange={(e) => setDispatchDate(e.target.value)}
                            />
                        </div>
                        <label>Product Category</label>
                        <select value={productCategory} onChange={(e) => setProductCategory(e.target.value)}>
                            <option value="">Select category</option>
                            <option value="Electronics">Electronics</option>
                            <option value="Fashion">Fashion</option>
                            <option value="Home & Kitchen">Home & Kitchen</option>
                            <option value="Beauty">Beauty</option>
                            <option value="Sports">Sports</option>
                            </select>

                        <label>Customer Segment</label>
                        <select value={customerSegment} onChange={(e) => setCustomerSegment(e.target.value)}>
                            <option value="">Select segment</option>
                            <option value="New">New</option>
                            <option value="Returning">Returning</option>
                            <option value="Premium">Premium</option>
                        </select>

                        <label>Return Type</label>
                        <select value={returnType} onChange={(e) => setReturnType(e.target.value)}>
                            <option value="">Select return type</option>
                            <option value="Refund">Refund</option>
                            <option value="Replacement">Replacement</option>
                            <option value="Exchange">Exchange</option>
                        </select>

                        <label>Customer Rating</label>
                        <input
                        type="number"
                        min="1"
                        max="5"
                        value={customerRating}
                        onChange={(e) => setCustomerRating(e.target.value)}
                        />

                        <label>Refund Amount</label>
                        <input
                        type="number"
                        min="0"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        />

                        <label>Carrier Name</label>
                            <select value={carrierName} onChange={(e) => setCarrierName(e.target.value)}>
                            <option value="">Select carrier</option>
                            <option value="Delhivery">Delhivery</option>
                            <option value="BlueDart">BlueDart</option>
                            <option value="Ecom Express">Ecom Express</option>
                        </select>

                        <textarea
                            placeholder="Return Reason"
                            value={returnReason}
                            onChange={(e) => setReturnReason(e.target.value)}
                            className="return-reason"
                        />


                        <div className="field-group">
                            <label>Delivery Date</label>
                            <input
                                type="date"
                                value={deliveryDate}
                                onChange={(e) => setDeliveryDate(e.target.value)}
                            />
                        </div>

                        <input
                            type="number"
                            placeholder="Reverse Logistics Cost"
                            value={reverseLogisticsCost}
                            onChange={(e) => setReverseLogisticsCost(e.target.value)}
                        />

                        <select>
                            <option>Pending</option>
                            <option>Approved</option>
                            <option>Rejected</option>
                        </select>

                        <input
                            type="text"
                            placeholder="Pickup Pincode"
                            value={pickupPincode}
                            onChange={(e) => setPickupPincode(e.target.value)}
                        />

                    </div>

                    <div className="form-actions">
                        <button
                            className="btn-submit"
                            onClick={submitReturn}
                        >
                            Submit Return
                        </button>
                    </div>
                    <button
                        type="button"
                        onClick={predictReturnStatus}
                        disabled={loading}
                        >
                        {loading ? "Predicting..." : "Predict Return Status"}
                    </button>
                    {prediction && (
                    <div className="prediction-box">
                        <h3>AI Prediction Result</h3>
                        <p>
                        Predicted Status: <b>{prediction.predicted_status}</b>
                        </p>
                        <p>
                        Confidence: <b>{prediction.confidence}%</b>
                        </p>
                    </div>
                    )}

                    {error && (
                    <p style={{ color: "red" }}>
                        {error}
                    </p>
                    )}

                    <p>{message}</p>

            
            </div>
        </div>
    )
}

export default ReturnForm;