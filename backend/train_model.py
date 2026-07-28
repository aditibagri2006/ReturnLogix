import pandas as pd
import os
from sqlalchemy import create_engine
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib



DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL)

query = """
SELECT
product_category,
customer_segment,
return_type,
customer_rating,
refund_amount,
carrier_name,
return_status
FROM returns
"""

df = pd.read_sql(query, engine)

print(df.head())
print("Before cleaning:", df.shape)

df = df.dropna(subset=[
    "product_category",
    "customer_segment",
    "return_type",
    "customer_rating",
    "refund_amount",
    "carrier_name",
    "return_status"
])

print("After cleaning:", df.shape)
# Encoding categorical columns

df = pd.get_dummies(
    df,
    columns=[
        "product_category",
        "customer_segment",
        "return_type",
        "carrier_name"
    ]
)

print(df.head())


X = df.drop("return_status", axis=1)
y = df["return_status"]

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)


model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

model.fit(X_train, y_train)


predictions = model.predict(X_test)

print(
    "Accuracy:",
    accuracy_score(y_test, predictions)
)


joblib.dump(model, "return_status_model.pkl")
joblib.dump(list(X.columns), "model_features.pkl")

print("Model Saved Successfully!")