from typing import TypedDict, Literal, List

class SupportState(TypedDict):
    user_query: str
    
    intent : str
    intent_confidence: float

    retrieved_docs: List[str]
    
    answer: str
    answer_confidence: float

    action: Literal["answer", "clarify", "escalate"]