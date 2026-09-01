from datetime import datetime

from langchain_core.tools import tool

from backend.app.core.database import (
    customers_collection,
    orders_collection,
    tickets_collection,
)


@tool
def get_customer(customer_id: str):
    """Get a customer profile using their customer ID."""

    customer = customers_collection.find_one(
        {
            "customer_id": customer_id
        },
        {
            "_id": 0
        },
    )

    if not customer:
        return {
            "error": "Customer not found"
        }

    return customer


@tool
def get_order(order_number: str):
    """Get an order using its order number."""

    order = orders_collection.find_one(
        {
            "order_number": order_number
        },
        {
            "_id": 0
        },
    )

    if not order:
        return {
            "error": "Order not found"
        }

    return order


@tool
def get_customer_orders(customer_id: str):
    """Get all orders belonging to a customer."""

    orders = orders_collection.find(
        {
            "customer_id": customer_id
        },
        {
            "_id": 0
        },
    )

    return list(orders)


@tool
def get_ticket(ticket_id: str):
    """Get a support ticket using its ticket ID."""

    ticket = tickets_collection.find_one(
        {
            "ticket_id": ticket_id
        },
        {
            "_id": 0
        },
    )

    if not ticket:
        return {
            "error": "Ticket not found"
        }

    return ticket


@tool
def get_customer_tickets(customer_id: str):
    """Get all support tickets belonging to a customer."""

    tickets = tickets_collection.find(
        {
            "customer_id": customer_id
        },
        {
            "_id": 0
        },
    )

    return list(tickets)


@tool
def create_ticket(
    customer_id: str,
    description: str,
    subject: str = "AI Escalation",
    order_number: str | None = None,
    priority: str = "high",
):
    """Create a new support ticket for a customer."""

    existing_tickets = (
        tickets_collection.count_documents({})
    )

    ticket_id = (
        f"TKT-{10000 + existing_tickets}"
    )

    ticket = {
        "ticket_id": ticket_id,
        "customer_id": customer_id,
        "order_number": order_number,
        "subject": subject,
        "description": description,
        "status": "escalated",
        "priority": priority,
        "assigned_to": "Support Agent",
        "created_at": datetime.now().isoformat(),
    }

    tickets_collection.insert_one(
        ticket
    )

    ticket.pop(
        "_id",
        None,
    )

    return ticket