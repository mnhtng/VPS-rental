DROP TABLE IF EXISTS users, accounts, sessions, verification_tokens, authenticators, proxmox_clusters, proxmox_nodes, proxmox_storages, vm_templates, proxmox_vms, vps_plans, carts, orders, order_items, payment_transactions, vps_instances, vps_snapshots, promotions, user_promotions, support_tickets, support_ticket_replies, conversations, knowledge_bases CASCADE;


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


-- ============================================
-- AUTHENTICATION & AUTHORIZATION
-- ============================================

-- Store user information
CREATE TABLE "users" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" VARCHAR(255),
    "email_verified" TIMESTAMP(3) WITH TIME ZONE,
    "phone" VARCHAR(20),
    "address" TEXT,
    "image" TEXT,
    "role" VARCHAR(20) NOT NULL DEFAULT 'USER',
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "users_email_key" UNIQUE ("email"),
	CONSTRAINT "users_role_check" CHECK (role IN ('USER', 'ADMIN'))
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
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "expires" TIMESTAMP(3) WITH TIME ZONE NOT NULL,
    "created_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

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
    "expires" TIMESTAMP(3) WITH TIME ZONE NOT NULL,

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


-- ============================================
-- PROXMOX INFRASTRUCTURE MANAGEMENT
-- ============================================

-- Proxmox Clusters
CREATE TABLE "proxmox_clusters" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "api_host" VARCHAR(255) NOT NULL,
    "api_port" INTEGER DEFAULT 8006,
    "api_user" VARCHAR(100) NOT NULL, -- e.g., root@pam
	"api_password" VARCHAR(255), -- encrypted
    "api_token_id" VARCHAR(100),
    "api_token_secret" VARCHAR(255), -- encrypted
    "verify_ssl" BOOLEAN NOT NULL DEFAULT FALSE,
    "status" VARCHAR(20) DEFAULT 'active', -- active, maintenance, offline
    "version" VARCHAR(50),
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proxmox_clusters_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "proxmox_clusters_name_key" UNIQUE ("name"),
    CONSTRAINT "proxmox_clusters_status_check" CHECK (status IN ('active', 'maintenance', 'offline'))
);

CREATE TRIGGER "set_timestamp_proxmox_clusters"
BEFORE UPDATE ON "proxmox_clusters"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Proxmox Nodes
CREATE TABLE "proxmox_nodes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cluster_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "ip_address" INET NOT NULL,
    "status" VARCHAR(20) DEFAULT 'online', -- online, offline, maintenance
    "cpu_cores" INTEGER,
    "total_memory_gb" DECIMAL(10,2),
    "total_storage_gb" DECIMAL(10,2),
    "max_vms" INTEGER DEFAULT 100,
    -- Resource limits for allocation
    "cpu_overcommit_ratio" DECIMAL(3,2) DEFAULT 2.0, -- Allow 2x CPU overcommit
    "ram_overcommit_ratio" DECIMAL(3,2) DEFAULT 1.5,
    -- Geographic/metadata
    "datacenter" VARCHAR(100),
    "location" VARCHAR(255),
    -- Monitoring
    "last_health_check" TIMESTAMP WITH TIME ZONE,
    "health_status" JSONB,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "proxmox_nodes_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "proxmox_nodes_cluster_id_name_key" UNIQUE ("cluster_id", "name"),
    CONSTRAINT "proxmox_nodes_status_check" CHECK (status IN ('online', 'offline', 'maintenance')),
    CONSTRAINT "proxmox_nodes_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "proxmox_clusters"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TRIGGER "set_timestamp_proxmox_nodes"
