const pool = require('../config/db');
const finnegansService = require('../services/finnegansService');

// Helper para convertir cualquier fecha/ISO string a formato YYYY-MM-DD para MySQL
const toSqlDate = (d) => {
  if (!d) return null;
  const s = String(d).trim();
  if (s.length >= 10 && /^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.substring(0, 10);
  }
  return null;
};

// --- TAREAS ---
exports.getTareas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT t.*, p.nombre as pais_nombre FROM tareas t LEFT JOIN paises p ON t.pais_id = p.id ORDER BY t.status ASC, t.fecha ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTarea = async (req, res) => {
  const { titulo, fecha, prioridad, pais_id, asignado, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO tareas (titulo, fecha, prioridad, pais_id, asignado, notas, status) VALUES (?, ?, ?, ?, ?, ?, "pendiente")',
      [titulo, toSqlDate(fecha), prioridad || 'media', pais_id || null, asignado || null, notas || null]
    );
    res.json({ id: result.insertId, message: 'Tarea creada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTarea = async (req, res) => {
  const { id } = req.params;
  const { titulo, fecha, prioridad, pais_id, asignado, notas, status } = req.body;
  try {
    await pool.query(
      'UPDATE tareas SET titulo = COALESCE(?, titulo), fecha = ?, prioridad = COALESCE(?, prioridad), pais_id = ?, asignado = ?, notas = ?, status = COALESCE(?, status) WHERE id = ?',
      [titulo, toSqlDate(fecha), prioridad || null, pais_id || null, asignado || null, notas || null, status || null, id]
    );
    res.json({ message: 'Tarea actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTarea = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tareas WHERE id = ?', [id]);
    res.json({ message: 'Tarea eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- CONTACTOS ---
exports.getContactos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM contactos ORDER BY nombre, apellido');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createContacto = async (req, res) => {
  const { nombre, apellido, empresa, rol, pais_id, pais_nombre, ciudad, email, telefono, estado, notas, finnegans_id } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO contactos (nombre, apellido, empresa, rol, pais_id, pais_nombre, ciudad, email, telefono, estado, notas, finnegans_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, apellido || null, empresa || null, rol || 'Otro', pais_id || null, pais_nombre || null, ciudad || null, email || null, telefono || null, estado || 'Activo', notas || null, finnegans_id || null]
    );
    res.json({ id: result.insertId, message: 'Contacto creado con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateContacto = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, empresa, rol, pais_id, pais_nombre, ciudad, email, telefono, estado, notas, finnegans_id } = req.body;
  try {
    await pool.query(
      'UPDATE contactos SET nombre = COALESCE(?, nombre), apellido = ?, empresa = ?, rol = ?, pais_id = ?, pais_nombre = ?, ciudad = ?, email = ?, telefono = ?, estado = ?, notas = ?, finnegans_id = ? WHERE id = ?',
      [nombre, apellido || null, empresa || null, rol || null, pais_id || null, pais_nombre || null, ciudad || null, email || null, telefono || null, estado || 'Activo', notas || null, finnegans_id || null, id]
    );
    res.json({ message: 'Contacto actualizado con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteContacto = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM contactos WHERE id = ?', [id]);
    res.json({ message: 'Contacto eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- COBRANZAS ---
exports.getCobranzas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT c.*, k.nombre as cliente_nombre, p.nombre as pais_nombre FROM cobranzas c LEFT JOIN contactos k ON c.cliente_id = k.id LEFT JOIN paises p ON c.pais_id = p.id ORDER BY c.vencimiento ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCobranza = async (req, res) => {
  const { descripcion, cliente_id, pais_id, monto, cobrado_monto, unidades, marca, embarque, vencimiento, estado, condicion, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO cobranzas (descripcion, cliente_id, pais_id, monto, cobrado_monto, unidades, marca, embarque, vencimiento, estado, condicion, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [descripcion, cliente_id || null, pais_id || null, monto || 0.00, cobrado_monto || 0.00, unidades || 0, marca || 'Don Yeyo', toSqlDate(embarque), toSqlDate(vencimiento), estado || 'Pendiente', condicion || null, notas || null]
    );
    res.json({ id: result.insertId, message: 'Cobranza guardada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCobranza = async (req, res) => {
  const { id } = req.params;
  const { descripcion, cliente_id, pais_id, monto, cobrado_monto, unidades, marca, embarque, vencimiento, estado, condicion, notas } = req.body;
  try {
    await pool.query(
      'UPDATE cobranzas SET descripcion = COALESCE(?, descripcion), cliente_id = ?, pais_id = ?, monto = ?, cobrado_monto = ?, unidades = ?, marca = ?, embarque = ?, vencimiento = ?, estado = ?, condicion = ?, notas = ? WHERE id = ?',
      [descripcion, cliente_id || null, pais_id || null, monto || 0.00, cobrado_monto || 0.00, unidades || 0, marca || 'Don Yeyo', toSqlDate(embarque), toSqlDate(vencimiento), estado || 'Pendiente', condicion || null, notas || null, id]
    );
    res.json({ message: 'Cobranza actualizada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCobranza = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM cobranzas WHERE id = ?', [id]);
    res.json({ message: 'Cobranza eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- PAISES ---
exports.getPaises = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM paises ORDER BY nombre');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPais = async (req, res) => {
  const { nombre, bandera, arancel, incoterm, ncm, moneda, tipocambio, tc_fecha, sanitario, sanitario_req, etiquetado, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO paises (nombre, bandera, arancel, incoterm, ncm, moneda, tipocambio, tc_fecha, sanitario, sanitario_req, etiquetado, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, bandera || '🌐', arancel || 0.00, incoterm || 'FOB', ncm || null, moneda || 'USD', tipocambio || 1.0000, toSqlDate(tc_fecha), sanitario || null, sanitario_req || null, etiquetado || null, notas || null]
    );
    res.json({ id: result.insertId, message: 'País guardado con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePais = async (req, res) => {
  const { id } = req.params;
  const { nombre, bandera, arancel, incoterm, ncm, moneda, tipocambio, tc_fecha, sanitario, sanitario_req, etiquetado, notas } = req.body;
  try {
    await pool.query(
      'UPDATE paises SET nombre = COALESCE(?, nombre), bandera = ?, arancel = ?, incoterm = ?, ncm = ?, moneda = ?, tipocambio = ?, tc_fecha = ?, sanitario = ?, sanitario_req = ?, etiquetado = ?, notas = ? WHERE id = ?',
      [nombre, bandera || '🌐', arancel || 0.00, incoterm || 'FOB', ncm || null, moneda || 'USD', tipocambio || 1.0000, toSqlDate(tc_fecha), sanitario || null, sanitario_req || null, etiquetado || null, notas || null, id]
    );
    res.json({ message: 'País actualizado con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePais = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM paises WHERE id = ?', [id]);
    res.json({ message: 'País eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- VISITAS ---
exports.getVisitas = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM visitas ORDER BY fecha DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const parseNum = (val, isFloat = false) => {
  if (val === null || val === undefined || val === '') return 0;
  const num = isFloat ? parseFloat(val) : parseInt(val, 10);
  return isNaN(num) ? 0 : num;
};

exports.createVisita = async (req, res) => {
  const { titulo, tipo, estado, fecha, lugar, contactos, notas, proximo, ronda_org, ronda_reuniones, ronda_importadores, ronda_pedidos, ronda_resultado } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO visitas (titulo, tipo, estado, fecha, lugar, contactos, notas, proximo, ronda_org, ronda_reuniones, ronda_importadores, ronda_pedidos, ronda_resultado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        titulo,
        tipo || 'Feria internacional',
        estado || 'Planificada',
        toSqlDate(fecha) || toSqlDate(new Date()),
        lugar || null,
        contactos || null,
        notas || null,
        proximo || null,
        ronda_org || null,
        parseNum(ronda_reuniones),
        parseNum(ronda_importadores),
        parseNum(ronda_pedidos, true),
        ronda_resultado || null
      ]
    );
    res.json({ id: result.insertId, message: 'Visita guardada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateVisita = async (req, res) => {
  const { id } = req.params;
  const { titulo, tipo, estado, fecha, lugar, contactos, notas, proximo, ronda_org, ronda_reuniones, ronda_importadores, ronda_pedidos, ronda_resultado } = req.body;
  try {
    await pool.query(
      'UPDATE visitas SET titulo = COALESCE(?, titulo), tipo = COALESCE(?, tipo), estado = ?, fecha = ?, lugar = ?, contactos = ?, notas = ?, proximo = ?, ronda_org = ?, ronda_reuniones = ?, ronda_importadores = ?, ronda_pedidos = ?, ronda_resultado = ? WHERE id = ?',
      [
        titulo,
        tipo || 'Feria internacional',
        estado || 'Planificada',
        toSqlDate(fecha),
        lugar || null,
        contactos || null,
        notas || null,
        proximo || null,
        ronda_org || null,
        parseNum(ronda_reuniones),
        parseNum(ronda_importadores),
        parseNum(ronda_pedidos, true),
        ronda_resultado || null,
        id
      ]
    );
    res.json({ message: 'Visita actualizada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


exports.deleteVisita = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM visitas WHERE id = ?', [id]);
    res.json({ message: 'Visita eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- OPORTUNIDADES ---
exports.getOportunidades = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT o.*, p.nombre as pais_nombre, p.bandera as pais_bandera FROM oportunidades o LEFT JOIN paises p ON o.pais_id = p.id ORDER BY o.cierre ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createOportunidad = async (req, res) => {
  const { nombre, pais_id, contacto_id, marca, categoria, monto, prob, etapa, cierre, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO oportunidades (nombre, pais_id, contacto_id, marca, categoria, monto, prob, etapa, cierre, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [nombre, pais_id || null, contacto_id || null, marca || 'Don Yeyo', categoria || null, monto || 0.00, prob || 0, etapa || 'Prospecto', toSqlDate(cierre), notas || null]
    );
    res.json({ id: result.insertId, message: 'Oportunidad guardada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOportunidad = async (req, res) => {
  const { id } = req.params;
  const { nombre, pais_id, contacto_id, marca, categoria, monto, prob, etapa, cierre, notas } = req.body;
  try {
    await pool.query(
      'UPDATE oportunidades SET nombre = COALESCE(?, nombre), pais_id = ?, contacto_id = ?, marca = ?, categoria = ?, monto = ?, prob = ?, etapa = ?, cierre = ?, notas = ? WHERE id = ?',
      [nombre, pais_id || null, contacto_id || null, marca || 'Don Yeyo', categoria || null, monto || 0.00, prob || 0, etapa || 'Prospecto', toSqlDate(cierre), notas || null, id]
    );
    res.json({ message: 'Oportunidad actualizada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteOportunidad = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM oportunidades WHERE id = ?', [id]);
    res.json({ message: 'Oportunidad eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- MUESTRAS ---
exports.getMuestras = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT m.*, p.nombre as pais_nombre FROM muestras m LEFT JOIN paises p ON m.pais_id = p.id ORDER BY m.fecha DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createMuestra = async (req, res) => {
  const { producto, destinatario, pais_id, fecha, resultado, costo, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO muestras (producto, destinatario, pais_id, fecha, resultado, costo, notas) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [producto, destinatario || null, pais_id || null, toSqlDate(fecha) || toSqlDate(new Date()), resultado || 'Pendiente', costo || 0.00, notas || null]
    );
    res.json({ id: result.insertId, message: 'Muestra registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteMuestra = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM muestras WHERE id = ?', [id]);
    res.json({ message: 'Muestra eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMuestra = async (req, res) => {
  const { id } = req.params;
  const { producto, destinatario, pais_id, fecha, resultado, costo, notas } = req.body;
  try {
    await pool.query(
      'UPDATE muestras SET producto = COALESCE(?, producto), destinatario = ?, pais_id = ?, fecha = ?, resultado = ?, costo = ?, notas = ? WHERE id = ?',
      [producto, destinatario || null, pais_id || null, toSqlDate(fecha), resultado || 'Pendiente', costo || 0.00, notas || null, id]
    );
    res.json({ message: 'Muestra actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- COMUNICACIONES ---
exports.getComunicaciones = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT c.*, k.nombre as contacto_nombre, p.nombre as pais_nombre FROM comunicaciones c LEFT JOIN contactos k ON c.contacto_id = k.id LEFT JOIN paises p ON k.pais_id = p.id ORDER BY c.fecha DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createComunicacion = async (req, res) => {
  const { tipo, fecha, contacto_id, asunto, resumen, proximo } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO comunicaciones (tipo, fecha, contacto_id, asunto, resumen, proximo) VALUES (?, ?, ?, ?, ?, ?)',
      [tipo || 'Email', toSqlDate(fecha) || toSqlDate(new Date()), contacto_id || null, asunto, resumen || null, proximo || null]
    );
    res.json({ id: result.insertId, message: 'Comunicación registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteComunicacion = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM comunicaciones WHERE id = ?', [id]);
    res.json({ message: 'Comunicación eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateComunicacion = async (req, res) => {
  const { id } = req.params;
  const { tipo, fecha, contacto_id, asunto, resumen, proximo } = req.body;
  try {
    await pool.query(
      'UPDATE comunicaciones SET tipo = COALESCE(?, tipo), fecha = ?, contacto_id = ?, asunto = COALESCE(?, asunto), resumen = ?, proximo = ? WHERE id = ?',
      [tipo || 'Email', toSqlDate(fecha), contacto_id || null, asunto, resumen || null, proximo || null, id]
    );
    res.json({ message: 'Comunicación actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- DOCUMENTOS ---
exports.getDocumentos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT d.*, p.nombre as pais_nombre FROM documentos d LEFT JOIN paises p ON d.pais_id = p.id ORDER BY d.vencimiento ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createDocumento = async (req, res) => {
  const { nombre, numero, tipo, pais_id, vencimiento, estado, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO documentos (nombre, numero, tipo, pais_id, vencimiento, estado, notas) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [nombre, numero || null, tipo || 'Invoice', pais_id || null, toSqlDate(vencimiento), estado || 'Vigente', notas || null]
    );
    res.json({ id: result.insertId, message: 'Documento guardado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteDocumento = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM documentos WHERE id = ?', [id]);
    res.json({ message: 'Documento eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateDocumento = async (req, res) => {
  const { id } = req.params;
  const { nombre, numero, tipo, pais_id, vencimiento, estado, notas } = req.body;
  try {
    await pool.query(
      'UPDATE documentos SET nombre = COALESCE(?, nombre), numero = ?, tipo = ?, pais_id = ?, vencimiento = ?, estado = ?, notas = ? WHERE id = ?',
      [nombre, numero || null, tipo || 'Invoice', pais_id || null, toSqlDate(vencimiento), estado || 'Vigente', notas || null, id]
    );
    res.json({ message: 'Documento actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- PRECIOS COMPETIDORES ---
exports.getPrecios = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT pr.*, p.nombre as pais_nombre FROM precios_competidores pr LEFT JOIN paises p ON pr.pais_id = p.id ORDER BY pr.fecha DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createPrecio = async (req, res) => {
  const { competidor, producto, pais_id, categoria, precio, unidad, peso, fuente, fecha, imagen_url, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO precios_competidores (competidor, producto, pais_id, categoria, precio, unidad, peso, fuente, fecha, imagen_url, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [competidor, producto || null, pais_id || null, categoria || null, precio || 0.00, unidad || 'unidades', peso || 1.000, fuente || null, toSqlDate(fecha) || toSqlDate(new Date()), imagen_url || null, notas || null]
    );
    res.json({ id: result.insertId, message: 'Precio de competidor registrado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deletePrecio = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM precios_competidores WHERE id = ?', [id]);
    res.json({ message: 'Registro de precio eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePrecio = async (req, res) => {
  const { id } = req.params;
  const { competidor, producto, pais_id, categoria, precio, unidad, peso, fuente, fecha, imagen_url, notas } = req.body;
  try {
    await pool.query(
      'UPDATE precios_competidores SET competidor = COALESCE(?, competidor), producto = ?, pais_id = ?, categoria = ?, precio = ?, unidad = ?, peso = ?, fuente = ?, fecha = ?, imagen_url = ?, notas = ? WHERE id = ?',
      [competidor, producto || null, pais_id || null, categoria || null, precio || 0.00, unidad || 'unidades', peso || 1.000, fuente || null, toSqlDate(fecha), imagen_url || null, notas || null, id]
    );
    res.json({ message: 'Precio actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- TENDENCIAS ---
exports.getTendencias = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT t.*, p.nombre as pais_nombre FROM tendencias t LEFT JOIN paises p ON t.pais_id = p.id ORDER BY t.created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTendencia = async (req, res) => {
  const { titulo, pais_id, categoria, descripcion, fuente, tags } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO tendencias (titulo, pais_id, categoria, descripcion, fuente, tags) VALUES (?, ?, ?, ?, ?, ?)',
      [titulo, pais_id || null, categoria || null, descripcion || null, fuente || null, tags || null]
    );
    res.json({ id: result.insertId, message: 'Tendencia guardada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteTendencia = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tendencias WHERE id = ?', [id]);
    res.json({ message: 'Tendencia eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTendencia = async (req, res) => {
  const { id } = req.params;
  const { titulo, pais_id, categoria, descripcion, fuente, tags } = req.body;
  try {
    await pool.query(
      'UPDATE tendencias SET titulo = COALESCE(?, titulo), pais_id = ?, categoria = ?, descripcion = ?, fuente = ?, tags = ? WHERE id = ?',
      [titulo, pais_id || null, categoria || null, descripcion || null, fuente || null, tags || null, id]
    );
    res.json({ message: 'Tendencia actualizada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- CALCULADORA ---
exports.getCalculos = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT c.*, p.nombre as pais_nombre FROM calculos_exportacion c LEFT JOIN paises p ON c.pais_id = p.id ORDER BY c.fecha DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCalculo = async (req, res) => {
  const { producto, pais_id, fob, qty, flete, seguro, arancel, otros, landed, fecha } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO calculos_exportacion (producto, pais_id, fob, qty, flete, seguro, arancel, otros, landed, fecha) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [producto, pais_id || null, fob || 0.00, qty || 1, flete || 0.00, seguro || 0.00, arancel || 0.00, otros || 0.00, landed || 0.00, toSqlDate(fecha) || toSqlDate(new Date())]
    );
    res.json({ id: result.insertId, message: 'Cálculo de exportación guardado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteCalculo = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM calculos_exportacion WHERE id = ?', [id]);
    res.json({ message: 'Cálculo de exportación eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCalculo = async (req, res) => {
  const { id } = req.params;
  const { producto, pais_id, fob, qty, flete, seguro, arancel, otros, landed, fecha } = req.body;
  try {
    await pool.query(
      'UPDATE calculos_exportacion SET producto = COALESCE(?, producto), pais_id = ?, fob = ?, qty = ?, flete = ?, seguro = ?, arancel = ?, otros = ?, landed = ?, fecha = ? WHERE id = ?',
      [producto, pais_id || null, fob || 0.00, qty || 1, flete || 0.00, seguro || 0.00, arancel || 0.00, otros || 0.00, landed || 0.00, toSqlDate(fecha), id]
    );
    res.json({ message: 'Cálculo actualizado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- FINNEGANS ERP INTEGRATION ---
exports.getFinnegansClientes = async (req, res) => {
  try {
    const clientes = await finnegansService.getClientesExportacion();
    res.json(clientes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getProductosFinnegans = async (req, res) => {
  try {
    const productos = await finnegansService.getProductosTerminados();
    res.json(productos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// --- ME (Microsoft user details fallback) ---
exports.getMe = (req, res) => {
  res.json(req.user);
};

// --- SYSTEM & AUTH VALIDATION ---
exports.validateEmail = (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: 'Email requerido', authorized: false });
  }

  const authorizedEmailsStr = process.env.AUTHORIZED_EMAILS || '';
  const authorizedEmails = authorizedEmailsStr.split(',').map(e => e.trim().toLowerCase()).filter(e => e);

  if (authorizedEmails.length === 0) {
    return res.json({ authorized: true, message: 'No hay restricción de emails configurada' });
  }

  const isAuthorized = authorizedEmails.includes(email.toLowerCase());
  res.json({ authorized: isAuthorized });
};

exports.getSystemVersion = (req, res) => {
  res.json({ version: '1.0.0', status: 'online' });
};

