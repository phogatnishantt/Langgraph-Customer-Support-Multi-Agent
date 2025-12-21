from config import LLM
from rag.retriever import retriever
from agents.grounding_guard import is_grounded


MIN_CONTEXT_LENGTH = 300  # characters

def rewrite_query(query: str) -> str:
    prompt = f"""
    Rewrite the following customer support query
    to be clearer and more searchable.

    Query:
    {query}
    """
    return LLM.invoke(prompt).content.strip()


def rag_agent(state):

    query = state["user_query"]

    docs = retriever.invoke(query)
    context = "\n\n".join(d.page_content for d in docs)


    if len(context) < MIN_CONTEXT_LENGTH:
        rewritten = rewrite_query(query)
        docs = retriever.invoke(rewritten)
        context = "\n\n".join(d.page_content for d in docs)

    if len(context) < MIN_CONTEXT_LENGTH:
        return {
            "retrieved_docs": [],
            "answer": "I'm unable to find a reliable answer from our knowledge base.",
            "force_escalate": True
        }

    prompt = f"""
    Answer ONLY using the context below.
    Do NOT add any information not explicitly stated.
    Context:
    {context}

    Question:
    {query}
    """

    answer = LLM.invoke(prompt).content

    # Guardrail: Groundedness
    grounded = is_grounded(answer, context)

    if not grounded:
        return {
            "retrieved_docs" : [],
            "answer": "I'm not confident this can be answered reliably from our documentation.",
            "force_escalate":True
        }

    return {
        "retrieved_docs": [d.metadata.get("source", "") for d in docs],
        "answer": answer,
        "force_escalate": False
    }
