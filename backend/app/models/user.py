from datetime import datetime, timezone


def user_document(
    username: str,
    email: str,
    password_hash: str,
    role: str = "customer",
    customer_id: str | None = None,
):
    now = datetime.now(timezone.utc)

    return {
        "username": username,
        "email": email.lower().strip(),
        "password_hash": password_hash,
        "role": role,
        "customer_id": customer_id,
        "is_active": True,
        "created_at": now,
        "updated_at": now,
    }