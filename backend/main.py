import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.core import settings, register_exception_handlers
from backend.db import init_db
from backend.routes import (
    auth_router,
    users_router,
    proxmox_router,
    proxmox_iaas_router,
)


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
    openapi_url="/openapi.json",
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

# Register all custom exception handlers
register_exception_handlers(app)


api_prefix = settings.API_PREFIX

app.include_router(auth_router, prefix=api_prefix)
app.include_router(users_router, prefix=api_prefix)
app.include_router(proxmox_router, prefix=api_prefix)
app.include_router(proxmox_iaas_router, prefix=api_prefix)


@app.get(f"{api_prefix}/")
def read_root():
    return {"message": "Welcome to the VPS Rental API!"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
