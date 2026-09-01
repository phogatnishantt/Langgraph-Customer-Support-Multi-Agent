import json
import os

from backend.app.core.database import (
    customers_collection,
    orders_collection,
    tickets_collection,
)


DATA_DIR = "data/generated"


def load_json(filename):
    path = os.path.join(DATA_DIR, filename)

    with open(path, "r") as file:
        return json.load(file)


def seed_collection(collection, data, name):
    collection.delete_many({})

    if data:
        collection.insert_many(data)

    print(f"{name}: inserted {len(data)} records")


def main():

    customers = load_json("customers.json")
    orders = load_json("orders.json")
    tickets = load_json("tickets.json")

    seed_collection(
        customers_collection,
        customers,
        "Customers"
    )

    seed_collection(
        orders_collection,
        orders,
        "Orders"
    )

    seed_collection(
        tickets_collection,
        tickets,
        "Tickets"
    )

    print("\nMongoDB seeding complete!")


if __name__ == "__main__":
    main()