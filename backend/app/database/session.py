from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings
<<<<<<< HEAD

engine = create_engine(
    settings.DATABASE_URL,
    echo=settings.DEBUG,
)
=======
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
>>>>>>> 81fe21d (feat: complete backend/frontend platform implementation, root .gitignore, and updated README)

SessionLocal = sessionmaker(
    bind=engine,
    autoflush=False,
    autocommit=False,
)

def get_db():
    db = SessionLocal()
    try:
        yield db
<<<<<<< HEAD

=======
>>>>>>> 81fe21d (feat: complete backend/frontend platform implementation, root .gitignore, and updated README)
    finally:
        db.close()
