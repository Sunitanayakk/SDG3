"""Create an explicitly requested Supabase admin. Never prints credentials or tokens."""

import argparse
import json
import os
import re
import secrets
from pathlib import Path

import httpx
from dotenv import dotenv_values, set_key
from sqlalchemy import select

from app.core.config import settings
from app.database.session import SessionLocal
from app.models.entities import Role, User


def provision(email):
    cfg = settings()
    if cfg.demo_mode or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", email):
        raise ValueError("Real mode and a valid administrator email are required")
    if not cfg.supabase_service_role_key:
        raise ValueError("Server-side Supabase administration credential is missing")
    credentials_file = Path(__file__).resolve().parents[1] / ".env.admin.local"
    saved = dotenv_values(credentials_file) if credentials_file.exists() else {}
    with httpx.Client(
        base_url=cfg.supabase_url.rstrip("/"),
        timeout=30,
        headers={
            "apikey": cfg.supabase_service_role_key,
            "Authorization": "Bearer " + cfg.supabase_service_role_key,
        },
    ) as client:
        match = None
        for page in range(1, 21):
            response = client.get("/auth/v1/admin/users", params={"page": page, "per_page": 100})
            response.raise_for_status()
            users = response.json().get("users", [])
            match = next((u for u in users if u.get("email", "").casefold() == email.casefold()), None)
            if match or len(users) < 100:
                break
        created = match is None
        if created:
            password = secrets.token_urlsafe(36)
            response = client.post(
                "/auth/v1/admin/users",
                json={
                    "email": email,
                    "password": password,
                    "email_confirm": True,
                    "user_metadata": {"display_name": "SwasthyaSetu administrator"},
                },
            )
            response.raise_for_status()
            match = response.json()
            credentials_file.touch(mode=0o600, exist_ok=True)
            os.chmod(credentials_file, 0o600)
            set_key(credentials_file, "SUPABASE_ADMIN_EMAIL", email)
            set_key(credentials_file, "SUPABASE_ADMIN_PASSWORD", password)
            set_key(credentials_file, "SUPABASE_ADMIN_USER_ID", match["id"])
        else:
            # Never reset an existing account's password.
            password = (
                saved.get("SUPABASE_ADMIN_PASSWORD")
                if saved.get("SUPABASE_ADMIN_USER_ID") == match["id"]
                else None
            )
        with SessionLocal() as db:
            user = db.get(User, match["id"])
            if not user:
                user = User(id=match["id"], display_name="Administrator", synthetic=False)
                db.add(user)
                db.flush()
            if not db.scalar(select(Role).where(Role.user_id == user.id, Role.name == "admin")):
                db.add(Role(user_id=user.id, name="admin"))
            db.commit()
        login_verified = False
        if password:
            response = client.post(
                "/auth/v1/token?grant_type=password",
                headers={"apikey": cfg.supabase_anon_key, "Authorization": "Bearer " + cfg.supabase_anon_key},
                json={"email": email, "password": password},
            )
            response.raise_for_status()
            login_verified = bool(response.json().get("access_token"))
        return {
            "status": "ok",
            "account_created": created,
            "admin_role": "granted",
            "user_id": match["id"],
            "password_login_verified": login_verified,
            "credentials_file": str(credentials_file) if password else "Existing password preserved",
            "email_sent": False,
        }


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--email", required=True)
    args = parser.parse_args()
    try:
        print(json.dumps(provision(args.email)))
    except Exception as exc:
        print(
            json.dumps(
                {
                    "status": "failed",
                    "error_type": type(exc).__name__,
                    "details": "Private credential and service details suppressed.",
                }
            )
        )
        raise SystemExit(1) from None
