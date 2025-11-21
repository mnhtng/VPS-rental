-- AlterTable
ALTER TABLE "public"."accounts" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."sessions" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."users" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;
