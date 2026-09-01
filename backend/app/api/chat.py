from datetime import datetime, timezone

from bson import ObjectId

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import BaseModel

from backend.app.core.database import (
    conversations_collection,
)

from backend.app.core.security import (
    get_current_user,
)

from backend.app.integrations.support_agent import (
    SupportAgent,
)


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


support_agent = SupportAgent()


class ChatRequest(BaseModel):
    message: str
    conversation_id: str
    customer_id: str | None = None


class ChatResponse(BaseModel):
    answer: str
    action: str | None = None
    confidence: float | None = None


# ============================================================
# Chat
# Authenticated users only
# ============================================================

@router.post(
    "/",
    response_model=ChatResponse,
)
def chat(
    request: ChatRequest,
    current_user=Depends(
        get_current_user
    ),
):

    # --------------------------------------------------------
    # Validate conversation ID
    # --------------------------------------------------------

    try:
        conversation_id = ObjectId(
            request.conversation_id
        )

    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid conversation ID",
        )


    # --------------------------------------------------------
    # Check conversation exists
    # --------------------------------------------------------

    conversation = (
        conversations_collection.find_one(
            {
                "_id": conversation_id
            }
        )
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )


    # --------------------------------------------------------
    # Customer access control
    # --------------------------------------------------------

    role = current_user.get(
        "role"
    )

    authenticated_customer_id = (
        current_user.get(
            "customer_id"
        )
    )


    # A customer cannot send a message
    # on behalf of another customer.
    if role == "customer":

        if not authenticated_customer_id:
            raise HTTPException(
                status_code=403,
                detail=(
                    "Customer account is not "
                    "linked to a customer profile"
                ),
            )

        if (
            request.customer_id
            and request.customer_id
            != authenticated_customer_id
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "You can only use your "
                    "own customer identity"
                ),
            )

        # Force the customer ID to the
        # authenticated customer's ID.
        effective_customer_id = (
            authenticated_customer_id
        )

    else:

        # Admin / support agent may select
        # a customer from the workspace.
        effective_customer_id = (
            request.customer_id
        )


    # --------------------------------------------------------
    # Save user message
    # --------------------------------------------------------

    user_message = {
        "role": "user",
        "content": request.message,
        "timestamp": datetime.now(
            timezone.utc
        ),
    }


    conversations_collection.update_one(
        {
            "_id": conversation_id
        },
        {
            "$push": {
                "messages": user_message
            },

            "$set": {
                "updated_at": datetime.now(
                    timezone.utc
                ),

                "customer_id":
                    effective_customer_id,
            },
        },
    )


    # --------------------------------------------------------
    # Run support agent
    # --------------------------------------------------------

    try:

        result = support_agent.run(
            request.message,
            customer_id=effective_customer_id,
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e),
        )


    # --------------------------------------------------------
    # Save assistant message
    # --------------------------------------------------------

    assistant_message = {
        "role": "assistant",
        "content": result.get(
            "answer",
            "",
        ),
        "action": result.get(
            "action"
        ),
        "confidence": result.get(
            "answer_confidence"
        ),
        "timestamp": datetime.now(
            timezone.utc
        ),
    }


    conversations_collection.update_one(
        {
            "_id": conversation_id
        },
        {
            "$push": {
                "messages":
                    assistant_message
            },

            "$set": {
                "updated_at": datetime.now(
                    timezone.utc
                )
            },
        },
    )


    # --------------------------------------------------------
    # Return response
    # --------------------------------------------------------

    return ChatResponse(
        answer=result.get(
            "answer",
            "",
        ),
        action=result.get(
            "action"
        ),
        confidence=result.get(
            "answer_confidence"
        ),
    )