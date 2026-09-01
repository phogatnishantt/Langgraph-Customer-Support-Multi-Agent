from pymongo import MongoClient
import os


MONGO_URI = os.getenv(
    "MONGO_URI",
    "mongodb://127.0.0.1:27017"
)

client = MongoClient(MONGO_URI)

db = client["customer_support"]


# ------------------------------------------------------------
# Collections
# ------------------------------------------------------------

customers_collection = db["customers"]

orders_collection = db["orders"]

conversations_collection = db["conversations"]

tickets_collection = db["tickets"]

agent_runs_collection = db["agent_runs"]

users_collection = db["users"]


# ------------------------------------------------------------
# Database indexes
# ------------------------------------------------------------

def create_indexes():

    # Customers

    customers_collection.create_index(
        "customer_id",
        unique=True
    )

    customers_collection.create_index(
        "email",
        unique=True
    )


    # Orders

    orders_collection.create_index(
        "order_number",
        unique=True
    )

    orders_collection.create_index(
        "customer_id"
    )


    # Tickets

    tickets_collection.create_index(
        "ticket_id",
        unique=True
    )

    tickets_collection.create_index(
        "customer_id"
    )

    tickets_collection.create_index(
        "status"
    )


    # Users

    users_collection.create_index(
        "email",
        unique=True
    )

    users_collection.create_index(
        "username",
        unique=True,
        sparse=True
    )


# ------------------------------------------------------------
# Database health check
# ------------------------------------------------------------

def check_database():

    try:
        client.admin.command("ping")

        return True

    except Exception:
        return False