import random
import uuid
from datetime import datetime, timedelta
import json
import os

random.seed(42)

OUTPUT_DIR = "data/generated"
os.makedirs(OUTPUT_DIR, exist_ok=True)

FIRST_NAMES = [
    "Aarav", "Vihaan", "Arjun", "Rohan", "Kabir",
    "Ananya", "Aisha", "Priya", "Isha", "Meera",
    "Rahul", "Karan", "Aditya", "Neha", "Simran",
    "Sofia", "Emma", "Liam", "Noah", "Olivia"
]

LAST_NAMES = [
    "Sharma", "Patel", "Singh", "Kumar", "Verma",
    "Gupta", "Mehta", "Shah", "Kapoor", "Malhotra",
    "Brown", "Wilson", "Taylor", "Anderson", "Martin"
]

PRODUCTS = [
    ("Wireless Headphones", 79.99),
    ("Mechanical Keyboard", 129.99),
    ("Gaming Mouse", 59.99),
    ("Smart Watch", 199.99),
    ("USB-C Hub", 49.99),
    ("Laptop Stand", 69.99),
    ("Webcam", 89.99),
    ("Bluetooth Speaker", 99.99),
    ("Monitor", 299.99),
    ("External SSD", 149.99),
]

TICKET_ISSUES = [
    "Product return",
    "Order delayed",
    "Damaged product",
    "Wrong product received",
    "Refund not received",
    "Payment issue",
    "Order cancellation",
    "Product information",
    "Account issue",
    "Delivery problem",
]

ORDER_STATUSES = [
    "processing",
    "shipped",
    "delivered",
    "cancelled",
    "returned"
]

TICKET_STATUSES = [
    "open",
    "in_progress",
    "resolved",
    "escalated"
]

PRIORITIES = [
    "low",
    "medium",
    "high",
    "critical"
]


def random_date(days_back=365):
    return datetime.now() - timedelta(
        days=random.randint(0, days_back)
    )


def generate_customers(count=100):
    customers = []

    for i in range(count):
        first = random.choice(FIRST_NAMES)
        last = random.choice(LAST_NAMES)

        customer_id = f"CUST-{1000 + i}"

        customers.append({
            "customer_id": customer_id,
            "name": f"{first} {last}",
            "email": f"{first.lower()}.{last.lower()}{i}@example.com",
            "phone": f"+91-{random.randint(7000000000, 9999999999)}",
            "created_at": random_date(730).isoformat(),
            "status": random.choice(["active", "active", "active", "inactive"]),
        })

    return customers


def generate_orders(customers, count=400):
    orders = []

    for i in range(count):
        customer = random.choice(customers)
        product, price = random.choice(PRODUCTS)

        quantity = random.randint(1, 3)

        orders.append({
            "order_id": str(uuid.uuid4()),
            "order_number": f"ORD-{100000 + i}",
            "customer_id": customer["customer_id"],
            "product": product,
            "quantity": quantity,
            "amount": round(price * quantity, 2),
            "status": random.choice(ORDER_STATUSES),
            "ordered_at": random_date(365).isoformat(),
            "delivery_date": (
                datetime.now() + timedelta(days=random.randint(-30, 20))
            ).isoformat(),
        })

    return orders


def generate_tickets(customers, orders, count=250):
    tickets = []

    for i in range(count):
        customer = random.choice(customers)

        customer_orders = [
            order for order in orders
            if order["customer_id"] == customer["customer_id"]
        ]

        order = random.choice(customer_orders) if customer_orders else None

        issue = random.choice(TICKET_ISSUES)

        tickets.append({
            "ticket_id": f"TKT-{10000 + i}",
            "customer_id": customer["customer_id"],
            "order_number": order["order_number"] if order else None,
            "subject": issue,
            "description": f"Customer reported an issue related to {issue.lower()}.",
            "status": random.choice(TICKET_STATUSES),
            "priority": random.choice(PRIORITIES),
            "assigned_to": random.choice([
                "AI",
                "Support Agent",
                "Senior Support",
                None
            ]),
            "created_at": random_date(180).isoformat(),
        })

    return tickets


def save_data(filename, data):
    path = os.path.join(OUTPUT_DIR, filename)

    with open(path, "w") as f:
        json.dump(data, f, indent=2)

    print(f"Created {path} ({len(data)} records)")


def main():
    customers = generate_customers(100)
    orders = generate_orders(customers, 400)
    tickets = generate_tickets(customers, orders, 250)

    save_data("customers.json", customers)
    save_data("orders.json", orders)
    save_data("tickets.json", tickets)

    print("\nData generation complete!")
    print(f"Customers: {len(customers)}")
    print(f"Orders: {len(orders)}")
    print(f"Tickets: {len(tickets)}")


if __name__ == "__main__":
    main()