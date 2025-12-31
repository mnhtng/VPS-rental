# VPS Rental Platform

A modern VPS rental platform with automated provisioning, payment gateway integration, and comprehensive management tools. Built with FastAPI, Next.js 15, and Proxmox VE.

[![FastAPI](https://img.shields.io/badge/FastAPI-0.117.1-009688?style=flat&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.5.9-000000?style=flat&logo=next.js)](https://nextjs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## ✨ Features

### Authentication & User Management

- **Secure Authentication**: NextAuth v5 with Prisma adapter for session management
- **Multiple Providers**: Email/password, Google OAuth, GitHub OAuth
- **Email Verification**: Automated email verification system using Resend
- **Role-Based Access Control (RBAC)**: Customer and admin roles with granular permissions
- **User Profiles**: Comprehensive profile management with password reset capabilities

### VPS Management

- **Automated Provisioning**: Direct integration with Proxmox VE for instant VPS deployment
- **Multiple OS Support**: Linux (Ubuntu, Debian, CentOS) and Windows Server templates
- **Real-time Control**: Start, stop, restart, and monitor VPS instances
- **VNC Console**: Browser-based VNC console via WebSocket for direct server access
- **Snapshot Management**: Create, restore, and delete VPS snapshots
- **Automated Cleanup**: Scheduled cleanup of expired VPS instances (2-phase: suspend → terminate)
- **Renewal System**: Seamless VPS renewal with payment gateway integration

### E-commerce Features

- **Shopping Cart**: Full-featured cart with real-time price calculations
- **VPS Plan Catalog**: Configurable plans with CPU, RAM, storage, and bandwidth options
- **Promotions**: Discount code system with validation and tracking
- **Order Management**: Complete order lifecycle tracking from cart to deployment
- **Invoice Generation**: Automated PDF invoice generation with detailed breakdowns
- **Payment Integration**:
    - **VNPay**: Vietnamese payment gateway
    - **MoMo**: Vietnamese mobile wallet
- **Repayment System**: Support for repayment for not-pay order

### Admin Dashboard

- **Analytics Dashboard**: Revenue tracking, order statistics, and user metrics
- **User Management**: View, edit, create, and manage user accounts
- **VPS Administration**: Monitor and control all VPS instances
- **Order Management**: Process orders, update statuses, and track revenue
- **Support System**: Manage support tickets and customer inquiries
- **Revenue Reports**: Detailed analytics with charts and exportable data

### Customer Support

- **AI-Powered Chatbot**: Google Gemini integration for intelligent VPS recommendations
- **Support Tickets**: Full ticketing system with threaded conversations
- **Admin Response System**: Efficient ticket management for support staff

### Internationalization

- **Multi-language Support**: Vietnamese and English localization
- **next-intl Integration**: Seamless locale switching
- **Currency Formatting**: VND currency formatting throughout

### Modern UI/UX

- **Responsive Design**: Mobile-first design with Tailwind CSS v4
- **Dark Mode**: System-aware theme switching with next-themes
- **shadcn/ui Components**: Beautiful, accessible UI components
- **Framer Motion**: Smooth animations and transitions
- **Interactive Charts**: Recharts integration for data visualization
- **PDF Viewer**: React-PDF for document preview

---

## 🛠 Technology Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **FastAPI** | 0.117.1 | Modern Python web framework with async support |
| **SQLModel** | 0.0.27 | SQL database ORM with Pydantic integration |
| **PostgreSQL** | 14+ | Production-grade relational database |
| **Proxmoxer** | 2.2.0 | Proxmox VE API client for VM management |
| **PyJWT** | 2.10.1 | JWT token generation and validation |
| **Argon2** | 25.1.0 | Secure password hashing |
| **APScheduler** | 3.11.2 | Background job scheduling for VPS cleanup |
| **Uvicorn** | 0.37.0 | ASGI server for production deployment |

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Next.js** | 15.5.9 | React framework with App Router |
| **React** | 19.2.3 | UI library |
| **TypeScript** | 5 | Type-safe JavaScript |
| **Tailwind CSS** | 4 | Utility-first CSS framework |
| **NextAuth** | 5.0.0-beta.29 | Authentication solution |
| **Prisma** | 7.2.0 | Database ORM and schema management |
| **Radix UI** | Latest | Accessible component primitives |
| **Recharts** | 2.15.4 | Chart library for analytics |
| **React-PDF** | 4.3.1 | PDF generation and rendering |
| **Zustand** | 5.0.8 | Lightweight state management |
| **Framer Motion** | 12.23.12 | Animation library |

### Infrastructure

- **Proxmox VE**: Virtualization platform for VPS hosting
- **WebSocket**: Real-time VNC console connections
- **Resend**: Transactional email service

---

<div align="center">
  <p>Made with ❤️ and ☕ by the PCloud Team</p>
  <p><strong>A journey of learning, building, and growing</strong></p>
</div>
