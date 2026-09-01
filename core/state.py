from typing import TypedDict, Literal, List, Optional


class SupportState(TypedDict, total=False):
    user_query: str

    customer_id: str | None
    
    intent: str
    intent_confidence: float

    retrieved_docs: List[str]

    customer_data: Optional[dict]
    order_data: Optional[dict]
    ticket_data: Optional[dict]

    answer: str
    answer_confidence: float

    force_escalate: bool

    action: Literal[
        "answer",
        "clarify",
        "escalate"
    ]