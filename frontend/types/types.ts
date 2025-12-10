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

export interface Login {
    email: string;
    password: string;
}

export interface Register {
    name: string;
    email: string;
    password: string;
    phone: string | null;
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
    discount_code?: string;
    created_at: string;
    updated_at: string;
    user: User;
    vps_plan: VPSPlan;
    template: VMTemplate;
}

export interface AddToCartPayload {
    planID: string;
    hostname: string;
    os: string;
    templateOS: string;
    templateVersion: string;
    durationMonths: number;
    totalPrice: number;
}

// Order for My Orders
export interface OrderItemConfiguration {
    plan_name: string;
    vcpu: number;
    ram_gb: number;
    storage_gb: number;
    storage_type: string;
    bandwidth_mbps: number;
    template_os: string;
}

export interface OrderItemDetail {
    id: string;
    hostname: string;
    os: string;
    duration_months: number;
    unit_price: number;
    total_price: number;
    configuration: OrderItemConfiguration;
    vps_plan?: VPSPlan;
    template?: VMTemplate;
    created_at: string;
    updated_at: string;
}

export interface Order {
    id: string;
    order_number: string;
    price: number;
    status: 'pending' | 'paid' | 'cancelled';
    payment_status?: 'pending' | 'completed' | 'failed';
    billing_address?: string;
    billing_phone?: string;
    note?: string;
    created_at: string;
    updated_at: string;
    order_items: OrderItemDetail[];
}

export interface OrderPaymentsResponse {
    order_id: string;
    order_number: string;
    order_status: string;
    payments: Array<{
        id: string;
        transaction_id: string | null;
        payment_method: string;
        amount: number;
        currency: string;
        status: string;
        created_at: string;
    }>;
}

export interface CheckoutFormData {
    phone: string;
    address: string;
    paymentMethod: 'momo' | 'vnpay';
}

export interface PaymentResponse {
    success: boolean;
    payment_url?: string;
    deeplink?: string;
    transaction_id?: string;
    payment_id?: string;
    error?: string;
}

export interface PaymentStatusResponse {
    payment_id: string;
    transaction_id: string | null;
    payment_method: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed';
    order_id: string | null;
    order_number: string | null;
    order_status: string | null;
    created_at: string;
    updated_at: string;
}

export interface PaymentResult {
    status: 'loading' | 'success' | 'failed';
    message: string;
    transactionId?: string;
    momoTransId?: string;
    amount?: string;
    orderNumber?: string;
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

export interface Promotion {
    id: string;
    code: string;
    description?: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    start_date?: string;
    end_date?: string;
    usage_limit?: number;
    per_user_limit?: number;
    created_at: string;
    updated_at: string;
}

export interface UserPromotion {
    id: string;
    user_id: string;
    promotion_id: string;
    order_id: string;
    used_at: string;
}

export interface ValidatePromotion {
    valid: boolean;
    promotion: Promotion;
    discount_amount: number;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    final_amount: number;
}

export interface ChatMessage {
    id: string;
    message: string;
    isUser: boolean;
    timestamp: Date;
}

//! Email and PDF Types
export interface VPSItem {
    name: string;
    hostname: string;
    os: string;
    duration_months?: number;
    cpu: number;
    ram: number;
    storage: number;
    storage_type: string;
    network_speed: number;
    price?: number;
    total_price?: number;
}

export interface EmailLayoutProps {
    preview?: string;
    children: React.ReactNode;
}

export interface EmailResetPasswordTemplateProps {
    name: string;
    resetUrl: string;
}

export interface EmailVerificationTemplateProps {
    name: string;
    verificationUrl: string;
}

export interface OrderConfirmationEmailData {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerAddress?: string;
    orderNumber: string;
    orderDate: string;
    vpsItems: VPSItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    transactionId?: string;
}

export interface EmailOrderConfirmationProps {
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    orderDate: string;
    vpsItems: VPSItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    transactionId?: string;
}

export interface VPSWelcomeEmailData {
    customerName: string;
    customerEmail: string;
    orderNumber: string;
    orderDate: string;
    vps: VPSItem;
    credentials: VPSCredentials;
}

export interface EmailVPSWelcomeProps {
    customerName: string;
    orderNumber: string;
    vps: VPSItem;
    credentials: VPSCredentials;
}

// PDF Invoice
export interface InvoicePDFProps {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    customerAddress?: string;
    orderNumber: string;
    orderDate: string;
    vpsItems: VPSItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    transactionId?: string;
}

// PDF VPS Welcome
export interface VPSCredentials {
    ipAddress: string;
    username: string;
    password: string;
    sshPort: number;
}

export interface VPSWelcomePDFProps {
    customerName: string;
    orderNumber: string;
    orderDate: string;
    vps: VPSItem;
    credentials: VPSCredentials;
}

//! API Types
export interface ApiResponse {
    message?: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    error?: {
        code: string | number;
        detail: string;
    } | null;
    meta?: {
        timestamp: string;
        path: string;
        requestID?: string; // UUID/random string
    }
}
