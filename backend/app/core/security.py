from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

from backend.app.core.database import users_collection


# ------------------------------------------------------------
# JWT configuration
# ------------------------------------------------------------

SECRET_KEY = "change-this-secret-key-in-production"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60


# ------------------------------------------------------------
# Password hashing
# ------------------------------------------------------------

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


# ------------------------------------------------------------
# JWT creation
# ------------------------------------------------------------

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:

    to_encode = data.copy()

    if expires_delta:
        expire = (
            datetime.now(timezone.utc)
            + expires_delta
        )
    else:
        expire = (
            datetime.now(timezone.utc)
            + timedelta(
                minutes=ACCESS_TOKEN_EXPIRE_MINUTES
            )
        )

    to_encode.update(
        {"exp": expire}
    )

    return jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM,
    )


# ------------------------------------------------------------
# JWT decoding
# ------------------------------------------------------------

def decode_access_token(
    token: str,
) -> dict | None:

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        return payload

    except JWTError:
        return None


# ------------------------------------------------------------
# Authentication dependency
# ------------------------------------------------------------

bearer_scheme = HTTPBearer()


def get_current_user(
    credentials: HTTPAuthorizationCredentials =
        Depends(bearer_scheme),
):
    token = credentials.credentials

    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token",
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=401,
            detail="Invalid authentication token",
        )

    try:
        from bson import ObjectId

        object_id = ObjectId(user_id)

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid user identity",
        )

    user = users_collection.find_one(
        {"_id": object_id}
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="User not found",
        )

    if not user.get("is_active", False):
        raise HTTPException(
            status_code=403,
            detail="User account is inactive",
        )

    return user


# ------------------------------------------------------------
# Role dependencies
# ------------------------------------------------------------

def require_admin(
    current_user=Depends(get_current_user),
):
    if current_user.get("role") != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required",
        )

    return current_user


def require_support_agent(
    current_user=Depends(get_current_user),
):
    allowed_roles = {
        "admin",
        "support_agent",
    }

    if current_user.get("role") not in allowed_roles:
        raise HTTPException(
            status_code=403,
            detail="Support agent access required",
        )

    return current_user


def require_authenticated(
    current_user=Depends(get_current_user),
):
    return current_user