DROP TABLE IF EXISTS roles, users, accounts, sessions, verification_tokens, authenticators, vps_plans, carts, orders, order_items, payment_transactions, vps_instances, promotions, user_promotions, support_tickets, support_ticket_reply, conversations, inboxes, knowledge_base CASCADE;


-- Enable the uuid-ossp extension to use uuid_generate_v4() for UUID generation.
-- Enable the pgcrypto extension to use gen_random_uuid() for UUID generation.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create a function to automatically update the 'updated_at' column on row changes.
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language plpgsql;


-- Define user roles
CREATE TABLE "roles" (
    -- USER, ADMIN, MODERATOR
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "roles_name_key" UNIQUE ("name")
);

CREATE TRIGGER "set_timestamp_roles"
BEFORE UPDATE ON "roles"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store user information
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "email_verified" TIMESTAMP(3),
    "phone" VARCHAR(20),
    "address" TEXT,
    "image" TEXT,
    "role_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_email_key" UNIQUE ("email"),
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TRIGGER "set_timestamp_users"
BEFORE UPDATE ON "users"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store user account information
CREATE TABLE "accounts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "accounts_provider_provider_account_id_key" UNIQUE ("provider", "provider_account_id"),
    CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

CREATE TRIGGER "set_timestamp_accounts"
BEFORE UPDATE ON "accounts"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store user sessions
CREATE TABLE "sessions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "session_token" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "sessions_session_token_key" UNIQUE ("session_token"),
    CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "sessions_user_id_idx" ON "sessions"("user_id");

CREATE TRIGGER "set_timestamp_sessions"
BEFORE UPDATE ON "sessions"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store verification tokens (e.g., for email verification, password reset)
CREATE TABLE "verification_tokens" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "verification_tokens_token_key" UNIQUE ("token")
);

CREATE INDEX "verification_tokens_identifier_idx" ON "verification_tokens"("identifier");


-- Store authenticators for 2FA (e.g., WebAuthn)
CREATE TABLE "authenticators" (
    "credential_id" TEXT NOT NULL,
    "user_id" UUID NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "credential_public_key" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "credential_device_type" TEXT NOT NULL,
    "credential_backed_up" BOOLEAN NOT NULL,
    "transports" TEXT,

    CONSTRAINT "authenticators_pkey" PRIMARY KEY ("user_id", "credential_id"),
    CONSTRAINT "authenticators_credential_id_key" UNIQUE ("credential_id"),
    CONSTRAINT "authenticators_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);


-- Store VPS configuration plans
CREATE TABLE "vps_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "vcpu" INTEGER NOT NULL,
    "ram_gb" INTEGER NOT NULL,
    "storage_type" VARCHAR(20) NOT NULL, -- SSD, NVMe
    "storage_gb" INTEGER NOT NULL,
    "bandwidth_mb" INTEGER NOT NULL,
    "operating_system" VARCHAR(100) NOT NULL,
    "monthly_price" DECIMAL(10,2) NOT NULL,
    "setup_fee" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vps_plans_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vps_plans_storage_type_check" CHECK (storage_type IN ('SSD', 'NVMe'))
);

CREATE TRIGGER "set_timestamp_vps_plans"
BEFORE UPDATE ON "vps_plans"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store user shopping cart items
CREATE TABLE "carts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "vps_plan_id" UUID NOT NULL,
    "hostname" VARCHAR(255) NOT NULL,
    "vm_template" VARCHAR(100) NOT NULL,
    "duration_months" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "carts_user_id_vps_plan_id_key" UNIQUE ("user_id", "vps_plan_id"),
    CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "carts_vps_plan_id_fkey" FOREIGN KEY ("vps_plan_id") REFERENCES "vps_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "carts_user_id_idx" ON "carts"("user_id");

CREATE TRIGGER "set_timestamp_carts"
BEFORE UPDATE ON "carts"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store user orders and invoices information
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "order_number" VARCHAR(50) NOT NULL, -- ORD-YYYYMMDD-XXXX
    "total_amount" DECIMAL(10,2) NOT NULL,
    "billing_address" TEXT NOT NULL,
    "billing_phone" VARCHAR(20) NOT NULL,
    "status" VARCHAR(20) DEFAULT 'pending', -- pending, paid, processing, cancelled
    "notes" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invoices_order_number_key" UNIQUE ("order_number"),
    CONSTRAINT "invoices_status_check" CHECK (status IN ('pending', 'paid', 'processing', 'cancelled')),
    CONSTRAINT "invoices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "orders_user_id_status_idx" ON "orders"("user_id", "status");

CREATE TRIGGER "set_timestamp_orders"
BEFORE UPDATE ON "orders"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store individual items within an order
CREATE TABLE "order_items" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "vps_plan_id" UUID,
    "hostname" VARCHAR(255) NOT NULL,
    "vm_template" VARCHAR(100) NOT NULL,
    "duration_months" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "configuration" JSONB, -- Store additional configuration
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_vps_plan_id_fkey" FOREIGN KEY ("vps_plan_id") REFERENCES "vps_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "order_items_order_id_idx" ON "order_items"("order_id");

CREATE TRIGGER "set_timestamp_order_items"
BEFORE UPDATE ON "order_items"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store payment transaction details
CREATE TABLE "payment_transactions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "order_id" UUID NOT NULL,
    "transaction_id" VARCHAR(255), -- ID from payment gateway
    "payment_method" VARCHAR(20) NOT NULL, -- momo, vnpay
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(3) DEFAULT 'VND', -- VND, USD
    "status" VARCHAR(20) DEFAULT 'pending', -- pending, completed, failed
    "gateway_response" JSONB, -- Response from payment gateway
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_transactions_transaction_id_key" UNIQUE ("transaction_id"),
    CONSTRAINT "payment_transactions_status_check" CHECK (status IN ('pending', 'completed', 'failed')),
    CONSTRAINT "payment_transactions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "payment_transactions_order_id_idx" ON "payment_transactions"("order_id");

