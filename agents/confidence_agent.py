from config import LLM


def confidence_agent(state):

    # Database-backed answers are directly grounded in MongoDB.
    if (
        state.get("order_data")
        or state.get("ticket_data")
        or state.get("customer_data")
    ):
        return {
            "answer_confidence": 0.95,
            "action": "answer",
        }

    # Force escalation from RAG/other agents.
    if state.get("force_escalate"):
        return {
            "answer_confidence": 0.0,
            "action": "escalate",
        }

    prompt = f"""
Score the quality of this customer-support answer from 0 to 1.

Question:
{state["user_query"]}

Answer:
{state["answer"]}

Return ONLY a number between 0 and 1.
"""

    try:
        raw_score = LLM.invoke(prompt).content.strip()
        score = float(raw_score)
        score = max(0.0, min(1.0, score))

    except (ValueError, TypeError):
        score = 0.5

    if score >= 0.65:
        return {
            "answer_confidence": score,
            "action": "answer",
        }

    if score >= 0.4:
        state["answer"] = (
            "Based on the information available, here's what I can share:\n\n"
            + state["answer"]
            + "\n\nIf this doesn't resolve your issue, I can escalate it."
        )

        return {
            "answer_confidence": score,
            "action": "clarify",
        }

    return {
        "answer_confidence": score,
        "action": "escalate",
    }