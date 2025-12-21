from config import LLM

def clarification_agent(state):
    prompt = f"""
    Ask a clarifying question to better understand:
    {state["user_query"]}
    """

    return {
        "answer": LLM.invoke(prompt).content
    }
