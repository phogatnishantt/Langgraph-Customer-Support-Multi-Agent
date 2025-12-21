from langgraph.graph import StateGraph, END
from core.state import SupportState
from langsmith import traceable
from agents.intent_agent import intent_agent
from agents.rag_agent import rag_agent
from agents.confidence_agent import confidence_agent
from agents.clarification_agent import clarification_agent
from agents.escalation_agent import escalation_agent

def build_graph():
    graph = StateGraph(SupportState)

    graph.add_node("intent", intent_agent)
    graph.add_node("rag",rag_agent)
    graph.add_node("confidence", confidence_agent)
    graph.add_node("clarify", clarification_agent)
    graph.add_node("escalate", escalation_agent)


    graph.set_entry_point("intent")

    graph.add_edge("intent", "rag")
    graph.add_edge("rag", "confidence")

    graph.add_conditional_edges(
        "confidence",
        lambda s: s["action"],
        {
            "answer":END,
            "clarify":"clarify",
            "escalate":"escalate"
        }
    )

    return graph.compile()