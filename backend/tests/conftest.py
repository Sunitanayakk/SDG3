import asyncio
import os

import httpx
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

# Set before application imports: a normal pytest invocation must never use local
# production credentials or the configured Supabase database.
os.environ.update(
    {
        "DEMO_MODE": "true",
        "DATABASE_URL": "sqlite://",
        "NVIDIA_API_KEY": "synthetic-test-key",
        "NVIDIA_MODEL": "minimaxai/minimax-m3.1-flash",
        "SUPABASE_URL": "",
        "SUPABASE_ANON_KEY": "",
        "SUPABASE_SERVICE_ROLE_KEY": "",
        "EMBEDDING_PROVIDER": "external",
        "EMBEDDING_MODEL": "intfloat/multilingual-e5-small",
        "EMBEDDING_DIMENSIONS": "384",
        "EMBEDDING_API_KEY": "",
        "EMBEDDING_BASE_URL": "",
    }
)

from app.core.rate_limit import _windows  # noqa: E402
from app.database.seed import seed  # noqa: E402
from app.database.session import Base, get_db  # noqa: E402
from app.main import app  # noqa: E402


@pytest.fixture
def db():
    engine = create_engine("sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool)
    Base.metadata.create_all(engine)
    factory = sessionmaker(engine, expire_on_commit=False)
    with factory() as session:
        seed(session)
        yield session
    Base.metadata.drop_all(engine)
    engine.dispose()


@pytest.fixture
def client(db):
    def override():
        yield db

    app.dependency_overrides[get_db] = override
    _windows.clear()

    class Client:
        def request(self, method, path, **kwargs):
            async def call():
                async with httpx.AsyncClient(
                    transport=httpx.ASGITransport(app=app), base_url="http://test"
                ) as c:
                    return await c.request(method, path, **kwargs)

            return asyncio.run(call())

        def get(self, path, **kwargs):
            return self.request("GET", path, **kwargs)

        def post(self, path, **kwargs):
            return self.request("POST", path, **kwargs)

        def put(self, path, **kwargs):
            return self.request("PUT", path, **kwargs)

        def delete(self, path, **kwargs):
            return self.request("DELETE", path, **kwargs)

    yield Client()
    app.dependency_overrides.clear()


@pytest.fixture
def admin_headers(client):
    token = client.post("/api/v1/auth/demo?role=admin").json()["access_token"]
    return {"Authorization": "Bearer " + token}
