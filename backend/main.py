import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.core import settings, register_exception_handlers
from backend.db import init_db
from backend.routes import (
    auth_router,
    users_router,
    vps_router,
    vps_admin_router,
    proxmox_router,
    vps_plans_router,
    cart_router,
    promotion_router,
    payment_router,
    vnc_websocket_router,
    orders_router,
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


# CORS origins - include Proxmox host for VNC WebSocket
origins = list(settings.ALLOWED_ORIGINS)
# Add Proxmox VNC WebSocket origins
proxmox_origins = [
    f"https://{settings.PROXMOX_HOST}:{settings.PROXMOX_PORT}",
    f"wss://{settings.PROXMOX_HOST}:{settings.PROXMOX_PORT}",
    f"https://{settings.PROXMOX_HOST}",
    "https://10.10.1.2:8006",
    "wss://10.10.1.2:8006",
]
origins.extend(proxmox_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins for WebSocket compatibility
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Register all custom exception handlers
register_exception_handlers(app)


api_prefix = settings.API_PREFIX

app.include_router(auth_router, prefix=api_prefix)
app.include_router(users_router, prefix=api_prefix)
app.include_router(vps_plans_router, prefix=api_prefix)
app.include_router(cart_router, prefix=api_prefix)
app.include_router(orders_router, prefix=api_prefix)
app.include_router(payment_router, prefix=api_prefix)
app.include_router(promotion_router, prefix=api_prefix)
app.include_router(vps_router, prefix=api_prefix)
app.include_router(vps_admin_router, prefix=api_prefix)
app.include_router(vnc_websocket_router, prefix=api_prefix)
app.include_router(proxmox_router, prefix=api_prefix)


@app.get(f"{api_prefix}/")
def health_check():
    return {"message": "Welcome to the VPS Rental API!"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
