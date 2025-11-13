-- CreateTable
CREATE TABLE `creditos` (
    `id` VARCHAR(50) NOT NULL,
    `empresa` VARCHAR(255) NOT NULL,
    `proyecto` VARCHAR(255) NOT NULL,
    `tipo_credito_id` INTEGER NOT NULL,
    `etapa` INTEGER NOT NULL,
    `estado_id` INTEGER NOT NULL,
    `fecha_contrato` DATE NULL,
    `tipo_financiamiento_id` INTEGER NOT NULL,
    `institucion_id` INTEGER NOT NULL,
    `monto_total` DECIMAL(15, 2) NOT NULL,
    `divisa` VARCHAR(10) NOT NULL,
    `dispuesto` DECIMAL(15, 2) NULL,
    `porcentaje_dispuesto` DOUBLE NULL,
    `por_disponer` DECIMAL(15, 2) NULL,
    `porcentaje_por_disponer` DOUBLE NULL,
    `pagado` DECIMAL(15, 2) NULL,
    `porcentaje_pagado` DOUBLE NULL,
    `saldo` DECIMAL(15, 2) NULL,
    `porcentaje_saldo` DOUBLE NULL,
    `porcentaje_anticipo` DOUBLE NULL,
    `tasa_interes` DOUBLE NULL,
    `porcentaje_comisiones` DOUBLE NULL,
    `plazo_meses` INTEGER NULL,
    `ampliacion_meses` INTEGER NULL,
    `fecha_vencimiento` DATE NULL,
    `aforo` DOUBLE NULL,
    `numero_viviendas` INTEGER NULL,
    `numero_locales` INTEGER NULL,
    `valor_presentado_banco` DECIMAL(15, 2) NULL,
    `ltv` DOUBLE NULL,
    `costo_presentado_banco` DECIMAL(15, 2) NULL,
    `ltc` DOUBLE NULL,
    `obligados` TEXT NULL,
    `garantias` TEXT NULL,
    `notas` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `creditos_empresa_idx`(`empresa`),
    INDEX `creditos_proyecto_idx`(`proyecto`),
    INDEX `creditos_tipo_credito_id_idx`(`tipo_credito_id`),
    INDEX `creditos_estado_id_idx`(`estado_id`),
    INDEX `creditos_tipo_financiamiento_id_idx`(`tipo_financiamiento_id`),
    INDEX `creditos_institucion_id_idx`(`institucion_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `code` VARCHAR(10) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `credit_types_name_key`(`name`),
    UNIQUE INDEX `credit_types_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_statuses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `color` VARCHAR(10) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `credit_statuses_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financing_types` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `financing_types_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `financial_institutions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `type` VARCHAR(50) NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `financial_institutions_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `credit_stages` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(50) NOT NULL,
    `order` INTEGER NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `credit_stages_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `creditos` ADD CONSTRAINT `creditos_tipo_credito_id_fkey` FOREIGN KEY (`tipo_credito_id`) REFERENCES `credit_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `creditos` ADD CONSTRAINT `creditos_estado_id_fkey` FOREIGN KEY (`estado_id`) REFERENCES `credit_statuses`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `creditos` ADD CONSTRAINT `creditos_tipo_financiamiento_id_fkey` FOREIGN KEY (`tipo_financiamiento_id`) REFERENCES `financing_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `creditos` ADD CONSTRAINT `creditos_institucion_id_fkey` FOREIGN KEY (`institucion_id`) REFERENCES `financial_institutions`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
