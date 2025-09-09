DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS payment_transactions CASCADE;
DROP TABLE IF EXISTS vps_instances CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS carts CASCADE;
DROP TABLE IF EXISTS vps_plans CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User Roles Table
CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    role_id INTEGER REFERENCES roles(id) DEFAULT 2,
    is_active BOOLEAN DEFAULT TRUE,
    is_verified BOOLEAN DEFAULT FALSE,
    email_verified_at TIMESTAMP WITH TIME ZONE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- VPS Plans Table
CREATE TABLE vps_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cpu_cores INTEGER NOT NULL,
    ram_gb INTEGER NOT NULL,
    storage_gb INTEGER NOT NULL,
    bandwidth_gb INTEGER,
    monthly_price DECIMAL(10,2) NOT NULL,
    setup_fee DECIMAL(10,2) DEFAULT 0,
    operating_systems TEXT[], -- Array of supported OS
    features TEXT[], -- Array of features
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Cart Table
CREATE TABLE carts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    vps_plan_id UUID REFERENCES vps_plans(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 1,
    duration_months INTEGER NOT NULL, -- Thời gian thuê (tháng)
    selected_os VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, vps_plan_id)
);

-- Orders Table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- pending, paid, processing, completed, cancelled
    total_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    final_amount DECIMAL(10,2) NOT NULL,
    payment_method VARCHAR(20), -- momo, vnpay, qr_code, bank_transfer
    payment_status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, refunded
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    vps_plan_id UUID REFERENCES vps_plans(id),
    quantity INTEGER NOT NULL,
    duration_months INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    selected_os VARCHAR(50),
    configuration JSONB, -- Store additional configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- VPS Instances Table (VPS đã được tạo cho khách hàng)
CREATE TABLE vps_instances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_item_id UUID REFERENCES order_items(id),
    vps_plan_id UUID REFERENCES vps_plans(id),
    instance_name VARCHAR(100) NOT NULL,
    hostname VARCHAR(255),
    ip_address INET,
    username VARCHAR(100), -- VPS login username
    password VARCHAR(255), -- VPS login password (encrypted)
    operating_system VARCHAR(50),
    status VARCHAR(20) DEFAULT 'creating', -- creating, active, suspended, terminated
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    auto_renew BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Payment Transactions Table
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    transaction_id VARCHAR(255) UNIQUE, -- ID từ payment gateway
    payment_method VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'VND',
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed, cancelled
    gateway_response JSONB, -- Response từ payment gateway
    qr_code_data TEXT, -- QR code data nếu thanh toán bằng QR
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chat Messages Table (Chatbot)
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    session_id UUID NOT NULL,
    message_type VARCHAR(10) NOT NULL, -- user, bot
    message TEXT NOT NULL,
    intent VARCHAR(100), -- Chatbot intent classification
    confidence FLOAT, -- Confidence score for bot responses
    metadata JSONB, -- Additional metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Article Table
CREATE TABLE articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    search_vector TSVECTOR,
);

-- Article Tags Table
CREATE TABLE article_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES articles(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);




-- Insert default user roles
INSERT INTO roles (name, description) VALUES 
('admin', 'System Administrator'),
('customer', 'Regular Customer'),

-- Insert sample VPS plans
INSERT INTO vps_plans (name, description, cpu_cores, ram_gb, storage_gb, bandwidth_gb, monthly_price, setup_fee, operating_systems, features) VALUES 
('Basic VPS', 'Perfect for small websites and development', 1, 1, 20, 1000, 99000, 0, 
 ARRAY['Ubuntu 20.04', 'Ubuntu 22.04', 'CentOS 8', 'Debian 11'], 
 ARRAY['SSD Storage', '24/7 Support', 'Root Access']),
 
('Standard VPS', 'Great for medium traffic websites', 2, 2, 40, 2000, 199000, 0,
 ARRAY['Ubuntu 20.04', 'Ubuntu 22.04', 'CentOS 8', 'Debian 11', 'Windows Server 2019'],
 ARRAY['SSD Storage', '24/7 Support', 'Root Access', 'Free SSL']),
 
('Premium VPS', 'High performance for demanding applications', 4, 4, 80, 4000, 399000, 0,
 ARRAY['Ubuntu 20.04', 'Ubuntu 22.04', 'CentOS 8', 'Debian 11', 'Windows Server 2019', 'Windows Server 2022'],
 ARRAY['NVMe SSD Storage', '24/7 Priority Support', 'Root Access', 'Free SSL', 'DDoS Protection']),
 
('Enterprise VPS', 'Maximum performance for enterprise applications', 8, 8, 160, 8000, 799000, 0,
 ARRAY['Ubuntu 20.04', 'Ubuntu 22.04', 'CentOS 8', 'Debian 11', 'Windows Server 2019', 'Windows Server 2022'],
 ARRAY['NVMe SSD Storage', '24/7 Priority Support', 'Root Access', 'Free SSL', 'DDoS Protection', 'Backup Service']);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_vps_instances_user_id ON vps_instances(user_id);
CREATE INDEX idx_vps_instances_status ON vps_instances(status);
CREATE INDEX idx_vps_instances_expires_at ON vps_instances(expires_at);
CREATE INDEX idx_payment_transactions_order_id ON payment_transactions(order_id);
CREATE INDEX idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chat_messages_session_id ON chat_messages(session_id);

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vps_plans_updated_at BEFORE UPDATE ON vps_plans
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vps_instances_updated_at BEFORE UPDATE ON vps_instances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Views for common queries
CREATE VIEW active_vps_instances AS
SELECT 
    vi.*,
    u.email as user_email,
    vp.name as plan_name,
    vp.cpu_cores,
    vp.ram_gb,
    vp.storage_gb
FROM vps_instances vi
JOIN users u ON vi.user_id = u.id
JOIN vps_plans vp ON vi.vps_plan_id = vp.id
WHERE vi.status = 'active';

CREATE VIEW order_summary AS
SELECT 
    o.*,
    u.email as user_email,
    COUNT(oi.id) as item_count
FROM orders o
JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.email;

COMMENT ON DATABASE vps_rental IS 'VPS Rental Management System Database';
