import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from backend.core.settings import settings
from backend.db.database import init_db
# from backend.routes import auth, vps_plans, orders, payment, support, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup code
    init_db()
    yield
    # Shutdown code (if any)
    pass


app = FastAPI(
    debug=settings.DEBUG,
    title="VPS Rental API",
    description="Comprehensive API for managing VPS rentals with payment processing and support",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    contact={
        "name": "VPS Rental API Support",
        "url": "http://localhost:8000/docs",
        "email": "support@vpsrentalapi.com",
    },
)


origins = settings.ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


api_prefix = settings.API_PREFIX


@app.get(f"{api_prefix}/")
def read_root():
    return {"message": "Welcome to the VPS Rental API!"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
