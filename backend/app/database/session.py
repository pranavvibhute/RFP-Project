from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
from app.database.base import Base
# Import all models so Base.metadata knows about them
import app.models  # noqa

database_url = settings.DATABASE_URL
connect_args = {}

if database_url.startswith("sqlite"):
    connect_args = {"check_same_thread": False}

try:
    engine = create_engine(
        database_url,
        connect_args=connect_args,
        echo=settings.DEBUG,
    )
    # Test connection
    with engine.connect() as conn:
        pass
except Exception as e:
    # Fallback to local SQLite database if remote PostgreSQL is unreachable
    local_sqlite_url = "sqlite:///./rfp_database.db"
    engine = create_engine(
        local_sqlite_url,
        connect_args={"check_same_thread": False},
        echo=False,
    )

# Automatically ensure database tables exist
Base.metadata.create_all(bind=engine)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

def get_db():
    db = SessionLocal()
    try:
        yield db

    finally:
        db.close()
