"""add notification dedupe key

Revision ID: dfea7c7ef11e
Revises: d0f8ec335279
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "dfea7c7ef11e"
down_revision: Union[str, Sequence[str], None] = "d0f8ec335279"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "notifications",
        sa.Column("dedupe_key", sa.String(length=255), nullable=True),
    )

    op.create_index(
        "ix_notifications_dedupe_key",
        "notifications",
        ["dedupe_key"],
        unique=True,
    )


def downgrade() -> None:
    op.drop_index(
        "ix_notifications_dedupe_key",
        table_name="notifications",
    )

    op.drop_column(
        "notifications",
        "dedupe_key",
    )