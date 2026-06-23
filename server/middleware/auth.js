// Middleware de Autenticacion Microsoft Azure AD

const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || 'donyeyo.com.ar';

module.exports = (req, res, next) => {
  // Para desarrollo local con Mocks
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      email: 'comercio.exterior@donyeyo.com.ar',
      name: 'Gabriel Comex (Mock)',
      rol: 'admin'
    };
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado. Token inexistente.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Nota: En producción verificaríamos la firma y el tenant id del JWT emitido por Microsoft Azure AD.
    // Para entornos dinámicos y simulación del modelo del cliente, decodificamos el payload.
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());

    const email = payload.preferred_username || payload.email || payload.upn || '';
    
    // Validar el dominio permitido corporativo
    if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
      return res.status(403).json({ error: 'Acceso denegado. Debe usar una cuenta corporativa de Don Yeyo.' });
    }

    req.user = {
      email,
      name: payload.name || 'Usuario Corporativo',
      rol: payload.roles && payload.roles.includes('Admin') ? 'admin' : 'editor'
    };

    next();
  } catch (err) {
    console.error('[Auth Middleware] JWT Error:', err.message);
    return res.status(401).json({ error: 'Token inválido o expirado.' });
  }
};
