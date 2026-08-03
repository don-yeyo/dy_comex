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

// Helper para validar formato de hora HH:mm o HH:mm:ss
const toSqlTime = (t) => {
  if (!t) return null;
  const s = String(t).trim();
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    return s.length === 5 ? `${s}:00` : s;
  }
  return null;
};

const parseNum = (val, isFloat = false) => {
  if (val === null || val === undefined || val === '') return 0;
  const num = isFloat ? parseFloat(val) : parseInt(val, 10);
  return isNaN(num) ? 0 : num;
};

// Helper para sincronizar tareas automáticas a la agenda
const autoSyncTarea = async (titulo, fecha, hora = null, pais_id = null, notas = null, asignado = null) => {
  if (!titulo || !fecha) return;
  try {
    const sqlDate = toSqlDate(fecha);
    const sqlTime = toSqlTime(hora);
    if (!sqlDate) return;

    // Verificar si ya existe una tarea igual no completada
    const [existing] = await pool.query(
      'SELECT id FROM tareas WHERE titulo = ? AND fecha = ? AND status = "pendiente" LIMIT 1',
      [titulo, sqlDate]
    );

    if (existing.length === 0) {
      await pool.query(
        'INSERT INTO tareas (titulo, fecha, hora, prioridad, pais_id, asignado, notas, status) VALUES (?, ?, ?, "media", ?, ?, ?, "pendiente")',
        [titulo, sqlDate, sqlTime, pais_id || null, asignado || null, notas || null]
      );
    }
  } catch (err) {
    console.error('[autoSyncTarea] Error creando tarea automática:', err.message);
  }
};


