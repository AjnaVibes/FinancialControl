/*
  Warnings:

  - You are about to drop the column `working_time_end` on the `clients` table. All the data in the column will be lost.
  - You are about to drop the column `working_time_start` on the `clients` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX `clients_beneficiary_idx` ON `clients`;

-- DropIndex
DROP INDEX `clients_client_status_idx` ON `clients`;

-- DropIndex
DROP INDEX `clients_marital_regimen_idx` ON `clients`;

-- DropIndex
DROP INDEX `clients_marital_registry_idx` ON `clients`;

-- DropIndex
DROP INDEX `clients_marital_status_idx` ON `clients`;

-- DropIndex
DROP INDEX `quotations_payment_entity_fkey` ON `quotations`;

-- DropIndex
DROP INDEX `quotations_payment_method_fkey` ON `quotations`;

-- DropIndex
DROP INDEX `quotations_quotation_status_fkey` ON `quotations`;

-- DropIndex
DROP INDEX `transactions_payment_entity_fkey` ON `transactions`;

-- DropIndex
DROP INDEX `transactions_payment_method_fkey` ON `transactions`;

-- DropIndex
DROP INDEX `transactions_prototype_fkey` ON `transactions`;

-- DropIndex
DROP INDEX `transactions_sub_prototype_fkey` ON `transactions`;

-- AlterTable
ALTER TABLE `clients` DROP COLUMN `working_time_end`,
    DROP COLUMN `working_time_start`,
    MODIFY `id` INTEGER NOT NULL;
