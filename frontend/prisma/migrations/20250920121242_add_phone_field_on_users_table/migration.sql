/*
  Warnings:

  - A unique constraint covering the columns `[email,phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Made the column `name` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `password` on table `users` required. This step will fail if there are existing NULL values in that column.
  - Made the column `email_verified` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "public"."users_email_key";

-- AlterTable
ALTER TABLE "public"."users" ADD COLUMN     "phone" VARCHAR(20),
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "email" SET NOT NULL,
ALTER COLUMN "password" SET NOT NULL,
ALTER COLUMN "email_verified" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_email_phone_key" ON "public"."users"("email", "phone");
