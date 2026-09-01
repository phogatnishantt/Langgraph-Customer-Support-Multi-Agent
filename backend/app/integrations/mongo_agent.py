import re

from backend.app.integrations.mongo_tools import (
    get_order,
    get_customer_orders,
    get_ticket,
    get_customer,
    get_customer_tickets,
)


def extract_id(query: str, prefix: str):
    """
    Extract an entity ID such as:

    ORD-100255
    TKT-10263
    CUST-1047
    """

    pattern = rf"\b{re.escape(prefix)}[A-Za-z0-9-]+\b"

    match = re.search(
        pattern,
        query.upper(),
    )

    if match:
        return match.group(0)

    return None


def mongo_agent(state):
    """
    MongoDB agent responsible for deterministic
    customer/order/ticket data retrieval.
    """

    intent = state.get(
        "intent",
        "",
    )

    query = state.get(
        "user_query",
        "",
    )

    customer_id = state.get(
        "customer_id"
    )


    # =========================================================
    # Default result
    # =========================================================

    result = {
        "customer_data": None,
        "order_data": None,
        "ticket_data": None,
        "answer": "",
        "force_escalate": False,
    }


    # =========================================================
    # ORDER STATUS
    # =========================================================

    if intent == "order_status":

        order_number = extract_id(
            query,
            "ORD-",
        )


        if not order_number:

            return {
                **result,
                "answer":
                    "Could you please provide your order number?",
            }


        order = get_order.invoke({
            "order_number": order_number,
        })


        if (
            not order
            or "error" in order
        ):

            return {
                **result,
                "answer":
                    "I couldn't find that order.",
                "force_escalate": True,
            }


        # -----------------------------------------------------
        # Customer ownership protection
        # -----------------------------------------------------

        if customer_id:

            order_customer_id = order.get(
                "customer_id"
            )


            if (
                order_customer_id
                and order_customer_id
                != customer_id
            ):

                return {
                    **result,
                    "answer":
                        "You can only access your own orders.",
                    "force_escalate": True,
                }


        result["order_data"] = order


        result["answer"] = (
            f"Your order {order['order_number']} "
            f"is currently {order['status']}. "
            f"The product is {order['product']}."
        )


        return result


    # =========================================================
    # CUSTOMER ORDERS
    # =========================================================

    if intent == "customer_orders":

        requested_customer_id = extract_id(
            query,
            "CUST-",
        )


        # Authenticated customer ID takes precedence.
        effective_customer_id = (
            customer_id
            or requested_customer_id
        )


        if not effective_customer_id:

            return {
                **result,
                "answer":
                    "Could you please provide your customer ID?",
            }


        # -----------------------------------------------------
        # Customer ownership protection
        # -----------------------------------------------------

        if (
            customer_id
            and requested_customer_id
            and requested_customer_id
            != customer_id
        ):

            return {
                **result,
                "answer":
                    "You can only access your own orders.",
                "force_escalate": True,
            }


        # -----------------------------------------------------
        # Retrieve orders
        # -----------------------------------------------------

        orders = get_customer_orders.invoke({
            "customer_id":
                effective_customer_id,
        })


        if (
            isinstance(orders, dict)
            and "error" in orders
        ):

            return {
                **result,
                "answer":
                    "I couldn't retrieve those orders.",
                "force_escalate": True,
            }


        if not orders:

            result["order_data"] = []

            result["answer"] = (
                f"I couldn't find any orders "
                f"for {effective_customer_id}."
            )

            return result


        result["order_data"] = orders


        # -----------------------------------------------------
        # Build readable response
        # -----------------------------------------------------

        order_count = len(orders)

        lines = []


        for order in orders[:10]:

            try:
                amount = float(
                    order.get(
                        "amount",
                        0,
                    )
                )
            except (
                TypeError,
                ValueError,
            ):
                amount = 0.0


            lines.append(
                f"{order.get('order_number', 'Unknown order')} — "
                f"{order.get('product', 'Unknown product')} — "
                f"{order.get('status', 'Unknown')} — "
                f"${amount:.2f}"
            )


        result["answer"] = (
            f"I found {order_count} "
            f"{'order' if order_count == 1 else 'orders'} "
            f"for {effective_customer_id}:\n"
            + "\n".join(lines)
        )


        if order_count > 10:

            result["answer"] += (
                f"\n…and {order_count - 10} more."
            )


        return result


    # =========================================================
    # CUSTOMER TICKETS
    # =========================================================

    if intent == "customer_tickets":

        requested_customer_id = extract_id(
            query,
            "CUST-",
        )


        effective_customer_id = (
            customer_id
            or requested_customer_id
        )


        if not effective_customer_id:

            return {
                **result,
                "answer":
                    "Could you please provide your customer ID?",
            }


        # -----------------------------------------------------
        # Customer ownership protection
        # -----------------------------------------------------

        if (
            customer_id
            and requested_customer_id
            and requested_customer_id
            != customer_id
        ):

            return {
                **result,
                "answer":
                    "You can only access your own tickets.",
                "force_escalate": True,
            }


        # -----------------------------------------------------
        # Retrieve tickets
        # -----------------------------------------------------

        tickets = get_customer_tickets.invoke({
            "customer_id":
                effective_customer_id,
        })


        if (
            isinstance(tickets, dict)
            and "error" in tickets
        ):

            return {
                **result,
                "answer":
                    "I couldn't retrieve your tickets.",
                "force_escalate": True,
            }


        # -----------------------------------------------------
        # No tickets
        # -----------------------------------------------------

        if not tickets:

            result["ticket_data"] = []

            result["answer"] = (
                f"You currently have no support "
                f"tickets for {effective_customer_id}."
            )

            return result


        # -----------------------------------------------------
        # Detect open-ticket requests
        # -----------------------------------------------------

        query_upper = query.upper()


        wants_open_tickets = (
            "OPEN TICKET" in query_upper
            or "OPEN TICKETS" in query_upper
            or "OPEN SUPPORT TICKET" in query_upper
            or "OPEN SUPPORT TICKETS" in query_upper
        )


        if wants_open_tickets:

            tickets_to_show = [
                ticket
                for ticket in tickets
                if ticket.get("status")
                in {
                    "open",
                    "in_progress",
                    "escalated",
                }
            ]

        else:

            tickets_to_show = tickets


        # -----------------------------------------------------
        # No open tickets
        # -----------------------------------------------------

        if not tickets_to_show:

            result["ticket_data"] = []

            result["answer"] = (
                "You currently have no open "
                "support tickets."
            )

            return result


        result["ticket_data"] = tickets_to_show


        # -----------------------------------------------------
        # Build readable response
        # -----------------------------------------------------

        ticket_count = len(
            tickets_to_show
        )

        lines = []


        for ticket in tickets_to_show[:10]:

            lines.append(
                f"{ticket.get('ticket_id', 'Unknown ticket')} — "
                f"{ticket.get('subject', 'Support request')} — "
                f"{ticket.get('status', 'Unknown')} — "
                f"{ticket.get('priority', 'Unknown')} priority"
            )


        prefix_text = (
            "I found"
            if not wants_open_tickets
            else "I found"
        )


        result["answer"] = (
            f"{prefix_text} {ticket_count} "
            f"{'ticket' if ticket_count == 1 else 'tickets'} "
            f"for {effective_customer_id}:\n"
            + "\n".join(lines)
        )


        if ticket_count > 10:

            result["answer"] += (
                f"\n…and {ticket_count - 10} more."
            )


        return result


    # =========================================================
    # TICKET STATUS
    # =========================================================

    if intent == "ticket_status":

        ticket_id = extract_id(
            query,
            "TKT-",
        )


        if not ticket_id:

            return {
                **result,
                "answer":
                    "Could you please provide your ticket number?",
            }


        ticket = get_ticket.invoke({
            "ticket_id": ticket_id,
        })


        if (
            not ticket
            or "error" in ticket
        ):

            return {
                **result,
                "answer":
                    "I couldn't find that ticket.",
                "force_escalate": True,
            }


        # -----------------------------------------------------
        # Customer ownership protection
        # -----------------------------------------------------

        if customer_id:

            ticket_customer_id = ticket.get(
                "customer_id"
            )


            if (
                ticket_customer_id
                and ticket_customer_id
                != customer_id
            ):

                return {
                    **result,
                    "answer":
                        "You can only access your own tickets.",
                    "force_escalate": True,
                }


        result["ticket_data"] = ticket


        result["answer"] = (
            f"Ticket {ticket['ticket_id']} "
            f"is currently {ticket['status']} "
            f"with {ticket['priority']} priority."
        )


        return result


    # =========================================================
    # CUSTOMER INFORMATION
    # =========================================================

    if intent == "customer_info":

        requested_customer_id = extract_id(
            query,
            "CUST-",
        )


        effective_customer_id = (
            customer_id
            or requested_customer_id
        )


        if not effective_customer_id:

            return {
                **result,
                "answer":
                    "Could you please provide your customer ID?",
            }


        # -----------------------------------------------------
        # Customer ownership protection
        # -----------------------------------------------------

        if (
            customer_id
            and requested_customer_id
            and requested_customer_id
            != customer_id
        ):

            return {
                **result,
                "answer":
                    "You can only access your own customer information.",
                "force_escalate": True,
            }


        customer = get_customer.invoke({
            "customer_id":
                effective_customer_id,
        })


        if (
            not customer
            or "error" in customer
        ):

            return {
                **result,
                "answer":
                    "I couldn't find that customer.",
                "force_escalate": True,
            }


        result["customer_data"] = customer


        name = customer.get(
            "name",
            effective_customer_id,
        )


        email = customer.get(
            "email",
            "not available",
        )


        result["answer"] = (
            f"Customer {name} "
            f"({effective_customer_id}) "
            f"is registered with email {email}."
        )


        return result


    # =========================================================
    # FALLBACK
    # =========================================================

    return {
        **result,
        "answer":
            "I couldn't determine which customer-support information you need.",
    }