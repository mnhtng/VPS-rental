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
    account?: Account;
}

export interface Account {
    id: string;
    type: string;
    provider: string;
    provider_account_id: string;
    refresh_token?: string;
    access_token?: string;
    expires_at?: number;
    token_type?: string;
    scope?: string;
    id_token?: string;
    session_state?: string;
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

export interface AdminUserCreate {
    name: string;
    email: string;
    password: string;
    phone?: string;
    address?: string;
    role?: 'USER' | 'ADMIN';
    verify_email?: boolean;
}

export interface AdminUserUpdate {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    role?: 'USER' | 'ADMIN';
    verify_email?: boolean;
}

export interface UserStatistics {
    total: number;
    admins: number;
    verified: number;
}

export interface VPSStatistics {
    total: number;
    active: number;
    suspended: number;
    terminated: number;
    creating: number;
    error: number;
}

export interface DashboardStats {
    total_users: number;
    user_growth: number;
    active_vps: number;
    vps_growth: number;
    monthly_revenue: number;
    revenue_growth: number;
    monthly_orders: number;
    order_growth: number;
    vps_status: {
        running: number;
        stopped: number;
        terminated: number;
    };
    recent_orders: RecentOrder[];
    revenue_chart: { month: string; revenue: number }[];
}

export interface RecentOrder {
    id: string;
    order_number: string;
    customer_name: string;
    amount: number;
    status: 'paid' | 'pending' | 'cancelled';
    plan: string;
    created_at: string;
}

export interface AnalyticsStats {
    vps_by_plan: VPSByPlanData[];
    vps_by_os: VPSByOSData[];
    monthly_revenue: AnalyticsMonthlyRevenue[];
    user_growth: UserGrowthData[];
    payment_methods: PaymentMethodData[];
    summary: AnalyticsSummary;
}

export interface VPSByPlanData {
    plan: string;
    count: number;
    revenue: number;
}

export interface VPSByOSData {
    os: string;
    count: number;
}

export interface AnalyticsMonthlyRevenue {
    month: string;
    revenue: number;
    orders: number;
}

export interface UserGrowthData {
    month: string;
    users: number;
}

export interface PaymentMethodData {
    method: string;
    count: number;
    amount: number;
}

export interface AnalyticsSummary {
    total_vps: number;
    total_users: number;
    yearly_revenue: number;
    yearly_orders: number;
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

export interface VPSPlanCreate {
    name: string;
    description?: string;
    category: 'basic' | 'standard' | 'premium';
    use_case?: string[];
    vcpu: number;
    ram_gb: number;
    storage_type: 'SSD' | 'NVMe';
    storage_gb: number;
    bandwidth_mbps: number;
    monthly_price: number;
    currency?: 'USD' | 'VND';
    max_snapshots?: number;
    max_ip_addresses?: number;
}

export interface VPSPlanUpdate {
    name?: string;
    description?: string;
    category?: 'basic' | 'standard' | 'premium';
    use_case?: string[];
    vcpu?: number;
    ram_gb?: number;
    storage_type?: 'SSD' | 'NVMe';
    storage_gb?: number;
    bandwidth_mbps?: number;
    monthly_price?: number;
    currency?: 'USD' | 'VND';
    max_snapshots?: number;
    max_ip_addresses?: number;
}

export interface VPSPlanStatistics {
    total: number;
    basic: number;
    standard: number;
    premium: number;
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

export interface ProxmoxCluster {
    id: string;
    name: string;
    api_host: string;
    api_port: number;
    api_user: string;
    api_password?: string;
    api_token_id?: string;
    api_token_secret?: string;
    verify_ssl: boolean;
    status: string;
    version?: string;
    created_at: string;
    updated_at?: string;
}

export interface ProxmoxNode {
    id: string;
    name: string;
    ip_address: string;
    status: string;
    cpu_cores?: number;
    total_memory_gb?: number;
    total_storage_gb?: number;
    max_vms?: number;
    cpu_overcommit_ratio?: number;
    ram_overcommit_ratio?: number;
    datacenter?: string;
    location?: string;
    last_health_check?: string;
    health_status?: string;
    created_at: string;
    updated_at?: string;
}

export interface ProxmoxVM {
    id: string;
    vmid: number;
    hostname: string;
    ip_address?: string;
    mac_address?: string;
    username?: string;
    password?: string;
    ssh_port?: number;
    vnc_port?: number;
    vnc_password?: string;
    vcpu?: number;
    ram_gb?: number;
    storage_gb?: number;
    storage_type?: string;
    bandwidth_mbps?: number;
    power_status: string;
    created_at: string;
    updated_at?: string;
    cluster: ProxmoxCluster;
    node: ProxmoxNode;
    template: VMTemplate;
    vps_instance: VPSInstance;
    snapshots: VPSSnapshot[];
}

export interface SnapshotInfo {
    name: string;
    description?: string;
    snaptime?: number;
    vmstate?: number;
    parent?: string;
}

export interface VPSSnapshot {
    snapshots: SnapshotInfo[];
    total: number;
    max_snapshots: number;
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
    payment_method?: string;
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

export interface OrderStatistics {
    total_orders: number;
    paid_orders: number;
    pending_orders: number;
    cancelled_orders: number;
    total_revenue: number;
    pending_amount: number;
    average_order: number;
}

export interface MonthlyRevenue {
    month: string;
    revenue: number;
    orders: number;
}

export interface AdminOrder {
    id: string;
    order_number: string;
    price: number;
    status: 'pending' | 'paid' | 'cancelled';
    payment_status?: string;
    payment_method?: string;
    billing_address?: string;
    billing_phone?: string;
    note?: string;
    created_at: string;
    updated_at: string;
    user?: User;
    order_items: OrderItemDetail[];
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
    vmid?: number;
    status: string;
    expires_at: string;
    auto_renew: boolean;
    created_at: string;
    updated_at?: string;
    user?: User;
    vps_plan?: VPSPlan;
    order_item?: OrderItemDetail;
    vm?: ProxmoxVM;
}

export interface VPSInfo {
    node_name: string,
    vm?: ProxmoxVM,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    vm_info: Record<string, any>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    disk_info: Record<string, any>
}

export interface VPSRRDDataPoint {
    time: number;
    cpu: number;
    maxcpu: number;
    mem: number;
    maxmem: number;
    memhost: number;
    netin: number;
    netout: number;
    disk: number;
    diskread: number;
    diskwrite: number;
    maxdisk: number;
    [key: string]: number;
    pressurecpufull: number;
    pressurecpusome: number;
    pressureiofull: number;
    pressureiosome: number;
    pressurememoryfull: number;
    pressurememorysome: number;
}

export interface SupportMessage {
    id: string;
    message: string;
    is_staff_reply: boolean;
    created_at: string;
}

export interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    category: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    email: string;
    phone: string;
    created_at: string;
    updated_at: string;
    user?: User;
    replies?: TicketReply[];
}

export interface TicketReply {
    id: string;
    ticket_id: string;
    message: {
        content: {
            text: string;
            format: 'markdown' | 'html' | 'plain';
        };
        sender: {
            role: 'ADMIN' | 'USER';
            id: string;
            name: string;
        };
        attachments: Array<{
            id: string;
            name: string;
            url: string;
            size: number;
            mime: string;
        }>;
    };
    created_at: string;
    updated_at: string;
}

export interface TicketStatistics {
    total: number;
    open: number;
    in_progress: number;
    resolved: number;
    closed: number;
}

export interface CreateTicketData {
    subject: string;
    description: string;
    category: string;
    priority: string;
    phone: string;
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

export interface VPSPlanRecommendation {
    id: string;
    name: string;
    vcpu: number;
    ram_gb: number;
    storage_gb: number;
    storage_type: string;
    monthly_price: number;
    currency: string;
    category: string;
    use_case?: string[];
}

export interface ChatMessage {
    id: string;
    message: string;
    isUser: boolean;
    timestamp: Date;
    intent?: string;
    recommendedPlans?: VPSPlanRecommendation[];
}

export interface ChatResponse {
    message: string;
    intent: string;
    recommended_plans?: VPSPlanRecommendation[];
    category?: string;
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
    subIpAddress: string;
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
