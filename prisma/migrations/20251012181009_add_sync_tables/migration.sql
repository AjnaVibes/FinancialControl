-- CreateTable
CREATE TABLE `webhook_configs` (
    `id` VARCHAR(191) NOT NULL,
    `tabla` VARCHAR(191) NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `categoria` VARCHAR(191) NOT NULL,
    `icono` VARCHAR(191) NULL,
    `color` VARCHAR(191) NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `webhookUrl` VARCHAR(191) NULL,
    `webhookSecret` VARCHAR(191) NULL,
    `intervalMinutes` INTEGER NOT NULL DEFAULT 30,
    `lastSyncAt` DATETIME(3) NULL,
    `nextSyncAt` DATETIME(3) NULL,
    `totalSyncs` INTEGER NOT NULL DEFAULT 0,
    `successSyncs` INTEGER NOT NULL DEFAULT 0,
    `errorSyncs` INTEGER NOT NULL DEFAULT 0,
    `lastError` TEXT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `webhook_configs_tabla_key`(`tabla`),
    INDEX `webhook_configs_categoria_idx`(`categoria`),
    INDEX `webhook_configs_isEnabled_idx`(`isEnabled`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `webhook_sync_logs` (
    `id` VARCHAR(191) NOT NULL,
    `configId` VARCHAR(191) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `action` VARCHAR(191) NOT NULL,
    `recordsReceived` INTEGER NOT NULL DEFAULT 0,
    `recordsInserted` INTEGER NOT NULL DEFAULT 0,
    `recordsUpdated` INTEGER NOT NULL DEFAULT 0,
    `recordsDuplicate` INTEGER NOT NULL DEFAULT 0,
    `recordsErrors` INTEGER NOT NULL DEFAULT 0,
    `duration` INTEGER NULL,
    `errorMessage` TEXT NULL,
    `requestPayload` JSON NULL,
    `responseData` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `webhook_sync_logs_configId_idx`(`configId`),
    INDEX `webhook_sync_logs_status_idx`(`status`),
    INDEX `webhook_sync_logs_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `webhook_sync_logs` ADD CONSTRAINT `webhook_sync_logs_configId_fkey` FOREIGN KEY (`configId`) REFERENCES `webhook_configs`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
