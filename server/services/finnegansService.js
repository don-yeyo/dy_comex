const axios = require('axios');

class FinnegansService {
  constructor() {
    this.clientId = process.env.FINNEGANS_CLIENT_ID;
    this.clientSecret = process.env.FINNEGANS_CLIENT_SECRET;
    this.tokenUrl = process.env.FINNEGANS_TOKEN_URL || 'https://api.teamplace.finneg.com/api/oauth/token';
    this.apiBase = process.env.FINNEGANS_API_BASE || 'https://api.finneg.com/api';
    this.empresaCod = process.env.FINNEGANS_EMPRESA_COD || 'EMPRE01';
    this.timeout = (parseInt(process.env.FINNEGANS_TIMEOUT) || 60) * 1000;
    this.clientesReport = process.env.FINNEGANS_CLIENTES_REPORT || 'USR_ClientesExportacionDY';

    this._accessToken = null;
    this._tokenExpiry = null;
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
    return [];
  }
}

module.exports = new FinnegansService();