BEFORE UPDATE ON "proxmox_nodes"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Storage Configuration
CREATE TABLE "proxmox_storages" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "node_id" UUID, -- Null with share storage
    "name" VARCHAR(100) NOT NULL, -- local-lvm, ceph, nfs
    "type" VARCHAR(20), -- btrfs | cephfs | cifs | dir | esxi | iscsi | iscsidirect | lvm | lvmthin | nfs | pbs | rbd | zfs | zfspool
    "content_types" TEXT[], -- ['images', 'rootdir', 'iso', 'backup']
    "total_space_gb" DECIMAL(10,2),
    "used_space_gb" DECIMAL(10,2),
    "available_space_gb" DECIMAL(10,2),
    "enabled" BOOLEAN DEFAULT TRUE,
    "shared" BOOLEAN DEFAULT FALSE, -- Shared storage across nodes
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "proxmox_storages_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "proxmox_storages_node_id_name_key" UNIQUE("node_id", "name"),
    CONSTRAINT "proxmox_storages_type_check" CHECK (type IN ('btrfs', 'cephfs', 'cifs', 'dir', 'esxi', 'iscsi', 'iscsidirect', 'lvm', 'lvmthin', 'nfs', 'pbs', 'rbd', 'zfs', 'zfspool')),
    CONSTRAINT "proxmox_storages_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "proxmox_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TRIGGER "set_timestamp_proxmox_storages"
BEFORE UPDATE ON "proxmox_storages"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- VM Templates
CREATE TABLE "vm_templates" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cluster_id" UUID,
    "node_id" UUID,
	"storage_id" UUID,
    "template_vmid" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "os_type" VARCHAR(50), -- linux, windows
	"os_version" VARCHAR(10), -- 22.04
    "default_user" VARCHAR(50) DEFAULT 'root',
	"cloud_init_enabled" BOOLEAN DEFAULT FALSE,
	-- Resource Specifications
    "cpu_cores" INTEGER DEFAULT 1,
    "ram_gb" INTEGER DEFAULT 1,
    "storage_gb" INTEGER DEFAULT 20,
    -- Pricing
    "setup_fee" DECIMAL(10,2) DEFAULT 0,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vm_templates_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vm_templates_cluster_id_node_id_template_vmid_key" UNIQUE ("cluster_id", "node_id", "template_vmid"),
    CONSTRAINT "vm_templates_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "proxmox_clusters"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vm_templates_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "proxmox_nodes"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vm_templates_storage_id_fkey" FOREIGN KEY ("storage_id") REFERENCES "proxmox_storages"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "vm_templates_template_vmid_idx" ON "vm_templates"("template_vmid");

CREATE TRIGGER "set_timestamp_vm_templates"
BEFORE UPDATE ON "vm_templates"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Proxmox VMs
CREATE TABLE "proxmox_vms" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cluster_id" UUID NOT NULL,
    "node_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "vmid" INTEGER NOT NULL,
    "hostname" VARCHAR(255) NOT NULL,
    "ip_address" INET,
    "mac_address" VARCHAR(17),
    -- Access credentials
    "username" VARCHAR(100),
    "password" VARCHAR(255),
    "ssh_port" INTEGER DEFAULT 22, -- SSH port (may be custom)
    "vnc_port" INTEGER, -- VNC port for console access
    "vnc_password" VARCHAR(255),
    -- Resource specifications (snapshot of plan at creation)
    "vcpu" INTEGER,
    "ram_gb" INTEGER,
    "storage_gb" INTEGER,
    "storage_type" VARCHAR(20),
    "bandwidth_mbps" INTEGER,
    "power_status" VARCHAR(20) NOT NULL DEFAULT 'stopped', -- running, stopped, suspended
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "proxmox_vms_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "proxmox_vms_cluster_id_node_id_vmid_key" UNIQUE ("cluster_id", "node_id", "vmid"),
    CONSTRAINT "proxmox_vms_hostname_key" UNIQUE ("hostname"),
    CONSTRAINT "proxmox_vms_power_status_check" CHECK (power_status IN ('running', 'stopped', 'suspended')),
    CONSTRAINT "proxmox_vms_cluster_id_fkey" FOREIGN KEY ("cluster_id") REFERENCES "proxmox_clusters"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "proxmox_vms_node_id_fkey" FOREIGN KEY ("node_id") REFERENCES "proxmox_nodes"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "proxmox_vms_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "vm_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE INDEX "proxmox_vms_node_id_idx" ON "proxmox_vms"("node_id");
CREATE INDEX "proxmox_vms_vmid_idx" ON "proxmox_vms"("vmid");

CREATE TRIGGER "set_timestamp_proxmox_vms"
BEFORE UPDATE ON "proxmox_vms"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- ============================================
-- PRODUCT MANAGEMENT
-- ============================================

