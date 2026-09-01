from config import LLM
import json
import re


VALID_INTENTS = {
    "billing",
    "login",
    "subscription",
    "refunds",
    "order_status",
    "ticket_status",
    "customer_info",
    "unknown",
}


def detect_entity_intent(query: str):
    query_upper = query.upper()

    if re.search(r"\bORD-[A-Z0-9-]+\b", query_upper):
        return "order_status", 0.99

    if re.search(r"\bTKT-[A-Z0-9-]+\b", query_upper):
        return "ticket_status", 0.99

    if re.search(r"\bCUST-[A-Z0-9-]+\b", query_upper):
        return "customer_info", 0.99

    return None


def intent_agent(state):
    query = state["user_query"]

    # Deterministic routing for known entity IDs.
    entity_intent = detect_entity_intent(query)

    if entity_intent:
        intent, confidence = entity_intent

        return {
            "intent": intent,
            "intent_confidence": confidence,
        }

    prompt = f"""
You are a customer-support intent classifier.

Classify the customer's query into exactly ONE of these intents:

- billing
- login
- subscription
- refunds
- order_status
- ticket_status
- customer_info
- unknown

Return ONLY valid JSON:

{{
    "intent": "refunds",
    "confidence": 0.91
}}

Customer query:
{query}
"""

    response = LLM.invoke(prompt).content.strip()

    try:
        result = json.loads(response)

        intent = result.get("intent", "unknown")
        confidence = float(result.get("confidence", 0.5))

        if intent not in VALID_INTENTS:
            intent = "unknown"

        confidence = max(0.0, min(1.0, confidence))

    except (json.JSONDecodeError, ValueError, TypeError):
        intent = "unknown"
        confidence = 0.3

    return {
        "intent": intent,
        "intent_confidence": confidence,
    }