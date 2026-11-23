import secrets
from datetime import datetime, timedelta, timezone
from functools import lru_cache

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.session import get_db
from app.models.entities import Role, User

security = HTTPBearer(auto_error=False)
demo_secret = secrets.token_urlsafe(48)


@lru_cache(maxsize=4)
def jwks_client(issuer):
    return jwt.PyJWKClient(issuer + "/.well-known/jwks.json", cache_keys=True)


def demo_login(db: Session, admin: bool):
    if not settings().demo_mode:
        raise HTTPException(404, "Demo authentication is disabled")
    user = User(display_name="Synthetic admin" if admin else "Demo guest", synthetic=True)
    db.add(user)
    db.flush()
    if admin:
        db.add(Role(user_id=user.id, name="admin"))
    db.commit()
    token = jwt.encode(
        {"sub": user.id, "exp": datetime.now(timezone.utc) + timedelta(hours=8), "aud": "demo"},
        demo_secret,
        algorithm="HS256",
    )
    return {"access_token": token, "role": "admin" if admin else "patient", "mode": "demo"}


def principal(
    credentials: HTTPAuthorizationCredentials | None = Depends(security), db: Session = Depends(get_db)
) -> User | None:
    if not credentials:
        return None
    try:
        if settings().demo_mode:
            payload = jwt.decode(credentials.credentials, demo_secret, algorithms=["HS256"], audience="demo")
        else:
            issuer = settings().supabase_url.rstrip("/") + "/auth/v1"
            jwks = jwks_client(issuer)
            key = jwks.get_signing_key_from_jwt(credentials.credentials)
            payload = jwt.decode(
                credentials.credentials,
                key.key,
                algorithms=["RS256", "ES256"],
                audience="authenticated",
                issuer=issuer,
                options={"require": ["exp", "sub"]},
            )
        user = db.get(User, payload["sub"])
        if not user and not settings().demo_mode:
            user = User(id=payload["sub"], display_name="Member")
            db.add(user)
            db.commit()
        if not user:
            raise ValueError("Unknown user")
        return user
    except Exception:
        raise HTTPException(401, "Session invalid or expired. Sign in again.") from None


def require_user(user: User | None = Depends(principal)) -> User:
    if not user:
        raise HTTPException(401, "Authentication required")
    return user


def admin(user: User = Depends(require_user), db: Session = Depends(get_db)) -> User:
    if not db.scalar(select(Role).where(Role.user_id == user.id, Role.name == "admin")):
        raise HTTPException(403, "Administrator role required")
    return user
