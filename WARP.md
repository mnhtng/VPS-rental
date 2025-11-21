# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

VPS Rental Platform: A comprehensive VPS rental system with FastAPI backend and Next.js 15 frontend, featuring Proxmox integration for VPS provisioning, Vietnamese payment gateways (MoMo, VNPay), and customer support systems.

## Repository Structure

```
vps-rental/
├── backend/              # FastAPI backend (Python 3.13+)
│   ├── core/            # Settings and configuration
│   ├── db/              # Database connection and initialization
│   ├── models/          # SQLModel database models
│   ├── routes/          # API route handlers
│   ├── schemas/         # Pydantic schemas for API validation
│   ├── services/        # Business logic (payment, etc.)
│   ├── utils/           # Utility functions
│   └── main.py          # FastAPI application entry point
└── frontend/            # Next.js 15 frontend (TypeScript)
    ├── app/             # App router pages
    ├── components/      # React components
    ├── contexts/        # React contexts
    ├── hooks/           # Custom React hooks
    ├── i18n/            # Internationalization (en, vi)
    ├── lib/             # Library code and auth
    ├── services/        # API service clients
    ├── types/           # TypeScript type definitions
    └── middleware.ts    # Route protection and i18n
```

## Development Commands

### Backend

**Setup:**
```powershell
cd backend
pip install -r requirements.txt
```

**Configure environment:**
- Copy `.env.example` to `.env`
- Update `DATABASE_URL` with PostgreSQL credentials
- Configure payment gateway credentials (VNPay, MoMo)
- Set Proxmox connection details

**Run development server:**
```powershell
python main.py
```
Server runs on http://localhost:8000 with auto-reload enabled.

**API Documentation:**
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

**Database:**
- Tables are auto-created on startup via `init_db()` in `main.py`
- Default admin account created automatically (admin@vpsrental.com / admin123)

### Frontend

**Setup:**
```powershell
cd frontend
npm install
```

