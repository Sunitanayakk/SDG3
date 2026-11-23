"""Hosted Nemotron 3 embeddings and half-precision ANN index.

2048 is the model's native dimension. pgvector's vector HNSW index supports
2000 dimensions; index a halfvec expression for the 2048-dimension column.
Only an empty chunk table can change dimension without an explicit reindex plan.
"""

from alembic import op
from sqlalchemy import text

revision = "002"
down_revision = "001"


def upgrade():
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return
    if bind.execute(text("SELECT count(*) FROM document_chunks")).scalar():
        raise RuntimeError("Embedding dimension migration requires an empty chunk table and reindex plan")
    bind.execute(text("DROP INDEX IF EXISTS chunks_embedding_hnsw"))
    bind.execute(text("ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(2048)"))
    bind.execute(
        text(
            "CREATE INDEX chunks_embedding_hnsw ON document_chunks USING hnsw "
            "((embedding::halfvec(2048)) halfvec_cosine_ops)"
        )
    )


def downgrade():
    bind = op.get_bind()
    if bind.dialect.name != "postgresql":
        return
    if bind.execute(text("SELECT count(*) FROM document_chunks")).scalar():
        raise RuntimeError("Remove/reindex document chunks explicitly before changing embedding dimensions")
    bind.execute(text("DROP INDEX IF EXISTS chunks_embedding_hnsw"))
    bind.execute(text("ALTER TABLE document_chunks ALTER COLUMN embedding TYPE vector(384)"))
    bind.execute(
        text("CREATE INDEX chunks_embedding_hnsw ON document_chunks USING hnsw (embedding vector_cosine_ops)")
    )
