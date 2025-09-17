import uvicorn
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlmodel import Session
from models.database import create_db_and_tables, get_session, User, VPSPlan, FAQ
from core.auth import get_password_hash
from core.settings import settings

# Import all route modules
from routes import auth, vps_plans, orders, payment, support, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create database tables
    create_db_and_tables()
    
    # Create default admin user if doesn't exist
    with Session(bind=get_session().__next__().bind) as session:
        from sqlmodel import select
        admin_exists = session.exec(select(User).where(User.email == settings.ADMIN_EMAIL)).first()
        if not admin_exists:
            admin_user = User(
                email=settings.ADMIN_EMAIL,
                hashed_password=get_password_hash(settings.ADMIN_PASSWORD),
                full_name="System Administrator",
                role="admin",
                is_active=True,
                is_verified=True
            )
            session.add(admin_user)
            session.commit()
            print(f"Created admin user: {settings.ADMIN_EMAIL}")
        
        # Create sample VPS plans if none exist
        existing_plans = session.exec(select(VPSPlan)).first()
        if not existing_plans:
            sample_plans = [
                VPSPlan(
                    name="Starter",
                    description="Perfect for small projects and testing",
                    cpu_cores=1,
                    ram_gb=1,
                    storage_type="SSD",
                    storage_gb=20,
                    bandwidth_gb=1000,
                    monthly_price=5.99
                ),
                VPSPlan(
                    name="Basic",
                    description="Great for small websites and applications",
                    cpu_cores=2,
                    ram_gb=2,
                    storage_type="SSD",
                    storage_gb=40,
                    bandwidth_gb=2000,
                    monthly_price=12.99
                ),
                VPSPlan(
                    name="Professional",
                    description="Ideal for growing businesses",
                    cpu_cores=4,
                    ram_gb=8,
                    storage_type="NVMe",
                    storage_gb=80,
                    bandwidth_gb=4000,
                    monthly_price=29.99
                ),
                VPSPlan(
                    name="Enterprise",
                    description="High-performance for demanding applications",
                    cpu_cores=8,
                    ram_gb=16,
                    storage_type="NVMe",
                    storage_gb=160,
                    bandwidth_gb=8000,
                    monthly_price=59.99
                )
            ]
            
            for plan in sample_plans:
                session.add(plan)
            session.commit()
            print("Created sample VPS plans")
        
        # Create sample FAQs if none exist
        existing_faqs = session.exec(select(FAQ)).first()
        if not existing_faqs:
            sample_faqs = [
                FAQ(
                    question="What is included in my VPS?",
                    answer="Each VPS includes dedicated CPU cores, RAM, SSD/NVMe storage, bandwidth allowance, root access, and 24/7 support.",
                    category="general",
                    order_index=1
                ),
                FAQ(
                    question="How long does VPS setup take?",
                    answer="VPS setup is automated and typically takes 5-10 minutes after payment confirmation.",
                    category="technical",
                    order_index=2
                ),
                FAQ(
                    question="What payment methods do you accept?",
                    answer="We accept QR code bank transfers, MoMo wallet, and VNPay for your convenience.",
                    category="billing",
                    order_index=3
                ),
                FAQ(
                    question="Can I upgrade my VPS later?",
                    answer="Yes, you can upgrade your VPS resources anytime through your control panel with zero downtime.",
                    category="technical",
                    order_index=4
                ),
                FAQ(
                    question="Do you provide backups?",
                    answer="Yes, daily automated backups are included with all plans. You can also create manual backups.",
                    category="technical",
                    order_index=5
                )
            ]
            
            for faq in sample_faqs:
                session.add(faq)
            session.commit()
            print("Created sample FAQs")
    
    yield

app = FastAPI(
    debug="True",
    title="VPS Rental API",
    description="Comprehensive API for managing VPS rentals with payment processing and support",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
    contact={
        "name": "VPS Rental API Support",
        "url": "http://localhost:8000/docs",
        "email": "support@vpsrentalapi.com",
    },
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(vps_plans.router)
app.include_router(orders.router)
app.include_router(payment.router)
app.include_router(support.router)
app.include_router(admin.router)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to the VPS Rental API!",
        "version": "1.0.0",
        "docs": "/docs",
        "features": [
            "User authentication with email verification",
            "VPS plan management",
            "Shopping cart and orders",
            "Multiple payment methods (QR, MoMo, VNPay)",
            "Customer support system",
            "Admin dashboard and analytics",
            "FAQ and chatbot support"
        ]
    }

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": "2025-01-27T10:00:00Z"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
