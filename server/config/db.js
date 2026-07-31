const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'dy_comex',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

console.log(`[Database] Intentando conectar a MySQL en ${dbConfig.host}:${dbConfig.port} (${dbConfig.database})...`);

const pool = mysql.createPool(dbConfig);

// Helper seguro para agregar columnas si no existen
const addColumnSafely = async (conn, table, column, definition) => {
  try {
    const [cols] = await conn.query(`SHOW COLUMNS FROM \`${table}\` LIKE ?`, [column]);
    if (cols.length === 0) {
      await conn.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
      console.log(`[Database Auto-Migration] Agregada columna '${column}' a la tabla '${table}'`);
    }
  } catch (e) {
    /* Silencioso si la tabla no existe aún */
  }
};

// Verificar la conexión de forma asíncrona y ejecutar migraciones automáticas
pool.getConnection()
  .then(async conn => {
    console.log('[Database] Conexión a MySQL establecida correctamente.');
    
    // Migraciones y parches de esquema
    try { await conn.query(`ALTER TABLE contactos MODIFY COLUMN estado VARCHAR(50) DEFAULT 'Activo'`); } catch (e) {}
    try { await conn.query(`ALTER TABLE muestras MODIFY COLUMN producto TEXT NOT NULL`); } catch (e) {}
    try { await conn.query(`ALTER TABLE precios_competidores ADD COLUMN imagen_url MEDIUMTEXT DEFAULT NULL`); } catch (e) {}

    // Migraciones requerimientos v1.1.0
    await addColumnSafely(conn, 'tareas', 'hora', 'TIME DEFAULT NULL AFTER fecha');
    await addColumnSafely(conn, 'tareas', 'hora_fin', 'TIME DEFAULT NULL AFTER hora');
    await addColumnSafely(conn, 'visitas', 'hora', 'TIME DEFAULT NULL AFTER fecha');
    await addColumnSafely(conn, 'visitas', 'hora_fin', 'TIME DEFAULT NULL AFTER hora');
    await addColumnSafely(conn, 'visitas', 'fecha_fin', 'DATE DEFAULT NULL AFTER fecha');
    await addColumnSafely(conn, 'visitas', 'actividad_padre_id', 'INT DEFAULT NULL AFTER hora_fin');
    await addColumnSafely(conn, 'visitas', 'contacto_id', 'INT DEFAULT NULL AFTER actividad_padre_id');
    await addColumnSafely(conn, 'visitas', 'excel_url', 'MEDIUMTEXT DEFAULT NULL AFTER proximo');

    await addColumnSafely(conn, 'contactos', 'etapa_comercial', 'VARCHAR(50) DEFAULT NULL AFTER estado');
    await addColumnSafely(conn, 'contactos', 'proxima_accion', 'TEXT DEFAULT NULL AFTER etapa_comercial');
    await addColumnSafely(conn, 'contactos', 'proxima_accion_fecha', 'DATE DEFAULT NULL AFTER proxima_accion');
    await addColumnSafely(conn, 'contactos', 'proxima_accion_hora', 'TIME DEFAULT NULL AFTER proxima_accion_fecha');

    await addColumnSafely(conn, 'oportunidades', 'marca_otra', 'VARCHAR(100) DEFAULT NULL AFTER marca');
    await addColumnSafely(conn, 'oportunidades', 'categoria_detalle', 'VARCHAR(150) DEFAULT NULL AFTER categoria');
    await addColumnSafely(conn, 'oportunidades', 'probabilidad', 'VARCHAR(20) DEFAULT "50%" AFTER monto');
    await addColumnSafely(conn, 'oportunidades', 'responsable', 'VARCHAR(100) DEFAULT NULL AFTER cierre');

    await addColumnSafely(conn, 'muestras', 'contacto_id', 'INT DEFAULT NULL AFTER destinatario');
    await addColumnSafely(conn, 'paises', 'incoterm_habitual', 'VARCHAR(50) DEFAULT NULL AFTER arancel');
    await addColumnSafely(conn, 'paises', 'ncm', 'VARCHAR(50) DEFAULT NULL AFTER incoterm_habitual');
    await addColumnSafely(conn, 'paises', 'tipocambio', 'DECIMAL(12,4) DEFAULT 1.0000 AFTER moneda');
    await addColumnSafely(conn, 'paises', 'tc_fecha', 'DATE DEFAULT NULL AFTER tipocambio');
    await addColumnSafely(conn, 'paises', 'sanitario', 'VARCHAR(100) DEFAULT NULL AFTER tc_fecha');
    await addColumnSafely(conn, 'paises', 'etiquetado_fotos', 'MEDIUMTEXT DEFAULT NULL AFTER etiquetado');
    await addColumnSafely(conn, 'paises', 'notas', 'MEDIUMTEXT DEFAULT NULL AFTER etiquetado_fotos');
    await addColumnSafely(conn, 'cobranzas', 'cliente_id', 'INT DEFAULT NULL AFTER id');
    await addColumnSafely(conn, 'cobranzas', 'pais_id', 'INT DEFAULT NULL AFTER cliente_id');
    await addColumnSafely(conn, 'cobranzas', 'cobrado_monto', 'DECIMAL(15,2) DEFAULT 0.00 AFTER monto');
    await addColumnSafely(conn, 'cobranzas', 'unidades', 'INT DEFAULT 0 AFTER cobrado_monto');
    await addColumnSafely(conn, 'cobranzas', 'marca', 'VARCHAR(50) DEFAULT "Don Yeyo" AFTER unidades');
    await addColumnSafely(conn, 'cobranzas', 'embarque', 'DATE DEFAULT NULL AFTER marca');
    await addColumnSafely(conn, 'cobranzas', 'medio_pago', 'VARCHAR(50) DEFAULT NULL AFTER condicion');
    await addColumnSafely(conn, 'cobranzas', 'condicion_pago', 'VARCHAR(50) DEFAULT NULL AFTER medio_pago');

    // Tabla Operaciones
    try {
      await conn.query(`
        CREATE TABLE IF NOT EXISTS \`operaciones\` (
          \`id\` INT AUTO_INCREMENT PRIMARY KEY,
          \`numero_pedido\` VARCHAR(50) NOT NULL,
          \`cliente_id\` INT DEFAULT NULL,
          \`pais_id\` INT DEFAULT NULL,
          \`estado\` ENUM('Pedido recibido', 'En proceso', 'Despachado') DEFAULT 'Pedido recibido',
          \`fecha_entrega\` DATE DEFAULT NULL,
          \`unidades\` INT DEFAULT 0,
          \`valor_usd\` DECIMAL(15,2) DEFAULT 0.00,
          \`kilogramos\` DECIMAL(10,2) DEFAULT 0.00,
          \`incoterm\` VARCHAR(20) DEFAULT 'FOB',
          \`documentos\` MEDIUMTEXT DEFAULT NULL,
          \`notas\` TEXT DEFAULT NULL,
          \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (\`cliente_id\`) REFERENCES \`contactos\`(\`id\`) ON DELETE SET NULL,
          FOREIGN KEY (\`pais_id\`) REFERENCES \`paises\`(\`id\`) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
      `);
    } catch (e) {}

    conn.release();
  })
  .catch(err => {
    console.error('[Database] ERROR al conectar a MySQL:', err.message);
  });

module.exports = pool;
