from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from pydantic import BaseModel

from backend.app.core.database import (
    tickets_collection,
)

from backend.app.core.security import (
    get_current_user,
    require_support_agent,
)


router = APIRouter(
    prefix="/tickets",
    tags=["Tickets"],
)


class TicketStatusUpdate(BaseModel):
    status: str


def serialize_ticket(ticket):
    ticket["_id"] = str(
        ticket["_id"]
    )

    return ticket


# ============================================================
# Get all tickets
# Admin + Support Agent
# ============================================================

@router.get("/")
def get_tickets(
    limit: int = 50,
    current_user=Depends(
        require_support_agent
    ),
):

    limit = max(
        1,
        min(limit, 100),
    )

    tickets = (
        tickets_collection
        .find()
        .limit(limit)
    )

    return [
        serialize_ticket(ticket)
        for ticket in tickets
    ]


# ============================================================
# Get one ticket
# Admin + Support Agent + Customer (own ticket)
# ============================================================

@router.get("/{ticket_id}")
def get_ticket(
    ticket_id: str,
    current_user=Depends(
        get_current_user
    ),
):

    ticket = (
        tickets_collection.find_one(
            {
                "ticket_id": ticket_id
            }
        )
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )

    role = current_user.get(
        "role"
    )

    # Customers can only access
    # their own tickets.
    if role == "customer":

        customer_id = (
            current_user.get(
                "customer_id"
            )
        )

        if (
            not customer_id
            or ticket.get("customer_id")
            != customer_id
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "You can only access "
                    "your own tickets"
                ),
            )

    return serialize_ticket(
        ticket
    )


# ============================================================
# Get tickets for a customer
# Admin + Support Agent + Customer (own tickets)
# ============================================================

@router.get(
    "/customer/{customer_id}"
)
def get_customer_tickets(
    customer_id: str,
    current_user=Depends(
        get_current_user
    ),
):

    role = current_user.get(
        "role"
    )

    # Customers can only request
    # their own tickets.
    if role == "customer":

        own_customer_id = (
            current_user.get(
                "customer_id"
            )
        )

        if (
            not own_customer_id
            or own_customer_id
            != customer_id
        ):
            raise HTTPException(
                status_code=403,
                detail=(
                    "You can only access "
                    "your own tickets"
                ),
            )

    tickets = tickets_collection.find(
        {
            "customer_id": customer_id
        }
    )

    return [
        serialize_ticket(ticket)
        for ticket in tickets
    ]


# ============================================================
# Update ticket status
# Admin + Support Agent only
# ============================================================

@router.patch(
    "/{ticket_id}"
)
def update_ticket_status(
    ticket_id: str,
    request: TicketStatusUpdate,
    current_user=Depends(
        require_support_agent
    ),
):

    allowed_statuses = {
        "open",
        "in_progress",
        "resolved",
        "escalated",
    }

    new_status = request.status.strip().lower()

    if new_status not in allowed_statuses:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid status. Allowed values: "
                "open, in_progress, resolved, escalated"
            ),
        )


    # --------------------------------------------------------
    # Find ticket
    # --------------------------------------------------------

    ticket = (
        tickets_collection.find_one(
            {
                "ticket_id": ticket_id
            }
        )
    )

    if not ticket:
        raise HTTPException(
            status_code=404,
            detail="Ticket not found",
        )


    # --------------------------------------------------------
    # Update
    # --------------------------------------------------------

    update_fields = {
        "status": new_status,
        "updated_at": datetime.now(
            timezone.utc
        ),
    }


    # Automatically assign the current
    # support user if the ticket is unassigned.
    if not ticket.get("assigned_to"):

        update_fields[
            "assigned_to"
        ] = current_user.get(
            "username"
        )


    tickets_collection.update_one(
        {
            "ticket_id": ticket_id
        },
        {
            "$set": update_fields
        },
    )


    # --------------------------------------------------------
    # Return updated ticket
    # --------------------------------------------------------

    updated_ticket = (
        tickets_collection.find_one(
            {
                "ticket_id": ticket_id
            }
        )
    )

    return serialize_ticket(
        updated_ticket
    )