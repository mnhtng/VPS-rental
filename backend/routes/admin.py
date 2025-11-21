# from fastapi import APIRouter, Depends, HTTPException, status, Query
# from sqlmodel import Session, select, func
# from typing import List, Dict, Any
# from datetime import datetime, timedelta
# from models.database import (
#     User, Order, Payment, VPSPlan, SupportTicket,
#     get_session, OrderStatus, PaymentStatus, UserRole
# )
# from schemas.api import (
#     UserListResponse, SalesReport, DashboardStats,
#     OrderResponse, VPSPlanResponse
# )
# from core.auth import get_admin_user
# from routes.orders import get_order_with_items

# router = APIRouter(prefix="/api/admin", tags=["Admin"])

# @router.get("/dashboard", response_model=DashboardStats)
# async def get_dashboard_stats(
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Get dashboard statistics"""
#     # Total users
#     total_users = session.exec(select(func.count(User.id))).first()

#     # Active orders
#     active_orders = session.exec(
#         select(func.count(Order.id))
#         .where(Order.status.in_([OrderStatus.ACTIVE, OrderStatus.PROCESSING]))
#     ).first()

#     # Total revenue
#     total_revenue = session.exec(
#         select(func.sum(Payment.amount))
#         .where(Payment.status == PaymentStatus.COMPLETED)
#     ).first() or 0

#     # Pending support tickets
#     pending_tickets = session.exec(
#         select(func.count(SupportTicket.id))
#         .where(SupportTicket.status.in_(["open", "in_progress"]))
#     ).first()

#     # Monthly growth (simplified calculation)
#     current_month = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
#     last_month = (current_month - timedelta(days=1)).replace(day=1)

#     current_month_orders = session.exec(
#         select(func.count(Order.id))
#         .where(Order.created_at >= current_month)
#     ).first()

#     last_month_orders = session.exec(
#         select(func.count(Order.id))
#         .where(Order.created_at >= last_month, Order.created_at < current_month)
#     ).first()

#     monthly_growth = 0
#     if last_month_orders and last_month_orders > 0:
#         monthly_growth = ((current_month_orders - last_month_orders) / last_month_orders) * 100

#     return DashboardStats(
#         total_users=total_users,
#         active_orders=active_orders,
#         total_revenue=float(total_revenue),
#         pending_tickets=pending_tickets,
#         monthly_growth=round(monthly_growth, 2)
#     )

# @router.get("/users", response_model=List[UserListResponse])
# async def get_all_users(
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session),
#     skip: int = Query(0, ge=0),
#     limit: int = Query(50, ge=1, le=100),
#     role: UserRole = Query(None),
#     is_active: bool = Query(None)
# ):
#     """Get all users"""
#     statement = select(User).order_by(User.created_at.desc())

#     if role:
#         statement = statement.where(User.role == role)
#     if is_active is not None:
#         statement = statement.where(User.is_active == is_active)

#     statement = statement.offset(skip).limit(limit)
#     users = session.exec(statement).all()

#     return users

# @router.get("/users/{user_id}", response_model=UserListResponse)
# async def get_user_details(
#     user_id: int,
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Get specific user details"""
#     user = session.get(User, user_id)
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="User not found"
#         )

#     return user

# @router.put("/users/{user_id}/status")
# async def update_user_status(
#     user_id: int,
#     is_active: bool,
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Update user active status"""
#     user = session.get(User, user_id)
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="User not found"
#         )

#     if user.role == UserRole.ADMIN and user.id != admin_user.id:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Cannot deactivate other admin users"
#         )

#     user.is_active = is_active
#     session.add(user)
#     session.commit()

#     return {"message": f"User {'activated' if is_active else 'deactivated'} successfully"}

# @router.put("/users/{user_id}/role")
# async def update_user_role(
#     user_id: int,
#     role: UserRole,
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Update user role"""
#     user = session.get(User, user_id)
#     if not user:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="User not found"
#         )

#     if user.id == admin_user.id:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Cannot change your own role"
#         )

#     user.role = role
#     session.add(user)
#     session.commit()

#     return {"message": "User role updated successfully"}

# @router.get("/orders", response_model=List[OrderResponse])
# async def get_all_orders_admin(
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session),
#     skip: int = Query(0, ge=0),
#     limit: int = Query(50, ge=1, le=100),
#     status: OrderStatus = Query(None),
#     user_id: int = Query(None)
# ):
#     """Get all orders with filters"""
#     statement = select(Order).order_by(Order.created_at.desc())

#     if status:
#         statement = statement.where(Order.status == status)
#     if user_id:
#         statement = statement.where(Order.user_id == user_id)