**Configure environment:**
Create `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Development server:**
```powershell
npm run dev              # With Turbopack (faster)
npm run dev:webpack      # With Webpack
```
Server runs on http://localhost:3000

**Build:**
```powershell
npm run build            # Production build with Turbopack
npm run build:webpack    # Production build with Webpack
```

**Linting:**
```powershell
npm run lint
```

**Database (Prisma):**
```powershell
npm run db:pull          # Pull schema from database
npm run db:push          # Push schema to database
npm run db:migrate       # Run migrations
npm run db:studio        # Open Prisma Studio
npm run db:generate      # Generate Prisma Client
npm run db:reset         # Reset database
```

## Architecture

### Backend Architecture

**Database Layer (SQLModel + PostgreSQL):**
- Models are organized by domain:
  - **User Management**: User, Account, Session, Authenticator, VerificationToken
  - **VPS Management**: VPSPlan, VPSInstance, VPSSnapshot
  - **E-commerce**: Cart, Order, OrderItem, PaymentTransaction, Promotion, UserPromotion
  - **Infrastructure**: ProxmoxCluster, ProxmoxNode, ProxmoxStorage, VMTemplate, ProxmoxVM
  - **Support**: SupportTicket, SupportTicketReply, Conversation, KnowledgeBase

**Critical SQLModel Pattern:**
- ⚠️ NEVER return relationship fields directly in API responses (causes circular reference issues)
- ✅ Always use schemas from `backend.schemas` for API responses (e.g., `RoleRead`, `RoleWithUsers`)
- Relationships are defined with `Relationship()` from SQLModel
- One-to-Many: Use `list[Model]` on "many" side, single `Model` on "one" side
- Many-to-Many: Requires `link_model` parameter pointing to junction table
- One-to-One: Use `uselist=False` on the side without FK

**API Layer (FastAPI):**
- API routes organized in `backend/routes/` by domain:
  - `auth.py` - Authentication endpoints
  - `users.py` - User management
  - `vps_plans.py` - VPS catalog
  - `orders.py` - Order management
  - `payment.py` - Payment processing
  - `support.py` - Support tickets
  - `admin.py` - Admin panel
- All routers imported and registered in `backend/routes/__init__.py`
- API prefix: `/api/v1` (configured in `core/settings.py`)
- Custom validation error handler removes "Value error, " prefix from Pydantic errors

**Service Layer:**
- Payment services in `backend/services/payment.py`:
  - `QRCodeService` - Generate QR codes for bank transfers
  - `MoMoService` - MoMo Wallet integration (create_payment)
  - `VNPayService` - VNPay gateway (create_payment, verify_payment)

**Configuration:**
- Settings managed via Pydantic Settings in `core/settings.py`
- Environment variables loaded from `.env`
- CORS origins parsed from comma-separated string in `ALLOWED_ORIGINS`

**Database Initialization:**
- `init_db()` called during FastAPI lifespan startup
- Auto-creates tables from SQLModel metadata
- Seeds initial data (admin user, VPS plans, FAQs)

### Frontend Architecture

**App Router (Next.js 15):**
- Internationalized routing with `next-intl`
- Locales: English (en), Vietnamese (vi)
- Protected routes handled in `middleware.ts`:
  - Protected: profile, my-orders, my-tickets, cart, checkout, admin
  - Uses NextAuth JWT tokens for authentication
  - Redirects to login with callback URL if unauthenticated

**Authentication:**
- NextAuth.js 5.0 (beta) with Prisma adapter
- JWT-based session management (Edge Runtime compatible)
- Auth logic in `lib/auth.ts` and `hooks/useAuth.ts`
- Backend JWT integration via `services/authService.ts`

**State Management:**
- React Context for authentication state (`contexts/`)
- Zustand for complex client state
- React Hook Form for form management with Zod validation

**UI Components:**
- Radix UI primitives for accessibility
- Tailwind CSS 4 for styling
- Custom components in `components/`
- Framer Motion for animations
- Tiptap for rich text editing (support tickets)

**Middleware Pattern:**
- `middleware.ts` runs on Edge Runtime
- Handles: i18n routing, auth protection, 404 rewrites
- Uses `getToken()` instead of `auth()` to avoid bcrypt in Edge Runtime
- Locale detection: cookies → pathname → Accept-Language → default

**Data Fetching:**
- Server Components for initial data (when possible)
- Client-side API calls via services in `services/`
- Error handling with toast notifications (sonner)

## Key Technical Decisions

1. **SQLModel over pure SQLAlchemy**: Type-safe ORM with Pydantic integration
2. **Next.js 15 with Turbopack**: Faster builds and hot reload
3. **Edge Runtime Middleware**: Requires JWT-based auth (no bcrypt)
4. **Prisma in Frontend**: Allows server-side data access in App Router
5. **Vietnamese Payment Gateways**: MoMo and VNPay for local market
6. **Proxmoxer**: Python library for Proxmox VE API integration

## Common Workflows

### Adding a New API Endpoint

1. Define model in `backend/models/` if needed
2. Create schema in `backend/schemas/`
3. Add route in appropriate `backend/routes/*.py` file
4. Import router in `backend/routes/__init__.py`
5. Register router in `backend/main.py` with `app.include_router()`

### Adding a New Frontend Page

1. Create route in `frontend/app/[locale]/your-route/page.tsx`
2. Add to `ROUTE_PATTERNS` in `middleware.ts` if public
3. Add to `PROTECTED_ROUTES` in `middleware.ts` if authenticated-only
4. Add translations in `frontend/messages/en.json` and `vi.json`

### Working with Relationships

When returning models with relationships:
```python
# ❌ Don't do this - circular reference
@router.get("/users/{id}")
def get_user(id: int) -> User:
    return session.get(User, id)

# ✅ Do this - use schema
from backend.schemas.users import UserRead

@router.get("/users/{id}", response_model=UserRead)
def get_user(id: int):
    return session.get(User, id)
```

## Environment Variables

### Backend Required
- `DATABASE_URL`: PostgreSQL connection string
- `SECRET_KEY`: JWT signing key
- `PROXMOX_HOST`, `PROXMOX_USER`, `PROXMOX_PASSWORD`: Proxmox connection
- `VNPAY_TMN_CODE`, `VNPAY_HASH_SECRET`: VNPay credentials
- `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`: MoMo credentials

### Frontend Required
- `NEXT_PUBLIC_API_URL`: Backend API URL
- `AUTH_SECRET`: NextAuth secret
- `DATABASE_URL`: PostgreSQL (for Prisma)

## Database

- **DBMS**: PostgreSQL 12+
- **ORM**: SQLModel (backend), Prisma (frontend)
- **Migrations**: Auto-create on startup (backend), Prisma migrations (frontend)
- **Default Admin**: admin@vpsrental.com / admin123

## Testing

No test framework currently configured. When adding tests:
- Backend: Consider pytest with pytest-asyncio for FastAPI
- Frontend: Consider Vitest or Jest with Testing Library
