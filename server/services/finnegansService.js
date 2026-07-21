const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CACHE_DIR = path.join(__dirname, '..', 'cache');
const PRODUCTOS_CACHE_FILE = path.join(CACHE_DIR, 'productos.json');

class FinnegansService {
  constructor() {
    this.clientId = process.env.FINNEGANS_CLIENT_ID;
    this.clientSecret = process.env.FINNEGANS_CLIENT_SECRET;
    this.tokenUrl = process.env.FINNEGANS_TOKEN_URL || 'https://api.teamplace.finneg.com/api/oauth/token';
    this.apiBase = process.env.FINNEGANS_API_BASE || 'https://api.finneg.com/api';
    this.empresaCod = process.env.FINNEGANS_EMPRESA_COD || 'EMPRE01';
    this.timeout = (parseInt(process.env.FINNEGANS_TIMEOUT) || 60) * 1000;
    this.clientesReport = process.env.FINNEGANS_CLIENTES_REPORT || 'USR_ClientesExportacionDY';
    this.productosReport = process.env.FINNEGANS_PRODUCTOS_REPORT || 'ListadoDeProductos';

    this._accessToken = null;
    this._tokenExpiry = null;

    // Asegurar que el directorio de caché exista
    if (!fs.existsSync(CACHE_DIR)) {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
    }
  }

