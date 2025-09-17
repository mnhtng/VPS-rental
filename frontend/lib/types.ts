// API Types for VPS Rental Frontend

export interface User {
    id: number | string;
    email: string;
    full_name?: string;
    name?: string; // For admin compatibility
    phone?: string;
    role?: 'customer' | 'admin';
    is_active?: boolean;
    is_verified?: boolean;
    subscription_status?: 'active' | 'inactive'; // For admin dashboard
    created_at: string;
}

export interface VPSPlan {
    id: number;
    name: string;
    description?: string;
    cpu?: string; // For display compatibility
    cpu_cores: number;
    ram?: string; // For display compatibility
    ram_gb: number;
    storage?: string; // For display compatibility
    storage_type: 'SSD' | 'NVMe';
    storage_gb: number;
    bandwidth?: string; // For display compatibility
    bandwidth_gb: number;
    price?: number; // For display compatibility
    monthly_billing?: number;
    monthly_price: number;
    features?: string[]; // For display compatibility
    popular?: boolean; // For display compatibility
    is_active: boolean;
    created_at: string;
}

export interface CartItem {
    vps_plan_id: number;
    quantity: number;
}

export interface CartSummary {
    items: CartItem[];
    total_amount: number;
}

export interface OrderItem {
    id: number;
    vps_plan_id: number;
    vps_plan: VPSPlan;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface Order {
    id: number | string;
    user_id?: number | string; // For admin compatibility
    plan_id?: number | string; // For admin compatibility
    order_number?: string;
    status: 'pending' | 'processing' | 'active' | 'suspended' | 'cancelled';
    total?: number; // For admin compatibility
    total_amount?: number;
    payment_method?: 'qr_code' | 'momo' | 'vnpay' | 'QR Code' | 'MoMo' | 'VNPay';
    billing_address?: string;
    notes?: string;
    created_at: string;
    updated_at?: string;
    order_items: OrderItem[];
}

export interface VPSInstance {
    id: number;
    order_id: number;
    server_name: string;
    ip_address: string;
    status: 'pending' | 'running' | 'stopped' | 'suspended';
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    created_at: string;
    updated_at: string;
}

export interface Payment {
    id: number;
    payment_method: 'qr_code' | 'momo' | 'vnpay';
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transaction_id?: string;
    qr_code_data?: string;
    payment_url?: string;
    created_at: string;
}

export interface SupportMessage {
    id: number;
    message: string;
    is_staff_reply: boolean;
    created_at: string;
}

export interface SupportTicket {
    id: number;
    subject: string;
    description: string;
    status: string;
    priority: string;
    category: string;
    created_at: string;
    updated_at: string;
    messages: SupportMessage[];
}

export interface FAQ {
    id: number;
    question: string;
    answer: string;
    category: string;
}

export interface DashboardStats {
    total_users: number;
    active_orders: number;
    total_revenue: number;
    pending_tickets: number;
    monthly_growth: number;
}

export interface SalesReport {
    total_orders: number;
    total_revenue: number;
    active_vps: number;
    new_users: number;
    period: string;
}

// Form Types
export interface RegisterForm {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
}

export interface LoginForm {
    email: string;
    password: string;
}

export interface ProfileUpdateForm {
    full_name?: string;
    phone?: string;
}

export interface PasswordChangeForm {
    current_password: string;
    new_password: string;
}

export interface OrderCreateForm {
    items: CartItem[];
    payment_method: 'qr_code' | 'momo' | 'vnpay';
    billing_address?: string;
    notes?: string;
}

export interface SupportTicketForm {
    subject: string;
    description: string;
    category: string;
    priority: string;
}

export interface ChatMessage {
    id: string;
    message: string;
    isUser: boolean;
    timestamp: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
    data?: T;
    message?: string;
    error?: string;
}

export interface AuthResponse {
    access_token: string;
    token_type: string;
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    per_page: number;
}
