from fastapi import APIRouter, Depends, HTTPException

from backend.app.core.database import (
    orders_collection,
)

from backend.app.core.security import (
    get_current_user,
    require_support_agent,
)


router = APIRouter(
    prefix="/orders",
    tags=["Orders"],
)


def serialize_order(order):
    order["_id"] = str(
        order["_id"]
    )

    return order


# ============================================================
# Get all orders
# Admin + Support Agent
# ============================================================

@router.get("/")
def get_orders(
    limit: int = 50,
    current_user=Depends(
        require_support_agent
    ),
):

    limit = max(
        1,
        min(limit, 100),
    )

    orders = (
        orders_collection
        .find()
        .limit(limit)
    )

    return [
        serialize_order(order)
        for order in orders
    ]


# ============================================================
# Get one order
# Admin + Support Agent + Customer (own order)
# ============================================================

@router.get("/{order_number}")
def get_order(
    order_number: str,
    current_user=Depends(
        get_current_user
    ),
):

    order = (
        orders_collection.find_one(
            {
                "order_number":
                    order_number
            }
        )
    )

    if not order:
        raise HTTPException(
            status_code=404,
            detail="Order not found",
        )

    role = current_user.get(
        "role"
    )

    # Customers can only access
    # orders belonging to themselves.
    if role == "customer":

        customer_id = (
            current_user.get(
                "customer_id"
            )
        )

        if (
            not customer_id
            or order.get("customer_id")
            != customer_id
        ):
            raise HTTPException(
                status_code=403,
                detail="You can only access your own orders",
            )

    return serialize_order(
        order
    )


# ============================================================
# Get orders for a customer
# Admin + Support Agent + Customer (own orders)
# ============================================================

@router.get(
    "/customer/{customer_id}"
)
def get_customer_orders(
    customer_id: str,
    current_user=Depends(
        get_current_user
    ),
):

    role = current_user.get(
        "role"
    )

    # Customers may only request
    # their own orders.
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
                detail="You can only access your own orders",
            )

    orders = orders_collection.find(
        {
            "customer_id":
                customer_id
        }
    )

    return [
        serialize_order(order)
        for order in orders
    ]