-- Store VPS configuration plans
CREATE TABLE "vps_plans" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50) NOT NULL, -- basic, standard, premium
	"use_case" TEXT[],
    "vcpu" INTEGER NOT NULL,
    "ram_gb" INTEGER NOT NULL,
    "storage_type" VARCHAR(20) NOT NULL, -- SSD, NVMe
    "storage_gb" INTEGER NOT NULL,
    "bandwidth_mbps" INTEGER NOT NULL, -- Network speed
    "monthly_price" DECIMAL(10,2) NOT NULL,
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND', -- VND, USD
    -- Limitations
    "max_snapshots" INTEGER NOT NULL DEFAULT 1,
    "max_ip_addresses" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vps_plans_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vps_plans_category_check" CHECK (category IN ('basic', 'standard', 'premium')),
    CONSTRAINT "vps_plans_storage_type_check" CHECK (storage_type IN ('SSD', 'NVMe')),
    CONSTRAINT "vps_plans_currency_check" CHECK (currency IN ('VND', 'USD'))
);

CREATE INDEX "vps_plans_category_idx" ON "vps_plans"("category");

CREATE TRIGGER "set_timestamp_vps_plans"
BEFORE UPDATE ON "vps_plans"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store user shopping cart items
CREATE TABLE "carts" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "vps_plan_id" UUID NOT NULL,
    "template_id" UUID NOT NULL,
    "hostname" VARCHAR(255) NOT NULL,
	"os" TEXT NOT NULL,
    "duration_months" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "carts_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "carts_user_id_vps_plan_id_template_id_hostname_key" UNIQUE ("user_id", "vps_plan_id", "template_id", "hostname"),
    CONSTRAINT "carts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "carts_vps_plan_id_fkey" FOREIGN KEY ("vps_plan_id") REFERENCES "vps_plans"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "carts_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "vm_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "carts_user_id_idx" ON "carts"("user_id");

CREATE TRIGGER "set_timestamp_carts"
BEFORE UPDATE ON "carts"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store user orders and invoices information
CREATE TABLE "orders" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID,
    "order_number" VARCHAR(50) NOT NULL, -- ORD-YYYYMMDD-XXXX
    "price" DECIMAL(10,2) NOT NULL,
    "billing_address" TEXT,
    "billing_phone" VARCHAR(20),
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, paid, processing, cancelled
    "note" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "orders_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "orders_order_number_key" UNIQUE ("order_number"),
    CONSTRAINT "orders_status_check" CHECK (status IN ('pending', 'paid', 'processing', 'cancelled')),
    CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "template_id" UUID,
    "hostname" VARCHAR(255) NOT NULL,
	"os" TEXT NOT NULL,
    "duration_months" INTEGER NOT NULL DEFAULT 1,
    "unit_price" DECIMAL(10,2) NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "configuration" JSONB NOT NULL, -- Store additional configuration
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "order_items_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "order_items_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "order_items_vps_plan_id_fkey" FOREIGN KEY ("vps_plan_id") REFERENCES "vps_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "order_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "vm_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE
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
    "currency" VARCHAR(10) NOT NULL DEFAULT 'VND', -- VND, USD
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, completed, failed
    "gateway_response" JSONB, -- Response from payment gateway
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payment_transactions_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "payment_transactions_transaction_id_key" UNIQUE ("transaction_id"),
    CONSTRAINT "paymenttransactions_status_check" CHECK (status IN ('pending', 'completed', 'failed')),
    CONSTRAINT "payment_transactions_payment_method_check" CHECK (payment_method IN ('momo', 'vnpay')),
    CONSTRAINT "payment_transactions_currency_check" CHECK (currency IN ('VND', 'USD')),
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
    "order_item_id" UUID,
    "vm_id" UUID,
    -- Status and lifecycle
    "status" VARCHAR(20) NOT NULL DEFAULT 'creating', -- creating, active, suspended, terminated, error
    "expires_at" TIMESTAMP WITH TIME ZONE NOT NULL,
    "auto_renew" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vps_instances_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vps_instances_status_check" CHECK (status IN ('creating', 'active', 'suspended', 'terminated', 'error')),
    CONSTRAINT "vps_instances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vps_instances_vps_plan_id_fkey" FOREIGN KEY ("vps_plan_id") REFERENCES "vps_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vps_instances_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "vps_instances_vm_id_fkey" FOREIGN KEY ("vm_id") REFERENCES "proxmox_vms"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "vps_instances_user_id_status_idx" ON "vps_instances"("user_id", "status");
