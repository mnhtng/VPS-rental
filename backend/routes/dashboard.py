import logging
from datetime import datetime, timezone
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlmodel import Session, select, func
from calendar import month_abbr, monthrange

from backend.db import get_session
from backend.models import User, VPSInstance, Order, OrderItem, VMTemplate, PaymentTransaction
from backend.utils import get_admin_user, Translator, get_translator


logger = logging.getLogger(__name__)
admin_router = APIRouter(prefix="/admin/dashboard", tags=["Admin - Dashboard"])


@admin_router.get(
    "/stats",
    status_code=status.HTTP_200_OK,
    summary="[Admin] Get Dashboard Statistics",
    description="Get all dashboard statistics including users, VPS, revenue, and orders (Admin Only)",
)
async def get_dashboard_stats(
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
    translator: Translator = Depends(get_translator),
):
    """
    Get comprehensive dashboard statistics.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (User, optional): The authenticated admin user. Defaults to Depends(get_admin_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 403 if not admin.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict containing dashboard stats including:
        - total_users, user_growth
        - active_vps, vps_growth
        - monthly_revenue, revenue_growth
        - monthly_orders, order_growth
        - vps_status distribution
        - recent_orders list
    """
    try:
        now = datetime.now(timezone.utc)
        current_month = now.month
        current_year = now.year

        # Calculate previous month
        if current_month == 1:
            prev_month = 12
            prev_year = current_year - 1
        else:
            prev_month = current_month - 1
            prev_year = current_year

        # ----- USER STATS -----
        total_users = session.exec(select(func.count()).select_from(User)).one()

        # Users created this month
        current_month_start = datetime(
            current_year, current_month, 1, tzinfo=timezone.utc
        )
        users_this_month = session.exec(
            select(func.count())
            .select_from(User)
            .where(User.created_at >= current_month_start)
        ).one()

        # Users created last month
        prev_month_start = datetime(prev_year, prev_month, 1, tzinfo=timezone.utc)
        prev_month_end = current_month_start
        users_last_month = session.exec(
            select(func.count())
            .select_from(User)
            .where(
                User.created_at >= prev_month_start, User.created_at < prev_month_end
            )
        ).one()

        user_growth = 0.0
        if users_last_month > 0:
            user_growth = round(
                ((users_this_month - users_last_month) / users_last_month) * 100, 1
            )

        # ----- VPS STATS -----
        all_vps = session.exec(select(VPSInstance)).all()

        active_vps = sum(1 for v in all_vps if v.status == "active")
        running_vps = sum(1 for v in all_vps if v.status == "active")
        stopped_vps = sum(1 for v in all_vps if v.status == "suspended")
        terminated_vps = sum(1 for v in all_vps if v.status == "terminated")

        # VPS created this month
        vps_this_month = sum(
            1 for v in all_vps if v.created_at and v.created_at >= current_month_start
        )
        vps_last_month = sum(
            1
            for v in all_vps
            if v.created_at and prev_month_start <= v.created_at < prev_month_end
        )

        vps_growth = 0.0
        if vps_last_month > 0:
            vps_growth = round(
                ((vps_this_month - vps_last_month) / vps_last_month) * 100, 1
            )

        # ----- ORDER & REVENUE STATS -----
        all_orders = session.exec(select(Order)).all()

        # Orders this month (all statuses)
        orders_this_month_list = [
            o
            for o in all_orders
            if o.created_at and o.created_at >= current_month_start
        ]
        monthly_orders = len(orders_this_month_list)

        # Orders last month
        orders_last_month = len(
            [
                o
                for o in all_orders
                if o.created_at and prev_month_start <= o.created_at < prev_month_end
            ]
        )

        order_growth = 0.0
        if orders_last_month > 0:
            order_growth = round(
                ((monthly_orders - orders_last_month) / orders_last_month) * 100, 1
            )

        # Revenue this month (paid orders only)
        paid_orders_this_month = [
            o for o in orders_this_month_list if o.status == "paid"
        ]
        monthly_revenue = sum(float(o.price) for o in paid_orders_this_month)

        # Revenue last month
        paid_orders_last_month = [
            o
            for o in all_orders
            if o.created_at
            and prev_month_start <= o.created_at < prev_month_end
            and o.status == "paid"
        ]
        last_month_revenue = sum(float(o.price) for o in paid_orders_last_month)

        revenue_growth = 0.0
        if last_month_revenue > 0:
            revenue_growth = round(
                ((monthly_revenue - last_month_revenue) / last_month_revenue) * 100, 1
            )

        # ----- RECENT ORDERS -----
        recent_orders_stmt = select(Order).order_by(Order.created_at.desc()).limit(5)
        recent_orders_db = session.exec(recent_orders_stmt).all()

        recent_orders = []
        for order in recent_orders_db:
            # Get plan name from order items
            plan_name = "VPS"
            if order.order_items:
                first_item = order.order_items[0]
                if hasattr(first_item, "vps_plan") and first_item.vps_plan:
                    plan_name = first_item.vps_plan.name
            else:
                plan_name = order.note

            recent_orders.append(
                {
                    "id": order.id,
                    "order_number": order.order_number,
                    "customer_name": order.user.name if order.user else "N/A",
                    "amount": float(order.price),
                    "status": order.status,
                    "plan": plan_name,
                    "created_at": (
                        order.created_at.isoformat() if order.created_at else None
                    ),
                }
            )

        # ----- MONTHLY REVENUE CHART DATA -----
        monthly_revenue_data = []
        for month_num in range(1, 13):
            month_start = datetime(current_year, month_num, 1, tzinfo=timezone.utc)
            if month_num == 12:
                month_end = datetime(current_year + 1, 1, 1, tzinfo=timezone.utc)
            else:
                month_end = datetime(
                    current_year, month_num + 1, 1, tzinfo=timezone.utc
                )

            month_orders = [
                o
                for o in all_orders
                if o.created_at
                and month_start <= o.created_at < month_end
                and o.status == "paid"
            ]
            month_revenue = sum(float(o.price) for o in month_orders)

            monthly_revenue_data.append(
                {
                    "month": month_abbr[month_num],
                    "revenue": month_revenue,
                }
            )

        return {
            "total_users": total_users,
            "user_growth": user_growth,
            "active_vps": active_vps,
            "vps_growth": vps_growth,
            "monthly_revenue": monthly_revenue,
            "revenue_growth": revenue_growth,
            "monthly_orders": monthly_orders,
            "order_growth": order_growth,
            "vps_status": {
                "running": running_vps,
                "stopped": stopped_vps,
                "terminated": terminated_vps,
            },
            "recent_orders": recent_orders,
            "revenue_chart": monthly_revenue_data,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Failed to get dashboard stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )


