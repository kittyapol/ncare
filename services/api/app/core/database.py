from typing import Any

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.config import settings

# Create database engine with conditional configuration based on database type
db_url = settings.DATABASE_URL
engine_kwargs: dict[str, Any] = {"pool_pre_ping": True}

# SQLite doesn't support pool_size and max_overflow
if "sqlite" not in db_url.lower():
    engine_kwargs.update({"pool_size": 10, "max_overflow": 20})
else:
    # For SQLite, use StaticPool for in-memory databases
    if ":memory:" in db_url or "mode=memory" in db_url:
        engine_kwargs.update(
            {"connect_args": {"check_same_thread": False}, "poolclass": StaticPool}
        )

engine = create_engine(db_url, **engine_kwargs)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Base class for models
Base = declarative_base()


def get_db():
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
