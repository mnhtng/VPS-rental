import logging
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from backend.core import settings, register_exception_handlers
from backend.db import init_db
from backend.services import VPSCleanupScheduler
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
    orders_admin_router,
    support_router,
    dashboard_admin_router,
    chatbot_router,
)


logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler()],
)


vps_cleanup_scheduler: VPSCleanupScheduler | None = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    global vps_cleanup_scheduler

    init_db()

    vps_cleanup_scheduler = VPSCleanupScheduler(check_interval_minutes=5)
    vps_cleanup_scheduler.start()

    yield

    if vps_cleanup_scheduler:
        vps_cleanup_scheduler.shutdown()


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
        "url": "https://api.ptitcloud.io.vn/docs",
        "email": "support@vpsrentalapi.com",
    },
)


# CORS origins
origins = list(settings.ALLOWED_ORIGINS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
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
app.include_router(orders_admin_router, prefix=api_prefix)
app.include_router(payment_router, prefix=api_prefix)
app.include_router(promotion_router, prefix=api_prefix)
app.include_router(support_router, prefix=api_prefix)
app.include_router(chatbot_router, prefix=api_prefix)
app.include_router(dashboard_admin_router, prefix=api_prefix)
app.include_router(vps_router, prefix=api_prefix)
app.include_router(vps_admin_router, prefix=api_prefix)
app.include_router(vnc_websocket_router, prefix=api_prefix)
app.include_router(proxmox_router, prefix=api_prefix)


@app.get(f"{api_prefix}/")
def health_check():
    return {"message": "Welcome to the VPS Rental API!"}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=settings.DEBUG)
