import joblib
import pandas as pd
import os

# Use absolute paths based on the location of this file so the models
# load correctly regardless of which directory the server is started from
# (important for Render/Railway deployments where the CWD may differ).
_DIR = os.path.dirname(os.path.abspath(__file__))
model = joblib.load(os.path.join(_DIR, "return_status_model.pkl"))
model_features = joblib.load(os.path.join(_DIR, "model_features.pkl"))


def predict_return_status(
    product_category,
    customer_segment,
    return_type,
    customer_rating,
    refund_amount,
    carrier_name
):
    input_data = pd.DataFrame([{
        "product_category": product_category,
        "customer_segment": customer_segment,
        "return_type": return_type,
        "customer_rating": customer_rating,
        "refund_amount": refund_amount,
        "carrier_name": carrier_name
    }])

    input_data = pd.get_dummies(input_data)

    # Training ke same columns maintain karega
    input_data = input_data.reindex(
        columns=model_features,
        fill_value=0
    )

    prediction = model.predict(input_data)[0]

    probabilities = model.predict_proba(input_data)[0]
    confidence = round(max(probabilities) * 100, 2)

    return prediction, confidence


# Quick local test
if __name__ == "__main__":
    status, confidence = predict_return_status(
        product_category="Electronics",
        customer_segment="Premium",
        return_type="Refund",
        customer_rating=5,
        refund_amount=12000,
        carrier_name="Delhivery"
    )

    print("Predicted status:", status)
    print("Confidence:", confidence, "%")