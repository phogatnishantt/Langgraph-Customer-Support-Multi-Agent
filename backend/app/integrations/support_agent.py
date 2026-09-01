from core.graph import build_graph

from agents.injection_guard import (
    is_prompt_injection,
    sanitize_context,
)


class SupportAgent:

    def __init__(self):
        self.graph = build_graph()

    def run(
        self,
        query: str,
        customer_id: str | None = None,
    ):
        if not query or not query.strip():
            raise ValueError(
                "Query cannot be empty."
            )

        if is_prompt_injection(query):
            return {
                "answer": (
                    "This request cannot be "
                    "processed automatically."
                ),
                "action": "blocked",
                "answer_confidence": 0.0,
            }

        sanitized_query = sanitize_context(
            query
        )

        initial_state = {
            "user_query": sanitized_query,
        }

        # Pass customer identity into LangGraph
        # when it is available.
        if customer_id:
            initial_state["customer_id"] = (
                customer_id
            )

        return self.graph.invoke(
            initial_state
        )