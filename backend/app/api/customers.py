from fastapi import APIRouter, Depends, HTTPException

from backend.app.core.database import (
    customers_collection,
)

from backend.app.core.security import (
    get_current_user,
    require_support_agent,
)


router = APIRouter(
    prefix="/customers",
    tags=["Customers"],
)


def serialize_customer(customer):
    customer["_id"] = str(
        customer["_id"]
    )

    return customer


# ============================================================
# Get all customers
# Admin + Support Agent
# ============================================================

@router.get("/")
def get_customers(
    limit: int = 50,
    current_user=Depends(
        require_support_agent
    ),
):

    limit = max(
        1,
        min(limit, 100),
    )

    customers = (
        customers_collection
        .find()
        .limit(limit)
    )

    return [
        serialize_customer(customer)
        for customer in customers
    ]


# ============================================================
# Get customer by ID
# Admin + Support Agent + Customer (own profile)
# ============================================================

@router.get("/{customer_id}")
def get_customer(
    customer_id: str,
    current_user=Depends(
        get_current_user
    ),
):

    role = current_user.get(
        "role"
    )

    # Customers can only access
    # their own customer record.
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
                detail="You can only access your own customer profile",
            )

    customer = (
        customers_collection.find_one(
            {
                "customer_id":
                    customer_id
            }
        )
    )

    if not customer:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    return serialize_customer(
        customer
    )