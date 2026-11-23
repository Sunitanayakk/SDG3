"""Read-only PostgreSQL readiness check. Suppresses connection strings and secrets."""

import json

from sqlalchemy import create_engine, inspect, text

from app.core.config import settings
from app.database.session import Base
from app.models import entities  # noqa: F401


def main():
    cfg = settings()
    engine = None
    try:
        engine = create_engine(
            cfg.database_url,
            connect_args={"connect_timeout": 12},
            pool_pre_ping=True,
        )
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
            tables = set(inspect(connection).get_table_names(schema="public"))
            project_tables = sorted(set(Base.metadata.tables) & tables)
            revision = (
                connection.execute(text("SELECT version_num FROM public.alembic_version")).scalar()
                if "alembic_version" in tables
                else None
            )
            vector = connection.execute(
                text("SELECT extversion FROM pg_extension WHERE extname='vector'")
            ).scalar()
            rls_count = connection.execute(
                text(
                    "SELECT count(*) FROM pg_tables WHERE schemaname='public' "
                    "AND tablename=ANY(:names) AND rowsecurity"
                ),
                {"names": project_tables},
            ).scalar()
            public_access_count = connection.execute(
                text(
                    "SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename=ANY(:names) "
                    "AND (has_table_privilege('anon', quote_ident(schemaname)||'.'||quote_ident(tablename), "
                    "'SELECT,INSERT,UPDATE,DELETE') OR "
                    "has_table_privilege('authenticated', quote_ident(schemaname)||'.'||quote_ident(tablename), "
                    "'SELECT,INSERT,UPDATE,DELETE'))"
                ),
                {"names": project_tables},
            ).scalar()
            vector_type = connection.execute(
                text(
                    "SELECT format_type(atttypid, atttypmod) FROM pg_attribute "
                    "WHERE attrelid=to_regclass('public.document_chunks') AND attname='embedding' AND NOT attisdropped"
                )
            ).scalar()
            hnsw = connection.execute(
                text(
                    "SELECT EXISTS(SELECT 1 FROM pg_indexes WHERE schemaname='public' "
                    "AND indexname='chunks_embedding_hnsw' AND indexdef LIKE '%USING hnsw%')"
                )
            ).scalar()
            print(
                json.dumps(
                    {
                        "connection": "ok",
                        "dialect": connection.dialect.name,
                        "ssl_in_use": bool(connection.connection.driver_connection.pgconn.ssl_in_use),
                        "application_mode": "demo" if cfg.demo_mode else "real",
                        "existing_project_tables": project_tables,
                        "alembic_revision": revision,
                        "pgvector_extension_version": vector,
                        "vector_embedding_type": vector_type,
                        "hnsw_index_exists": hnsw,
                        "rls_enabled_table_count": rls_count,
                        "public_clients_have_no_table_crud_access": public_access_count == 0,
                        "configured_embedding_dimensions": cfg.embedding_dimensions,
                        "check_scope": "read-only; no migrations or seed data applied",
                    }
                )
            )
    except Exception as exc:
        print(
            json.dumps(
                {
                    "connection": "failed",
                    "error_type": type(exc).__name__,
                    "sqlstate": getattr(getattr(exc, "orig", None), "sqlstate", None),
                    "message": "Database connection check failed; credentials and private diagnostics suppressed.",
                }
            )
        )
        raise SystemExit(1) from None
    finally:
        if engine is not None:
            engine.dispose()


if __name__ == "__main__":
    main()
