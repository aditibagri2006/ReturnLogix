import io
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import re
from db import get_conn
import csv
from predict import predict_return_status
import os

# Load .env for local development (no-op if python-dotenv is absent or
# there is no .env file — perfectly safe to keep in production too).
try:
    # pyrefly: ignore [missing-import]
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)

# Configured CORS to allow all origins, headers, and standard HTTP methods
CORS(app, resources={r"/*": {
    "origins": "*",
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"]
}})

# Global preflight request handler for CORS preflight (OPTIONS) checks
@app.before_request
def handle_preflight():
    if request.method == "OPTIONS":
        response = app.make_default_options_response()
        headers = response.headers
        headers['Access-Control-Allow-Origin'] = '*'
        headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization'
        return response

# =========================================================
# AUTHENTICATION ENDPOINTS
# =========================================================

@app.route('/user/signup', methods=['POST'])
def signup():
    conn = get_conn()
    cur = conn.cursor()
    data = request.json or {}

    uname = data.get('uname')
    uemail = data.get('uemail')
    upassword = data.get('upassword')
    pattern = r'^(?=.*[a-z])(?=.*[A-Z])(?=.*[\W_]).{8,}$'

    if not upassword or not re.match(pattern, upassword):
        return jsonify({
            "message": "Password must contain 8 characters, uppercase, lowercase and special character"
        }), 400

    cur.execute(
        "SELECT * FROM users WHERE uemail=%s",
        (uemail,)
    )

    existing_user = cur.fetchone()

    if existing_user:
        return jsonify({
            "message": "Email already exists. Please Sign In"
        }), 401

    cur.execute(
        "INSERT INTO users(uname, uemail, upassword) VALUES(%s,%s,%s)",
        (uname, uemail, upassword)
    )

    conn.commit()

    return jsonify({
        "message": "Signup successful"
    })

# Alias route for frontend calling /signup directly
@app.route('/signup', methods=['POST'])
def signup_alias():
    return signup()


@app.route('/user/signin', methods=['POST'])
def signin():
    conn = get_conn()
    cur = conn.cursor()
    data = request.json or {}

    uemail = data.get('uemail')
    upassword = data.get('upassword')

    cur.execute(
        "SELECT * FROM users WHERE uemail=%s AND upassword=%s",
        (uemail, upassword)
    )

    user = cur.fetchone()

    if user:
        return jsonify({
            "message": "Login successful",
            "uid": user[0],
            "uname": user[1],
            "uemail": user[2]
        })

    return jsonify({
        "message": "Invalid email or password"
    }), 401

# Alias route for frontend calling /signin directly
@app.route('/signin', methods=['POST'])
def signin_alias():
    return signin()


@app.route('/users', methods=['GET'])
def get_users():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT uid, uname, uemail, created_at FROM users")
    data = cur.fetchall()
    return jsonify(data)

# =========================================================
# GENERAL & PRODUCT ENDPOINTS
# =========================================================

@app.route('/update-product-details/<int:id>', methods=['PUT'])
def update_product_details(id):
    conn = get_conn()
    cur = conn.cursor()

    description = request.form.get('description')
    image_url = request.form.get('image_url')

    cur.execute("""
        UPDATE returns
        SET product_description=%s,
            image_url=%s
        WHERE return_request_id=%s
    """, (description, image_url, id))

    conn.commit()

    return jsonify({
        "message": "Updated Successfully"
    })


@app.route('/product/<int:id>', methods=['GET'])
def get_product(id):
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
            return_request_id,
            product_name,
            return_status,
            product_description,
            image_url
        FROM returns
        WHERE return_request_id=%s
    """, (id,))

    data = cur.fetchone()

    if not data:
        return jsonify({"message": "Not Found"}), 404

    return jsonify({
        "id": data[0],
        "product_name": data[1],
        "status": data[2],
        "description": data[3],
        "image_url": data[4]
    })


@app.route('/export-csv', methods=['GET'])
def export_csv():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        SELECT
        return_request_id,
        customer_name,
        product_name,
        return_status,
        pickup_pincode
        FROM returns
        ORDER BY return_request_id
    """)

    data = cur.fetchall()

    # Write to an in-memory buffer instead of disk — required on read-only
    # hosted environments (Render, Railway, etc.).
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        "Return ID",
        "Customer Name",
        "Product Name",
        "Status",
        "Pincode"
    ])
    writer.writerows(data)
    output.seek(0)

    return send_file(
        io.BytesIO(output.getvalue().encode("utf-8")),
        mimetype="text/csv",
        as_attachment=True,
        download_name="returns_export.csv"
    )


