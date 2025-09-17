# VPS Rental Platform

A comprehensive VPS rental website with a modern React frontend and FastAPI backend.

## Features

### ✅ Completed Features

#### Backend (FastAPI)

- **User Authentication System**
    - Secure registration with email verification
    - JWT-based login/logout with session management
    - Profile management (update personal info, change password)
    - Role-based access control (customer/admin)

- **VPS Management**
    - Complete VPS plan catalog with configurable options
    - CPU cores (1-16), RAM (1GB-64GB), Storage (SSD/NVMe, 20GB-1TB)
    - Bandwidth options and pricing management
    - Search and filtering capabilities

- **Shopping Cart & Orders**
    - Full shopping cart functionality
    - Add/remove items with quantity selection
    - Real-time price calculation
    - Complete order management system

- **Payment Integration**
    - QR Code payment with dynamic QR generation
    - MoMo Wallet integration
    - VNPay payment gateway
    - Transaction tracking and status management

- **Customer Support**
    - Intelligent chatbot for VPS recommendations
    - Support ticket system with messaging
    - FAQ management system
    - 24/7 support capabilities

- **Admin Panel**
    - Comprehensive dashboard with analytics
    - User management (view, activate/deactivate, role changes)
    - Order management and status updates
    - Sales reports and revenue analytics
    - VPS plan management
    - Support ticket administration

#### Frontend (Next.js + React)

- **Modern UI/UX**
    - Responsive design with Tailwind CSS
    - Beautiful homepage with feature highlights
    - Professional navigation and layout

- **User Interface**
    - User authentication pages
    - Shopping cart with real-time updates
    - VPS plan browsing and comparison
    - Order management interface

- **State Management**
    - Context-based authentication
    - Shopping cart state management
    - API integration with error handling

## Tech Stack

### Backend

- **FastAPI** - Modern Python web framework
- **SQLModel** - Type-safe ORM with Pydantic
- **PostgreSQL** - Production database
- **JWT** - Secure authentication
- **Pydantic** - Data validation
- **QRCode** - Payment QR generation
- **Email** - SMTP email verification

### Frontend

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Radix UI** - Accessible components
- **React Hook Form** - Form management
- **Axios** - API client
- **React Hot Toast** - Notifications

## Setup Instructions

### Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 12+

### Backend Setup

1. **Install Dependencies**

   ```bash
   cd backend
   pip install -r requirements.txt
   ```

2. **Database Setup**
   - Create a PostgreSQL database
   - Update `core/settings.py` with your database URL
   - Default: `postgresql://postgres:password@localhost:5432/vps_rental`

3. **Environment Variables**
   Create a `.env` file in the backend directory:

   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/vps_rental
   SECRET_KEY=your-secret-key-here
   SMTP_USERNAME=your-email@gmail.com
   SMTP_PASSWORD=your-email-password
   ADMIN_EMAIL=admin@vpsrental.com
   ADMIN_PASSWORD=admin123
   ```

4. **Run the Server**

   ```bash
   python main.py
   ```

   The API will be available at `http://localhost:8000`

### Frontend Setup

1. **Install Dependencies**

   ```bash
   cd frontend
   npm install
   ```

2. **Environment Variables**
   Create a `.env.local` file:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

3. **Run the Development Server**

   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## API Documentation

Once the backend is running, visit:

- **Swagger UI**: <http://localhost:8000/docs>
- **ReDoc**: <http://localhost:8000/redoc>

## Default Admin Account

- **Email**: <admin@vpsrental.com>
- **Password**: admin123

## Database Schema

The system includes the following main models:

- **User** - User accounts with role-based access
- **VPSPlan** - VPS configurations and pricing
- **Order** - Customer orders with items
- **Payment** - Payment transactions and methods
- **SupportTicket** - Customer support system
- **FAQ** - Frequently asked questions

## Payment Methods

1. **QR Code** - Bank transfer with generated QR codes
2. **MoMo Wallet** - Vietnamese mobile wallet
3. **VNPay** - Vietnamese payment gateway

## Development

### Backend Development

- The API automatically creates database tables on startup
- Sample data (VPS plans, FAQs, admin user) is created automatically
- All endpoints are documented with OpenAPI/Swagger

### Frontend Development

- Hot reload enabled for development
- TypeScript for type safety
- Responsive design with mobile support
- Context-based state management

## Production Deployment

### Backend

1. Set up PostgreSQL database
2. Configure environment variables
3. Use a production WSGI server (e.g., Gunicorn)
4. Set up reverse proxy (Nginx)

### Frontend

1. Build the application: `npm run build`
2. Deploy to Vercel, Netlify, or your preferred platform
3. Configure environment variables

## Security Features

- **Password Hashing** - bcrypt for secure password storage
- **JWT Authentication** - Secure token-based auth
- **Input Validation** - Pydantic models for API validation
- **CORS Protection** - Configured for production
- **SQL Injection Protection** - SQLModel ORM prevents SQL injection
- **Rate Limiting** - Can be configured for production

## Support

For technical support or questions:

- Create a support ticket through the application
- Email: <support@vpsrental.com>
- 24/7 chat support available

## License

This project is for educational and commercial use.
