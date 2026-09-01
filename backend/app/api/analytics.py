from fastapi import APIRouter, Depends

from backend.app.core.database import (
    customers_collection,
    orders_collection,
    tickets_collection,
    conversations_collection,
    agent_runs_collection,
)

from backend.app.core.security import (
    require_admin,
)


router = APIRouter(
    prefix="/analytics",
    tags=["Analytics"],
)


# ============================================================
# Analytics overview
# Admin only
# ============================================================

@router.get("/")
def get_analytics(
    current_user=Depends(require_admin),
):
    # --------------------------------------------------------
    # Basic totals
    # --------------------------------------------------------

    total_customers = (
        customers_collection.count_documents({})
    )

    total_orders = (
        orders_collection.count_documents({})
    )

    total_tickets = (
        tickets_collection.count_documents({})
    )

    total_conversations = (
        conversations_collection.count_documents({})
    )


    # --------------------------------------------------------
    # Customer status
    # --------------------------------------------------------

    active_customers = (
        customers_collection.count_documents(
            {
                "status": "active"
            }
        )
    )

    inactive_customers = (
        customers_collection.count_documents(
            {
                "status": "inactive"
            }
        )
    )


    # --------------------------------------------------------
    # Order status
    # --------------------------------------------------------

    order_statuses = [
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
    ]

    orders_by_status = {}

    for status in order_statuses:
        orders_by_status[status] = (
            orders_collection.count_documents(
                {
                    "status": status
                }
            )
        )


    # --------------------------------------------------------
    # Ticket status
    # --------------------------------------------------------

    ticket_statuses = [
        "open",
        "in_progress",
        "resolved",
        "escalated",
    ]

    tickets_by_status = {}

    for status in ticket_statuses:
        tickets_by_status[status] = (
            tickets_collection.count_documents(
                {
                    "status": status
                }
            )
        )


    # --------------------------------------------------------
    # Ticket priority
    # --------------------------------------------------------

    priorities = [
        "low",
        "medium",
        "high",
        "critical",
    ]

    tickets_by_priority = {}

    for priority in priorities:
        tickets_by_priority[priority] = (
            tickets_collection.count_documents(
                {
                    "priority": priority
                }
            )
        )


    # --------------------------------------------------------
    # Ticket assignment
    # --------------------------------------------------------

    assigned_tickets = (
        tickets_collection.count_documents(
            {
                "assigned_to": {
                    "$nin": [
                        None,
                        "",
                    ]
                }
            }
        )
    )

    unassigned_tickets = (
        tickets_collection.count_documents(
            {
                "$or": [
                    {
                        "assigned_to": None
                    },
                    {
                        "assigned_to": ""
                    },
                ]
            }
        )
    )


    # --------------------------------------------------------
    # Resolution rate
    # --------------------------------------------------------

    resolved_tickets = (
        tickets_collection.count_documents(
            {
                "status": "resolved"
            }
        )
    )

    if total_tickets > 0:
        resolution_rate = round(
            resolved_tickets /
            total_tickets,
            4,
        )
    else:
        resolution_rate = 0.0


    # --------------------------------------------------------
    # Escalation rate
    # --------------------------------------------------------

    escalated_tickets = (
        tickets_collection.count_documents(
            {
                "status": "escalated"
            }
        )
    )

    if total_tickets > 0:
        escalation_rate = round(
            escalated_tickets /
            total_tickets,
            4,
        )
    else:
        escalation_rate = 0.0


    # --------------------------------------------------------
    # Response
    # --------------------------------------------------------

    return {
        "totals": {
            "customers": total_customers,
            "orders": total_orders,
            "tickets": total_tickets,
            "conversations": total_conversations,
        },

        "customers": {
            "active": active_customers,
            "inactive": inactive_customers,
        },

        "orders": {
            "by_status": orders_by_status,
        },

        "tickets": {
            "by_status": tickets_by_status,
            "by_priority": tickets_by_priority,
            "assigned": assigned_tickets,
            "unassigned": unassigned_tickets,
            "resolved": resolved_tickets,
            "escalated": escalated_tickets,
            "resolution_rate": resolution_rate,
            "escalation_rate": escalation_rate,
        },
    }


# ============================================================
# Agent execution history
# Admin only
# ============================================================

@router.get("/agent-runs")
def get_agent_runs(
    limit: int = 20,
    current_user=Depends(require_admin),
):
    # Prevent unnecessarily large requests
    limit = max(
        1,
        min(limit, 100),
    )

    runs = (
        agent_runs_collection
        .find(
            {},
            {
                "_id": 0,
                "agent": 1,
                "status": 1,
                "started_at": 1,
                "completed_at": 1,
                "duration_ms": 1,
                "user_query": 1,
                "intent": 1,
                "customer_id": 1,
                "action": 1,
                "answer_confidence": 1,
                "error": 1,
            },
        )
        .sort(
            "started_at",
            -1,
        )
        .limit(limit)
    )

    return list(runs)