@app.route('/update-return', methods=['PUT'])
def update_return():
    conn = get_conn()
    cur = conn.cursor()
    data = request.json or {}

    cur.execute("""
        UPDATE returns
        SET customer_name=%s,
            product_name=%s,
            return_status=%s,
            pickup_pincode=%s
        WHERE return_request_id=%s
    """,
    (
        data['customer_name'],
        data['product_name'],
        data['return_status'],
        data['pickup_pincode'],
        data['return_request_id']
    ))

    conn.commit()

    return jsonify({"message": "Updated"})


@app.route('/delete-return/<int:return_id>', methods=['DELETE'])
def delete_return(return_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM returns WHERE return_request_id = %s",
        (return_id,)
    )

    conn.commit()

    return jsonify({
        "message": "Record Deleted Successfully"
    })


@app.route('/user', methods=['POST'])
def submit():
    conn = get_conn()
    cur = conn.cursor()
    data = request.json or {}

    customer_name = data['customer_name']
    customer_email = data['customer_email']
    product_name = data['product_name']
    item_id = data['item_id']
    seller_id = data['seller_id']
    dispatch_date = data['dispatch_date']
    delivery_date = data['delivery_date']
    return_reason = data['return_reason']
    return_status = data['return_status']
    reverse_logistics_cost = data['reverse_logistics_cost']
    pickup_pincode = data['pickup_pincode']

    cur.execute(
        """
        INSERT INTO returns
        (
            customer_name,
            customer_email,
            product_name,
            item_id,
            seller_id,
            dispatch_date,
            delivery_date,
            return_reason,
            return_status,
            reverse_logistics_cost,
            pickup_pincode
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """,
        (
            customer_name,
            customer_email,
            product_name,
            item_id,
            seller_id,
            dispatch_date,
            delivery_date,
            return_reason,
            return_status,
            reverse_logistics_cost,
            pickup_pincode
        )
    )

    conn.commit()

    return jsonify({
        "message": "Return request submitted successfully"
    })

# =========================================================
# CUSTOMER PORTAL ENDPOINTS
# =========================================================

CUSTOMER_RETURN_REQUIRED_FIELDS = [
    'customer_name', 'customer_email', 'product_name', 'item_id',
    'product_category', 'return_type', 'customer_rating',
    'refund_amount', 'carrier_name', 'dispatch_date', 'delivery_date',
    'return_reason', 'pickup_pincode'
]

CUSTOMER_RETURNS_COLUMNS = [
    "return_request_id", "product_name", "item_id", "product_category",
    "return_type", "customer_rating", "refund_amount", "carrier_name",
    "dispatch_date", "delivery_date", "return_reason",
    "return_status", "review_status", "pickup_pincode"
]


@app.route('/customer/return', methods=['POST'])
def customer_submit_return():
    data = request.json or {}

    missing = [
        f for f in CUSTOMER_RETURN_REQUIRED_FIELDS
        if data.get(f) in (None, "")
    ]
    if missing:
        return jsonify({
            "message": f"Missing required fields: {', '.join(missing)}"
        }), 400

    if not re.match(r'^[A-Za-z ]+$', data['customer_name']):
        return jsonify({"message": "Customer name can only contain letters"}), 400

    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', data['customer_email']):
        return jsonify({"message": "Enter a valid email address"}), 400

    if not re.match(r'^\d{6}$', str(data['pickup_pincode'])):
        return jsonify({"message": "Pincode must be exactly 6 digits"}), 400

    if len(str(data['return_reason']).strip()) < 10:
        return jsonify({"message": "Return reason must be at least 10 characters"}), 400

    if str(data['delivery_date']) < str(data['dispatch_date']):
        return jsonify({"message": "Delivery date cannot be before dispatch date"}), 400

    try:
        customer_rating = int(data['customer_rating'])
        refund_amount = float(data['refund_amount'])
    except (TypeError, ValueError):
        return jsonify({"message": "Rating and refund amount must be numbers"}), 400

    try:
        predicted_status, confidence = predict_return_status(
            product_category=data['product_category'],
            customer_segment="New",
            return_type=data['return_type'],
            customer_rating=customer_rating,
            refund_amount=refund_amount,
            carrier_name=data['carrier_name']
        )

        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO returns (
                customer_name, customer_email, product_name, item_id,
                product_category, customer_segment, return_type,
                customer_rating, refund_amount, carrier_name,
                dispatch_date, delivery_date, return_reason,
                return_status, review_status, pickup_pincode
            ) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING return_request_id
        """, (
            data['customer_name'], data['customer_email'], data['product_name'], data['item_id'],
            data['product_category'], "New", data['return_type'],
            customer_rating, refund_amount, data['carrier_name'],
            data['dispatch_date'], data['delivery_date'], data['return_reason'],
            predicted_status, "Under Review", data['pickup_pincode']
        ))

        new_id = cur.fetchone()[0]
        conn.commit()

        return jsonify({
            "message": "Return request submitted successfully",
            "return_request_id": new_id,
            "predicted_status": predicted_status,
            "confidence": confidence
        }), 201

    except Exception as e:
        try:
            get_conn().rollback()
        except Exception:
            pass
        return jsonify({
            "message": "Could not submit return request",
            "error": str(e)
        }), 400


@app.route('/customer/returns/<email>', methods=['GET'])
def customer_returns(email):
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT
                return_request_id, product_name, item_id, product_category,
                return_type, customer_rating, refund_amount, carrier_name,
                dispatch_date, delivery_date, return_reason,
                return_status, review_status, pickup_pincode
            FROM returns
            WHERE customer_email = %s
            ORDER BY return_request_id DESC
        """, (email,))

        rows = cur.fetchall()
        data = [dict(zip(CUSTOMER_RETURNS_COLUMNS, row)) for row in rows]

        return jsonify({"data": data, "total": len(data)})

    except Exception as e:
        return jsonify({
            "message": "Could not fetch returns",
            "error": str(e)
        }), 400


