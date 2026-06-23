// Middleware de Autenticacion Microsoft Azure AD

const allowedDomain = process.env.ALLOWED_EMAIL_DOMAIN || 'donyeyo.com.ar';

module.exports = (req, res, next) => {
  // Para desarrollo local con Mocks
  if (process.env.NODE_ENV === 'development') {
    req.user = {
      email: 'gabrielt@donyeyo.com.ar',
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
    // Decodificar payload
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(Buffer.from(base64, 'base64').toString());

    const email = (payload.preferred_username || payload.email || payload.upn || '').trim().toLowerCase();
    
    // Validar el dominio permitido corporativo
    if (allowedDomain && !email.endsWith(`@${allowedDomain}`)) {
      return res.status(403).json({ error: 'Acceso denegado. Debe usar una cuenta corporativa de Don Yeyo.' });
    }

    // Validar emails autorizados al estilo dy_shigma
    const authorizedEmailsStr = process.env.AUTHORIZED_EMAILS || '';
    const authorizedEmails = authorizedEmailsStr
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);

    if (authorizedEmails.length > 0 && !authorizedEmails.includes(email)) {
      return res.status(403).json({ error: `Acceso denegado. El correo ${email} no está en la lista de accesos autorizados.` });
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
