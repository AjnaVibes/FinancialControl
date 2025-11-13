/*
  Warnings:

  - You are about to alter the column `monthly_income` on the `clients` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.
  - You are about to alter the column `additional_income` on the `clients` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Int`.

*/
-- DropForeignKey
ALTER TABLE `agencies` DROP FOREIGN KEY `agencies_coordinator_fkey`;

-- DropForeignKey
ALTER TABLE `agents` DROP FOREIGN KEY `agents_agency_fkey`;

-- DropForeignKey
ALTER TABLE `agents` DROP FOREIGN KEY `agents_coordinator_fkey`;

-- DropForeignKey
ALTER TABLE `client_references` DROP FOREIGN KEY `client_references_client_fkey`;

-- DropForeignKey
ALTER TABLE `clients` DROP FOREIGN KEY `clients_beneficiary_fkey`;

-- DropForeignKey
ALTER TABLE `clients` DROP FOREIGN KEY `clients_client_status_fkey`;

-- DropForeignKey
ALTER TABLE `clients` DROP FOREIGN KEY `clients_marital_regimen_fkey`;

-- DropForeignKey
ALTER TABLE `clients` DROP FOREIGN KEY `clients_marital_registry_fkey`;

-- DropForeignKey
ALTER TABLE `clients` DROP FOREIGN KEY `clients_marital_status_fkey`;

-- DropForeignKey
ALTER TABLE `coordinators` DROP FOREIGN KEY `coordinators_agency_fkey`;

-- DropForeignKey
ALTER TABLE `deposits` DROP FOREIGN KEY `deposits_project_fkey`;

-- DropForeignKey
ALTER TABLE `facades` DROP FOREIGN KEY `facades_project_fkey`;

-- DropForeignKey
ALTER TABLE `movement_methods` DROP FOREIGN KEY `movement_methods_agency_fkey`;

-- DropForeignKey
ALTER TABLE `movements` DROP FOREIGN KEY `movements_transaction_fkey`;

-- DropForeignKey
ALTER TABLE `payment_entities` DROP FOREIGN KEY `payment_entities_payment_method_fkey`;

-- DropForeignKey
ALTER TABLE `payment_methods` DROP FOREIGN KEY `payment_methods_project_fkey`;

-- DropForeignKey
ALTER TABLE `phases` DROP FOREIGN KEY `phases_phase_status_fkey`;

-- DropForeignKey
ALTER TABLE `phases` DROP FOREIGN KEY `phases_project_fkey`;

-- DropForeignKey
ALTER TABLE `projects` DROP FOREIGN KEY `projects_project_status_fkey`;

-- DropForeignKey
ALTER TABLE `promissories` DROP FOREIGN KEY `promissories_transaction_fkey`;

-- DropForeignKey
ALTER TABLE `promissories` DROP FOREIGN KEY `promissories_type_fkey`;

-- DropForeignKey
ALTER TABLE `prototipes` DROP FOREIGN KEY `prototipes_project_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_agency_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_agent_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_client_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_payment_entity_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_payment_method_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_project_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_prototype_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_quotation_status_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_sub_prototype_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_transaction_fkey`;

-- DropForeignKey
ALTER TABLE `quotations` DROP FOREIGN KEY `quotations_unit_fkey`;

-- DropForeignKey
ALTER TABLE `references` DROP FOREIGN KEY `references_project_fkey`;

-- DropForeignKey
ALTER TABLE `references` DROP FOREIGN KEY `references_quotation_fkey`;

-- DropForeignKey
ALTER TABLE `sub_developers` DROP FOREIGN KEY `sub_developers_developer_fkey`;

-- DropForeignKey
ALTER TABLE `sub_developers` DROP FOREIGN KEY `sub_developers_project_fkey`;

-- DropForeignKey
ALTER TABLE `sub_prototypes` DROP FOREIGN KEY `sub_prototypes_project_fkey`;

-- DropForeignKey
ALTER TABLE `sub_prototypes` DROP FOREIGN KEY `sub_prototypes_prototype_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_client_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_payment_entity_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_payment_method_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_project_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_prototype_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_sub_prototype_fkey`;

-- DropForeignKey
ALTER TABLE `transactions` DROP FOREIGN KEY `transactions_unit_fkey`;

-- DropForeignKey
ALTER TABLE `units` DROP FOREIGN KEY `units_facade_fkey`;

-- DropForeignKey
ALTER TABLE `units` DROP FOREIGN KEY `units_phase_fkey`;

-- DropForeignKey
ALTER TABLE `units` DROP FOREIGN KEY `units_project_fkey`;

-- DropForeignKey
ALTER TABLE `units` DROP FOREIGN KEY `units_prototype_fkey`;

-- DropForeignKey
ALTER TABLE `units` DROP FOREIGN KEY `units_sub_prototype_fkey`;

-- DropIndex
DROP INDEX `clients_created_at_idx` ON `clients`;

-- DropIndex
DROP INDEX `clients_curp_idx` ON `clients`;

-- DropIndex
DROP INDEX `clients_email_idx` ON `clients`;

-- DropIndex
DROP INDEX `clients_updated_at_idx` ON `clients`;

-- AlterTable
ALTER TABLE `clients` MODIFY `birthday` DATE NULL,
    MODIFY `email` TEXT NULL,
    MODIFY `curp` TEXT NULL,
    MODIFY `monthly_income` INTEGER NULL,
    MODIFY `additional_income` INTEGER NULL,
    MODIFY `working_time_start` TEXT NULL,
    MODIFY `working_time_end` TEXT NULL;

-- CreateTable
CREATE TABLE `transaction_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `color` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `operates` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `description` VARCHAR(255) NULL,
    `color` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `transactions_operate_idx` ON `transactions`(`operate`);
