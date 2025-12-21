from config import LLM

def intent_agent(state):
    prompt = f"""
    Classify intent as one of:
    billing, login, subscription, refunds, unknown

    Return JSON:
    intent, confidence (0-1)

    Query:
    {state["user_query"]}
    """

    resp = LLM.invoke(prompt).content

    intent = "unknown"
    confidence = 0.5

    if "billing" in resp.lower():
        intent = "billing"
    if "refund" in resp.lower():
        intent = "refunds"

    return {
        "intent":intent,
        "intent_confidence":confidence
    }