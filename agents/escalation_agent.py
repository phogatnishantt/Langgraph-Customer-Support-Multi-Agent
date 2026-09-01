from backend.app.integrations.mongo_tools import create_ticket


def escalation_agent(state):

    customer_id = state.get("customer_id") or "UNKNOWN"

    ticket = create_ticket.invoke({
        "customer_id": customer_id,
        "description": state.get(
            "user_query",
            "Customer issue requires human assistance."
        ),
        "subject": f"AI Escalation - {state.get('intent', 'unknown')}",
        "priority": "high",
    })

    return {
        "answer": (
            f"Your issue requires human assistance. "
            f"A support ticket ({ticket['ticket_id']}) "
            f"has been created."
        ),
        "ticket_data": ticket,
    }