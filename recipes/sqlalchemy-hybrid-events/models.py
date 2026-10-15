from datetime import datetime, timezone

from sqlalchemy import String, event, func
from sqlalchemy.ext.hybrid import hybrid_property
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, column_property, mapped_column


class Base(DeclarativeBase):
    pass


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[int] = mapped_column(primary_key=True)
    first: Mapped[str] = mapped_column(String(50))
    last: Mapped[str] = mapped_column(String(50))
    created_at: Mapped[datetime | None] = mapped_column(default=None)
    updated_at: Mapped[datetime | None] = mapped_column(default=None)

    @hybrid_property
    def full_name(self) -> str:
        # instance level: plain Python value
        return f"{self.first} {self.last}"

    @full_name.expression
    def full_name(cls):
        # class level: SQL expression usable in WHERE/ORDER BY
        return cls.first + " " + cls.last


# column_property added after mapping, since it references the mapped columns
Account.name_len = column_property(func.length(Account.first) + func.length(Account.last))


@event.listens_for(Session, "before_flush")
def stamp_audit_fields(session, flush_context, instances):
    # before_flush changes are included in the same INSERT/UPDATE
    now = datetime.now(timezone.utc)
    for obj in session.new:
        if isinstance(obj, Account):
            obj.created_at = now
    for obj in session.dirty:
        if isinstance(obj, Account) and session.is_modified(obj):
            obj.updated_at = now
