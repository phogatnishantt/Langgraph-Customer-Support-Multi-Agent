import re

from backend.app.integrations.mongo_tools import (
    get_order,
    get_ticket,
)


def extract_id(query: str, prefix: str):
    pattern = rf"\b{re.escape(prefix)}[A-Za-z0-9-]+\b"
    match = re.search(pattern, query.upper())

    if match:
        return match.group(0)

    return None


def mongo_agent(state):
    intent = state.get("intent", "")
    query = state.get("user_query", "")

    result = {
        "customer_data": None,
        "order_data": None,
        "ticket_data": None,
        "answer": "",
        "force_escalate": False,
    }

    if intent == "order_status":

        order_number = extract_id(query, "ORD-")

        if not order_number:
            return {
                **result,
                "answer": "Could you please provide your order number?",
            }

        order = get_order.invoke({
            "order_number": order_number
        })

        if not order or "error" in order:
            return {
                **result,
                "answer": "I couldn't find that order.",
                "force_escalate": True,
            }

        result["order_data"] = order
        result["answer"] = (
            f"Your order {order['order_number']} is currently "
            f"{order['status']}. The product is {order['product']}."
        )

        return result

    if intent == "ticket_status":

        ticket_id = extract_id(query, "TKT-")

        if not ticket_id:
            return {
                **result,
                "answer": "Could you please provide your ticket number?",
            }

        ticket = get_ticket.invoke({
            "ticket_id": ticket_id
        })

        if not ticket or "error" in ticket:
            return {
                **result,
                "answer": "I couldn't find that ticket.",
                "force_escalate": True,
            }

        result["ticket_data"] = ticket
        result["answer"] = (
            f"Ticket {ticket['ticket_id']} is currently "
            f"{ticket['status']} with {ticket['priority']} priority."
        )

        return result

    return result