# from fastapi import APIRouter, Depends, HTTPException, status, Query
# from sqlmodel import Session, select
# from typing import List, Dict, Any
# from datetime import datetime
# import uuid
# from models.database import (
#     Order, OrderItem, VPSPlan, User, get_session,
#     OrderStatus, PaymentMethod
# )
# from schemas.api import (
#     CartItem, CartSummary, OrderCreate, OrderResponse,
#     OrderStatusUpdate, OrderItemResponse, VPSPlanResponse
# )
# from core.auth import get_current_active_user, get_admin_user

# router = APIRouter(prefix="/api/orders", tags=["Orders"])

# @router.post("/calculate-cart", response_model=CartSummary)
# async def calculate_cart(
#     items: List[CartItem],
#     session: Session = Depends(get_session)
# ):
#     """Calculate cart total and validate items"""
#     total_amount = 0
#     validated_items = []

#     for item in items:
#         plan = session.get(VPSPlan, item.vps_plan_id)
#         if not plan or not plan.is_active:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail=f"VPS plan {item.vps_plan_id} is not available"
#             )

#         item_total = plan.monthly_price * item.quantity
#         total_amount += item_total
#         validated_items.append(item)

#     return CartSummary(items=validated_items, total_amount=total_amount)

# @router.post("/", response_model=OrderResponse)
# async def create_order(
#     order_data: OrderCreate,
#     current_user: User = Depends(get_current_active_user),
#     session: Session = Depends(get_session)
# ):
#     """Create a new order"""
#     if not current_user.is_verified:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Please verify your email before placing an order"
#         )

#     # Validate cart items
#     total_amount = 0
#     order_items_data = []

#     for item in order_data.items:
#         plan = session.get(VPSPlan, item.vps_plan_id)
#         if not plan or not plan.is_active:
#             raise HTTPException(
#                 status_code=status.HTTP_400_BAD_REQUEST,
#                 detail=f"VPS plan {item.vps_plan_id} is not available"
#             )

#         item_total = plan.monthly_price * item.quantity
#         total_amount += item_total

#         order_items_data.append({
#             "vps_plan_id": plan.id,
#             "quantity": item.quantity,
#             "unit_price": plan.monthly_price,
#             "total_price": item_total,
#             "plan": plan
#         })

#     # Generate order number
#     order_number = f"ORD-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:8].upper()}"

#     # Create order
#     order = Order(
#         user_id=current_user.id,
#         order_number=order_number,
#         total_amount=total_amount,
#         payment_method=order_data.payment_method,
#         billing_address=order_data.billing_address,
#         notes=order_data.notes
#     )

#     session.add(order)
#     session.commit()
#     session.refresh(order)

#     # Create order items
#     for item_data in order_items_data:
#         order_item = OrderItem(
#             order_id=order.id,
#             vps_plan_id=item_data["vps_plan_id"],
#             quantity=item_data["quantity"],
#             unit_price=item_data["unit_price"],
#             total_price=item_data["total_price"]
#         )
#         session.add(order_item)

#     session.commit()

#     # Fetch complete order with items
#     return get_order_with_items(order.id, session)

# @router.get("/", response_model=List[OrderResponse])
# async def get_user_orders(
#     current_user: User = Depends(get_current_active_user),
#     session: Session = Depends(get_session),
#     skip: int = Query(0, ge=0),
#     limit: int = Query(50, ge=1, le=100)
# ):
#     """Get current user's orders"""
#     statement = (
#         select(Order)
#         .where(Order.user_id == current_user.id)
#         .order_by(Order.created_at.desc())
#         .offset(skip)
#         .limit(limit)
#     )
#     orders = session.exec(statement).all()

#     return [get_order_with_items(order.id, session) for order in orders]

# @router.get("/{order_id}", response_model=OrderResponse)
# async def get_order(
#     order_id: int,
#     current_user: User = Depends(get_current_active_user),
#     session: Session = Depends(get_session)
# ):
#     """Get a specific order"""
#     order = session.get(Order, order_id)
#     if not order:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Order not found"
#         )

#     # Check if user owns this order or is admin
#     if order.user_id != current_user.id and current_user.role != "admin":
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Not authorized to access this order"
#         )

