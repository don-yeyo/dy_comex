const express = require('express');
const router = express.Router();
const apiController = require('../controllers/apiController');
const auth = require('../middleware/auth');

// Aplicar middleware de autenticación de Microsoft a todas las rutas
router.use(auth);

// Ruta Me
router.get('/me', apiController.getMe);

// Rutas de Finnegans
router.get('/finnegans/clientes', apiController.getFinnegansClientes);

// Rutas de Tareas
router.get('/tareas', apiController.getTareas);
router.post('/tareas', apiController.createTarea);
router.put('/tareas/:id', apiController.updateTarea);
router.delete('/tareas/:id', apiController.deleteTarea);

// Rutas de Contactos
router.get('/contactos', apiController.getContactos);
router.post('/contactos', apiController.createContacto);
router.put('/contactos/:id', apiController.updateContacto);
router.delete('/contactos/:id', apiController.deleteContacto);

// Rutas de Cobranzas
router.get('/cobranzas', apiController.getCobranzas);
router.post('/cobranzas', apiController.createCobranza);
router.put('/cobranzas/:id', apiController.updateCobranza);
router.delete('/cobranzas/:id', apiController.deleteCobranza);

// Rutas de Paises
router.get('/paises', apiController.getPaises);
router.post('/paises', apiController.createPais);
router.put('/paises/:id', apiController.updatePais);
router.delete('/paises/:id', apiController.deletePais);

// Rutas de Visitas
router.get('/visitas', apiController.getVisitas);
router.post('/visitas', apiController.createVisita);
router.put('/visitas/:id', apiController.updateVisita);
router.delete('/visitas/:id', apiController.deleteVisita);

// Rutas de Oportunidades
router.get('/oportunidades', apiController.getOportunidades);
router.post('/oportunidades', apiController.createOportunidad);
router.put('/oportunidades/:id', apiController.updateOportunidad);
router.delete('/oportunidades/:id', apiController.deleteOportunidad);

// Rutas de Muestras
router.get('/muestras', apiController.getMuestras);
router.post('/muestras', apiController.createMuestra);
router.put('/muestras/:id', apiController.updateMuestra);
router.delete('/muestras/:id', apiController.deleteMuestra);

// Rutas de Comunicaciones
router.get('/comunicaciones', apiController.getComunicaciones);
router.post('/comunicaciones', apiController.createComunicacion);
router.put('/comunicaciones/:id', apiController.updateComunicacion);
router.delete('/comunicaciones/:id', apiController.deleteComunicacion);

// Rutas de Documentos
router.get('/documentos', apiController.getDocumentos);
router.post('/documentos', apiController.createDocumento);
router.put('/documentos/:id', apiController.updateDocumento);
router.delete('/documentos/:id', apiController.deleteDocumento);

// Rutas de Precios Competidores
router.get('/precios', apiController.getPrecios);
router.post('/precios', apiController.createPrecio);
router.put('/precios/:id', apiController.updatePrecio);
router.delete('/precios/:id', apiController.deletePrecio);

// Rutas de Tendencias de Mercado
router.get('/tendencias', apiController.getTendencias);
router.post('/tendencias', apiController.createTendencia);
router.put('/tendencias/:id', apiController.updateTendencia);
router.delete('/tendencias/:id', apiController.deleteTendencia);

// Rutas de Calculos Guardados
router.get('/calculos', apiController.getCalculos);
router.post('/calculos', apiController.createCalculo);
router.put('/calculos/:id', apiController.updateCalculo);
router.delete('/calculos/:id', apiController.deleteCalculo);

module.exports = router;
