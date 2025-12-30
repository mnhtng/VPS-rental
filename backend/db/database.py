from sqlmodel import SQLModel, create_engine, Session
from backend.core.settings import settings


engine = create_engine(settings.DATABASE_URL, echo=True)


def get_session():
    """
    Dependency function to get database session.
    Usage in FastAPI route: session: Session = Depends(get_session)
    """

    with Session(engine) as session:
        yield session


def init_db():
    """
    Create all database tables defined in SQLModel models.
    Call this function on application startup.
    """

    SQLModel.metadata.create_all(engine)
