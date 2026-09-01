from datetime import datetime, timezone
from bson import ObjectId
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.app.core.database import conversations_collection


router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"]
)


class ConversationCreate(BaseModel):
    customer_id: str | None = None
    title: str = "New conversation"


class MessageCreate(BaseModel):
    role: str
    content: str


def serialize_conversation(conversation):
    conversation["_id"] = str(conversation["_id"])
    return conversation


@router.post("/")
def create_conversation(data: ConversationCreate):
    conversation = {
        "customer_id": data.customer_id,
        "title": data.title,
        "status": "active",
        "messages": [],
        "created_at": datetime.now(timezone.utc),
        "updated_at": datetime.now(timezone.utc),
    }

    result = conversations_collection.insert_one(conversation)

    conversation["_id"] = result.inserted_id

    return serialize_conversation(conversation)


@router.get("/")
def get_conversations(limit: int = 50):
    conversations = (
        conversations_collection
        .find()
        .sort("updated_at", -1)
        .limit(limit)
    )

    return [
        serialize_conversation(conversation)
        for conversation in conversations
    ]


@router.get("/{conversation_id}")
def get_conversation(conversation_id: str):
    try:
        object_id = ObjectId(conversation_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid conversation ID"
        )

    conversation = conversations_collection.find_one({
        "_id": object_id
    })

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    return serialize_conversation(conversation)


@router.post("/{conversation_id}/messages")
def add_message(
    conversation_id: str,
    data: MessageCreate
):
    try:
        object_id = ObjectId(conversation_id)
    except Exception:
        raise HTTPException(
            status_code=400,
            detail="Invalid conversation ID"
        )

    message = {
        "role": data.role,
        "content": data.content,
        "timestamp": datetime.now(timezone.utc),
    }

    result = conversations_collection.update_one(
        {"_id": object_id},
        {
            "$push": {"messages": message},
            "$set": {
                "updated_at": datetime.now(timezone.utc)
            },
        }
    )

    if result.matched_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found"
        )

    return {
        "message": "Message added successfully",
        "conversation_id": conversation_id
    }