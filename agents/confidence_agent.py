from config import LLM

def confidence_agent(state):

    if state.get("force_escalate"):
        return {
            "answer_confidence": 0.0,
            "action": "escalate"
        }

    prompt = f"""
    Score the answer quality from 0 to 1.

    Question:
    {state["user_query"]}

    Answer:
    {state["answer"]}

    Return ONLY a number.
    """

    try:
        score = float(LLM.invoke(prompt).content.strip())
    except:
        score = 0.3


    ## Tone Control
    if score < 0.65:
        state["answer"] = (
            "Based on our documentation, here's what I can share:\n\n"
            + state["answer"]
            + "\n\nIf this dosen't resolve your issue, I can escalate it."
        )

    if score > 0.65:
        action = "answer"
    
    if score < 0.4:
        action = "escalate"
    else:
        action = "clarify"

    return {
        "answer_confidence": score,
        "action": action
    }