@app.route('/dashboard', methods=['GET'])
def dashboard():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*) FROM returns")
    row = cur.fetchone()
    total = row[0] if row else 0

    cur.execute("SELECT COUNT(*) FROM returns WHERE return_status='Pending'")
    row = cur.fetchone()
    pending = row[0] if row else 0

    cur.execute("SELECT COUNT(*) FROM returns WHERE return_status='Approved'")
    row = cur.fetchone()
    approved = row[0] if row else 0

    cur.execute("SELECT COUNT(*) FROM returns WHERE return_status='Rejected'")
    row = cur.fetchone()
    rejected = row[0] if row else 0

    return jsonify({
        "total": total,
        "pending": pending,
        "approved": approved,
        "rejected": rejected
    })


@app.route('/read/<int:page>', methods=['GET'])
def read(page):
    conn = get_conn()
    cur = conn.cursor()
    limit = 10
    offset = (page - 1) * limit

    cur.execute("""
        SELECT
            return_request_id,
            customer_name,
            product_name,
            return_status,
            pickup_pincode
        FROM returns
        ORDER BY return_request_id ASC
        LIMIT %s OFFSET %s
    """, (limit, offset))

    data = cur.fetchall()
    cur.execute("SELECT COUNT(*) FROM returns")
    total_records = cur.fetchone()[0]

    return jsonify({
        "data": data,
        "total": total_records
    })


@app.route('/update', methods=['PUT'])
def update():
    conn = get_conn()
    cur = conn.cursor()
    data = request.json or {}

    regid = data['regid']
    text = data['text']

    cur.execute(
        "UPDATE submissions SET text=%s WHERE regid=%s",
        (text, regid)
    )

    conn.commit()

    return jsonify({
        "message": "Updated successfully"
    })


@app.route('/delete/<regid>', methods=['DELETE'])
def delete(regid):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "DELETE FROM submissions WHERE regid=%s",
        (regid,)
    )

    conn.commit()

    return jsonify({
        "message": "Deleted successfully"
    })


@app.route("/predict-return-status", methods=["POST"])
def predict_return_status_api():
    try:
        data = request.get_json() or {}

        prediction, confidence = predict_return_status(
            product_category=data["product_category"],
            customer_segment=data["customer_segment"],
            return_type=data["return_type"],
            customer_rating=int(data["customer_rating"]),
            refund_amount=float(data["refund_amount"]),
            carrier_name=data["carrier_name"]
        )

        return jsonify({
            "predicted_status": prediction,
            "confidence": confidence
        }), 200

    except Exception as e:
        return jsonify({
            "error": str(e)
        }), 400

# =========================================================
# EMPLOYEE PORTAL ENDPOINTS
# =========================================================

HIGH_RISK_SQL = "(customer_rating <= 2 OR refund_amount > 30000)"

