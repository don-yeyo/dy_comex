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

// Verificar la conexión de forma asíncrona
pool.getConnection()
  .then(conn => {
    console.log('[Database] Conexión a MySQL establecida correctamente.');
    conn.release();
  })
  .catch(err => {
    console.error('[Database] ERROR al conectar a MySQL:', err.message);
  });

module.exports = pool;
