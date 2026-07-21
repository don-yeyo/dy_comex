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

// Verificar la conexión de forma asíncrona y ejecutar migraciones automáticas
pool.getConnection()
  .then(async conn => {
    console.log('[Database] Conexión a MySQL establecida correctamente.');
    try {
      // 1. Modificar contactos.estado a VARCHAR(50) para evitar truncado de ENUM
      await conn.query(`ALTER TABLE contactos MODIFY COLUMN estado VARCHAR(50) DEFAULT 'Activo'`);
    } catch (e) { /* Columna ya modificada o tabla inexistente */ }
    try {
      // 2. Modificar muestras.producto a TEXT para soportar JSON multi-producto sin límite de 150/200 caracteres
      await conn.query(`ALTER TABLE muestras MODIFY COLUMN producto TEXT NOT NULL`);
    } catch (e) { /* Columna ya modificada */ }
    try {
      // 3. Agregar imagen_url MEDIUMTEXT a precios_competidores
      await conn.query(`ALTER TABLE precios_competidores ADD COLUMN imagen_url MEDIUMTEXT DEFAULT NULL`);
    } catch (e) { /* Columna ya existe */ }
    conn.release();
  })

  .catch(err => {
    console.error('[Database] ERROR al conectar a MySQL:', err.message);
  });

module.exports = pool;