EMPLOYEE_RETURNS_COLUMNS = [
    "return_request_id", "customer_name", "customer_email", "product_name", "product_category",
    "return_type", "customer_rating", "refund_amount", "carrier_name", "customer_segment",
    "dispatch_date", "delivery_date", "return_status", "review_status", "reviewed_by",
    "pickup_pincode", "return_reason"
]

EMPLOYEE_RETURN_DETAIL_COLUMNS = [
    "return_request_id", "customer_name", "customer_email",
    "product_name", "item_id", "product_category", "product_brand",
    "product_price", "quantity", "return_type", "customer_rating",
    "refund_amount", "reverse_logistics_cost", "seller_id", "carrier_name",
    "customer_segment", "customer_city", "customer_state",
    "dispatch_date", "delivery_date", "pickup_date", "pickup_pincode",
    "warehouse_location", "return_status", "review_status", "reviewed_by",
    "resolution_days", "return_reason", "customer_feedback",
    "product_description", "image_url"
]

EMPLOYEE_RETURNS_SORT_COLUMNS = {
    "id": "return_request_id",
    "customer": "customer_name",
    "product": "product_name",
    "rating": "customer_rating",
    "refund": "refund_amount",
    "dispatch_date": "dispatch_date",
    "status": "return_status"
}

EMPLOYEE_EDITABLE_RETURN_STATUSES = {"Pending", "Approved", "Rejected"}
EMPLOYEE_EDITABLE_REVIEW_STATUSES = {"Under Review", "Escalated", "Approved", "Rejected"}


def _enrich_with_ai(row):
    record = dict(zip(EMPLOYEE_RETURNS_COLUMNS, row))

    try:
        prediction, confidence = predict_return_status(
            product_category=record["product_category"],
            customer_segment=record["customer_segment"] or "New",
            return_type=record["return_type"],
            customer_rating=int(record["customer_rating"]),
            refund_amount=float(record["refund_amount"]),
            carrier_name=record["carrier_name"]
        )
        record["ai_prediction"] = prediction
        record["ai_confidence"] = confidence
    except Exception:
        record["ai_prediction"] = "N/A"
        record["ai_confidence"] = 0

    rating = record.get("customer_rating")
    refund = record.get("refund_amount")
    record["is_high_risk"] = bool(
        (rating is not None and rating <= 2) or
        (refund is not None and float(refund) > 30000)
    )
    return record


@app.route('/employee/dashboard-metrics', methods=['GET'])
def employee_dashboard_metrics():
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(f"""
            SELECT
                COUNT(*) AS total,
                COUNT(*) FILTER (WHERE return_status = 'Pending')  AS pending,
                COUNT(*) FILTER (WHERE return_status = 'Approved') AS approved,
                COUNT(*) FILTER (WHERE return_status = 'Rejected') AS rejected,
                COUNT(*) FILTER (WHERE review_status = 'Under Review') AS ai_suggested,
                COUNT(*) FILTER (WHERE {HIGH_RISK_SQL}) AS high_risk,
                AVG(resolution_days) AS avg_resolution_days,
                COALESCE(SUM(refund_amount), 0) AS total_refund_amount
            FROM returns
        """)
        row = cur.fetchone()

        return jsonify({
            "total": row[0] or 0,
            "pending": row[1] or 0,
            "approved": row[2] or 0,
            "rejected": row[3] or 0,
            "ai_suggested": row[4] or 0,
            "high_risk": row[5] or 0,
            "avg_resolution_days": round(float(row[6]), 1) if row[6] is not None else 0,
            "total_refund_amount": round(float(row[7]), 2) if row[7] is not None else 0
        })
    except Exception as e:
        return jsonify({"message": "Could not load dashboard metrics", "error": str(e)}), 400


