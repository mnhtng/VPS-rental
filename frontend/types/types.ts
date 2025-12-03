//! Core Types
export interface User {
    id: string;
    name?: string;
    email: string;
    email_verified?: string;
    phone?: string;
    address?: string;
    image?: string;
    role: 'USER' | 'ADMIN';
    created_at: string;
    updated_at?: string;
}

export interface VPSPlan {
    id: string;
    name: string;
    description?: string;
    category: string;
    use_case: string[];
    vcpu: number;
    ram_gb: number;
    storage_type: 'SSD' | 'NVMe';
    storage_gb: number;
    bandwidth_mbps: number;
    monthly_price: number;
    currency: 'USD' | 'VND';
    max_snapshots?: number;
    max_ip_addresses?: number;
    created_at: string;
    updated_at?: string;
}

export interface VMTemplate {
    id: string;
    template_vmid: number;
    name: string;
    description?: string;
    os_type: string;
    os_version: string;
    default_user: string;
    cloud_init_enabled: boolean;
    cpu_cores: number;
    ram_gb: number;
    storage_gb: number;
    setup_fee: number;
    created_at: string;
    updated_at?: string;
}

export interface CartItem {
    id: string;
    hostname: string;
    os: string;
    duration_months: number;
    unit_price: number;
    total_price: number;
    created_at: string;
    updated_at: string;
    user: User;
    vps_plan: VPSPlan;
    template: VMTemplate;
}

export interface OrderItem {
    id: string;
    vps_plan_id: string;
    vps_plan: VPSPlan;
    quantity: number;
    unit_price: number;
    total_price: number;
}

export interface Order {
    id: string;
    user_id?: string; // For admin compatibility
    plan_id?: string; // For admin compatibility
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
    id: string;
    order_id: string;
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
    id: string;
    payment_method: 'qr_code' | 'momo' | 'vnpay';
    amount: number;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    transaction_id?: string;
    qr_code_data?: string;
    payment_url?: string;
    created_at: string;
}

export interface SupportMessage {
    id: string;
    message: string;
    is_staff_reply: boolean;
    created_at: string;
}

export interface SupportTicketContact {
    email: string;
    phone: string;
}

export interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    status: 'open' | 'in-progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    category: string;
    contact: SupportTicketContact;
    created_at: string;
    updated_at: string;
    messages: SupportMessage[];
}

export interface FAQ {
    id: string;
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

export interface Profile {
    name: string;
    email: string;
    phone?: string
    address?: string;
    joinedDate?: string;
    avatar?: string;
    role?: 'USER' | 'ADMIN';
}

export interface ProfileUpdate {
    name?: string;
    phone?: string
    address?: string;
}

export interface PasswordChange {
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

//! API Request Types

//! API Response Types
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T | null;
    error: {
        code: string | number;
        detail: string;
    } | null;
    meta?: {
        timestamp: string;
        path: string;
        requestID?: string; // UUID/random string
    }
}

export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    per_page: number;
}