#     statement = statement.offset(skip).limit(limit)
#     orders = session.exec(statement).all()

#     return [get_order_with_items(order.id, session) for order in orders]

# @router.get("/sales-report", response_model=SalesReport)
# async def get_sales_report(
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session),
#     days: int = Query(30, ge=1, le=365)
# ):
#     """Get sales report for specified period"""
#     start_date = datetime.now() - timedelta(days=days)

#     # Total orders in period
#     total_orders = session.exec(
#         select(func.count(Order.id))
#         .where(Order.created_at >= start_date)
#     ).first()

#     # Total revenue in period
#     total_revenue = session.exec(
#         select(func.sum(Payment.amount))
#         .join(Order)
#         .where(
#             Payment.status == PaymentStatus.COMPLETED,
#             Order.created_at >= start_date
#         )
#     ).first() or 0

#     # Active VPS count
#     active_vps = session.exec(
#         select(func.count(Order.id))
#         .where(Order.status == OrderStatus.ACTIVE)
#     ).first()

#     # New users in period
#     new_users = session.exec(
#         select(func.count(User.id))
#         .where(User.created_at >= start_date)
#     ).first()

#     return SalesReport(
#         total_orders=total_orders,
#         total_revenue=float(total_revenue),
#         active_vps=active_vps,
#         new_users=new_users,
#         period=f"{days} days"
#     )

# @router.get("/analytics/revenue")
# async def get_revenue_analytics(
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session),
#     days: int = Query(30, ge=7, le=365)
# ):
#     """Get revenue analytics by day"""
#     start_date = datetime.now() - timedelta(days=days)

#     # Get daily revenue
#     result = session.exec(
#         select(
#             func.date(Payment.created_at).label('date'),
#             func.sum(Payment.amount).label('revenue')
#         )
#         .join(Order)
#         .where(
#             Payment.status == PaymentStatus.COMPLETED,
#             Payment.created_at >= start_date
#         )
#         .group_by(func.date(Payment.created_at))
#         .order_by(func.date(Payment.created_at))
#     ).all()

#     return [{"date": str(row.date), "revenue": float(row.revenue)} for row in result]

# @router.get("/analytics/orders")
# async def get_order_analytics(
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Get order status distribution"""
#     result = session.exec(
#         select(Order.status, func.count(Order.id).label('count'))
#         .group_by(Order.status)
#     ).all()

#     return [{"status": row.status, "count": row.count} for row in result]

# @router.get("/analytics/popular-plans")
# async def get_popular_plans(
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session),
#     limit: int = Query(10, ge=1, le=50)
# ):
#     """Get most popular VPS plans"""
#     from models.database import OrderItem

#     result = session.exec(
#         select(
#             VPSPlan.name,
#             VPSPlan.monthly_price,
#             func.sum(OrderItem.quantity).label('total_sold'),
#             func.sum(OrderItem.total_price).label('total_revenue')
#         )
#         .join(OrderItem)
#         .join(Order)
#         .where(Order.status != OrderStatus.CANCELLED)
#         .group_by(VPSPlan.id, VPSPlan.name, VPSPlan.monthly_price)
#         .order_by(func.sum(OrderItem.quantity).desc())
#         .limit(limit)
#     ).all()

#     return [{
#         "plan_name": row.name,
#         "monthly_price": float(row.monthly_price),
#         "total_sold": row.total_sold,
#         "total_revenue": float(row.total_revenue)
#     } for row in result]

# @router.get("/system/health")
# async def get_system_health(
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Get system health status"""
#     try:
#         # Test database connection
#         session.exec(select(func.count(User.id))).first()
#         db_status = "healthy"
#     except Exception:
#         db_status = "error"

#     # Get recent activity
#     recent_orders = session.exec(
#         select(func.count(Order.id))
#         .where(Order.created_at >= datetime.now() - timedelta(hours=24))
#     ).first()

#     recent_users = session.exec(
#         select(func.count(User.id))
#         .where(User.created_at >= datetime.now() - timedelta(hours=24))
#     ).first()

#     failed_payments = session.exec(
#         select(func.count(Payment.id))
#         .where(
#             Payment.status == PaymentStatus.FAILED,
#             Payment.created_at >= datetime.now() - timedelta(hours=24)
#         )
#     ).first()

#     return {
#         "database": db_status,
#         "recent_activity": {
#             "orders_24h": recent_orders,
#             "new_users_24h": recent_users,
#             "failed_payments_24h": failed_payments
#         },
#         "timestamp": datetime.now().isoformat()
#     }