#     return get_order_with_items(order_id, session)

# @router.put("/{order_id}/status", response_model=OrderResponse)
# async def update_order_status(
#     order_id: int,
#     status_update: OrderStatusUpdate,
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session)
# ):
#     """Update order status (Admin only)"""
#     order = session.get(Order, order_id)
#     if not order:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Order not found"
#         )

#     order.status = status_update.status
#     order.updated_at = datetime.utcnow()
#     session.add(order)
#     session.commit()

#     return get_order_with_items(order_id, session)

# @router.delete("/{order_id}")
# async def cancel_order(
#     order_id: int,
#     current_user: User = Depends(get_current_active_user),
#     session: Session = Depends(get_session)
# ):
#     """Cancel an order (only if pending)"""
#     order = session.get(Order, order_id)
#     if not order:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Order not found"
#         )

#     # Check if user owns this order
#     if order.user_id != current_user.id:
#         raise HTTPException(
#             status_code=status.HTTP_403_FORBIDDEN,
#             detail="Not authorized to cancel this order"
#         )

#     # Only allow cancellation of pending orders
#     if order.status != OrderStatus.PENDING:
#         raise HTTPException(
#             status_code=status.HTTP_400_BAD_REQUEST,
#             detail="Only pending orders can be cancelled"
#         )

#     order.status = OrderStatus.CANCELLED
#     order.updated_at = datetime.utcnow()
#     session.add(order)
#     session.commit()

#     return {"message": "Order cancelled successfully"}

# # Admin routes
# @router.get("/admin/all", response_model=List[OrderResponse])
# async def get_all_orders(
#     admin_user: User = Depends(get_admin_user),
#     session: Session = Depends(get_session),
#     skip: int = Query(0, ge=0),
#     limit: int = Query(50, ge=1, le=100),
#     status: OrderStatus = Query(None)
# ):
#     """Get all orders (Admin only)"""
#     statement = select(Order).order_by(Order.created_at.desc())

#     if status:
#         statement = statement.where(Order.status == status)

#     statement = statement.offset(skip).limit(limit)
#     orders = session.exec(statement).all()

#     return [get_order_with_items(order.id, session) for order in orders]

# def get_order_with_items(order_id: int, session: Session) -> OrderResponse:
#     """Helper function to get order with all related data"""
#     # Get order
#     order = session.get(Order, order_id)
#     if not order:
#         raise HTTPException(
#             status_code=status.HTTP_404_NOT_FOUND,
#             detail="Order not found"
#         )

#     # Get order items with VPS plans
#     statement = (
#         select(OrderItem, VPSPlan)
#         .join(VPSPlan)
#         .where(OrderItem.order_id == order_id)
#     )
#     items_with_plans = session.exec(statement).all()

#     # Build order items response
#     order_items = []
#     for order_item, vps_plan in items_with_plans:
#         item_response = OrderItemResponse(
#             id=order_item.id,
#             vps_plan_id=order_item.vps_plan_id,
#             vps_plan=VPSPlanResponse(
#                 id=vps_plan.id,
#                 name=vps_plan.name,
#                 description=vps_plan.description,
#                 cpu_cores=vps_plan.cpu_cores,
#                 ram_gb=vps_plan.ram_gb,
#                 storage_type=vps_plan.storage_type,
#                 storage_gb=vps_plan.storage_gb,
#                 bandwidth_gb=vps_plan.bandwidth_gb,
#                 monthly_price=vps_plan.monthly_price,
#                 is_active=vps_plan.is_active,
#                 created_at=vps_plan.created_at
#             ),
#             quantity=order_item.quantity,
#             unit_price=order_item.unit_price,
#             total_price=order_item.total_price
#         )
#         order_items.append(item_response)

#     return OrderResponse(
#         id=order.id,
#         order_number=order.order_number,
#         status=order.status,
#         total_amount=order.total_amount,
#         payment_method=order.payment_method,
#         billing_address=order.billing_address,
#         notes=order.notes,
#         created_at=order.created_at,
#         updated_at=order.updated_at,
#         order_items=order_items
#     )
