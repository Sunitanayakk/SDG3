"""Initial schema with the original 384-dimensional embedding column.

Revision 002 migrates an empty index to the hosted model's native dimensions.
"""

from alembic import op
from pgvector.sqlalchemy import Vector
from sqlalchemy import JSON, MetaData, text

from app.database.session import Base
from app.models import entities  # noqa: F401

revision = "001"
down_revision = None


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name == "postgresql":
        bind.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
    # Keep the original revision's vector shape stable even when runtime settings change.
    initial_metadata = MetaData()
    for table in Base.metadata.sorted_tables:
        table.to_metadata(initial_metadata)
    initial_metadata.tables["document_chunks"].c.embedding.type = Vector(384).with_variant(JSON, "sqlite")
    initial_metadata.create_all(bind)
    if bind.dialect.name == "postgresql":
        # Backend-owned tables: no direct access via Supabase's public Data API.
        for table in Base.metadata.sorted_tables:
            bind.execute(text(f'ALTER TABLE "{table.name}" ENABLE ROW LEVEL SECURITY'))
            bind.execute(text(f'REVOKE ALL ON "{table.name}" FROM anon, authenticated'))
        bind.execute(
            text(
                "CREATE INDEX chunks_embedding_hnsw ON document_chunks USING hnsw (embedding vector_cosine_ops)"
            )
        )


def downgrade():
    Base.metadata.drop_all(op.get_bind())
