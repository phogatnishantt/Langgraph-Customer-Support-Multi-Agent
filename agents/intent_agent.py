from config import LLM

import json
import re


VALID_INTENTS = {
    "billing",
    "login",
    "subscription",
    "refunds",
    "order_status",
    "customer_orders",
    "ticket_status",
    "customer_tickets",
    "customer_info",
    "unknown",
}


def detect_entity_intent(query: str):

    query_upper = query.upper()


    # =========================================================
    # Explicit order number
    # =========================================================

    if re.search(
        r"\bORD-[A-Z0-9-]+\b",
        query_upper,
    ):
        return "order_status", 0.99


    # =========================================================
    # Explicit ticket number
    # =========================================================

    if re.search(
        r"\bTKT-[A-Z0-9-]+\b",
        query_upper,
    ):
        return "ticket_status", 0.99


    # =========================================================
    # Customer ticket-list requests
    # =========================================================

    ticket_history_patterns = [
        r"\bSHOW\s+(ME\s+)?(ALL\s+)?(MY\s+)?TICKETS\b",
        r"\bLIST\s+(ALL\s+)?(MY\s+)?TICKETS\b",
        r"\bGET\s+(ALL\s+)?(MY\s+)?TICKETS\b",
        r"\bMY\s+TICKETS\b",
        r"\bTICKETS\s+(FOR|OF)\b",
        r"\bSUPPORT\s+TICKETS\b",
        r"\bMY\s+SUPPORT\s+TICKETS\b",
        r"\bOPEN\s+TICKETS\b",
        r"\bMY\s+OPEN\s+TICKETS\b",
        r"\bDO\s+I\s+HAVE\s+(ANY\s+)?OPEN\s+TICKETS\b",
        r"\bANY\s+OPEN\s+TICKETS\b",
    ]

    for pattern in ticket_history_patterns:

        if re.search(
            pattern,
            query_upper,
        ):
            return "customer_tickets", 0.99


    # =========================================================
    # Customer order-history requests
    # =========================================================

    order_history_patterns = [
        r"\bSHOW\s+(ME\s+)?(ALL\s+)?(MY\s+)?ORDERS\b",
        r"\bLIST\s+(ALL\s+)?(MY\s+)?ORDERS\b",
        r"\bGET\s+(ALL\s+)?(MY\s+)?ORDERS\b",
        r"\bMY\s+ORDERS\b",
        r"\bORDERS\s+(FOR|OF)\b",
        r"\bORDER\s+HISTORY\b",
        r"\bPAST\s+ORDERS\b",
        r"\bRECENT\s+ORDERS\b",
        r"\bALL\s+ORDERS\b",
    ]

    for pattern in order_history_patterns:

        if re.search(
            pattern,
            query_upper,
        ):
            return "customer_orders", 0.99


    # =========================================================
    # Customer ID
    # =========================================================

    if re.search(
        r"\bCUST-[A-Z0-9-]+\b",
        query_upper,
    ):
        return "customer_info", 0.99


    return None


def intent_agent(state):

    query = state["user_query"]


    # =========================================================
    # Deterministic routing
    # =========================================================

    entity_intent = detect_entity_intent(
        query
    )


    if entity_intent:

        intent, confidence = entity_intent

        return {
            "intent": intent,
            "intent_confidence": confidence,
        }


    # =========================================================
    # LLM fallback
    # =========================================================

    prompt = f"""
You are a customer-support intent classifier.

Classify the customer's query into exactly ONE
of these intents:

- billing
- login
- subscription
- refunds
- order_status
- customer_orders
- ticket_status
- customer_tickets
- customer_info
- unknown

Intent definitions:

order_status:
The customer is asking about ONE specific order,
usually identified by an order number such as ORD-100255.

customer_orders:
The customer wants multiple orders, order history,
recent orders, or all orders belonging to a customer.

ticket_status:
The customer is asking about ONE specific support ticket,
usually identified by a ticket number such as TKT-10253.

customer_tickets:
The customer wants their support tickets, ticket history,
open tickets, or all tickets belonging to them.

customer_info:
The customer is asking for profile/account information.

Return ONLY valid JSON:

{{
    "intent": "customer_tickets",
    "confidence": 0.91
}}

Customer query:
{query}
"""


    response = LLM.invoke(
        prompt
    ).content.strip()


    try:

        result = json.loads(
            response
        )

        intent = result.get(
            "intent",
            "unknown",
        )

        confidence = float(
            result.get(
                "confidence",
                0.5,
            )
        )


        if intent not in VALID_INTENTS:
            intent = "unknown"


        confidence = max(
            0.0,
            min(
                1.0,
                confidence,
            ),
        )


    except (
        json.JSONDecodeError,
        ValueError,
        TypeError,
    ):

        intent = "unknown"
        confidence = 0.3


    return {
        "intent": intent,
        "intent_confidence": confidence,
    }