// --- TAREAS ---
exports.getTareas = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT t.*, p.nombre as pais_nombre 
       FROM tareas t 
       LEFT JOIN paises p ON t.pais_id = p.id 
       ORDER BY 
         CASE t.status WHEN 'pendiente' THEN 1 WHEN 'hecha' THEN 2 ELSE 3 END ASC, 
         CASE t.prioridad WHEN 'alta' THEN 1 WHEN 'media' THEN 2 WHEN 'baja' THEN 3 ELSE 4 END ASC, 
         t.fecha ASC, 
         t.hora ASC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createTarea = async (req, res) => {
  const { titulo, fecha, hora, hora_fin, prioridad, pais_id, asignado, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO tareas (titulo, fecha, hora, hora_fin, prioridad, pais_id, asignado, notas, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, "pendiente")',
      [titulo, toSqlDate(fecha), toSqlTime(hora), toSqlTime(hora_fin), prioridad || 'media', pais_id || null, asignado || null, notas || null]
    );
    res.json({ id: result.insertId, message: 'Tarea creada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateTarea = async (req, res) => {
  const { id } = req.params;
  const { titulo, fecha, hora, hora_fin, prioridad, pais_id, asignado, notas, status } = req.body;
  try {
    const fields = [];
    const values = [];

    if (titulo !== undefined) { fields.push('titulo = ?'); values.push(titulo); }
    if (fecha !== undefined) { fields.push('fecha = ?'); values.push(toSqlDate(fecha)); }
    if (hora !== undefined) { fields.push('hora = ?'); values.push(toSqlTime(hora)); }
    if (hora_fin !== undefined) { fields.push('hora_fin = ?'); values.push(toSqlTime(hora_fin)); }
    if (prioridad !== undefined) { fields.push('prioridad = ?'); values.push(prioridad); }
    if (pais_id !== undefined) { fields.push('pais_id = ?'); values.push(pais_id || null); }
    if (asignado !== undefined) { fields.push('asignado = ?'); values.push(asignado || null); }
    if (notas !== undefined) { fields.push('notas = ?'); values.push(notas || null); }
    if (status !== undefined) { fields.push('status = ?'); values.push(status); }

    if (fields.length === 0) {
      return res.json({ message: 'Sin cambios a actualizar' });
    }

    values.push(id);
    await pool.query(`UPDATE tareas SET ${fields.join(', ')} WHERE id = ?`, values);
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
  const { nombre, apellido, empresa, rol, pais_id, pais_nombre, ciudad, email, telefono, estado, etapa_comercial, proxima_accion, proxima_accion_fecha, proxima_accion_hora, notas, finnegans_id } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO contactos (nombre, apellido, empresa, rol, pais_id, pais_nombre, ciudad, email, telefono, estado, etapa_comercial, proxima_accion, proxima_accion_fecha, proxima_accion_hora, notas, finnegans_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        nombre,
        apellido || null,
        empresa || null,
        rol || 'Otro',
        pais_id || null,
        pais_nombre || null,
        ciudad || null,
        email || null,
        telefono || null,
        estado || 'Activo',
        etapa_comercial || null,
        proxima_accion || null,
        toSqlDate(proxima_accion_fecha),
        toSqlTime(proxima_accion_hora),
        notas || null,
        finnegans_id || null
      ]
    );

    if (proxima_accion && proxima_accion_fecha) {
      await autoSyncTarea(
        `Próxima Acción: ${nombre} (${empresa || 'Contacto'}) - ${proxima_accion}`,
        proxima_accion_fecha,
        proxima_accion_hora,
        pais_id,
        `Generado automáticamente desde Contactos`
      );
    }

    res.json({ id: result.insertId, message: 'Contacto creado con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateContacto = async (req, res) => {
  const { id } = req.params;
  const { nombre, apellido, empresa, rol, pais_id, pais_nombre, ciudad, email, telefono, estado, etapa_comercial, proxima_accion, proxima_accion_fecha, proxima_accion_hora, notas, finnegans_id } = req.body;
  try {
    await pool.query(
      'UPDATE contactos SET nombre = COALESCE(?, nombre), apellido = ?, empresa = ?, rol = ?, pais_id = ?, pais_nombre = ?, ciudad = ?, email = ?, telefono = ?, estado = ?, etapa_comercial = ?, proxima_accion = ?, proxima_accion_fecha = ?, proxima_accion_hora = ?, notas = ?, finnegans_id = ? WHERE id = ?',
      [
        nombre,
        apellido || null,
        empresa || null,
        rol || null,
        pais_id || null,
        pais_nombre || null,
        ciudad || null,
        email || null,
        telefono || null,
        estado || 'Activo',
        etapa_comercial || null,
        proxima_accion || null,
        toSqlDate(proxima_accion_fecha),
        toSqlTime(proxima_accion_hora),
        notas || null,
        finnegans_id || null,
        id
      ]
    );

    if (proxima_accion && proxima_accion_fecha) {
      await autoSyncTarea(
        `Próxima Acción: ${nombre} (${empresa || 'Contacto'}) - ${proxima_accion}`,
        proxima_accion_fecha,
        proxima_accion_hora,
        pais_id,
        `Generado automáticamente desde Contactos`
      );
    }

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


// --- VISITAS Y REUNIONES ---
exports.getVisitas = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT v.*, c.nombre as contacto_nombre, c.empresa as contacto_empresa FROM visitas v LEFT JOIN contactos c ON v.contacto_id = c.id ORDER BY v.fecha DESC, v.hora ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createVisita = async (req, res) => {
  const { titulo, tipo, estado, fecha, fecha_fin, hora, hora_fin, actividad_padre_id, contacto_id, lugar, contactos, notas, proximo, excel_url, ronda_org, ronda_reuniones, ronda_importadores, ronda_resultado } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO visitas (titulo, tipo, estado, fecha, fecha_fin, hora, hora_fin, actividad_padre_id, contacto_id, lugar, contactos, notas, proximo, excel_url, ronda_org, ronda_reuniones, ronda_importadores, ronda_resultado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        titulo,
        tipo || 'Feria internacional',
        estado || 'Planificada',
        toSqlDate(fecha) || toSqlDate(new Date()),
        toSqlDate(fecha_fin),
        toSqlTime(hora),
        toSqlTime(hora_fin),
        actividad_padre_id || null,
        contacto_id || null,
        lugar || null,
        contactos || null,
        notas || null,
        proximo || null,
        excel_url || null,
        ronda_org || null,
        parseNum(ronda_reuniones),
        parseNum(ronda_importadores),
        ronda_resultado || null
      ]
    );

    if (fecha) {
      await autoSyncTarea(
        `Evento/Reunión: ${titulo}`,
        fecha,
        hora,
        null,
        `Lugar: ${lugar || 'N/A'}. Notas: ${notas || 'Sin notas'}`
      );
    }

    res.json({ id: result.insertId, message: 'Visita guardada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateVisita = async (req, res) => {
  const { id } = req.params;
  const { titulo, tipo, estado, fecha, fecha_fin, hora, hora_fin, actividad_padre_id, contacto_id, lugar, contactos, notas, proximo, excel_url, ronda_org, ronda_reuniones, ronda_importadores, ronda_resultado } = req.body;
  try {
    await pool.query(
      'UPDATE visitas SET titulo = COALESCE(?, titulo), tipo = COALESCE(?, tipo), estado = ?, fecha = ?, fecha_fin = ?, hora = ?, hora_fin = ?, actividad_padre_id = ?, contacto_id = ?, lugar = ?, contactos = ?, notas = ?, proximo = ?, excel_url = ?, ronda_org = ?, ronda_reuniones = ?, ronda_importadores = ?, ronda_resultado = ? WHERE id = ?',
      [
        titulo,
        tipo || 'Feria internacional',
        estado || 'Planificada',
        toSqlDate(fecha),
        toSqlDate(fecha_fin),
        toSqlTime(hora),
        toSqlTime(hora_fin),
        actividad_padre_id || null,
        contacto_id || null,
        lugar || null,
        contactos || null,
        notas || null,
        proximo || null,
        excel_url || null,
        ronda_org || null,
        parseNum(ronda_reuniones),
        parseNum(ronda_importadores),
        ronda_resultado || null,
        id
      ]
    );

    if (fecha) {
      await autoSyncTarea(
        `Evento/Reunión: ${titulo}`,
        fecha,
        hora,
        null,
        `Lugar: ${lugar || 'N/A'}. Notas: ${notas || 'Sin notas'}`
      );
    }

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
    const [rows] = await pool.query(
      'SELECT o.*, p.nombre as pais_nombre, p.bandera as pais_bandera, c.nombre as contacto_nombre, c.empresa as contacto_empresa FROM oportunidades o LEFT JOIN paises p ON o.pais_id = p.id LEFT JOIN contactos c ON o.contacto_id = c.id ORDER BY o.cierre ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createOportunidad = async (req, res) => {
  const { nombre, pais_id, contacto_id, marca, marca_otra, categoria, categoria_detalle, monto, probabilidad, etapa, cierre, responsable, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO oportunidades (nombre, pais_id, contacto_id, marca, marca_otra, categoria, categoria_detalle, monto, probabilidad, etapa, cierre, responsable, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        nombre,
        pais_id || null,
        contacto_id || null,
        marca || 'Don Yeyo',
        marca_otra || null,
        categoria || null,
        categoria_detalle || null,
        monto || 0.00,
        probabilidad || '50%',
        etapa || 'En análisis',
        toSqlDate(cierre),
        responsable || null,
        notas || null
      ]
    );
    res.json({ id: result.insertId, message: 'Oportunidad guardada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOportunidad = async (req, res) => {
  const { id } = req.params;
  const { nombre, pais_id, contacto_id, marca, marca_otra, categoria, categoria_detalle, monto, probabilidad, etapa, cierre, responsable, notas } = req.body;
  try {
    await pool.query(
      'UPDATE oportunidades SET nombre = COALESCE(?, nombre), pais_id = ?, contacto_id = ?, marca = ?, marca_otra = ?, categoria = ?, categoria_detalle = ?, monto = ?, probabilidad = ?, etapa = ?, cierre = ?, responsable = ?, notas = ? WHERE id = ?',
      [
        nombre,
        pais_id || null,
        contacto_id || null,
        marca || 'Don Yeyo',
        marca_otra || null,
        categoria || null,
        categoria_detalle || null,
        monto || 0.00,
        probabilidad || '50%',
        etapa || 'En análisis',
        toSqlDate(cierre),
        responsable || null,
        notas || null,
        id
      ]
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
    const [rows] = await pool.query(
      'SELECT m.*, p.nombre as pais_nombre, c.nombre as contacto_nombre, c.empresa as contacto_empresa FROM muestras m LEFT JOIN paises p ON m.pais_id = p.id LEFT JOIN contactos c ON m.contacto_id = c.id ORDER BY m.fecha DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createMuestra = async (req, res) => {
  const { producto, destinatario, contacto_id, pais_id, fecha, resultado, costo, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO muestras (producto, destinatario, contacto_id, pais_id, fecha, resultado, costo, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [
        producto,
        destinatario || null,
        contacto_id || null,
        pais_id || null,
        toSqlDate(fecha) || toSqlDate(new Date()),
        resultado || 'Pendiente',
        costo || 0.00,
        notas || null
      ]
    );

    if (fecha) {
      await autoSyncTarea(
        `Seguimiento de Muestra: ${producto} a ${destinatario || 'Cliente'}`,
        fecha,
        null,
        pais_id,
        `Resultado actual: ${resultado || 'Pendiente'}`
      );
    }

    res.json({ id: result.insertId, message: 'Muestra registrada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateMuestra = async (req, res) => {
  const { id } = req.params;
  const { producto, destinatario, contacto_id, pais_id, fecha, resultado, costo, notas } = req.body;
  try {
    await pool.query(
      'UPDATE muestras SET producto = COALESCE(?, producto), destinatario = ?, contacto_id = ?, pais_id = ?, fecha = ?, resultado = ?, costo = ?, notas = ? WHERE id = ?',
      [
        producto,
        destinatario || null,
        contacto_id || null,
        pais_id || null,
        toSqlDate(fecha),
        resultado || 'Pendiente',
        costo || 0.00,
        notas || null,
        id
      ]
    );

    if (fecha) {
      await autoSyncTarea(
        `Seguimiento de Muestra: ${producto} a ${destinatario || 'Cliente'}`,
        fecha,
        null,
        pais_id,
        `Resultado actual: ${resultado || 'Pendiente'}`
      );
    }

    res.json({ message: 'Muestra actualizada' });
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
  const { nombre, bandera, arancel, incoterm_habitual, ncm, moneda, tipocambio, tc_fecha, sanitario, sanitario_req, etiquetado, etiquetado_fotos, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO paises (nombre, bandera, arancel, incoterm_habitual, ncm, moneda, tipocambio, tc_fecha, sanitario, sanitario_req, etiquetado, etiquetado_fotos, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        nombre,
        bandera || '🌐',
        arancel || 0.00,
        incoterm_habitual || null,
        ncm || null,
        moneda || 'USD',
        tipocambio || 1.0000,
        toSqlDate(tc_fecha),
        sanitario || null,
        sanitario_req || null,
        etiquetado || null,
        etiquetado_fotos || null,
        notas || null
      ]
    );
    res.json({ id: result.insertId, message: 'País guardado con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePais = async (req, res) => {
  const { id } = req.params;
  const { nombre, bandera, arancel, incoterm_habitual, ncm, moneda, tipocambio, tc_fecha, sanitario, sanitario_req, etiquetado, etiquetado_fotos, notas } = req.body;
  try {
    await pool.query(
      'UPDATE paises SET nombre = COALESCE(?, nombre), bandera = ?, arancel = ?, incoterm_habitual = ?, ncm = ?, moneda = ?, tipocambio = ?, tc_fecha = ?, sanitario = ?, sanitario_req = ?, etiquetado = ?, etiquetado_fotos = ?, notas = ? WHERE id = ?',
      [
        nombre,
        bandera || '🌐',
        arancel || 0.00,
        incoterm_habitual || null,
        ncm || null,
        moneda || 'USD',
        tipocambio || 1.0000,
        toSqlDate(tc_fecha),
        sanitario || null,
        sanitario_req || null,
        etiquetado || null,
        etiquetado_fotos || null,
        notas || null,
        id
      ]
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


// --- OPERACIONES (Reemplaza a Documentos) ---
exports.getOperaciones = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT o.*, c.nombre as cliente_nombre, c.empresa as cliente_empresa, p.nombre as pais_nombre, p.bandera as pais_bandera FROM operaciones o LEFT JOIN contactos c ON o.cliente_id = c.id LEFT JOIN paises p ON o.pais_id = p.id ORDER BY o.fecha_entrega ASC, o.created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createOperacion = async (req, res) => {
  const { numero_pedido, cliente_id, pais_id, estado, fecha_entrega, unidades, valor_usd, kilogramos, incoterm, documentos, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO operaciones (numero_pedido, cliente_id, pais_id, estado, fecha_entrega, unidades, valor_usd, kilogramos, incoterm, documentos, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        numero_pedido,
        cliente_id || null,
        pais_id || null,
        estado || 'Pedido recibido',
        toSqlDate(fecha_entrega),
        unidades || 0,
        valor_usd || 0.00,
        kilogramos || 0.00,
        incoterm || 'FOB',
        documentos || null,
        notas || null
      ]
    );

    if (fecha_entrega) {
      await autoSyncTarea(
        `Entrega de Operación Nº ${numero_pedido}`,
        fecha_entrega,
        null,
        pais_id,
        `Estado: ${estado || 'Pedido recibido'}. Unidades: ${unidades}`
      );
    }

    res.json({ id: result.insertId, message: 'Operación registrada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateOperacion = async (req, res) => {
  const { id } = req.params;
  const { numero_pedido, cliente_id, pais_id, estado, fecha_entrega, unidades, valor_usd, kilogramos, incoterm, documentos, notas } = req.body;
  try {
    await pool.query(
      'UPDATE operaciones SET numero_pedido = COALESCE(?, numero_pedido), cliente_id = ?, pais_id = ?, estado = ?, fecha_entrega = ?, unidades = ?, valor_usd = ?, kilogramos = ?, incoterm = ?, documentos = ?, notas = ? WHERE id = ?',
      [
        numero_pedido,
        cliente_id || null,
        pais_id || null,
        estado || 'Pedido recibido',
        toSqlDate(fecha_entrega),
        unidades || 0,
        valor_usd || 0.00,
        kilogramos || 0.00,
        incoterm || 'FOB',
        documentos || null,
        notas || null,
        id
      ]
    );

    if (fecha_entrega) {
      await autoSyncTarea(
        `Entrega de Operación Nº ${numero_pedido}`,
        fecha_entrega,
        null,
        pais_id,
        `Estado: ${estado || 'Pedido recibido'}. Unidades: ${unidades}`
      );
    }

    res.json({ message: 'Operación actualizada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteOperacion = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM operaciones WHERE id = ?', [id]);
    res.json({ message: 'Operación eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// --- DOCUMENTOS (Legacy) ---
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

exports.deleteDocumento = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM documentos WHERE id = ?', [id]);
    res.json({ message: 'Documento eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// --- COMUNICACIONES ---
exports.getComunicaciones = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT c.*, k.nombre as contacto_nombre, p.nombre as pais_nombre FROM comunicaciones c LEFT JOIN contactos k ON c.contacto_id = k.id LEFT JOIN paises p ON k.pais_id = p.id ORDER BY c.fecha DESC'
    );
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

exports.deleteComunicacion = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM comunicaciones WHERE id = ?', [id]);
    res.json({ message: 'Comunicación eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// --- PRECIOS COMPETIDORES ---
exports.getPrecios = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT pr.*, p.nombre as pais_nombre FROM precios_competidores pr LEFT JOIN paises p ON pr.pais_id = p.id ORDER BY pr.fecha DESC'
    );
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
      [
        competidor,
        producto || null,
        pais_id || null,
        categoria || null,
        precio || 0.00,
        unidad || 'unidades',
        peso || 1.000,
        fuente || null,
        toSqlDate(fecha) || toSqlDate(new Date()),
        imagen_url || null,
        notas || null
      ]
    );
    res.json({ id: result.insertId, message: 'Precio de competidor registrado' });
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
      [
        competidor,
        producto || null,
        pais_id || null,
        categoria || null,
        precio || 0.00,
        unidad || 'unidades',
        peso || 1.000,
        fuente || null,
        toSqlDate(fecha),
        imagen_url || null,
        notas || null,
        id
      ]
    );
    res.json({ message: 'Precio actualizado' });
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


// --- TENDENCIAS ---
exports.getTendencias = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT t.*, p.nombre as pais_nombre FROM tendencias t LEFT JOIN paises p ON t.pais_id = p.id ORDER BY t.created_at DESC'
    );
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

exports.deleteTendencia = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM tendencias WHERE id = ?', [id]);
    res.json({ message: 'Tendencia eliminada' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// --- CALCULADORA ---
exports.getCalculos = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT c.*, p.nombre as pais_nombre FROM calculos_exportacion c LEFT JOIN paises p ON c.pais_id = p.id ORDER BY c.fecha DESC'
    );
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

exports.deleteCalculo = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM calculos_exportacion WHERE id = ?', [id]);
    res.json({ message: 'Cálculo de exportación eliminado' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// --- COBRANZAS ---
exports.getCobranzas = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT c.*, k.nombre as cliente_nombre, p.nombre as pais_nombre FROM cobranzas c LEFT JOIN contactos k ON c.cliente_id = k.id LEFT JOIN paises p ON c.pais_id = p.id ORDER BY c.vencimiento ASC'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.createCobranza = async (req, res) => {
  const { descripcion, cliente_id, pais_id, monto, cobrado_monto, unidades, marca, embarque, vencimiento, estado, condicion, medio_pago, condicion_pago, notas } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO cobranzas (descripcion, cliente_id, pais_id, monto, cobrado_monto, unidades, marca, embarque, vencimiento, estado, condicion, medio_pago, condicion_pago, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [
        descripcion,
        cliente_id || null,
        pais_id || null,
        monto || 0.00,
        cobrado_monto || 0.00,
        unidades || 0,
        marca || 'Don Yeyo',
        toSqlDate(embarque),
        toSqlDate(vencimiento),
        estado || 'Pendiente',
        condicion || null,
        medio_pago || null,
        condicion_pago || null,
        notas || null
      ]
    );
    if (vencimiento && estado !== 'Cobrado total') {
      await autoSyncTarea(
        `Vencimiento de Cobranza: ${descripcion || 'Operación'}`,
        vencimiento,
        null,
        pais_id || null,
        `Monto total: $${monto || 0} USD. Estado: ${estado || 'Pendiente'}`
      );
    }

    res.json({ id: result.insertId, message: 'Cobranza guardada con éxito' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateCobranza = async (req, res) => {
  const { id } = req.params;
  const { descripcion, cliente_id, pais_id, monto, cobrado_monto, unidades, marca, embarque, vencimiento, estado, condicion, medio_pago, condicion_pago, notas } = req.body;
  try {
    await pool.query(
      'UPDATE cobranzas SET descripcion = COALESCE(?, descripcion), cliente_id = ?, pais_id = ?, monto = ?, cobrado_monto = ?, unidades = ?, marca = ?, embarque = ?, vencimiento = ?, estado = ?, condicion = ?, medio_pago = ?, condicion_pago = ?, notas = ? WHERE id = ?',
      [
        descripcion,
        cliente_id || null,
        pais_id || null,
        monto || 0.00,
        cobrado_monto || 0.00,
        unidades || 0,
        marca || 'Don Yeyo',
        toSqlDate(embarque),
        toSqlDate(vencimiento),
        estado || 'Pendiente',
        condicion || null,
        medio_pago || null,
        condicion_pago || null,
        notas || null,
        id
      ]
    );

    if (vencimiento && estado !== 'Cobrado total') {
      await autoSyncTarea(
        `Vencimiento de Cobranza: ${descripcion || 'Operación'}`,
        vencimiento,
        null,
        pais_id || null,
        `Monto total: $${monto || 0} USD. Estado: ${estado || 'Pendiente'}`
      );
    }

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

exports.syncFinnegansClientes = async (req, res) => {
  try {
    const clientes = await finnegansService.getClientesExportacion();
    let synced = 0;
    for (const c of clientes) {
      if (!c.nombre) continue;
      const finnegans_id = String(c.codigo || c.id || c.nombre);
      const [existing] = await pool.query('SELECT id FROM contactos WHERE finnegans_id = ? OR nombre = ?', [finnegans_id, c.nombre]);
      if (existing.length === 0) {
        await pool.query(
          'INSERT INTO contactos (nombre, empresa, rol, ciudad, email, telefono, estado, finnegans_id, notas) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [c.nombre, c.empresa || c.razonSocial || c.nombre, c.rol || 'Importador', c.ciudad || null, c.email || null, c.telefono || null, 'Activo', finnegans_id, 'Sincronizado desde Finnegans ERP']
        );
        synced++;
      } else {
        await pool.query(
          'UPDATE contactos SET empresa = COALESCE(?, empresa), email = COALESCE(?, email), telefono = COALESCE(?, telefono), finnegans_id = ? WHERE id = ?',
          [c.empresa || c.razonSocial, c.email, c.telefono, finnegans_id, existing[0].id]
        );
        synced++;
      }
    }
    res.json({ message: `Sincronización completada. ${synced} contactos procesados desde Finnegans.` });
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

  const cleanInputEmail = email.trim().toLowerCase();
  const inputParts = cleanInputEmail.split('@');
  const inputHandle = inputParts[0] || '';
  const inputDomain = inputParts[1] || '';

  const authorizedEmailsStr = (process.env.AUTHORIZED_EMAILS || '').replace(/^["']|["']$/g, '');
  const authorizedEmails = authorizedEmailsStr.split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
  const authorizedHandles = authorizedEmails.map(e => e.split('@')[0]);

  const allowedDomain = (process.env.ALLOWED_EMAIL_DOMAIN || 'donyeyo.com.ar').replace(/^["']|["']$/g, '').trim().toLowerCase();

  if (authorizedEmails.length === 0 && !allowedDomain) {
    return res.json({ authorized: true, message: 'Sin restricciones configuradas' });
  }

  const isAuthorized = 
    authorizedEmails.includes(cleanInputEmail) ||
    authorizedHandles.includes(inputHandle) ||
    (allowedDomain && (inputDomain === allowedDomain || inputDomain.endsWith('.' + allowedDomain) || inputDomain.includes('donyeyo')));

  res.json({ 
    authorized: isAuthorized, 
    email: cleanInputEmail,
    matchedBy: isAuthorized ? (authorizedEmails.includes(cleanInputEmail) ? 'exact' : (authorizedHandles.includes(inputHandle) ? 'handle' : 'domain')) : 'none'
  });
};

exports.getSystemVersion = (req, res) => {
  res.json({ version: '1.1.0', status: 'online' });
};

exports.getDbStatus = async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.query("SELECT 1");
    connection.release();
    return res.json({ status: 'ok', database: 'connected' });
  } catch (error) {
    console.error('[Healthcheck] Database connection failed:', error.message);
    return res.status(500).json({
      status: 'error',
      database: 'disconnected',
      message: error.message
    });
  }
};
