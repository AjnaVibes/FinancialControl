-- CreateTable
CREATE TABLE `vsc_empresas` (
    `id_empresa` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `rfc` VARCHAR(191) NULL,
    `direccion` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `activo` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id_empresa`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vsc_viviendas` (
    `id_vivienda` INTEGER NOT NULL AUTO_INCREMENT,
    `id_proyecto` INTEGER NOT NULL,
    `numero_vivienda` VARCHAR(191) NOT NULL,
    `manzana` VARCHAR(191) NULL,
    `lote` VARCHAR(191) NULL,
    `prototipo` VARCHAR(191) NULL,
    `estatus` VARCHAR(191) NULL,
    `superficie_terreno` DOUBLE NULL,
    `superficie_construccion` DOUBLE NULL,
    `precio_venta` DOUBLE NULL,
    `fecha_inicio` DATETIME(3) NULL,
    `fecha_terminacion` DATETIME(3) NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `vsc_viviendas_id_proyecto_idx`(`id_proyecto`),
    PRIMARY KEY (`id_vivienda`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vsc_clientes` (
    `id_cliente` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `apellido_paterno` VARCHAR(191) NULL,
    `apellido_materno` VARCHAR(191) NULL,
    `rfc` VARCHAR(191) NULL,
    `curp` VARCHAR(191) NULL,
    `telefono` VARCHAR(191) NULL,
    `celular` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `direccion` TEXT NULL,
    `fecha_registro` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `vsc_clientes_rfc_idx`(`rfc`),
    INDEX `vsc_clientes_curp_idx`(`curp`),
    INDEX `vsc_clientes_email_idx`(`email`),
    PRIMARY KEY (`id_cliente`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vsc_cliente_vivienda` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `id_cliente` INTEGER NOT NULL,
    `id_vivienda` INTEGER NOT NULL,
    `fecha_asignacion` DATETIME(3) NOT NULL,
    `tipo_operacion` VARCHAR(191) NULL,
    `monto_operacion` DOUBLE NULL,
    `estatus` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `vsc_cliente_vivienda_id_cliente_idx`(`id_cliente`),
    INDEX `vsc_cliente_vivienda_id_vivienda_idx`(`id_vivienda`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vsc_avances_fisicos` (
    `id_avance` INTEGER NOT NULL AUTO_INCREMENT,
    `id_vivienda` INTEGER NOT NULL,
    `fecha_avance` DATETIME(3) NOT NULL,
    `porcentaje_avance` DOUBLE NOT NULL,
    `descripcion` TEXT NULL,
    `observaciones` TEXT NULL,
    `usuario_registro` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `vsc_avances_fisicos_id_vivienda_idx`(`id_vivienda`),
    INDEX `vsc_avances_fisicos_fecha_avance_idx`(`fecha_avance`),
    PRIMARY KEY (`id_avance`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vsc_ordenes_compra` (
    `id_orden` INTEGER NOT NULL AUTO_INCREMENT,
    `numero_orden` VARCHAR(191) NOT NULL,
    `fecha_orden` DATETIME(3) NOT NULL,
    `proveedor` VARCHAR(191) NULL,
    `monto_total` DOUBLE NULL,
    `estatus` VARCHAR(191) NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `vsc_ordenes_compra_numero_orden_idx`(`numero_orden`),
    INDEX `vsc_ordenes_compra_fecha_orden_idx`(`fecha_orden`),
    PRIMARY KEY (`id_orden`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vsc_control_documentos` (
    `id_documento` INTEGER NOT NULL AUTO_INCREMENT,
    `id_vivienda` INTEGER NULL,
    `id_cliente` INTEGER NULL,
    `tipo_documento` VARCHAR(191) NOT NULL,
    `numero_documento` VARCHAR(191) NULL,
    `fecha_documento` DATETIME(3) NULL,
    `fecha_vencimiento` DATETIME(3) NULL,
    `estatus` VARCHAR(191) NULL,
    `ruta_archivo` TEXT NULL,
    `observaciones` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `vsc_control_documentos_id_vivienda_idx`(`id_vivienda`),
    INDEX `vsc_control_documentos_id_cliente_idx`(`id_cliente`),
    INDEX `vsc_control_documentos_tipo_documento_idx`(`tipo_documento`),
    PRIMARY KEY (`id_documento`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `vsc_proyectos` (
    `id_proyecto` INTEGER NOT NULL AUTO_INCREMENT,
    `nombre` VARCHAR(191) NOT NULL,
    `descripcion` TEXT NULL,
    `ubicacion` VARCHAR(191) NULL,
    `fecha_inicio` DATETIME(3) NULL,
    `fecha_fin_estimada` DATETIME(3) NULL,
    `total_viviendas` INTEGER NULL,
    `estatus` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `vsc_proyectos_nombre_idx`(`nombre`),
    INDEX `vsc_proyectos_estatus_idx`(`estatus`),
    PRIMARY KEY (`id_proyecto`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