@admin_router.get(
    "/analytics",
    status_code=status.HTTP_200_OK,
    summary="[Admin] Get Analytics Statistics",
    description="Get comprehensive analytics statistics including VPS by plan, OS, monthly revenue, user growth, and payment methods (Admin Only)",
)
async def get_analytics_stats(
    session: Session = Depends(get_session),
    admin_user: User = Depends(get_admin_user),
    translator: Translator = Depends(get_translator),
):
    """
    Get comprehensive analytics statistics.

    Args:
        session (Session, optional): Database session. Defaults to Depends(get_session).
        admin_user (User, optional): The authenticated admin user. Defaults to Depends(get_admin_user).
        translator (Translator, optional): Translator for i18n messages. Defaults to Depends(get_translator).

    Raises:
        HTTPException: 401 if not authenticated.
        HTTPException: 403 if not admin.
        HTTPException: 500 if there is a server error.

    Returns:
        Dict containing analytics stats including:
        - vps_by_plan: VPS count and revenue by plan category
        - vps_by_os: VPS count by operating system
        - monthly_revenue: Revenue and orders per month
        - user_growth: Cumulative user count per month
        - payment_methods: Payment distribution by method
        - summary: Total VPS, users, yearly revenue, orders
    """
    try:
        now = datetime.now(timezone.utc)
        current_year = now.year

        # ----- VPS BY PLAN -----
        all_vps = session.exec(select(VPSInstance)).all()
        all_order_items = session.exec(select(OrderItem)).all()
        all_orders = session.exec(select(Order)).all()

        vps_by_plan_dict = {
            "basic": {
                "count": 0, 
                "revenue": 0
            }, 
            "standard": {
                "count": 0, 
                "revenue": 0
            }, 
            "premium": {
                "count": 0, 
                "revenue": 0
            }
        }

        for vps in all_vps:
            if vps.vps_plan:
                category = vps.vps_plan.category.lower()
                if category in vps_by_plan_dict:
                    vps_by_plan_dict[category]["count"] += 1

                    if vps.order_item:
                        vps_by_plan_dict[category]["revenue"] += float(vps.order_item.total_price or 0)

        vps_by_plan = [
            {
                "plan": plan.capitalize(), 
                "count": data["count"], 
                "revenue": data["revenue"]
            }
            for plan, data in vps_by_plan_dict.items()
        ]

        # ----- VPS BY OS -----
        vps_by_os_dict = {}
        for vps in all_vps:
            if vps.order_item and vps.order_item.template:
                os_type = vps.order_item.template.os_type or "Unknown"
                if os_type not in vps_by_os_dict:
                    vps_by_os_dict[os_type] = 0
                vps_by_os_dict[os_type] += 1

        vps_by_os = [
            {
                "os": os, 
                "count": count
            }
            for os, count in vps_by_os_dict.items()
        ]

        # ----- MONTHLY REVENUE AND ORDERS -----
        monthly_revenue_data = []
        for month_num in range(1, 13):
            month_start = datetime(current_year, month_num, 1, tzinfo=timezone.utc)
            if month_num == 12:
                month_end = datetime(current_year + 1, 1, 1, tzinfo=timezone.utc)
            else:
                month_end = datetime(current_year, month_num + 1, 1, tzinfo=timezone.utc)

            month_orders = [
                order for order in all_orders
                if order.created_at and month_start <= order.created_at < month_end and order.status == "paid"
            ]
            month_revenue = sum(float(order.price) for order in month_orders)
            month_order_count = len(month_orders)

            monthly_revenue_data.append({
                "month": month_abbr[month_num],
                "revenue": month_revenue,
                "orders": month_order_count,
            })

        # ----- USER GROWTH -----
        all_users = session.exec(select(User)).all()
        user_growth_data = []

        for month_num in range(1, 13):
            if month_num == 12:
                month_end = datetime(current_year + 1, 1, 1, tzinfo=timezone.utc)
            else:
                month_end = datetime(current_year, month_num + 1, 1, tzinfo=timezone.utc)

            # Count users created before the end of this month
            users_count = sum(1 for user in all_users if user.created_at and user.created_at < month_end)

            user_growth_data.append({
                "month": month_abbr[month_num],
                "users": users_count,
            })

        # ----- PAYMENT METHODS -----
        all_payments = session.exec(
            select(PaymentTransaction).where(PaymentTransaction.status == "completed")
        ).all()

        payment_methods_dict = {"vnpay": {"count": 0, "amount": 0}, "momo": {"count": 0, "amount": 0}}

        for payment in all_payments:
            method = payment.payment_method.lower()
            if method in payment_methods_dict:
                payment_methods_dict[method]["count"] += 1
                payment_methods_dict[method]["amount"] += float(payment.amount)

        payment_methods = [
            {"method": method.upper() if method == "vnpay" else method.capitalize(), "count": data["count"], "amount": data["amount"]}
            for method, data in payment_methods_dict.items()
        ]

        # ----- SUMMARY -----
        total_vps = len(all_vps)
        total_users = len(all_users)
        yearly_revenue = sum(item["revenue"] for item in monthly_revenue_data)
        yearly_orders = sum(item["orders"] for item in monthly_revenue_data)

        return {
            "vps_by_plan": vps_by_plan,
            "vps_by_os": vps_by_os,
            "monthly_revenue": monthly_revenue_data,
            "user_growth": user_growth_data,
            "payment_methods": payment_methods,
            "summary": {
                "total_vps": total_vps,
                "total_users": total_users,
                "yearly_revenue": yearly_revenue,
                "yearly_orders": yearly_orders,
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f">>> Failed to get analytics stats: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=translator.t("errors.internal_server"),
        )