CREATE INDEX "vps_instances_vm_id_idx" ON "vps_instances"("vm_id");
CREATE INDEX "vps_instances_expires_at_idx" ON "vps_instances"("expires_at");

CREATE TRIGGER "set_timestamp_vps_instances"
BEFORE UPDATE ON "vps_instances"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store VPS snapshots
CREATE TABLE "vps_snapshots" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "vm_id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "size_gb" DECIMAL(10,2),
    "status" VARCHAR(20) NOT NULL DEFAULT 'creating', -- creating, available, deleting, error
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vps_snapshots_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "vps_snapshots_vm_id_name_key" UNIQUE ("vm_id", "name"),
    CONSTRAINT "vps_snapshots_status_check" CHECK (status IN ('creating', 'available', 'deleting', 'error')),
    CONSTRAINT "vps_snapshots_vm_id_fkey" FOREIGN KEY ("vm_id") REFERENCES "proxmox_vms"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "vps_snapshots_vm_id_idx" ON "vps_snapshots"("vm_id");
CREATE INDEX "vps_snapshots_status_idx" ON "vps_snapshots"("status");

CREATE TRIGGER "set_timestamp_vps_snapshots"
BEFORE UPDATE ON "vps_snapshots"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store promotional codes and discounts
CREATE TABLE "promotions" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "discount_type" VARCHAR(20) NOT NULL, -- percentage, fixed_amount
    "discount_value" DECIMAL(10,2) NOT NULL,
    "start_date" TIMESTAMP WITH TIME ZONE,
    "end_date" TIMESTAMP WITH TIME ZONE,
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
    CONSTRAINT "user_promotions_user_id_promotion_id_order_id_key" UNIQUE ("user_id", "promotion_id", "order_id"),
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
    "category" VARCHAR(100) NOT NULL, -- technical_support, payment, server_issue, performance, security, other
    "priority" VARCHAR(20) NOT NULL DEFAULT 'low', -- low, medium, high, urgent
    "status" VARCHAR(20) NOT NULL DEFAULT 'open', -- open, in_progress, resolved, closed
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
CREATE TABLE "support_ticket_replies" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "ticket_id" UUID NOT NULL,
    "message" JSONB NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "support_ticket_replies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "support_ticket_replies_ticket_id_fkey" FOREIGN KEY ("ticket_id") REFERENCES "support_tickets"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "support_ticket_replies_ticket_id_idx" ON "support_ticket_replies"("ticket_id");

CREATE TRIGGER "set_timestamp_support_ticket_replies"
BEFORE UPDATE ON "support_ticket_replies"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store user conversations (for chatbot or support)
CREATE TABLE "conversations" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
	"sender" VARCHAR(20) NOT NULL, -- user, bot
    "message" TEXT NOT NULL,
    "intent" VARCHAR(100), -- Chatbot intent classification
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id"),
	CONSTRAINT "conversations_sender_check" CHECK (sender IN ('user', 'bot')),
    CONSTRAINT "conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "conversations_user_id_idx" ON "conversations"("user_id");

CREATE TRIGGER "set_timestamp_conversations"
BEFORE UPDATE ON "conversations"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();


-- Store knowledge base articles for FAQs and support
CREATE TABLE "knowledge_bases" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "category" VARCHAR(50), -- e.g., Payment, Technical Support
    "tags" TEXT[], -- e.g., ['payment', 'setup']
    "search_vector" TSVECTOR,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "knowledge_bases_pkey" PRIMARY KEY ("id")
);

UPDATE "knowledge_bases" 
SET "search_vector" = to_tsvector('english', coalesce("question",'') || ' ' || coalesce("answer",'')) WHERE "search_vector" IS NULL;

CREATE INDEX "knowledge_bases_search_vector_idx" ON "knowledge_bases" USING GIN("search_vector");

CREATE TRIGGER "set_timestamp_knowledge_bases"
BEFORE UPDATE ON "knowledge_bases"
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column();
