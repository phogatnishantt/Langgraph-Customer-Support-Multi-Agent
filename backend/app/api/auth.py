from bson import ObjectId

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials,
)

from backend.app.core.database import (
    users_collection,
    customers_collection,
)

from backend.app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)

from backend.app.models.user import (
    user_document,
)

from backend.app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
)


router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


security = HTTPBearer()


# ============================================================
# Register
# ============================================================

@router.post(
    "/register",
    response_model=UserResponse,
)
def register(
    request: RegisterRequest,
):

    allowed_roles = {
        "customer",
        "support_agent",
        "admin",
    }

    if request.role not in allowed_roles:
        raise HTTPException(
            status_code=400,
            detail="Invalid role",
        )


    # --------------------------------------------------------
    # Customer accounts must be linked to a
    # real customer record.
    # --------------------------------------------------------

    if request.role == "customer":

        if not request.customer_id:
            raise HTTPException(
                status_code=400,
                detail=(
                    "customer_id is required "
                    "for customer accounts"
                ),
            )

        customer = (
            customers_collection.find_one(
                {
                    "customer_id":
                        request.customer_id
                }
            )
        )

        if not customer:
            raise HTTPException(
                status_code=404,
                detail="Customer not found",
            )


    # --------------------------------------------------------
    # Non-customer roles should not be linked
    # to customer records.
    # --------------------------------------------------------

    customer_id = (
        request.customer_id
        if request.role == "customer"
        else None
    )


    # --------------------------------------------------------
    # Duplicate email check
    # --------------------------------------------------------

    existing_user = (
        users_collection.find_one(
            {
                "email":
                    request.email.lower().strip()
            }
        )
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already registered",
        )


    # --------------------------------------------------------
    # Create user
    # --------------------------------------------------------

    user = user_document(
        username=request.username,
        email=request.email,
        password_hash=hash_password(
            request.password
        ),
        role=request.role,
        customer_id=customer_id,
    )


    try:
        users_collection.insert_one(user)

    except Exception as error:

        raise HTTPException(
            status_code=400,
            detail=str(error),
        )


    return UserResponse(
        username=user["username"],
        email=user["email"],
        role=user["role"],
        customer_id=user.get(
            "customer_id"
        ),
        is_active=user["is_active"],
    )


# ============================================================
# Login
# ============================================================

@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    request: LoginRequest,
):

    user = (
        users_collection.find_one(
            {
                "email":
                    request.email.lower().strip()
            }
        )
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )


    if not user.get(
        "is_active",
        False,
    ):
        raise HTTPException(
            status_code=403,
            detail="User account is inactive",
        )


    if not verify_password(
        request.password,
        user["password_hash"],
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
        )


    token = create_access_token(
        {
            "sub": str(user["_id"]),
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
            "customer_id": user.get(
                "customer_id"
            ),
        }
    )


    return TokenResponse(
        access_token=token,
        token_type="bearer",
    )


# ============================================================
# Current user
# ============================================================

@router.get(
    "/me",
    response_model=UserResponse,
)
def get_current_user_info(
    credentials: HTTPAuthorizationCredentials =
        Depends(security),
):

    token = credentials.credentials

    payload = decode_access_token(
        token
    )

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )


    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )


    try:
        object_id = ObjectId(user_id)

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid token subject",
        )


    user = (
        users_collection.find_one(
            {
                "_id": object_id
            }
        )
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )


    if not user.get(
        "is_active",
        False,
    ):
        raise HTTPException(
            status_code=403,
            detail="User account is inactive",
        )


    return UserResponse(
        username=user["username"],
        email=user["email"],
        role=user["role"],
        customer_id=user.get(
            "customer_id"
        ),
        is_active=user["is_active"],
    )