@app.route('/employee/analytics', methods=['GET'])
def employee_analytics():
    try:
        conn = get_conn()
        cur = conn.cursor()

        def distribution(column):
            cur.execute(f"""
                SELECT {column}, COUNT(*)
                FROM returns
                WHERE {column} IS NOT NULL
                GROUP BY {column}
                ORDER BY COUNT(*) DESC
            """)
            return [{"label": r[0], "value": r[1]} for r in cur.fetchall()]

        status_distribution = distribution("return_status")
        category_distribution = distribution("product_category")
        carrier_distribution = distribution("carrier_name")
        segment_distribution = distribution("customer_segment")

        cur.execute("""
            SELECT TO_CHAR(dispatch_date, 'YYYY-MM') AS month,
                   COUNT(*), COALESCE(SUM(refund_amount), 0)
            FROM returns
            WHERE dispatch_date IS NOT NULL
            GROUP BY month
            ORDER BY month
        """)
        monthly_rows = cur.fetchall()
        monthly_returns = [{"month": r[0], "count": r[1]} for r in monthly_rows]
        refund_trend = [{"month": r[0], "amount": float(r[2])} for r in monthly_rows]

        cur.execute("""
            SELECT product_category, customer_segment, return_type,
                   customer_rating, refund_amount, carrier_name
            FROM returns
            WHERE product_category IS NOT NULL AND customer_segment IS NOT NULL
              AND return_type IS NOT NULL AND customer_rating IS NOT NULL
              AND refund_amount IS NOT NULL AND carrier_name IS NOT NULL
            ORDER BY return_request_id DESC
            LIMIT 300
        """)
        sample_rows = cur.fetchall()
        ai_counts = {}
        for r in sample_rows:
            try:
                status, _ = predict_return_status(
                    product_category=r[0], customer_segment=r[1], return_type=r[2],
                    customer_rating=int(r[3]), refund_amount=float(r[4]), carrier_name=r[5]
                )
                ai_counts[status] = ai_counts.get(status, 0) + 1
            except Exception:
                continue
        ai_prediction_distribution = [{"label": k, "value": v} for k, v in ai_counts.items()]

        return jsonify({
            "status_distribution": status_distribution,
            "category_distribution": category_distribution,
            "carrier_distribution": carrier_distribution,
            "segment_distribution": segment_distribution,
            "monthly_returns": monthly_returns,
            "refund_trend": refund_trend,
            "ai_prediction_distribution": ai_prediction_distribution,
            "ai_sample_size": len(sample_rows)
        })
    except Exception as e:
        return jsonify({"message": "Could not load analytics", "error": str(e)}), 400


