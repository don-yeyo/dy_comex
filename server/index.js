const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares globales de seguridad y utilidades
app.use(helmet({
  contentSecurityPolicy: false // Desactivar CSP en desarrollo si interfiere con React
}));
app.use(cors({
  origin: '*', // Permitir cualquier origen para desarrollo y Netlify redirect
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(morgan('dev'));
app.use(express.json());

// Logger de variables de entorno críticas en inicialización
console.log(`[Server] Iniciando en modo: ${process.env.NODE_ENV}`);
console.log(`[Server] Vinculado a DB: ${process.env.DB_NAME || 'dy_comex'} en host: ${process.env.DB_HOST || 'localhost'}`);

// Rutas de API
app.use('/api', apiRoutes);

// Manejador de ruta raíz para chequear estado
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date() });
});

// Levantar el servidor en local si no se ejecuta bajo serverless
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[Server] Escuchando en el puerto: ${PORT}`);
  });
}

module.exports = app;
