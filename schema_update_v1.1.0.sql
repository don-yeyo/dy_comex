-- =============================================================
-- SCRIPT DE MIGRACIÓN Y CAMBIOS ESTRUCTURALES - COMEX CRM v1.1.0
-- Ejecutar en la base de datos MySQL (dy_comex)
-- =============================================================

USE `dy_comex`;

-- 1. Tabla Tareas: Fecha y Hora de Inicio y Fin
ALTER TABLE `tareas` 
  ADD COLUMN IF NOT EXISTS `hora` TIME DEFAULT NULL AFTER `fecha`,
  ADD COLUMN IF NOT EXISTS `hora_fin` TIME DEFAULT NULL AFTER `hora`;

-- 2. Tabla Visitas: Fecha Inicio/Fin, Hora Inicio/Fin, Evento Padre, Contacto y Adjuntos
ALTER TABLE `visitas` 
  ADD COLUMN IF NOT EXISTS `fecha_fin` DATE DEFAULT NULL AFTER `fecha`,
  ADD COLUMN IF NOT EXISTS `hora` TIME DEFAULT NULL AFTER `fecha_fin`,
  ADD COLUMN IF NOT EXISTS `hora_fin` TIME DEFAULT NULL AFTER `hora`,
  ADD COLUMN IF NOT EXISTS `actividad_padre_id` INT DEFAULT NULL AFTER `hora_fin`,
  ADD COLUMN IF NOT EXISTS `contacto_id` INT DEFAULT NULL AFTER `actividad_padre_id`,
  ADD COLUMN IF NOT EXISTS `excel_url` MEDIUMTEXT DEFAULT NULL AFTER `proximo`;

-- 3. Tabla Contactos: Etapa Comercial y Próxima Acción
ALTER TABLE `contactos`
  MODIFY COLUMN `estado` VARCHAR(50) DEFAULT 'Activo',
  ADD COLUMN IF NOT EXISTS `etapa_comercial` VARCHAR(50) DEFAULT NULL AFTER `estado`,
  ADD COLUMN IF NOT EXISTS `proxima_accion` TEXT DEFAULT NULL AFTER `etapa_comercial`,
  ADD COLUMN IF NOT EXISTS `proxima_accion_fecha` DATE DEFAULT NULL AFTER `proxima_accion`,
  ADD COLUMN IF NOT EXISTS `proxima_accion_hora` TIME DEFAULT NULL AFTER `proxima_accion_fecha`;

-- 4. Tabla Oportunidades: Marcas adicionales, Categoria detalle y Responsable
ALTER TABLE `oportunidades`
  ADD COLUMN IF NOT EXISTS `marca_otra` VARCHAR(100) DEFAULT NULL AFTER `marca`,
  ADD COLUMN IF NOT EXISTS `categoria_detalle` VARCHAR(150) DEFAULT NULL AFTER `categoria`,
  ADD COLUMN IF NOT EXISTS `responsable` VARCHAR(100) DEFAULT NULL AFTER `cierre`;

-- 5. Tabla Muestras: Contacto directo vinculado
ALTER TABLE `muestras`
  MODIFY COLUMN `producto` TEXT NOT NULL,
  ADD COLUMN IF NOT EXISTS `contacto_id` INT DEFAULT NULL AFTER `destinatario`;

-- 6. Tabla Países: Fotografías de etiquetado
ALTER TABLE `paises`
  ADD COLUMN IF NOT EXISTS `etiquetado_fotos` MEDIUMTEXT DEFAULT NULL AFTER `etiquetado`;

-- 7. Tabla Cobranzas: Medio y Condición de Pago
ALTER TABLE `cobranzas`
  ADD COLUMN IF NOT EXISTS `medio_pago` VARCHAR(50) DEFAULT NULL AFTER `condicion`,
  ADD COLUMN IF NOT EXISTS `condicion_pago` VARCHAR(50) DEFAULT NULL AFTER `medio_pago`;

-- 8. Tabla Precios Competidores: Fotografías de empaque / góndola
ALTER TABLE `precios_competidores`
  ADD COLUMN IF NOT EXISTS `imagen_url` MEDIUMTEXT DEFAULT NULL;

-- 9. Nueva Tabla Operaciones (Remplaza al módulo de Documentos)
CREATE TABLE IF NOT EXISTS `operaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `numero_pedido` VARCHAR(50) NOT NULL,
  `cliente_id` INT DEFAULT NULL,
  `pais_id` INT DEFAULT NULL,
  `estado` ENUM('Pedido recibido', 'En proceso', 'Despachado') DEFAULT 'Pedido recibido',
  `fecha_entrega` DATE DEFAULT NULL,
  `unidades` INT DEFAULT 0,
  `valor_usd` DECIMAL(15,2) DEFAULT 0.00,
  `kilogramos` DECIMAL(10,2) DEFAULT 0.00,
  `incoterm` VARCHAR(20) DEFAULT 'FOB',
  `documentos` MEDIUMTEXT DEFAULT NULL,
  `notas` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`cliente_id`) REFERENCES `contactos`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`pais_id`) REFERENCES `paises`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