@app.route('/employee/returns', methods=['GET'])
def employee_returns():
    try:
        conn = get_conn()
        page = max(1, int(request.args.get('page', 1)))
        limit = max(1, min(100, int(request.args.get('limit', 10))))
        search = request.args.get('search', '').strip()
        status = request.args.get('status', 'All')
        category = request.args.get('category', 'All')
        carrier = request.args.get('carrier', 'All')
        ai_prediction_filter = request.args.get('ai_prediction', 'All')
        date_from = request.args.get('date_from', '')
        date_to = request.args.get('date_to', '')
        sort_by = EMPLOYEE_RETURNS_SORT_COLUMNS.get(
            request.args.get('sort_by', 'id'), 'return_request_id'
        )
        sort_dir = 'ASC' if request.args.get('sort_dir', 'desc').lower() == 'asc' else 'DESC'

        where = []
        params = []

        if search:
            where.append(
                "(customer_name ILIKE %s OR product_name ILIKE %s OR CAST(return_request_id AS TEXT) ILIKE %s)"
            )
            like = f"%{search}%"
            params += [like, like, like]

        if status != 'All':
            where.append("return_status = %s")
            params.append(status)

        if category != 'All':
            where.append("product_category = %s")
            params.append(category)

        if carrier != 'All':
            where.append("carrier_name = %s")
            params.append(carrier)

        if date_from:
            where.append("dispatch_date >= %s")
            params.append(date_from)

        if date_to:
            where.append("dispatch_date <= %s")
            params.append(date_to)

        where_clause = f"WHERE {' AND '.join(where)}" if where else ""
        select_cols = ", ".join(EMPLOYEE_RETURNS_COLUMNS)

        cur = conn.cursor()

        if ai_prediction_filter != 'All':
            cur.execute(f"""
                SELECT {select_cols} FROM returns
                {where_clause}
                ORDER BY {sort_by} {sort_dir}
                LIMIT 1000
            """, params)
            enriched = [_enrich_with_ai(row) for row in cur.fetchall()]
            enriched = [r for r in enriched if r['ai_prediction'] == ai_prediction_filter]

            total = len(enriched)
            start = (page - 1) * limit
            page_rows = enriched[start:start + limit]

            return jsonify({
                "data": page_rows, "total": total, "page": page,
                "total_pages": max(1, -(-total // limit))
            })

        cur.execute(f"SELECT COUNT(*) FROM returns {where_clause}", params)
        total = cur.fetchone()[0]

        offset = (page - 1) * limit
        cur.execute(f"""
            SELECT {select_cols} FROM returns
            {where_clause}
            ORDER BY {sort_by} {sort_dir}
            LIMIT %s OFFSET %s
        """, params + [limit, offset])

        data = [_enrich_with_ai(row) for row in cur.fetchall()]

        return jsonify({
            "data": data, "total": total, "page": page,
            "total_pages": max(1, -(-total // limit))
        })

    except Exception as e:
        return jsonify({"message": "Could not load returns", "error": str(e)}), 400


@app.route('/employee/returns/<int:return_id>', methods=['GET'])
def employee_return_detail(return_id):
    try:
        conn = get_conn()
        cur = conn.cursor()
        select_cols = ", ".join(EMPLOYEE_RETURN_DETAIL_COLUMNS)
        cur.execute(f"""
            SELECT {select_cols} FROM returns WHERE return_request_id = %s
        """, (return_id,))
        row = cur.fetchone()

        if not row:
            return jsonify({"message": "Return not found"}), 404

        record = dict(zip(EMPLOYEE_RETURN_DETAIL_COLUMNS, row))

        try:
            prediction, confidence = predict_return_status(
                product_category=record["product_category"],
                customer_segment=record["customer_segment"] or "New",
                return_type=record["return_type"],
                customer_rating=int(record["customer_rating"]),
                refund_amount=float(record["refund_amount"]),
                carrier_name=record["carrier_name"]
            )
            record["ai_prediction"] = prediction
            record["ai_confidence"] = confidence
        except Exception:
            record["ai_prediction"] = "N/A"
            record["ai_confidence"] = 0

        return jsonify(record)
    except Exception as e:
        return jsonify({"message": "Could not load return details", "error": str(e)}), 400


@app.route('/employee/returns/<int:return_id>', methods=['PUT'])
def employee_update_return(return_id):
    try:
        conn = get_conn()
        data = request.json or {}
        updates = []
        params = []

        if 'return_status' in data:
            if data['return_status'] not in EMPLOYEE_EDITABLE_RETURN_STATUSES:
                return jsonify({"message": "Invalid return status"}), 400
            updates.append("return_status = %s")
            params.append(data['return_status'])

        if 'review_status' in data:
            if data['review_status'] not in EMPLOYEE_EDITABLE_REVIEW_STATUSES:
                return jsonify({"message": "Invalid review status"}), 400
            updates.append("review_status = %s")
            params.append(data['review_status'])

        if 'reviewed_by' in data:
            updates.append("reviewed_by = %s")
            params.append(data['reviewed_by'])

        if not updates:
            return jsonify({"message": "Nothing to update"}), 400

        params.append(return_id)
        cur = conn.cursor()
        cur.execute(f"""
            UPDATE returns SET {', '.join(updates)}
            WHERE return_request_id = %s
            RETURNING return_request_id
        """, params)

        updated = cur.fetchone()
        if not updated:
            conn.rollback()
            return jsonify({"message": "Return not found"}), 404

        conn.commit()
        return jsonify({"message": "Return updated successfully"})

    except Exception as e:
        try:
            get_conn().rollback()
        except Exception:
            pass
        return jsonify({"message": "Could not update return", "error": str(e)}), 400


@app.route('/export-excel', methods=['GET'])
def export_excel():
    try:
        import pandas as pd
    except ImportError:
        return jsonify({
            "message": "Excel export requires pandas."
        }), 500

    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute("""
            SELECT return_request_id, customer_name, customer_email, product_name,
                   product_category, return_type, customer_rating, refund_amount,
                   carrier_name, return_status, review_status, reviewed_by,
                   dispatch_date, delivery_date, pickup_pincode
            FROM returns
            ORDER BY return_request_id
        """)
        rows = cur.fetchall()
        columns = [
            "Return ID", "Customer Name", "Customer Email", "Product Name",
            "Category", "Return Type", "Rating", "Refund Amount", "Carrier",
            "Status", "Review Status", "Reviewed By", "Dispatch Date",
            "Delivery Date", "Pincode"
        ]
        df = pd.DataFrame(rows, columns=columns)

        # Write to an in-memory buffer instead of disk — required on
        # read-only hosted environments (Render, Railway, etc.).
        output = io.BytesIO()
        try:
            df.to_excel(output, index=False, engine="openpyxl")
        except ImportError:
            return jsonify({
                "message": "Excel export requires the 'openpyxl' package."
            }), 500
        output.seek(0)

        return send_file(
            output,
            mimetype="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            as_attachment=True,
            download_name="returns_export.xlsx"
        )
    except Exception as e:
        return jsonify({"message": "Could not export Excel file", "error": str(e)}), 400


if __name__ == '__main__':
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=False)