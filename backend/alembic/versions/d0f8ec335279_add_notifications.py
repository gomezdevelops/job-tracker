"""add notifications

Revision ID: d0f8ec335279
Revises: 2072b1c241d4
Create Date: 2026-10-03 15:20:27.990976

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql


# revision identifiers, used by Alembic.
revision: str = "d0f8ec335279"
down_revision: Union[str, Sequence[str], None] = "2072b1c241d4"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "notifications",
        sa.Column(
            "id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            nullable=False,
        ),
        sa.Column(
            "type",
            sa.String(length=50),
            nullable=False,
        ),
        sa.Column(
            "title",
            sa.String(length=255),
            nullable=False,
        ),
        sa.Column(
            "message",
            sa.Text(),
            nullable=False,
        ),
        sa.Column(
            "application_id",
            postgresql.UUID(as_uuid=True),
            nullable=True,
        ),
        sa.Column(
            "is_read",
            sa.Boolean(),
            nullable=False,
        ),
        sa.Column(
            "created_at",
            sa.DateTime(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["application_id"],
            ["applications.id"],
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_index(
        "ix_notifications_user_id",
        "notifications",
        ["user_id"],
    )

    op.create_index(
        "ix_notifications_type",
        "notifications",
        ["type"],
    )

    op.create_index(
        "ix_notifications_application_id",
        "notifications",
        ["application_id"],
    )

    op.create_index(
        "ix_notifications_is_read",
        "notifications",
        ["is_read"],
    )

    op.create_index(
        "ix_notifications_created_at",
        "notifications",
        ["created_at"],
    )


def downgrade() -> None:
    pass