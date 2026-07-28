from faker import Faker
import random
import os
import psycopg2
from datetime import timedelta

fake = Faker("en_IN")

DATABASE_URL = os.getenv("DATABASE_URL")

conn = psycopg2.connect(DATABASE_URL)

cur = conn.cursor()

products = [
    {
        "name": "AC",
        "image": "/images/AC.jpg",
        "category": "Electronics",
        "brand": "LG"
    },
    {
        "name": "Camera",
        "image": "/images/camera.jpg",
        "category": "Electronics",
        "brand": "Sony"
    },
    {
        "name": "Charger",
        "image": "/images/charger.jpg",
        "category": "Electronics",
        "brand": "Samsung"
    },
    {
        "name": "CPU",
        "image": "/images/CPU.jpg",
        "category": "Electronics",
        "brand": "Dell"
    },
    {
        "name": "Drone",
        "image": "/images/drone.jpg",
        "category": "Electronics",
        "brand": "Samsung"
    },
    {
        "name": "Earbuds",
        "image": "/images/earbuds.jpg",
        "category": "Electronics",
        "brand": "Boat"
    },
    {
        "name": "Air Purifier",
        "image": "/images/air purifier.jpg",
        "category": "Home & Kitchen",
        "brand": "Philips"
    }
]


statuses = ["Approved", "Pending", "Rejected"]

reasons = [
    "Defective Product",
    "Wrong Item Delivered",
    "Damaged Packaging",
    "Quality Issue",
    "Not As Expected",
    "Missing Parts"
]
categories = [
    "Electronics",
    "Fashion",
    "Home & Kitchen",
    "Beauty",
    "Sports"
]

brands = [
    "Samsung",
    "Sony",
    "LG",
    "Boat",
    "Nike",
    "Puma",
    "Philips",
    "Dell"
]

cities = [
    ("Delhi","Delhi"),
    ("Mumbai","Maharashtra"),
    ("Bengaluru","Karnataka"),
    ("Hyderabad","Telangana"),
    ("Chennai","Tamil Nadu"),
    ("Kolkata","West Bengal"),
    ("Pune","Maharashtra")
]

segments = [
    "New",
    "Returning",
    "Premium"
]

return_types = [
    "Refund",
    "Replacement",
    "Exchange"
]

review_status= [
    "Under Review",
    "Escalated",
    "Approved",
    "Rejected"
]

warehouses = [
    "Delhi Hub",
    "Mumbai Hub",
    "Bangalore Hub",
    "Hyderabad Hub"
]

carriers = [
    "Delhivery",
    "BlueDart",
    "Ecom Express"
]

feedbacks = [
    "Excellent support",
    "Quick replacement",
    "Product damaged",
    "Delivery delay",
    "Satisfied with process",
    "Poor packaging"
]

for i in range(500):

    product = random.choice(products)

    product_name = product["name"]
    image_url = product["image"]
    product_category = product["category"]
    product_brand = product["brand"]
    city, state = random.choice(cities)
    product_price = round(random.uniform(500,50000),2)

    quantity = random.randint(1,5)

    customer_segment = random.choice(segments)

    return_type = random.choice(return_types)

    # Pehle ye generate honge
    customer_rating = random.randint(1,5)

    if return_type == "Refund":
        refund_amount = round(product_price * random.uniform(0.8,1),2)

    elif return_type == "Replacement":
        refund_amount = round(product_price * random.uniform(0.2,0.5),2)

    else:
        refund_amount = 0
        # Business Rules for Return Status
    

    # Premium customers get priority
    if customer_segment == "Premium" and customer_rating >= 4:
        return_status = "Approved"

    # Very poor customer rating
    elif customer_rating <= 2:
        return_status = "Rejected"

    # Expensive refunds require manual verification
    elif refund_amount > 30000:
        return_status = "Pending"

    # Exchange requests are usually approved
    elif return_type == "Exchange":
        return_status = "Approved"

    # Replacement mostly approved or pending
    elif return_type == "Replacement":
        return_status = random.choice([
            "Approved",
            "Pending"
        ])

    # Remaining cases
    else:
        return_status = random.choice([
            "Approved",
            "Pending",
            "Rejected"
        ])
    
    if return_status == "Approved":
        resolution_days = random.randint(1, 5)

    elif return_status == "Rejected":
        resolution_days = random.randint(2, 8)

    else:
        resolution_days = random.randint(5, 15)

    reviewed_by = fake.name()

    
    if return_status == "Approved":
        resolution_days = random.randint(1,3)

    elif return_status == "Rejected":
        resolution_days = random.randint(2,6)

    else:
        resolution_days = random.randint(7,15)



    

    dispatch_date = fake.date_time_between(
        start_date="-90d",
        end_date="-30d"
    )

    delivery_date = dispatch_date + timedelta(
        days=random.randint(2, 7)
    )
    pickup_date = delivery_date + timedelta(days=1)

    warehouse_map = {
        "Delhi": "Delhi Hub",
        "Mumbai": "Mumbai Hub",
        "Bengaluru": "Bangalore Hub",
        "Hyderabad": "Hyderabad Hub",
        "Chennai": "Bangalore Hub",
        "Kolkata": "Delhi Hub",
        "Pune": "Mumbai Hub"
    }

    warehouse_location = warehouse_map[city]

    if city == "Delhi":
        carrier_name = "Delhivery"

    elif city == "Mumbai":
        carrier_name = "BlueDart"

    else:
        carrier_name = random.choice(carriers)

    

    customer_feedback = random.choice(feedbacks)
    # Return Reason Business Rule
    if return_status == "Rejected":
        return_reason = random.choice([
            "Not As Expected",
            "Quality Issue"
        ])
    else:
        return_reason = random.choice(reasons)
        # Review Status Business Rule
        if return_status == "Approved":
            review_status = "Approved"

        elif return_status == "Rejected":
            review_status = "Rejected"

        else:
            review_status = random.choice([
                "Under Review",
                "Escalated"
            ])

    cur.execute("""
        INSERT INTO returns (
            product_category,
            product_brand,
            product_price,
            quantity,

            customer_city,
            customer_state,
            customer_segment,

            return_type,
            refund_amount,
            resolution_days,

            reviewed_by,
            review_status,

            pickup_date,
            warehouse_location,
            carrier_name,

            customer_rating,
            customer_feedback,
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
            pickup_pincode,
            product_description,
            image_url
        )
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
     """, (
            product_category,
            product_brand,
            product_price,
            quantity,

            city,
            state,
            customer_segment,

            return_type,
            refund_amount,
            resolution_days,

            reviewed_by,
            review_status,

            pickup_date,
            warehouse_location,
            carrier_name,

            customer_rating,
            customer_feedback,

            fake.name()[:30],
            fake.email(),

            product_name,

            f"ITM{random.randint(1000,9999)}",
            f"SEL{random.randint(1000,9999)}",

            dispatch_date,
            delivery_date,

            return_reason,
            return_status,

            round(random.uniform(50,500),2),

            fake.postcode(),

            fake.text(max_nb_chars=120),

            image_url
        )
    )

conn.commit()

print("200 records inserted successfully!")

cur.close()
conn.close()