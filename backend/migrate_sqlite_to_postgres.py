from __future__ import annotations

import os
from pathlib import Path

from sqlalchemy import create_engine, select
from sqlalchemy.dialects.postgresql import insert as pg_insert

from app import Base, MemoryRecord, engine as target_engine

SOURCE_DB = Path(__file__).with_name("omni_memory.db")


def main() -> None:
    if not os.getenv("DATABASE_URL"):
        raise SystemExit("DATABASE_URL is not set. Configure the Supabase session-pooler URI first.")

    if target_engine.dialect.name != "postgresql":
        raise SystemExit(
            "The target DATABASE_URL is not PostgreSQL. Check that the Supabase secret is loaded."
        )

    Base.metadata.create_all(bind=target_engine)

    if not SOURCE_DB.exists():
        print(f"No SQLite file found at {SOURCE_DB}. PostgreSQL schema is ready; nothing to migrate.")
        return

    source_engine = create_engine(f"sqlite:///{SOURCE_DB.as_posix()}")
    table = MemoryRecord.__table__

    with source_engine.connect() as source:
        records = [dict(row._mapping) for row in source.execute(select(table)).all()]

    if not records:
        print("SQLite database is empty. PostgreSQL schema is ready; nothing to migrate.")
        return

    migrated = 0
    with target_engine.begin() as target:
        for start in range(0, len(records), 100):
            batch = records[start : start + 100]
            statement = (
                pg_insert(table)
                .values(batch)
                .on_conflict_do_nothing(index_elements=[table.c.id])
            )
            result = target.execute(statement)
            migrated += result.rowcount or 0

    print(f"Read {len(records)} SQLite memories.")
    print(f"Inserted {migrated} new memories into Supabase PostgreSQL.")
    print(f"Skipped {len(records) - migrated} records already present.")
    print("The original SQLite file was not deleted.")


if __name__ == "__main__":
    main()
