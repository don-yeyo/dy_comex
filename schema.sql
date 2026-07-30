-- Base de datos para dy_comex

CREATE DATABASE IF NOT EXISTS `dy_comex` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dy_comex`;

-- Tabla de Usuarios y Roles (basado en el modelo MSAL y local fallback)
CREATE TABLE IF NOT EXISTS `usuarios` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(100) UNIQUE NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `rol` ENUM('admin', 'editor', 'viewer') DEFAULT 'viewer',
  `activo` TINYINT(1) DEFAULT 1,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla Maestra de Países
CREATE TABLE IF NOT EXISTS `paises` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(80) UNIQUE NOT NULL,
  `bandera` VARCHAR(10) DEFAULT '🌐',
  `arancel` DECIMAL(5,2) DEFAULT 0.00,
  `moneda` VARCHAR(10) DEFAULT 'USD',
  `tipocambio` DECIMAL(12,4) DEFAULT 1.0000,
  `tc_fecha` DATE DEFAULT NULL,
  `sanitario` VARCHAR(100) DEFAULT NULL,
  `sanitario_req` TEXT DEFAULT NULL, -- Certificados / documentación obligatoria
  `etiquetado` TEXT DEFAULT NULL,
  `etiquetado_fotos` MEDIUMTEXT DEFAULT NULL, -- Fotos o imágenes adjuntas (Base64/JSON)
  `notas` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Contactos / Clientes
CREATE TABLE IF NOT EXISTS `contactos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(100) NOT NULL,
  `apellido` VARCHAR(100) DEFAULT NULL,
  `empresa` VARCHAR(100) DEFAULT NULL,
  `rol` VARCHAR(50) DEFAULT 'Otro', -- Importador, Distribuidor, Broker, Retailer, Otro
  `pais_id` INT DEFAULT NULL,
  `pais_nombre` VARCHAR(80) DEFAULT NULL,
  `ciudad` VARCHAR(100) DEFAULT NULL,
  `email` VARCHAR(100) DEFAULT NULL,
  `telefono` VARCHAR(50) DEFAULT NULL,
  `estado` VARCHAR(50) DEFAULT 'Activo', -- Activo, En proceso, Inactivo, Descartado
  `etapa_comercial` VARCHAR(50) DEFAULT NULL, -- Primer contacto, Reunión exploratoria, Cotización, Negociación, Habilitación regulatoria
  `proxima_accion` TEXT DEFAULT NULL,
  `proxima_accion_fecha` DATE DEFAULT NULL,
  `proxima_accion_hora` TIME DEFAULT NULL,
  `notas` TEXT DEFAULT NULL,
  `finnegans_id` VARCHAR(50) DEFAULT NULL, -- Relación con el ID del ERP Finnegans
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`pais_id`) REFERENCES `paises`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Visitas y Actividades comerciales
CREATE TABLE IF NOT EXISTS `visitas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(150) NOT NULL,
  `tipo` VARCHAR(50) NOT NULL, -- Feria internacional, Ronda de negocios, Reunión comercial, Visita a cliente, Videoconferencia
  `estado` ENUM('Planificada', 'Realizada', 'Cancelada') DEFAULT 'Planificada',
  `fecha` DATE NOT NULL,
  `fecha_fin` DATE DEFAULT NULL, -- Para ferias o viajes multidía
  `hora` TIME DEFAULT NULL,
  `actividad_padre_id` INT DEFAULT NULL, -- Agrupar reuniones dentro de una actividad/evento
  `contacto_id` INT DEFAULT NULL, -- Vinculación con cliente registrado
  `lugar` VARCHAR(150) DEFAULT NULL,
  `contactos` TEXT DEFAULT NULL, -- Nombres de contactos involucrados
  `notas` TEXT DEFAULT NULL,
  `proximo` TEXT DEFAULT NULL, -- Próxima acción definida
  `excel_url` MEDIUMTEXT DEFAULT NULL, -- Adjunto Excel de clientes relevados
  -- Campos específicos de Ronda de Negocios
  `ronda_org` VARCHAR(100) DEFAULT NULL,
  `ronda_reuniones` INT DEFAULT 0,
  `ronda_importadores` INT DEFAULT 0, -- Contactos calificados
  `ronda_resultado` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`contacto_id`) REFERENCES `contactos`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`actividad_padre_id`) REFERENCES `visitas`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Oportunidades comerciales
CREATE TABLE IF NOT EXISTS `oportunidades` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `pais_id` INT DEFAULT NULL,
  `contacto_id` INT DEFAULT NULL,
  `marca` VARCHAR(50) DEFAULT 'Don Yeyo', -- Don Yeyo, DeViano, Otro
  `marca_otra` VARCHAR(100) DEFAULT NULL,
  `categoria` VARCHAR(100) DEFAULT NULL, -- Incluye Nuevo desarrollo
  `categoria_detalle` VARCHAR(150) DEFAULT NULL,
  `monto` DECIMAL(15,2) DEFAULT 0.00, -- Reemplazado visualmente por Inversión necesaria
  `etapa` VARCHAR(50) DEFAULT 'En análisis', -- En análisis, En proceso, Finalizado, Descartado
  `cierre` DATE DEFAULT NULL,
  `responsable` VARCHAR(100) DEFAULT NULL,
  `notas` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`pais_id`) REFERENCES `paises`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`contacto_id`) REFERENCES `contactos`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Muestras enviadas
CREATE TABLE IF NOT EXISTS `muestras` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `producto` TEXT NOT NULL,
  `destinatario` VARCHAR(150) DEFAULT NULL,
  `contacto_id` INT DEFAULT NULL, -- Vinculación con base de clientes
  `pais_id` INT DEFAULT NULL,
  `fecha` DATE NOT NULL,
  `resultado` ENUM('Pendiente', 'Positivo', 'En evaluación', 'Negativo') DEFAULT 'Pendiente',
  `costo` DECIMAL(12,2) DEFAULT 0.00,
  `notas` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`pais_id`) REFERENCES `paises`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`contacto_id`) REFERENCES `contactos`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Log de Comunicaciones
CREATE TABLE IF NOT EXISTS `comunicaciones` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `tipo` ENUM('Email', 'Llamada', 'WhatsApp', 'Reunión', 'Videollamada') NOT NULL,
  `fecha` DATE NOT NULL,
  `contacto_id` INT DEFAULT NULL,
  `asunto` VARCHAR(150) NOT NULL,
  `resumen` TEXT DEFAULT NULL,
  `proximo` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`contacto_id`) REFERENCES `contactos`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Operaciones (Reemplaza a Documentos)
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
  `documentos` MEDIUMTEXT DEFAULT NULL, -- JSON array con archivos adjuntos
  `notas` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`cliente_id`) REFERENCES `contactos`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`pais_id`) REFERENCES `paises`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla legacy de Documentos (mantenida por compatibilidad)
CREATE TABLE IF NOT EXISTS `documentos` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `nombre` VARCHAR(150) NOT NULL,
  `numero` VARCHAR(50) DEFAULT NULL,
  `tipo` VARCHAR(50) NOT NULL,
  `pais_id` INT DEFAULT NULL,
  `vencimiento` DATE DEFAULT NULL,
  `estado` ENUM('Vigente', 'Vencido', 'Por vencer') DEFAULT 'Vigente',
  `notas` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`pais_id`) REFERENCES `paises`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Precios de Competidores (Inteligencia)
CREATE TABLE IF NOT EXISTS `precios_competidores` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `competidor` VARCHAR(100) NOT NULL,
  `producto` VARCHAR(150) DEFAULT NULL,
  `pais_id` INT DEFAULT NULL,
  `categoria` VARCHAR(50) DEFAULT NULL,
  `precio` DECIMAL(12,2) DEFAULT 0.00,
  `unidad` VARCHAR(20) DEFAULT 'unidades',
  `peso` DECIMAL(8,3) DEFAULT 1.000, -- En kilogramos para autocalcular precio/kg
  `fuente` VARCHAR(150) DEFAULT NULL,
  `fecha` DATE NOT NULL,
  `imagen_url` MEDIUMTEXT DEFAULT NULL, -- Fotos o imágenes adjuntas (Base64)
  `notas` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`pais_id`) REFERENCES `paises`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Tendencias de Mercado
CREATE TABLE IF NOT EXISTS `tendencias` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(150) NOT NULL,
  `pais_id` INT DEFAULT NULL,
  `categoria` VARCHAR(50) DEFAULT NULL,
  `descripcion` TEXT DEFAULT NULL,
  `fuente` VARCHAR(150) DEFAULT NULL,
  `tags` VARCHAR(150) DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`pais_id`) REFERENCES `paises`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Cálculos Guardados (Calculadora)
CREATE TABLE IF NOT EXISTS `calculos_exportacion` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `producto` VARCHAR(150) NOT NULL,
  `pais_id` INT DEFAULT NULL,
  `fob` DECIMAL(12,2) DEFAULT 0.00,
  `qty` INT DEFAULT 1,
  `flete` DECIMAL(12,2) DEFAULT 0.00,
  `seguro` DECIMAL(12,2) DEFAULT 0.00,
  `arancel` DECIMAL(5,2) DEFAULT 0.00,
  `otros` DECIMAL(12,2) DEFAULT 0.00,
  `landed` DECIMAL(15,2) DEFAULT 0.00,
  `fecha` DATE NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`pais_id`) REFERENCES `paises`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Cobranzas
CREATE TABLE IF NOT EXISTS `cobranzas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `descripcion` VARCHAR(150) NOT NULL,
  `cliente_id` INT DEFAULT NULL,
  `pais_id` INT DEFAULT NULL,
  `monto` DECIMAL(15,2) DEFAULT 0.00,
  `cobrado_monto` DECIMAL(15,2) DEFAULT 0.00,
  `unidades` INT DEFAULT 0,
  `marca` VARCHAR(50) DEFAULT 'Don Yeyo',
  `embarque` DATE DEFAULT NULL,
  `vencimiento` DATE DEFAULT NULL,
  `estado` ENUM('Cobrado', 'Cobrado parcial', 'Pendiente', 'Vencido') DEFAULT 'Pendiente',
  `condicion` VARCHAR(50) DEFAULT NULL,
  `medio_pago` VARCHAR(50) DEFAULT NULL, -- Transferencia, Carta de crédito, etc.
  `condicion_pago` VARCHAR(50) DEFAULT NULL, -- Anticipado, 50% anticipado / 50% contra BL, 15 días, 30 días, 60 días, Otro
  `notas` TEXT DEFAULT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`cliente_id`) REFERENCES `contactos`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`pais_id`) REFERENCES `paises`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de Tareas (TODO list)
CREATE TABLE IF NOT EXISTS `tareas` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `titulo` VARCHAR(150) NOT NULL,
  `fecha` DATE DEFAULT NULL,
  `hora` TIME DEFAULT NULL,
  `prioridad` ENUM('alta', 'media', 'baja') DEFAULT 'media',
  `pais_id` INT DEFAULT NULL,
  `asignado` VARCHAR(100) DEFAULT NULL,
  `notas` TEXT DEFAULT NULL,
  `status` ENUM('pendiente', 'hecha') DEFAULT 'pendiente',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`pais_id`) REFERENCES `paises`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insertar Datos Semilla para Países
INSERT INTO `paises` (`nombre`, `bandera`, `arancel`, `moneda`, `tipocambio`, `sanitario`) VALUES
('Brasil', '🇧🇷', 0.00, 'BRL', 5.4200, 'ANVISA'),
('México', '🇲🇽', 10.00, 'MXN', 18.2000, 'COFEPRIS'),
('Chile', '🇨🇱', 6.00, 'CLP', 930.0000, 'SAG'),
('Paraguay', '🇵🇾', 0.00, 'PYG', 7500.0000, 'INAN'),
('Uruguay', '🇺🇾', 0.00, 'UYU', 39.5000, 'MSP');
