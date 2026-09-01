from time import perf_counter

from langgraph.graph import StateGraph, END

from core.state import SupportState

from agents.intent_agent import intent_agent
from agents.rag_agent import rag_agent
from agents.confidence_agent import confidence_agent
from agents.clarification_agent import clarification_agent
from agents.escalation_agent import escalation_agent

from backend.app.integrations.mongo_agent import mongo_agent

from backend.app.integrations.agent_logger import (
    start_agent_run,
    finish_agent_run,
    fail_agent_run,
)


def tracked_agent(
    agent_name,
    agent_function,
):
    def wrapper(state):

        run_id = start_agent_run(
            agent_name,
            state,
        )

        started_at = perf_counter()

        try:
            result = agent_function(state)

            updated_state = {
                **state,
                **result,
            }

            finish_agent_run(
                run_id,
                agent_name,
                updated_state,
                started_at,
            )

            return result

        except Exception as error:

            fail_agent_run(
                run_id,
                agent_name,
                error,
                started_at,
            )

            raise

    return wrapper


def route_after_intent(state):

    intent = state.get(
        "intent",
        "unknown",
    )

    mongo_intents = {
        "order_status",
        "ticket_status",
        "customer_info",
    }

    if intent in mongo_intents:
        return "mongo"

    return "rag"


def build_graph():

    graph = StateGraph(
        SupportState
    )

    graph.add_node(
        "intent",
        tracked_agent(
            "Intent Agent",
            intent_agent,
        ),
    )

    graph.add_node(
        "rag",
        tracked_agent(
            "RAG Agent",
            rag_agent,
        ),
    )

    graph.add_node(
        "mongo",
        tracked_agent(
            "MongoDB Agent",
            mongo_agent,
        ),
    )

    graph.add_node(
        "confidence",
        tracked_agent(
            "Confidence Agent",
            confidence_agent,
        ),
    )

    graph.add_node(
        "clarify",
        tracked_agent(
            "Clarification Agent",
            clarification_agent,
        ),
    )

    graph.add_node(
        "escalate",
        tracked_agent(
            "Escalation Agent",
            escalation_agent,
        ),
    )

    graph.set_entry_point(
        "intent"
    )

    graph.add_conditional_edges(
        "intent",
        route_after_intent,
        {
            "rag": "rag",
            "mongo": "mongo",
        },
    )

    graph.add_edge(
        "rag",
        "confidence",
    )

    graph.add_edge(
        "mongo",
        "confidence",
    )

    graph.add_conditional_edges(
        "confidence",
        lambda state: state["action"],
        {
            "answer": END,
            "clarify": "clarify",
            "escalate": "escalate",
        },
    )

    return graph.compile()