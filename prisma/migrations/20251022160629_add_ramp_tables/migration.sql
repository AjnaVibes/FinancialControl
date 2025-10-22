-- CreateTable
CREATE TABLE `marital_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marital_registries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `marital_regimen` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `color` VARCHAR(255) NULL,
    `key` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `client_statuses_key_idx`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `project_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phase_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotation_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `color` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promise_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `hidden` BOOLEAN NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agencies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `responsable` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `mobile` VARCHAR(255) NULL,
    `phone` VARCHAR(255) NULL,
    `address` VARCHAR(255) NULL,
    `composed_commission` INTEGER NULL,
    `coordinator` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `comm_account_statement` INTEGER NULL,
    `user` INTEGER NULL,
    `is_broker` BOOLEAN NULL,

    INDEX `agencies_coordinator_idx`(`coordinator`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `coordinators` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `f_lastname` VARCHAR(255) NULL,
    `m_lastname` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `mobile` VARCHAR(255) NULL,
    `agency` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `comm_account_statement` INTEGER NULL,

    INDEX `coordinators_agency_idx`(`agency`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `agents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `mobile` VARCHAR(255) NULL,
    `phone` VARCHAR(255) NULL,
    `address` VARCHAR(255) NULL,
    `agency` INTEGER NULL,
    `composed_commission` INTEGER NULL,
    `user` INTEGER NULL,
    `coordinator` INTEGER NULL,
    `can_reservate` TEXT NULL,
    `last_session` DATETIME(3) NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `comm_account_statement` INTEGER NULL,
    `is_broker` BOOLEAN NULL,
    `is_google_calendar_synced` BOOLEAN NULL,
    `is_google_mail_synced` BOOLEAN NULL,
    `google_user_email` VARCHAR(255) NULL,
    `google_access_token` LONGTEXT NULL,
    `google_refresh_token` LONGTEXT NULL,

    INDEX `agents_agency_idx`(`agency`),
    INDEX `agents_coordinator_idx`(`coordinator`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `beneficiaries` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `m_lastname` VARCHAR(255) NULL,
    `f_lastname` VARCHAR(255) NULL,
    `identification_type` VARCHAR(255) NULL,
    `identification` VARCHAR(255) NULL,
    `relation` VARCHAR(255) NULL,
    `client` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `beneficiaries_client_idx`(`client`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `client_references` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `phone` VARCHAR(255) NULL,
    `f_lastname` VARCHAR(255) NULL,
    `m_lastname` VARCHAR(255) NULL,
    `client` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `client_references_client_idx`(`client`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `developers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `business_name` VARCHAR(255) NULL,
    `user` INTEGER NULL,
    `website` VARCHAR(255) NULL,
    `phone` VARCHAR(255) NULL,
    `cellphone` VARCHAR(255) NULL,
    `facebook` VARCHAR(255) NULL,
    `instagram` VARCHAR(255) NULL,
    `address` LONGTEXT NULL,
    `project` INTEGER NULL,
    `bank_reference` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_developers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `business_name` VARCHAR(255) NULL,
    `website` VARCHAR(255) NULL,
    `phone` VARCHAR(255) NULL,
    `cellphone` VARCHAR(255) NULL,
    `facebook` VARCHAR(255) NULL,
    `instagram` VARCHAR(255) NULL,
    `address` LONGTEXT NULL,
    `user` INTEGER NULL,
    `developer` INTEGER NULL,
    `project` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `sub_developers_developer_idx`(`developer`),
    INDEX `sub_developers_project_idx`(`project`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `projects` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `address` VARCHAR(255) NULL,
    `surface` DECIMAL(10, 2) NULL,
    `project_status` INTEGER NULL,
    `image_id` INTEGER NULL,
    `project_file` INTEGER NULL,
    `configuration` INTEGER NULL,
    `penalty` INTEGER NULL,
    `history` TEXT NULL,
    `project_id` INTEGER NULL,
    `currency` TEXT NULL,
    `signature` VARCHAR(255) NULL,
    `deposit_account` VARCHAR(255) NULL,
    `business_name` VARCHAR(255) NULL,
    `deleted_at` DATETIME(3) NULL,
    `development_description` TEXT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `broker` INTEGER NULL,
    `website` VARCHAR(255) NULL,
    `deed` VARCHAR(255) NULL,
    `deed_number` VARCHAR(255) NULL,
    `notary_name` VARCHAR(255) NULL,
    `notary_number` VARCHAR(255) NULL,
    `notary_state` VARCHAR(255) NULL,
    `signature_mail` VARCHAR(255) NULL,
    `date` DATETIME(3) NULL,
    `mbroker` INTEGER NULL,
    `map_type` VARCHAR(255) NULL,

    INDEX `projects_project_status_idx`(`project_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `facades` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `project` INTEGER NULL,
    `facade_id` INTEGER NULL,
    `description` TEXT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `facades_project_idx`(`project`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `phases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `start_date` DATETIME(3) NULL,
    `deadline` DATETIME(3) NULL,
    `project` INTEGER NULL,
    `phase_status` INTEGER NULL,
    `variation` DOUBLE NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `airtable` VARCHAR(255) NULL,

    INDEX `phases_project_idx`(`project`),
    INDEX `phases_phase_status_idx`(`phase_status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `prototipes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `max_units` INTEGER NULL,
    `project` INTEGER NULL,
    `housing_type` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `prototipes_project_idx`(`project`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sub_prototypes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prototype` INTEGER NULL,
    `project` INTEGER NULL,
    `name` VARCHAR(255) NULL,
    `price` DECIMAL(10, 2) NULL,
    `aside` DECIMAL(10, 2) NULL,
    `specifications` TEXT NULL,
    `commercial_description` TEXT NULL,
    `construction` DECIMAL(10, 2) NULL,
    `bedrooms` INTEGER NULL,
    `bathrooms` INTEGER NULL,
    `half_bathrooms` INTEGER NULL,
    `lounge` INTEGER NULL,
    `dinning_room` INTEGER NULL,
    `studio` INTEGER NULL,
    `flex_room` INTEGER NULL,
    `parking` INTEGER NULL,
    `cellar` INTEGER NULL,
    `washing` INTEGER NULL,
    `specifications_finishes` TEXT NULL,
    `specifications_ceiling` TEXT NULL,
    `specifications_smithy` TEXT NULL,
    `specifications_furniture` LONGTEXT NULL,
    `specifications_installations` TEXT NULL,
    `specifications_painting` TEXT NULL,
    `specifications_equipment` TEXT NULL,
    `penalty` INTEGER NULL,
    `rooftop_number` DOUBLE NULL,
    `rooftop_area` DOUBLE NULL,
    `parking_area` DOUBLE NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `prototipe` INTEGER NULL,

    INDEX `sub_prototypes_prototype_idx`(`prototype`),
    INDEX `sub_prototypes_project_idx`(`project`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `units` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `prototype` INTEGER NULL,
    `phase` INTEGER NULL,
    `cuv` VARCHAR(255) NULL,
    `street` VARCHAR(255) NULL,
    `surface` DOUBLE NULL,
    `floors` INTEGER NULL,
    `surplus_mt2` DOUBLE NULL,
    `project` INTEGER NULL,
    `price` DECIMAL(10, 2) NULL,
    `condominium_set` INTEGER NULL,
    `location` INTEGER NULL,
    `housing_id` VARCHAR(255) NULL,
    `building_phase` INTEGER NULL,
    `official_number` VARCHAR(255) NULL,
    `interior_number` VARCHAR(255) NULL,
    `facade` INTEGER NULL,
    `lot` INTEGER NULL,
    `square` INTEGER NULL,
    `sub_prototype` INTEGER NULL,
    `subcondominium_set` INTEGER NULL,
    `housing_number` VARCHAR(255) NULL,
    `currency` TEXT NULL,
    `bridge` INTEGER NULL,
    `building` INTEGER NULL,
    `amenities` INTEGER NULL,
    `quality_checklist` INTEGER NULL,
    `postsale_checklist` INTEGER NULL,
    `warranty_checklist` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `ocpg_checklist` INTEGER NULL,
    `prototipe` INTEGER NULL,

    INDEX `units_prototype_idx`(`prototype`),
    INDEX `units_phase_idx`(`phase`),
    INDEX `units_project_idx`(`project`),
    INDEX `units_facade_idx`(`facade`),
    INDEX `units_sub_prototype_idx`(`sub_prototype`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `quotations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `unit` INTEGER NULL,
    `sub_prototype` INTEGER NULL,
    `prototype` INTEGER NULL,
    `project` INTEGER NULL,
    `discount` INTEGER NULL,
    `deed` INTEGER NULL,
    `payment_method` INTEGER NULL,
    `sub_payment_method` INTEGER NULL,
    `agent` INTEGER NULL,
    `client` INTEGER NULL,
    `items` TEXT NULL,
    `agency` INTEGER NULL,
    `quotation_status` INTEGER NULL,
    `payment_entity` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `deposit` DECIMAL(10, 2) NULL,
    `transaction` INTEGER NULL,
    `total` DECIMAL(10, 2) NULL,
    `subtotal` DECIMAL(10, 2) NULL,
    `deposit_total` DECIMAL(10, 2) NULL,
    `executive` INTEGER NULL,
    `complete` BOOLEAN NULL,
    `send` BOOLEAN NULL,
    `cost_total` DECIMAL(10, 2) NULL,
    `surplus_price_total` DECIMAL(10, 2) NULL,
    `package_total` DECIMAL(10, 2) NULL,
    `deed_total` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(10) NULL,
    `exchange_rate` VARCHAR(10) NULL,
    `rate_type` DECIMAL(10, 2) NULL,
    `notes` VARCHAR(255) NULL,
    `monex` INTEGER NULL,
    `first_credit` DOUBLE NULL,
    `second_credit` DOUBLE NULL,
    `co_sub_payment_method` INTEGER NULL,
    `co_payment_entity` INTEGER NULL,
    `surplus_price` DOUBLE NULL,
    `user` INTEGER NULL,
    `aside_deposit` DOUBLE NULL,
    `additional_cost` DOUBLE NULL,
    `min_deposit` DOUBLE NULL,
    `min_deposit_total` DOUBLE NULL,
    `payment_date` DATETIME(3) NULL,
    `discount_total` DOUBLE NULL,
    `reservation` INTEGER NULL,
    `safe_cost_total` DOUBLE NULL,
    `aside_deposits` TEXT NULL,
    `version` VARCHAR(255) NULL,
    `created_by` INTEGER NULL,
    `is_coacredited` BOOLEAN NULL,
    `commissionable` BOOLEAN NULL,
    `verification_date` DATETIME(3) NULL,
    `quotation_sent_date` DATETIME(3) NULL,
    `monex_reference_sent_date` DATETIME(3) NULL,
    `airtable` VARCHAR(255) NULL,
    `is_deed_informative` BOOLEAN NULL,
    `prototipe` INTEGER NULL,
    `broker` INTEGER NULL,
    `coordinator` INTEGER NULL,
    `referencial` INTEGER NULL,
    `referencial_assign` VARCHAR(255) NULL,
    `mbroker` INTEGER NULL,

    UNIQUE INDEX `quotations_transaction_key`(`transaction`),
    INDEX `quotations_unit_idx`(`unit`),
    INDEX `quotations_sub_prototype_idx`(`sub_prototype`),
    INDEX `quotations_prototype_idx`(`prototype`),
    INDEX `quotations_project_idx`(`project`),
    INDEX `quotations_agency_idx`(`agency`),
    INDEX `quotations_agent_idx`(`agent`),
    INDEX `quotations_client_idx`(`client`),
    INDEX `quotations_transaction_idx`(`transaction`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `transactions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction_id` VARCHAR(255) NULL,
    `commission_phase` INTEGER NULL,
    `closing_date` DATETIME(3) NULL,
    `unit` INTEGER NULL,
    `client` INTEGER NULL,
    `total_debt` DECIMAL(10, 2) NULL,
    `payments` DECIMAL(10, 2) NULL,
    `balance` DECIMAL(10, 2) NULL,
    `balance_due` DECIMAL(10, 2) NULL,
    `phone_verification` BOOLEAN NULL,
    `payment_method` INTEGER NULL,
    `sub_payment_method` INTEGER NULL,
    `payment_entity` INTEGER NULL,
    `commissions_in_debt` DECIMAL(10, 2) NULL,
    `project` INTEGER NULL,
    `commission_stage` INTEGER NULL,
    `transaction_status` INTEGER NULL,
    `quotation` INTEGER NULL,
    `prototype` INTEGER NULL,
    `sub_prototype` INTEGER NULL,
    `interview` INTEGER NULL,
    `credit_total` DOUBLE NULL,
    `to_authorize` INTEGER NULL,
    `signed` INTEGER NULL,
    `operate` INTEGER NULL,
    `close_date` DATETIME(3) NULL,
    `last_contact_date` DATETIME(3) NULL,
    `next_contact_date` DATETIME(3) NULL,
    `is_document_complete` BOOLEAN NULL,
    `docuementes_complete` DATETIME(3) NULL,
    `user_keys` INTEGER NULL,
    `keys_date` DATETIME(3) NULL,
    `keys_comment` TEXT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `fisical_person` BOOLEAN NULL,
    `prototipe` INTEGER NULL,
    `calculated_commisions` LONGTEXT NULL,

    INDEX `transactions_unit_idx`(`unit`),
    INDEX `transactions_client_idx`(`client`),
    INDEX `transactions_project_idx`(`project`),
    INDEX `transactions_quotation_idx`(`quotation`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movements` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `amount` DECIMAL(10, 2) NULL,
    `authorization_key` VARCHAR(255) NULL,
    `movement_id` VARCHAR(255) NULL,
    `payment_date` DATETIME(3) NULL,
    `comments` TEXT NULL,
    `payment_status` TEXT NULL,
    `verified` TEXT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `transaction` INTEGER NULL,
    `bank` VARCHAR(255) NULL,
    `account_holder` VARCHAR(255) NULL,
    `receiving_account` VARCHAR(255) NULL,
    `issuing_account` VARCHAR(255) NULL,
    `payment_method` VARCHAR(255) NULL,
    `source_method` VARCHAR(255) NULL,
    `canceled` BOOLEAN NULL,
    `countable` BOOLEAN NULL,
    `is_credit` BOOLEAN NULL,
    `movement_type` TEXT NULL,
    `type` INTEGER NULL,
    `created_by` VARCHAR(255) NULL,
    `sent` BOOLEAN NULL,
    `spei_payment_id` VARCHAR(255) NULL,
    `voucher_url` VARCHAR(255) NULL,
    `status_payment_online` VARCHAR(255) NULL,
    `clabe_spei` VARCHAR(255) NULL,
    `amount_spei` DECIMAL(10, 2) NULL,
    `expiration_spei` DATETIME(3) NULL,
    `payment` DECIMAL(10, 2) NULL,
    `change_type` DECIMAL(10, 2) NULL,
    `currency` VARCHAR(255) NULL,
    `converted_currency` VARCHAR(255) NULL,
    `affected_type` INTEGER NULL,

    INDEX `movements_transaction_idx`(`transaction`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `promissories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transaction` INTEGER NULL,
    `promissories` TEXT NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `amount` DOUBLE NULL,
    `number` INTEGER NULL,
    `due_date` DATETIME(3) NULL,
    `signature_date` DATETIME(3) NULL,
    `isPaid` BOOLEAN NULL,
    `spei_payment_id` VARCHAR(255) NULL,
    `voucher_url` VARCHAR(255) NULL,
    `status_payment_online` VARCHAR(255) NULL,
    `clabe_spei` VARCHAR(255) NULL,
    `amount_spei` DECIMAL(10, 2) NULL,
    `expiration_spei` DATETIME(3) NULL,
    `is_credit_promisse` BOOLEAN NULL,
    `type` INTEGER NULL,

    INDEX `promissories_transaction_idx`(`transaction`),
    INDEX `promissories_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_methods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `project` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `payment_methods_project_idx`(`project`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payment_entities` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `project` INTEGER NULL,
    `sub_payment_method` INTEGER NULL,
    `payment_method` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `payment_entities_payment_method_idx`(`payment_method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `references` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reference` VARCHAR(255) NULL,
    `project` INTEGER NULL,
    `category` TEXT NULL,
    `date` DATETIME(3) NULL,
    `rfc` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `identifier` VARCHAR(255) NULL,
    `depositor` VARCHAR(255) NULL,
    `quotation` INTEGER NULL,
    `used` BOOLEAN NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `reference_payment` INTEGER NULL,

    INDEX `references_project_idx`(`project`),
    INDEX `references_quotation_idx`(`quotation`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `deposits` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `description` TEXT NULL,
    `cost_percentage` DOUBLE NULL,
    `project` INTEGER NULL,
    `aside_amount` DOUBLE NULL,
    `square_lot` TEXT NULL,
    `penalty` DOUBLE NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,

    INDEX `deposits_project_idx`(`project`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `movement_methods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(255) NULL,
    `f_lastname` VARCHAR(255) NULL,
    `m_lastname` VARCHAR(255) NULL,
    `email` VARCHAR(255) NULL,
    `mobile` VARCHAR(255) NULL,
    `agency` INTEGER NULL,
    `created_at` DATETIME(3) NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NULL,
    `comm_account_statement` INTEGER NULL,

    INDEX `movement_methods_agency_idx`(`agency`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `clients_marital_status_idx` ON `clients`(`marital_status`);

-- CreateIndex
CREATE INDEX `clients_marital_registry_idx` ON `clients`(`marital_registry`);

-- CreateIndex
CREATE INDEX `clients_marital_regimen_idx` ON `clients`(`marital_regimen`);

-- CreateIndex
CREATE INDEX `clients_beneficiary_idx` ON `clients`(`beneficiary`);

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_marital_status_fkey` FOREIGN KEY (`marital_status`) REFERENCES `marital_statuses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_marital_registry_fkey` FOREIGN KEY (`marital_registry`) REFERENCES `marital_registries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_marital_regimen_fkey` FOREIGN KEY (`marital_regimen`) REFERENCES `marital_regimen`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_client_status_fkey` FOREIGN KEY (`client_status`) REFERENCES `client_statuses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `clients` ADD CONSTRAINT `clients_beneficiary_fkey` FOREIGN KEY (`beneficiary`) REFERENCES `beneficiaries`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agencies` ADD CONSTRAINT `agencies_coordinator_fkey` FOREIGN KEY (`coordinator`) REFERENCES `coordinators`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `coordinators` ADD CONSTRAINT `coordinators_agency_fkey` FOREIGN KEY (`agency`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agents` ADD CONSTRAINT `agents_agency_fkey` FOREIGN KEY (`agency`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `agents` ADD CONSTRAINT `agents_coordinator_fkey` FOREIGN KEY (`coordinator`) REFERENCES `coordinators`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `client_references` ADD CONSTRAINT `client_references_client_fkey` FOREIGN KEY (`client`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_developers` ADD CONSTRAINT `sub_developers_developer_fkey` FOREIGN KEY (`developer`) REFERENCES `developers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_developers` ADD CONSTRAINT `sub_developers_project_fkey` FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `projects` ADD CONSTRAINT `projects_project_status_fkey` FOREIGN KEY (`project_status`) REFERENCES `project_statuses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `facades` ADD CONSTRAINT `facades_project_fkey` FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phases` ADD CONSTRAINT `phases_project_fkey` FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `phases` ADD CONSTRAINT `phases_phase_status_fkey` FOREIGN KEY (`phase_status`) REFERENCES `phase_statuses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `prototipes` ADD CONSTRAINT `prototipes_project_fkey` FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_prototypes` ADD CONSTRAINT `sub_prototypes_prototype_fkey` FOREIGN KEY (`prototype`) REFERENCES `prototipes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sub_prototypes` ADD CONSTRAINT `sub_prototypes_project_fkey` FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_prototype_fkey` FOREIGN KEY (`prototype`) REFERENCES `prototipes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_phase_fkey` FOREIGN KEY (`phase`) REFERENCES `phases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_project_fkey` FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_facade_fkey` FOREIGN KEY (`facade`) REFERENCES `facades`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `units` ADD CONSTRAINT `units_sub_prototype_fkey` FOREIGN KEY (`sub_prototype`) REFERENCES `sub_prototypes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_unit_fkey` FOREIGN KEY (`unit`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_sub_prototype_fkey` FOREIGN KEY (`sub_prototype`) REFERENCES `sub_prototypes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_prototype_fkey` FOREIGN KEY (`prototype`) REFERENCES `prototipes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_project_fkey` FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_agency_fkey` FOREIGN KEY (`agency`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_agent_fkey` FOREIGN KEY (`agent`) REFERENCES `agents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_payment_method_fkey` FOREIGN KEY (`payment_method`) REFERENCES `payment_methods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_payment_entity_fkey` FOREIGN KEY (`payment_entity`) REFERENCES `payment_entities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_client_fkey` FOREIGN KEY (`client`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_quotation_status_fkey` FOREIGN KEY (`quotation_status`) REFERENCES `quotation_statuses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `quotations` ADD CONSTRAINT `quotations_transaction_fkey` FOREIGN KEY (`transaction`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_unit_fkey` FOREIGN KEY (`unit`) REFERENCES `units`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_client_fkey` FOREIGN KEY (`client`) REFERENCES `clients`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_payment_entity_fkey` FOREIGN KEY (`payment_entity`) REFERENCES `payment_entities`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_payment_method_fkey` FOREIGN KEY (`payment_method`) REFERENCES `payment_methods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_project_fkey` FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_prototype_fkey` FOREIGN KEY (`prototype`) REFERENCES `prototipes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `transactions` ADD CONSTRAINT `transactions_sub_prototype_fkey` FOREIGN KEY (`sub_prototype`) REFERENCES `sub_prototypes`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movements` ADD CONSTRAINT `movements_transaction_fkey` FOREIGN KEY (`transaction`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promissories` ADD CONSTRAINT `promissories_transaction_fkey` FOREIGN KEY (`transaction`) REFERENCES `transactions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `promissories` ADD CONSTRAINT `promissories_type_fkey` FOREIGN KEY (`type`) REFERENCES `promise_types`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_methods` ADD CONSTRAINT `payment_methods_project_fkey` FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payment_entities` ADD CONSTRAINT `payment_entities_payment_method_fkey` FOREIGN KEY (`payment_method`) REFERENCES `payment_methods`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `references` ADD CONSTRAINT `references_project_fkey` FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `references` ADD CONSTRAINT `references_quotation_fkey` FOREIGN KEY (`quotation`) REFERENCES `quotations`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `deposits` ADD CONSTRAINT `deposits_project_fkey` FOREIGN KEY (`project`) REFERENCES `projects`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `movement_methods` ADD CONSTRAINT `movement_methods_agency_fkey` FOREIGN KEY (`agency`) REFERENCES `agencies`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