CREATE TRIGGER "set_timestamp_payment_transactions"
BEFORE UPDATE ON "payment_transactions"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store VPS instances rented by users
CREATE TABLE "vps_instances" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "vps_plan_id" UUID,
    "hostname" VARCHAR(255) NOT NULL,
    "ip_address" INET,
    "username" VARCHAR(100),
    "password" VARCHAR(255),
    "vm_template" VARCHAR(100) NOT NULL,
    "duration_months" INTEGER NOT NULL DEFAULT 1,
    "status" VARCHAR(20) DEFAULT 'creating', -- creating, active, suspended, terminated, error
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "auto_renew" BOOLEAN DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vps_instances_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vps_instances_status_check" CHECK (status IN ('creating', 'active', 'suspended', 'terminated', 'error')),
    CONSTRAINT "vps_instances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vps_instances_vps_plan_id_fkey" FOREIGN KEY ("vps_plan_id") REFERENCES "vps_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "vps_instances_user_id_status_idx" ON "vps_instances"("user_id", "status");

CREATE TRIGGER "set_timestamp_vps_instances"
BEFORE UPDATE ON "vps_instances"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store promotional codes and discounts
CREATE TABLE "promotions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "discount_type" VARCHAR(20) NOT NULL, -- percentage, fixed_amount
    "discount_value" DECIMAL(10,2) NOT NULL,
    "start_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "end_date" TIMESTAMP WITH TIME ZONE NOT NULL,
    "usage_limit" INTEGER, -- Total usage limit
    "per_user_limit" INTEGER, -- Usage limit per user
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promotions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "promotions_code_key" UNIQUE ("code"),
    CONSTRAINT "promotions_discount_type_check" CHECK (discount_type IN ('percentage', 'fixed_amount'))
);

CREATE TRIGGER "set_timestamp_promotions"
BEFORE UPDATE ON "promotions"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Track which users have used which promotions
CREATE TABLE "user_promotions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "promotion_id" UUID NOT NULL,
    "order_id" UUID NOT NULL,
    "used_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_promotions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "user_promotions_user_promotion_key" UNIQUE ("user_id", "promotion_id"),
    CONSTRAINT "user_promotions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_promotions_promotion_id_fkey" FOREIGN KEY ("promotion_id") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_promotions_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "user_promotions_user_id_idx" ON "user_promotions"("user_id");


-- Store customer support tickets
CREATE TABLE "support_tickets" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "subject" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(100), -- technical_support, payment, server_issue, performance, security, other
    "priority" VARCHAR(20) DEFAULT 'low', -- low, medium, high, urgent
    "status" VARCHAR(20) DEFAULT 'open', -- open, in_progress, resolved, closed
    "email" TEXT NOT NULL,
    "phone" VARCHAR(20) NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_tickets_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "support_tickets_status_check" CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    CONSTRAINT "support_tickets_priority_check" CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    CONSTRAINT "support_tickets_category_check" CHECK (category IN ('technical_support', 'payment', 'server_issue', 'performance', 'security', 'other')),
    CONSTRAINT "support_tickets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "support_tickets_user_id_status_idx" ON "support_tickets"("user_id", "status");

CREATE TRIGGER "set_timestamp_support_tickets"
BEFORE UPDATE ON "support_tickets"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store replies/messages within support tickets
CREATE TABLE "support_ticket_reply" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticket_id" UUID NOT NULL,
    "message" JSONB NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_reply_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "support_ticket_reply_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "support_ticket_reply_ticket_id_idx" ON "support_ticket_reply"("ticket_id");

CREATE TRIGGER "set_timestamp_support_ticket_reply"
BEFORE UPDATE ON "support_ticket_reply"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store user conversations (for chatbot or support)
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "conversations_user_id_idx" ON "conversations"("user_id");

CREATE TRIGGER "set_timestamp_conversations"
BEFORE UPDATE ON "conversations"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


CREATE TABLE "inboxes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "conversation_id" UUID NOT NULL,
    "sender" VARCHAR(20) NOT NULL, -- user, bot
    "message" TEXT NOT NULL,
    "intent" VARCHAR(100), -- Chatbot intent classification
    "confidence" FLOAT, -- Confidence score for bot responses
    "metadata" JSONB, -- Additional metadata
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inboxes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "inboxes_sender_check" CHECK (sender IN ('user', 'bot')),
    CONSTRAINT "inboxes_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "inboxes_conversation_id_idx" ON "inboxes"("conversation_id");

CREATE TRIGGER "set_timestamp_inboxes"
BEFORE UPDATE ON "inboxes"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


CREATE TABLE "knowledge_base" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" VARCHAR(50), -- e.g., Payment, Technical Support
    "tags" TEXT[], -- e.g., ['payment', 'setup']
    "search_vector" TSVECTOR,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_base_pkey" PRIMARY KEY ("id")
);

UPDATE "knowledge_base" 
SET "search_vector" = to_tsvector('english', coalesce("question",'') || ' ' || coalesce("answer",'')) WHERE "search_vector" IS NULL;

CREATE INDEX "knowledge_base_search_vector_idx" ON "knowledge_base" USING GIN("search_vector");

CREATE TRIGGER "set_timestamp_knowledge_base"
BEFORE UPDATE ON "knowledge_base"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