  async _getAccessToken() {
    // Si ya tenemos token válido, reutilizar
    if (this._accessToken && this._tokenExpiry && Date.now() < this._tokenExpiry - 60000) {
      return this._accessToken;
    }

    // Si las credenciales son mocks, retornamos mock token
    if (!this.clientId || this.clientId.includes('mock')) {
      console.log('[Finnegans Service] Usando Mock Token para desarrollo.');
      this._accessToken = 'mock_access_token_123456';
      this._tokenExpiry = Date.now() + 3600000;
      return this._accessToken;
    }

    const params = new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: this.clientId,
      client_secret: this.clientSecret
    });

    try {
      console.log(`[Finnegans] Solicitando nuevo Access Token a: ${this.tokenUrl}`);
      const response = await axios.get(`${this.tokenUrl}?${params.toString()}`, {
        timeout: this.timeout
      });
      this._accessToken = response.data.toString().trim();
      this._tokenExpiry = Date.now() + 3600000;
      return this._accessToken;
    } catch (err) {
      console.error('[Finnegans Auth Error]:', err.message);
      // Fallback a mock en desarrollo si falla
      return 'mock_fallback_token';
    }
  }

  async executeReport(reportName, params = {}) {
    const token = await this._getAccessToken();
    
    // Si estamos usando un mock completo
    if (token === 'mock_access_token_123456' || token === 'mock_fallback_token') {
      console.log(`[Finnegans Service] [MOCK] Ejecutando reporte mock para: ${reportName}`);
      return this._getMockData(reportName);
    }

    const url = `${this.apiBase}/reports/${reportName}`;
    const queryParams = {
      ACCESS_TOKEN: token,
      ...params
    };

    try {
      const response = await axios.get(url, {
        params: queryParams,
        timeout: this.timeout
      });
      return response.data;
    } catch (err) {
      console.error(`[Finnegans API Error] al ejecutar reporte ${reportName}:`, err.message);
      return this._getMockData(reportName);
    }
  }

  /**
   * Obtiene la lista de clientes de exportación activos.
   */
  async getClientesExportacion() {
    const params = {
      PARAMWEBREPORT_Empresa: this.empresaCod
    };
    try {
      const data = await this.executeReport(this.clientesReport, params);
      if (!Array.isArray(data)) return [];
      
      return data.map(c => ({
        codigo: c.CODIGO || c.CLIENTECOD || c.ORGANIZACIONCOD || '',
        nombre: c.NOMBRE || c.DESCRIPCION || c.ORGANIZACION || 'Cliente Exportación Sin Nombre',
        pais: c.PAIS || c.PAISNOM || 'Brasil'
      }));
    } catch (err) {
      console.error('[Finnegans] Error en getClientesExportacion:', err.message);
      return [];
    }
  }

  /**
   * Obtiene productos terminados de Finnegans con caché diaria en archivo JSON.
   * Solo retorna items donde RUBRO === 'PRODUCTOS TERMINADOS'.
   * La caché se renueva una vez al día en el primer request.
   */
  async getProductosTerminados() {
    // Intentar leer caché
    const cached = this._readProductosCache();
    if (cached) {
      console.log(`[Finnegans] Productos servidos desde caché (${cached.length} items)`);
      return cached;
    }

    // Caché expirada o inexistente: consultar API
    console.log('[Finnegans] Caché de productos expirada o inexistente. Consultando API...');
    const params = {
      PARAMWEBREPORT_FiltroActivo: 'true',
      PARAMWEBREPORT_Empresa: this.empresaCod
    };

    try {
      const data = await this.executeReport(this.productosReport, params);
      if (!Array.isArray(data)) {
        console.warn('[Finnegans] Respuesta de productos no es un array.');
        return this._getMockProductos();
      }

      // Filtrar solo PRODUCTOS TERMINADOS
      const filtered = data
        .filter(item => item.RUBRO === 'PRODUCTOS TERMINADOS')
        .map(item => ({
          id: item.PRODUCTOID,
          codigo: item.CODIGO || '',
          nombre: item.PRODUCTONOMBRE || '',
          marca: item.MARCA || '',
          familia: item.FAMILIA || '',
          subfamilia: item.SUBFAMILIA || ''
        }));

      // Guardar en caché
      this._writeProductosCache(filtered);
      console.log(`[Finnegans] ${filtered.length} productos terminados cacheados.`);
      return filtered;
    } catch (err) {
      console.error('[Finnegans] Error obteniendo productos:', err.message);
      return this._getMockProductos();
    }
  }

  /**
   * Lee la caché de productos. Retorna null si no existe o si es de un día anterior.
   */
  _readProductosCache() {
    try {
      if (!fs.existsSync(PRODUCTOS_CACHE_FILE)) return null;
      const raw = fs.readFileSync(PRODUCTOS_CACHE_FILE, 'utf-8');
      const cache = JSON.parse(raw);
      const today = new Date().toISOString().split('T')[0];
      if (cache.lastUpdated === today && Array.isArray(cache.data)) {
        return cache.data;
      }
      return null; // Caché de otro día
    } catch {
      return null;
    }
  }

  /**
   * Escribe la caché de productos con la fecha de hoy.
   */
  _writeProductosCache(data) {
    try {
      const cache = {
        lastUpdated: new Date().toISOString().split('T')[0],
        count: data.length,
        data
      };
      fs.writeFileSync(PRODUCTOS_CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
    } catch (err) {
      console.error('[Finnegans] Error escribiendo caché de productos:', err.message);
    }
  }

  _getMockData(reportName) {
    if (reportName === this.clientesReport) {
      return [
        { CODIGO: 'CLI-001', NOMBRE: 'Supermercados Pao de Açucar', PAIS: 'Brasil' },
        { CODIGO: 'CLI-002', NOMBRE: 'Zaffari Distribuidora Ltda', PAIS: 'Brasil' },
        { CODIGO: 'CLI-003', NOMBRE: 'Chedraui México', PAIS: 'México' },
        { CODIGO: 'CLI-004', NOMBRE: 'Tottus Chile S.A.', PAIS: 'Chile' },
        { CODIGO: 'CLI-005', NOMBRE: 'Arco Iris Distribuciones', PAIS: 'Paraguay' },
        { CODIGO: 'CLI-006', NOMBRE: 'Tienda Inglesa S.A.', PAIS: 'Uruguay' }
      ];
    }
    if (reportName === this.productosReport) {
      return this._getMockProductosRaw();
    }
    return [];
  }

  _getMockProductosRaw() {
    return [
      { PRODUCTOID: 6702, CODIGO: '20351', PRODUCTONOMBRE: 'PAN DE SALVADO x400g. CALIDAD ES PRIMER PRECIO', MARCA: 'BLANCA', FAMILIA: 'PANIFICADOS', SUBFAMILIA: 'PAN DE MOLDE', RUBRO: 'PRODUCTOS TERMINADOS' },
      { PRODUCTOID: 1001, CODIGO: '10100', PRODUCTONOMBRE: 'TAPAS PARA EMPANADAS DON YEYO x12u 330g', MARCA: 'DON YEYO', FAMILIA: 'TAPAS', SUBFAMILIA: 'EMPANADAS', RUBRO: 'PRODUCTOS TERMINADOS' },
      { PRODUCTOID: 1002, CODIGO: '10101', PRODUCTONOMBRE: 'TAPAS PARA EMPANADAS DON YEYO x24u 660g', MARCA: 'DON YEYO', FAMILIA: 'TAPAS', SUBFAMILIA: 'EMPANADAS', RUBRO: 'PRODUCTOS TERMINADOS' },
      { PRODUCTOID: 1003, CODIGO: '10200', PRODUCTONOMBRE: 'TAPAS PARA PASCUALINA DON YEYO x2u 400g', MARCA: 'DON YEYO', FAMILIA: 'TAPAS', SUBFAMILIA: 'PASCUALINA', RUBRO: 'PRODUCTOS TERMINADOS' },
      { PRODUCTOID: 1004, CODIGO: '10300', PRODUCTONOMBRE: 'TAPAS PARA EMPANADAS DeVIANO x12u 330g', MARCA: 'DEVIANO', FAMILIA: 'TAPAS', SUBFAMILIA: 'EMPANADAS', RUBRO: 'PRODUCTOS TERMINADOS' },
      { PRODUCTOID: 1005, CODIGO: '10400', PRODUCTONOMBRE: 'RAVIOLES DON YEYO RICOTTA x500g', MARCA: 'DON YEYO', FAMILIA: 'PASTAS', SUBFAMILIA: 'RAVIOLES', RUBRO: 'PRODUCTOS TERMINADOS' },
      { PRODUCTOID: 1006, CODIGO: '10401', PRODUCTONOMBRE: 'RAVIOLES DON YEYO CARNE x500g', MARCA: 'DON YEYO', FAMILIA: 'PASTAS', SUBFAMILIA: 'RAVIOLES', RUBRO: 'PRODUCTOS TERMINADOS' },
      { PRODUCTOID: 1007, CODIGO: '10500', PRODUCTONOMBRE: 'TORTILLAS DE TRIGO DON YEYO x8u 320g', MARCA: 'DON YEYO', FAMILIA: 'TORTILLAS', SUBFAMILIA: 'TORTILLAS', RUBRO: 'PRODUCTOS TERMINADOS' },
      { PRODUCTOID: 1008, CODIGO: '10600', PRODUCTONOMBRE: 'PREPIZZA DON YEYO x2u 460g', MARCA: 'DON YEYO', FAMILIA: 'PANIFICADOS', SUBFAMILIA: 'PREPIZZA', RUBRO: 'PRODUCTOS TERMINADOS' },
      { PRODUCTOID: 9999, CODIGO: '90000', PRODUCTONOMBRE: 'MATERIA PRIMA HARINA 000', MARCA: '', FAMILIA: 'INSUMOS', SUBFAMILIA: 'HARINA', RUBRO: 'MATERIA PRIMA' }
    ];
  }

  _getMockProductos() {
    const raw = this._getMockProductosRaw();
    return raw
      .filter(item => item.RUBRO === 'PRODUCTOS TERMINADOS')
      .map(item => ({
        id: item.PRODUCTOID,
        codigo: item.CODIGO,
        nombre: item.PRODUCTONOMBRE,
        marca: item.MARCA,
        familia: item.FAMILIA,
        subfamilia: item.SUBFAMILIA
      }));
  }
}

module.exports = new FinnegansService();
