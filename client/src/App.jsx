import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  LayoutDashboard, Users, Calendar, Briefcase, Package,
  Globe, FileText, TrendingUp, Calculator, DollarSign,
  CheckSquare, Menu, Sun, Moon, Plus, Trash2, RefreshCw, X, User, Edit,
  Bell, Search, Landmark, Handshake, BriefcaseBusiness, Store, Video,
  Receipt, Ship, ClipboardList, Leaf, Scroll, FileSignature, File,
  Mail, Phone, MessageCircle, Camera, ArrowRight, Activity, Target,
  BarChart3, Tag, Clock, MapPin, Building2, ChevronRight, AlertTriangle,
  Filter, PieChart, Boxes, Send, Paperclip, ChevronLeft, Calendar as CalendarIcon,
  CheckCircle2, Clock3, AlertCircle, ShoppingBag, FileSpreadsheet, LogOut
} from 'lucide-react';
import logo from './assets/logo-don-yeyo-png-sin-fondo.png';
import { ToastContainer, useToast } from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import RichTextEditor from './components/RichTextEditor';
import ProductAutocomplete from './components/ProductAutocomplete';
import ProImageUploader from './components/ProImageUploader';
import LoginScreen from './components/LoginScreen';
import DbConnectionGuard from './components/DbConnectionGuard';
import { useAuth } from './config/AuthContext';
import './App.css';

// Config from env
const APP_CONFIG = {
  companyName: import.meta.env.VITE_COMPANY_NAME || 'DON YEYO S.A.',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.1.0',
  appName: import.meta.env.VITE_APP_NAME || 'ComEx CRM',
  defaultUserName: import.meta.env.VITE_DEFAULT_USER_NAME || 'Usuario',
  defaultUserEmail: import.meta.env.VITE_DEFAULT_USER_EMAIL || 'usuario@empresa.com'
};

// Configurar base URL e Interceptor de Axios
axios.defaults.baseURL = '/api';

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const errorMsg = error.response?.data?.error || error.message || '';
    const configUrl = error.config?.url || '';
    if (!configUrl.includes('/system/db-status')) {
      window.dispatchEvent(new CustomEvent('api-request-failed', {
        detail: { status, message: errorMsg }
      }));
    }
    return Promise.reject(error);
  }
);

// ========== VALIDATION RULES ==========
const VALIDATION_RULES = {
  contacto: {
    nombre: { required: true, maxLength: 100, label: 'Nombre' },
    apellido: { maxLength: 100, label: 'Apellido' },
    empresa: { maxLength: 150, label: 'Empresa' },
    email: { maxLength: 150, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, patternMsg: 'Email no válido', label: 'Email' },
    telefono: { maxLength: 50, label: 'Teléfono' },
    ciudad: { maxLength: 100, label: 'Ciudad' }
  },
  visita: {
    titulo: { required: true, maxLength: 200, label: 'Título' },
    lugar: { maxLength: 150, label: 'Lugar' },
    contactos: { maxLength: 300, label: 'Contactos' },
    ronda_reuniones: { min: 0, label: 'Nro. de reuniones' },
    ronda_importadores: { min: 0, label: 'Contactos calificados' }
  },
  oportunidad: {
    nombre: { required: true, maxLength: 200, label: 'Nombre' },
    monto: { min: 0, label: 'Inversión necesaria' }
  },
  operacion: {
    numero_pedido: { required: true, maxLength: 50, label: 'Número de pedido' },
    unidades: { min: 0, label: 'Unidades' },
    valor_usd: { min: 0, label: 'Valor en USD' },
    kilogramos: { min: 0, label: 'Kilogramos' }
  },
  tarea: {
    titulo: { required: true, maxLength: 200, label: 'Descripción' }
  },
  cobranza: {
    descripcion: { required: true, maxLength: 250, label: 'Operación' },
    monto: { min: 0, label: 'Monto' }
  },
  muestra: {
    producto: { required: true, maxLength: 65000, label: 'Producto' },
    destinatario: { maxLength: 150, label: 'Destinatario' }
  },
  comunicacion: {
    asunto: { required: true, maxLength: 200, label: 'Asunto' }
  },
  pais: {
    nombre: { required: true, maxLength: 100, label: 'País' },
    bandera: { maxLength: 4, label: 'Bandera' },
    moneda: { maxLength: 10, label: 'Moneda' }
  },
  precio: {
    competidor: { required: true, maxLength: 150, label: 'Competidor' },
    producto: { maxLength: 200, label: 'Producto' }
  },
  tendencia: {
    titulo: { required: true, maxLength: 200, label: 'Título' }
  }
};

function validateForm(modalType, values) {
  const rules = VALIDATION_RULES[modalType];
  if (!rules) return [];
  const errors = [];
  for (const [field, rule] of Object.entries(rules)) {
    const val = values[field];
    if (rule.required && (!val || String(val).trim() === '')) {
      errors.push(`${rule.label} es obligatorio.`);
    }
    if (val && rule.maxLength && String(val).length > rule.maxLength) {
      errors.push(`${rule.label} no puede superar ${rule.maxLength} caracteres.`);
    }
    if (val && rule.pattern && !rule.pattern.test(val)) {
      errors.push(rule.patternMsg || `${rule.label} tiene un formato inválido.`);
    }
    if (val !== undefined && val !== '' && rule.min !== undefined && Number(val) < rule.min) {
      errors.push(`${rule.label} debe ser al menos ${rule.min}.`);
    }
    if (val !== undefined && val !== '' && rule.max !== undefined && Number(val) > rule.max) {
      errors.push(`${rule.label} no puede superar ${rule.max}.`);
    }
  }
  return errors;
}

// Helpers de fecha
const parseDateStr = (d) => {
  if (!d) return null;
  const s = String(d).trim().substring(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const dt = new Date(s + 'T12:00:00');
  return isNaN(dt.getTime()) ? null : dt;
};

const fmtDate = (d) => {
  const dt = parseDateStr(d);
  if (!dt) return '—';
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtTime = (t) => {
  if (!t) return '';
  const s = String(t).trim().substring(0, 5);
  return s ? `${s} hs` : '';
};

const daysFrom = (d) => {
  const dt = parseDateStr(d);
  if (!dt) return 9999;
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  return Math.round((dt - today) / (1000 * 60 * 60 * 24));
};

function MuestraProductosManager({ value, onChange, productosFinnegans = [] }) {
  const [items, setItems] = useState([]);
  const [inputProd, setInputProd] = useState('');
  const [inputQty, setInputQty] = useState('');
  const [inputLote, setInputLote] = useState('');

  useEffect(() => {
    if (!value) {
      setItems([]);
      return;
    }
    if (Array.isArray(value)) {
      setItems(value);
      return;
    }
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        setItems(parsed);
        return;
      }
    } catch (e) { }
    setItems([{ producto: String(value), cantidad: '1 u.', lote: '' }]);
  }, [value]);

  const updateParent = (newItems) => {
    setItems(newItems);
    if (newItems.length === 0) {
      onChange('');
    } else {
      onChange(JSON.stringify(newItems));
    }
  };

  const handleSelectProduct = (val) => {
    const match = productosFinnegans.find(p =>
      (p.codigo && String(p.codigo).toLowerCase() === String(val).toLowerCase()) ||
      (p.nombre && String(p.nombre).toLowerCase() === String(val).toLowerCase()) ||
      (p.descripcion && String(p.descripcion).toLowerCase() === String(val).toLowerCase()) ||
      (p.codigo && val.startsWith(String(p.codigo)))
    );
    if (match) {
      const codStr = match.codigo ? `${match.codigo} — ` : '';
      const nameStr = match.nombre || match.descripcion || val;
      setInputProd(`${codStr}${nameStr}`);
    } else {
      setInputProd(val);
    }
  };

  const handleAdd = () => {
    if (!inputProd.trim()) return;
    const newItem = {
      producto: inputProd.trim(),
      cantidad: inputQty.trim() || '1 u.',
      lote: inputLote.trim()
    };
    const next = [...items, newItem];
    updateParent(next);
    setInputProd('');
    setInputQty('');
    setInputLote('');
  };

  const handleRemove = (index) => {
    const next = items.filter((_, i) => i !== index);
    updateParent(next);
  };

  return (
    <div style={{ background: 'var(--surface-hover)', padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', marginBottom: '14px' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: items.length > 0 ? 12 : 6 }}>
        {items.length === 0 ? (
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>Sin productos agregados. Añada al menos un producto a la muestra.</div>
        ) : (
          items.map((it, idx) => (
            <div key={idx} style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '10px 14px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>📦 {it.producto}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 2, display: 'flex', gap: 12 }}>
                  <span>· {it.cantidad || '1 u.'}</span>
                  {it.lote && <span>· Lote: {it.lote}</span>}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemove(idx)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dy-red)', padding: 6, display: 'flex', alignItems: 'center' }}
                title="Quitar producto"
              >
                <X size={16} />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="form-group" style={{ marginBottom: 10 }}>
        <label className="form-label" style={{ fontSize: '0.75rem' }}>Buscar o escribir Producto *</label>
        <input
          type="text"
          className="form-input"
          list="finnegans-prod-list"
          value={inputProd}
          onChange={e => handleSelectProduct(e.target.value)}
          placeholder="Ej: 10400 — RAVIOLES DON YEYO RICOTTA x500g"
          style={{ width: '100%' }}
        />
        <datalist id="finnegans-prod-list">
          {productosFinnegans.map((p, idx) => {
            const label = p.codigo ? `${p.codigo} — ${p.nombre || p.descripcion}` : (p.nombre || p.descripcion || p);
            return <option key={idx} value={label} />;
          })}
        </datalist>
      </div>

      <div className="form-grid-2" style={{ alignItems: 'flex-end', marginBottom: 10 }}>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Cantidad / Presentación</label>
          <input
            type="text"
            className="form-input"
            value={inputQty}
            onChange={e => setInputQty(e.target.value)}
            placeholder="Ej: 5 unidades, 3 cajas"
          />
        </div>
        <div className="form-group" style={{ marginBottom: 0 }}>
          <label className="form-label" style={{ fontSize: '0.75rem' }}>Lote (opcional)</label>
          <input
            type="text"
            className="form-input"
            placeholder="Ej: 5656"
            value={inputLote}
            onChange={e => setInputLote(e.target.value)}
          />
        </div>
      </div>

      <button
        type="button"
        className="btn btn-secondary btn-sm"
        onClick={handleAdd}
        style={{ width: '100%' }}
      >
        <Plus size={14} /> Agregar producto a la muestra
      </button>
    </div>
  );
}

export default function App() {
  const toast = useToast();
  const { account, isAuthenticated, logout } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('dy_theme') || 'light');

  // Estado de Ordenamiento por Columnas en Grillas (recordado por pantalla en localStorage)
  const [sortsByTab, setSortsByTab] = useState(() => {
    try {
      const saved = localStorage.getItem('dy_sorts_by_tab');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  });

  // Estado de Navegación por Pestañas y Hash URL para Favoritos
  const [activeTab, setActiveTab] = useState(() => {
    const hash = window.location.hash.replace('#', '');
    const validTabs = ['dashboard', 'tareas', 'agenda', 'contactos', 'visitas', 'oportunidades', 'operaciones', 'muestras', 'paises', 'inteligencia', 'cobranzas', 'calculadora', 'alertas'];
    return validTabs.includes(hash) ? hash : 'dashboard';
  });

  const activeSort = sortsByTab[activeTab] || { field: null, dir: 'asc' };
  const sortField = activeSort.field;
  const sortDirection = activeSort.dir;

  const handleSort = (field) => {
    setSortsByTab(prev => {
      const current = prev[activeTab] || { field: null, dir: 'asc' };
      const nextDir = current.field === field && current.dir === 'asc' ? 'desc' : 'asc';
      const updated = { ...prev, [activeTab]: { field, dir: nextDir } };
      localStorage.setItem('dy_sorts_by_tab', JSON.stringify(updated));
      return updated;
    });
  };

  const sortData = useCallback((data, field, direction) => {
    if (!field || !data || data.length === 0) return data;
    return [...data].sort((a, b) => {
      let valA = a[field];
      let valB = b[field];
      if (valA === null || valA === undefined) valA = '';
      if (valB === null || valB === undefined) valB = '';

      if (typeof valA === 'number' && typeof valB === 'number') {
        return direction === 'asc' ? valA - valB : valB - valA;
      }
      const strA = String(valA).toLowerCase();
      const strB = String(valB).toLowerCase();
      if (strA < strB) return direction === 'asc' ? -1 : 1;
      if (strA > strB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, []);

  const renderSortTh = (field, label, titleTooltip) => (
    <th
      onClick={() => handleSort(field)}
      style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
      title={titleTooltip || `Clic para ordenar por ${label}`}
    >
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
        <span>{label}</span>
        {sortField === field ? (
          <span style={{ fontSize: '0.7rem', color: 'var(--dy-blue)', fontWeight: 800 }}>
            {sortDirection === 'asc' ? '▲' : '▼'}
          </span>
        ) : (
          <span style={{ fontSize: '0.65rem', opacity: 0.3 }}>⇅</span>
        )}
      </div>
    </th>
  );

  const [subTab, setSubTab] = useState('muestras');
  const [intelTab, setIntelTab] = useState('precios');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const parseImageUrls = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') return [parsed];
    } catch (e) { }
    return [String(val)];
  };

  const switchTab = useCallback((tab) => {
    setActiveTab(tab);
    window.location.hash = '#' + tab;
    setSidebarOpen(false);
  }, []);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validTabs = ['dashboard', 'tareas', 'agenda', 'contactos', 'visitas', 'oportunidades', 'operaciones', 'muestras', 'paises', 'inteligencia', 'cobranzas', 'calculadora', 'alertas'];
      if (hash && validTabs.includes(hash)) {
        setActiveTab(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // Filtros de búsqueda global e inteligencia
  const [globalSearch, setGlobalSearch] = useState('');
  const [intelFilterPais, setIntelFilterPais] = useState(() => localStorage.getItem('dy_filter_intel_pais') || '');
  const [intelFilterMarca, setIntelFilterMarca] = useState(() => localStorage.getItem('dy_filter_intel_marca') || '');

  // Estados de datos
  const [contactos, setContactos] = useState([]);
  const [visitas, setVisitas] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [cobranzas, setCobranzas] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [muestras, setMuestras] = useState([]);
  const [comunicaciones, setComunicaciones] = useState([]);
  const [operaciones, setOperaciones] = useState([]);
  const [paises, setPaises] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [tendencias, setTendencias] = useState([]);
  const [calculos, setCalculos] = useState([]);
  const [productosFinnegans, setProductosFinnegans] = useState([]);
  const [loading, setLoading] = useState(true);

  // Estados de filtros por sección (persistencia en localStorage)
  const [tareaFilterStatus, setTareaFilterStatus] = useState(() => localStorage.getItem('dy_filter_tarea_status') || '');
  const [tareaFilterPrio, setTareaFilterPrio] = useState(() => localStorage.getItem('dy_filter_tarea_prio') || '');
  const [contactoFilterEstado, setContactoFilterEstado] = useState(() => localStorage.getItem('dy_filter_contacto_estado') || '');
  const [visitaFilterTipo, setVisitaFilterTipo] = useState(() => localStorage.getItem('dy_filter_visita_tipo') || '');
  const [oportunidadFilterEtapa, setOportunidadFilterEtapa] = useState(() => localStorage.getItem('dy_filter_oportunidad_etapa') || '');
  const [cobranzaFilterEstado, setCobranzaFilterEstado] = useState(() => localStorage.getItem('dy_filter_cobranza_estado') || '');
  const [muestraFilterRes, setMuestraFilterRes] = useState(() => localStorage.getItem('dy_filter_muestra_res') || '');
  const [comFilterTipo, setComFilterTipo] = useState(() => localStorage.getItem('dy_filter_com_tipo') || '');
  const [operacionFilterEstado, setOperacionFilterEstado] = useState(() => localStorage.getItem('dy_filter_operacion_estado') || '');

  // Guardar cambios de filtros en localStorage
  useEffect(() => { localStorage.setItem('dy_filter_tarea_status', tareaFilterStatus); }, [tareaFilterStatus]);
  useEffect(() => { localStorage.setItem('dy_filter_tarea_prio', tareaFilterPrio); }, [tareaFilterPrio]);
  useEffect(() => { localStorage.setItem('dy_filter_contacto_estado', contactoFilterEstado); }, [contactoFilterEstado]);
  useEffect(() => { localStorage.setItem('dy_filter_visita_tipo', visitaFilterTipo); }, [visitaFilterTipo]);
  useEffect(() => { localStorage.setItem('dy_filter_oportunidad_etapa', oportunidadFilterEtapa); }, [oportunidadFilterEtapa]);
  useEffect(() => { localStorage.setItem('dy_filter_cobranza_estado', cobranzaFilterEstado); }, [cobranzaFilterEstado]);
  useEffect(() => { localStorage.setItem('dy_filter_muestra_res', muestraFilterRes); }, [muestraFilterRes]);
  useEffect(() => { localStorage.setItem('dy_filter_com_tipo', comFilterTipo); }, [comFilterTipo]);
  useEffect(() => { localStorage.setItem('dy_filter_operacion_estado', operacionFilterEstado); }, [operacionFilterEstado]);
  useEffect(() => { localStorage.setItem('dy_filter_intel_pais', intelFilterPais); }, [intelFilterPais]);
  useEffect(() => { localStorage.setItem('dy_filter_intel_marca', intelFilterMarca); }, [intelFilterMarca]);

  // Estado del modal de confirmación de eliminación
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Estado del modal universal
  const [showModal, setShowModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formValues, setFormValues] = useState({});

  // Lightbox de imágenes (declarado arriba)

  // Muestras: array de productos seleccionados
  const [muestraProductos, setMuestraProductos] = useState([]);
  const [muestraProductoInput, setMuestraProductoInput] = useState('');
  const [muestraCantInput, setMuestraCantInput] = useState('');
  const [muestraLoteInput, setMuestraLoteInput] = useState('');

  // Calendario Centralizado
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState('grid'); // 'grid' | 'timeline'
  const [selectedCalDay, setSelectedCalDay] = useState(null);

  // Estado de la Calculadora de Costos Landed
  const [calcForm, setCalcForm] = useState({
    producto: '',
    pais_id: '',
    incoterm: 'FOB',
    fob: '',
    qty: '1',
    flete: '',
    seguro: '',
    arancel: '',
    otros: ''
  });

  const calcFob = parseFloat(calcForm.fob) || 0;
  const calcQty = parseFloat(calcForm.qty) || 1;
  const calcFlete = parseFloat(calcForm.flete) || 0;
  const calcSeguro = parseFloat(calcForm.seguro) || 0;
  const calcArancelPct = parseFloat(calcForm.arancel) || 0;
  const calcOtros = parseFloat(calcForm.otros) || 0;

  const totalFOB = calcFob * calcQty;
  const cifValue = totalFOB + calcFlete + calcSeguro;
  const arancelUSD = cifValue * (calcArancelPct / 100);
  const landedTotal = cifValue + arancelUSD + calcOtros;
  const landedUnitario = calcQty > 0 ? landedTotal / calcQty : 0;

  const handleSaveCalc = async (e) => {
    if (e) e.preventDefault();
    if (!calcForm.fob || parseFloat(calcForm.fob) <= 0) {
      toast.error('Ingresá un precio FOB válido mayor a 0');
      return;
    }
    try {
      await axios.post('/calculos', {
        producto: calcForm.producto.trim() || 'Cálculo de exportación',
        pais_id: calcForm.pais_id || null,
        fob: calcFob,
        qty: calcQty,
        flete: calcFlete,
        seguro: calcSeguro,
        arancel: calcArancelPct,
        otros: calcOtros,
        landed: landedTotal,
        fecha: new Date().toISOString().substring(0, 10)
      });
      toast.success('Cálculo de exportación guardado ✓');
      loadData();
    } catch (err) {
      console.error('Error al guardar cálculo:', err);
      toast.error('Error al guardar el cálculo');
    }
  };

  const handleLoadCalc = (c) => {
    setCalcForm({
      producto: c.producto || '',
      pais_id: c.pais_id || '',
      incoterm: 'FOB',
      fob: c.fob || '',
      qty: c.qty || '1',
      flete: c.flete || '',
      seguro: c.seguro || '',
      arancel: c.arancel || '',
      otros: c.otros || ''
    });
    toast.info('Cálculo cargado en la calculadora');
  };

  const handleResetCalc = () => {
    setCalcForm({
      producto: '',
      pais_id: '',
      incoterm: 'FOB',
      fob: '',
      qty: '1',
      flete: '',
      seguro: '',
      arancel: '',
      otros: ''
    });
  };

  // Notificaciones y Alertas activas en tiempo real (Campanita)
  const activeAlerts = useMemo(() => {
    const list = [];
    tareas.filter(t => t.status !== 'hecha' && daysFrom(t.fecha) <= 0).forEach(t => {
      list.push({
        id: `t-${t.id}`,
        tab: 'tareas',
        title: `Tarea: ${t.titulo}`,
        subtitle: `Fecha: ${fmtDate(t.fecha)} ${t.hora ? fmtTime(t.hora) : ''}`,
        severity: daysFrom(t.fecha) < 0 ? 'red' : 'amber'
      });
    });
    cobranzas.filter(c => c.estado !== 'Cobrado' && daysFrom(c.vencimiento) <= 3).forEach(c => {
      list.push({
        id: `c-${c.id}`,
        tab: 'cobranzas',
        title: `Cobranza (${c.estado}): ${c.descripcion}`,
        subtitle: `Vence: ${fmtDate(c.vencimiento)} • $${parseFloat(c.monto || 0).toLocaleString()} USD`,
        severity: daysFrom(c.vencimiento) < 0 ? 'red' : 'amber'
      });
    });
    muestras.filter(m => m.resultado === 'Pendiente').forEach(m => {
      list.push({
        id: `m-${m.id}`,
        tab: 'muestras',
        title: `Muestra en evaluación: ${m.destinatario || 'Cliente'}`,
        subtitle: `Enviada: ${fmtDate(m.fecha)}`,
        severity: 'blue'
      });
    });
    operaciones.filter(op => op.estado !== 'Despachado' && daysFrom(op.fecha_entrega) <= 5).forEach(op => {
      list.push({
        id: `op-${op.id}`,
        tab: 'operaciones',
        title: `Pedido ${op.numero_pedido} próximo a entrega`,
        subtitle: `Entrega: ${fmtDate(op.fecha_entrega)} • ${op.estado}`,
        severity: 'amber'
      });
    });
    return list;
  }, [tareas, cobranzas, muestras, operaciones]);

  // Estado para controlar si las alertas ya fueron visualizadas por el usuario
  const [alertsSeen, setAlertsSeen] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(0);

  useEffect(() => {
    if (activeTab === 'alertas' || notificationsOpen) {
      setAlertsSeen(true);
      setLastSeenCount(activeAlerts.length);
    }
  }, [activeTab, notificationsOpen, activeAlerts.length]);

  const hasUnreadAlerts = useMemo(() => {
    if (activeAlerts.length === 0) return false;
    if (activeTab === 'alertas' || notificationsOpen) return false;
    return !alertsSeen || activeAlerts.length > lastSeenCount;
  }, [activeAlerts.length, activeTab, notificationsOpen, alertsSeen, lastSeenCount]);

  // Métricas de Resumen de Cobranzas
  const cobradoAnoTotal = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return cobranzas.reduce((acc, c) => {
      const year = c.vencimiento ? new Date(c.vencimiento).getFullYear() : currentYear;
      if (year === currentYear) {
        return acc + (parseFloat(c.cobrado_monto) || (c.estado === 'Cobrado total' || c.estado === 'Cobrado' ? parseFloat(c.monto) || 0 : 0));
      }
      return acc;
    }, 0);
  }, [cobranzas]);

  const pendienteTotal = useMemo(() => {
    return cobranzas.reduce((acc, c) => {
      if (c.estado === 'Cobrado total' || c.estado === 'Cobrado') return acc;
      const total = parseFloat(c.monto) || 0;
      const cobrado = parseFloat(c.cobrado_monto) || 0;
      return acc + Math.max(0, total - cobrado);
    }, 0);
  }, [cobranzas]);

  const vencidoTotal = useMemo(() => {
    return cobranzas.reduce((acc, c) => {
      if (c.estado === 'Cobrado total' || c.estado === 'Cobrado') return acc;
      if (daysFrom(c.vencimiento) < 0 || c.estado === 'Vencido') {
        const total = parseFloat(c.monto) || 0;
        const cobrado = parseFloat(c.cobrado_monto) || 0;
        return acc + Math.max(0, total - cobrado);
      }
      return acc;
    }, 0);
  }, [cobranzas]);

  // Sincronización con Finnegans ERP
  const handleSyncFinnegans = async () => {
    try {
      toast.info('Sincronizando clientes con Finnegans ERP...');
      const res = await axios.post('/finnegans/sync-clientes');
      toast.success(res.data.message || 'Contactos sincronizados correctamente ✓');
      loadData();
    } catch (err) {
      console.error('Error al sincronizar Finnegans:', err);
      toast.error('Error de sincronización: ' + (err.response?.data?.error || err.message));
    }
  };

  // Catálogo ampliado de productos
  const productosCatalogo = useMemo(() => {
    if (productosFinnegans.length > 0) return productosFinnegans;
    return [
      { codigo: 'DY-TAP-01', nombre: 'Tapas de Empanadas Hoja Don Yeyo 330g' },
      { codigo: 'DY-TAP-02', nombre: 'Tapas de Empanadas Criollas Don Yeyo 330g' },
      { codigo: 'DY-PST-01', nombre: 'Tapas de Pascualina Hoja Don Yeyo 400g' },
      { codigo: 'DY-PAS-01', nombre: 'Fideos Tallarines Don Yeyo 500g' },
      { codigo: 'DY-TOR-01', nombre: 'Tortillas de Trigo Clásicas Don Yeyo 240g' },
      { codigo: 'DEV-TAP-01', nombre: 'Tapas de Empanadas DeViano Premium 350g' }
    ];
  }, [productosFinnegans]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('dy_theme', theme);
  }, [theme]);

  // Carga inicial de datos
  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const [
        resC, resV, resO, resCob, resT, resM, resCom, resOp, resP, resPr, resTen, resCalc, resProd
      ] = await Promise.all([
        axios.get('/contactos'),
        axios.get('/visitas'),
        axios.get('/oportunidades'),
        axios.get('/cobranzas'),
        axios.get('/tareas'),
        axios.get('/muestras'),
        axios.get('/comunicaciones'),
        axios.get('/operaciones'),
        axios.get('/paises'),
        axios.get('/precios'),
        axios.get('/tendencias'),
        axios.get('/calculos'),
        axios.get('/finnegans/productos').catch(() => ({ data: [] }))
      ]);

      setContactos(resC.data);
      setVisitas(resV.data);
      setOportunidades(resO.data);
      setCobranzas(resCob.data);
      setTareas(resT.data);
      setMuestras(resM.data);
      setComunicaciones(resCom.data);
      setOperaciones(resOp.data);
      setPaises(resP.data);
      setPrecios(resPr.data);
      setTendencias(resTen.data);
      setCalculos(resCalc.data);
      if (resProd.data && resProd.data.length > 0) {
        setProductosFinnegans(resProd.data);
      }
    } catch (err) {
      console.error('Error al cargar datos:', err);
      toast.error('Error de conexión con el servidor. Revisá la base de datos.');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Abre modal para nuevo elemento
  const openNew = (type, defaultData = {}) => {
    setEditingItem(null);
    const initialData = { ...defaultData };
    if (type === 'precio' && !initialData.fecha) {
      initialData.fecha = new Date().toISOString().substring(0, 10);
    }
    setFormValues(initialData);
    if (type === 'muestra') {
      setMuestraProductos([]);
      setMuestraProductoInput('');
      setMuestraCantInput('');
      setMuestraLoteInput('');
    }
    setShowModal(type);
  };

  // Abre modal para editar elemento existente
  const openEdit = (type, item) => {
    setEditingItem(item);
    setFormValues({ ...item });
    if (type === 'muestra') {
      try {
        const parsed = JSON.parse(item.producto);
        if (Array.isArray(parsed)) {
          setMuestraProductos(parsed.map(p => typeof p === 'string' ? { nombre: p } : p));
        } else {
          setMuestraProductos([{ nombre: String(item.producto) }]);
        }
      } catch {
        setMuestraProductos(item.producto ? [{ nombre: String(item.producto) }] : []);
      }
      setMuestraProductoInput('');
      setMuestraCantInput('');
      setMuestraLoteInput('');
    }
    setShowModal(type);
  };

  // Guardar formulario universal
  const handleSave = async (e, endpoint) => {
    e.preventDefault();
    const validationErrors = validateForm(showModal, formValues);
    if (validationErrors.length > 0) {
      toast.error(validationErrors[0]);
      return;
    }

    try {
      let dataToSend = { ...formValues };

      if (showModal === 'muestra') {
        if (muestraProductos.length === 0) {
          toast.error('Agregá al menos un producto a la muestra.');
          return;
        }
        dataToSend.producto = JSON.stringify(muestraProductos);
      }

      if (editingItem) {
        await axios.put(`/${endpoint}/${editingItem.id}`, dataToSend);
        toast.success('Registro actualizado correctamente');
      } else {
        await axios.post(`/${endpoint}`, dataToSend);
        toast.success('Registro creado correctamente');
      }
      setShowModal(null);
      loadData();
    } catch (err) {
      console.error('Error al guardar:', err);
      const serverMsg = err.response?.data?.error || err.message;
      toast.error(`Error al guardar: ${serverMsg}`);
    }
  };

  // Confirmar eliminación
  const requestDelete = (endpoint, id, name) => {
    setConfirmDelete({ endpoint, id, name });
  };

  const handleConfirmDelete = async () => {
    if (!confirmDelete) return;
    const { endpoint, id } = confirmDelete;
    try {
      await axios.delete(`/${endpoint}/${id}`);
      toast.success('Registro eliminado');
      loadData();
    } catch (err) {
      console.error('Error al eliminar:', err);
      toast.error('Error al eliminar el registro');
    } finally {
      setConfirmDelete(null);
    }
  };

  const setFv = (field, value) => setFormValues(prev => ({ ...prev, [field]: value }));

  const fv = (field) => formValues[field] !== undefined && formValues[field] !== null ? formValues[field] : '';

  const fvDate = (field) => {
    const val = formValues[field];
    if (!val) return '';
    return String(val).substring(0, 10);
  };

  const maxLen = (modalType, field) => VALIDATION_RULES[modalType]?.[field]?.maxLength;

  // Agregar producto a lista de muestras
  const addMuestraProducto = () => {
    if (!muestraProductoInput.trim()) return;
    const newProd = {
      nombre: muestraProductoInput.trim(),
      cantidad: muestraCantInput.trim() || null,
      lote: muestraLoteInput.trim() || null
    };
    setMuestraProductos(prev => [...prev, newProd]);
    setMuestraProductoInput('');
    setMuestraCantInput('');
    setMuestraLoteInput('');
  };

  const removeMuestraProducto = (index) => {
    setMuestraProductos(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle de tareas completadas
  const toggleTareaStatus = async (t) => {
    const nextStatus = t.status === 'hecha' ? 'pendiente' : 'hecha';
    try {
      await axios.put(`/tareas/${t.id}`, { status: nextStatus });
      loadData();
    } catch (err) {
      toast.error('Error al actualizar estado de tarea');
    }
  };

  // Badges y badges de estados
  const estadoBadge = (est) => {
    const map = {
      'Activo': 'badge-emerald', 'Realizada': 'badge-emerald', 'Positivo': 'badge-emerald',
      'Cobrado': 'badge-emerald', 'Vigente': 'badge-emerald', 'Despachado': 'badge-emerald',
      'Planificada': 'badge-sky', 'En proceso': 'badge-amber', 'En evaluación': 'badge-amber',
      'Cobrado parcial': 'badge-amber', 'Por vencer': 'badge-amber', 'En análisis': 'badge-sky',
      'Pedido recibido': 'badge-sky', 'Prospecto': 'badge-navy', 'Pendiente': 'badge-navy',
      'Inactivo': 'badge-gray', 'Cancelada': 'badge-red', 'Negativo': 'badge-red',
      'Vencido': 'badge-red', 'Descartado': 'badge-red', 'Finalizado': 'badge-emerald'
    };
    return <span className={`badge ${map[est] || 'badge-navy'}`}>{est}</span>;
  };

  const etapaBadge = (etapa) => {
    const map = {
      'En análisis': 'badge-sky',
      'En proceso': 'badge-amber',
      'Finalizado': 'badge-emerald',
      'Descartado': 'badge-red',
      'Primer contacto': 'badge-navy',
      'Reunión exploratoria': 'badge-sky',
      'Cotización': 'badge-amber',
      'Negociación': 'badge-purple',
      'Habilitación regulatoria': 'badge-teal'
    };
    return <span className={`badge ${map[etapa] || 'badge-navy'}`}>{etapa}</span>;
  };

  const prioridadBadge = (prio) => {
    const map = { 'alta': 'badge-red', 'media': 'badge-amber', 'baja': 'badge-gray' };
    return <span className={`badge ${map[prio] || 'badge-gray'}`}>{prio}</span>;
  };

  const comIcon = (tipo) => {
    switch (tipo) {
      case 'Email': return <Mail size={14} />;
      case 'Llamada': return <Phone size={14} />;
      case 'WhatsApp': return <MessageCircle size={14} />;
      case 'Reunión': return <User size={14} />;
      case 'Videollamada': return <Video size={14} />;
      default: return <Mail size={14} />;
    }
  };

  const docIcon = (tipo) => {
    switch (tipo) {
      case 'Invoice': return <Receipt size={16} />;
      case 'Bill of Lading': return <Ship size={16} />;
      case 'Packing List': return <ClipboardList size={16} />;
      case 'Certificado fitosanitario': return <Leaf size={16} />;
      case 'Certificado de origen': return <Scroll size={16} />;
      case 'Contrato': return <FileSignature size={16} />;
      default: return <File size={16} />;
    }
  };

  const priorityWeight = useMemo(() => ({ 'alta': 1, 'media': 2, 'baja': 3 }), []);
  const statusWeight = useMemo(() => ({ 'pendiente': 1, 'hecha': 2 }), []);

  // Listas filtradas y ordenadas por defecto (Estado, Prioridad, Fecha límite, Hora inicio)
  const filteredTareas = useMemo(() => {
    const list = tareas.filter(t => {
      const q = globalSearch.toLowerCase();
      const mQ = !q || (t.titulo?.toLowerCase().includes(q) || t.asignado?.toLowerCase().includes(q) || t.pais_nombre?.toLowerCase().includes(q));
      const mS = !tareaFilterStatus || t.status === tareaFilterStatus;
      const mP = !tareaFilterPrio || t.prioridad === tareaFilterPrio;
      return mQ && mS && mP;
    });

    return [...list].sort((a, b) => {
      // 1. Estado (pendiente < hecha)
      const sA = statusWeight[a.status?.toLowerCase()] || 3;
      const sB = statusWeight[b.status?.toLowerCase()] || 3;
      if (sA !== sB) return sA - sB;

      // 2. Prioridad (alta < media < baja)
      const pA = priorityWeight[a.prioridad?.toLowerCase()] || 4;
      const pB = priorityWeight[b.prioridad?.toLowerCase()] || 4;
      if (pA !== pB) return pA - pB;

      // 3. Fecha límite (ascendente)
      const fA = a.fecha || '9999-12-31';
      const fB = b.fecha || '9999-12-31';
      if (fA !== fB) return fA.localeCompare(fB);

      // 4. Hora inicio (ascendente)
      const hA = a.hora || '23:59';
      const hB = b.hora || '23:59';
      return hA.localeCompare(hB);
    });
  }, [tareas, globalSearch, tareaFilterStatus, tareaFilterPrio, priorityWeight, statusWeight]);

  const filteredContactos = useMemo(() => {
    return contactos.filter(c => {
      const q = globalSearch.toLowerCase();
      const mQ = !q || (c.nombre?.toLowerCase().includes(q) || c.apellido?.toLowerCase().includes(q) || c.empresa?.toLowerCase().includes(q) || c.ciudad?.toLowerCase().includes(q));
      const mE = !contactoFilterEstado || c.estado === contactoFilterEstado;
      return mQ && mE;
    });
  }, [contactos, globalSearch, contactoFilterEstado]);

  const filteredVisitas = useMemo(() => {
    return visitas.filter(v => {
      const q = globalSearch.toLowerCase();
      const mQ = !q || (v.titulo?.toLowerCase().includes(q) || v.lugar?.toLowerCase().includes(q) || v.contactos?.toLowerCase().includes(q));
      const mT = !visitaFilterTipo || v.tipo === visitaFilterTipo;
      return mQ && mT;
    });
  }, [visitas, globalSearch, visitaFilterTipo]);

  const filteredOportunidades = useMemo(() => {
    return oportunidades.filter(o => {
      const q = globalSearch.toLowerCase();
      const mQ = !q || (o.nombre?.toLowerCase().includes(q) || o.marca?.toLowerCase().includes(q) || o.categoria?.toLowerCase().includes(q) || o.responsable?.toLowerCase().includes(q));
      const mE = !oportunidadFilterEtapa || o.etapa === oportunidadFilterEtapa;
      return mQ && mE;
    });
  }, [oportunidades, globalSearch, oportunidadFilterEtapa]);

  const filteredOperaciones = useMemo(() => {
    return operaciones.filter(op => {
      const q = globalSearch.toLowerCase();
      const mQ = !q || (op.numero_pedido?.toLowerCase().includes(q) || op.cliente_nombre?.toLowerCase().includes(q) || op.cliente_empresa?.toLowerCase().includes(q) || op.pais_nombre?.toLowerCase().includes(q));
      const mE = !operacionFilterEstado || op.estado === operacionFilterEstado;
      return mQ && mE;
    });
  }, [operaciones, globalSearch, operacionFilterEstado]);

  const filteredCobranzas = useMemo(() => {
    return cobranzas.filter(c => {
      const q = globalSearch.toLowerCase();
      const mQ = !q || (c.descripcion?.toLowerCase().includes(q) || c.cliente_nombre?.toLowerCase().includes(q));
      const mE = !cobranzaFilterEstado || c.estado === cobranzaFilterEstado;
      return mQ && mE;
    });
  }, [cobranzas, globalSearch, cobranzaFilterEstado]);

  const filteredMuestras = useMemo(() => {
    return muestras.filter(m => {
      const q = globalSearch.toLowerCase();
      const mQ = !q || (m.destinatario?.toLowerCase().includes(q) || m.producto?.toLowerCase().includes(q));
      const mR = !muestraFilterRes || m.resultado === muestraFilterRes;
      return mQ && mR;
    });
  }, [muestras, globalSearch, muestraFilterRes]);

  const filteredComunicaciones = useMemo(() => {
    return comunicaciones.filter(c => {
      const q = globalSearch.toLowerCase();
      const mQ = !q || (c.asunto?.toLowerCase().includes(q) || c.contacto_nombre?.toLowerCase().includes(q));
      const mT = !comFilterTipo || c.tipo === comFilterTipo;
      return mQ && mT;
    });
  }, [comunicaciones, globalSearch, comFilterTipo]);

  const filteredPrecios = useMemo(() => {
    return precios.filter(p => {
      const mPais = !intelFilterPais || String(p.pais_id) === String(intelFilterPais);
      const mMarca = !intelFilterMarca || p.competidor?.toLowerCase().includes(intelFilterMarca.toLowerCase()) || p.producto?.toLowerCase().includes(intelFilterMarca.toLowerCase());
      return mPais && mMarca;
    });
  }, [precios, intelFilterPais, intelFilterMarca]);

  const filteredTendencias = useMemo(() => {
    return tendencias.filter(t => {
      const mPais = !intelFilterPais || String(t.pais_id) === String(intelFilterPais);
      const mMarca = !intelFilterMarca || t.titulo?.toLowerCase().includes(intelFilterMarca.toLowerCase()) || t.tags?.toLowerCase().includes(intelFilterMarca.toLowerCase());
      return mPais && mMarca;
    });
  }, [tendencias, intelFilterPais, intelFilterMarca]);

  // Listas ordenadas dinámicamente según la columna seleccionada
  const filteredTareasSorted = useMemo(() => sortData(filteredTareas, sortField, sortDirection), [filteredTareas, sortData, sortField, sortDirection]);
  const filteredContactosSorted = useMemo(() => sortData(filteredContactos, sortField, sortDirection), [filteredContactos, sortData, sortField, sortDirection]);
  const filteredVisitasSorted = useMemo(() => sortData(filteredVisitas, sortField, sortDirection), [filteredVisitas, sortData, sortField, sortDirection]);
  const filteredOportunidadesSorted = useMemo(() => sortData(filteredOportunidades, sortField, sortDirection), [filteredOportunidades, sortData, sortField, sortDirection]);
  const filteredOperacionesSorted = useMemo(() => sortData(filteredOperaciones, sortField, sortDirection), [filteredOperaciones, sortData, sortField, sortDirection]);
  const filteredCobranzasSorted = useMemo(() => sortData(filteredCobranzas, sortField, sortDirection), [filteredCobranzas, sortData, sortField, sortDirection]);
  const filteredMuestrasSorted = useMemo(() => sortData(filteredMuestras, sortField, sortDirection), [filteredMuestras, sortData, sortField, sortDirection]);
  const filteredComunicacionesSorted = useMemo(() => sortData(filteredComunicaciones, sortField, sortDirection), [filteredComunicaciones, sortData, sortField, sortDirection]);
  const filteredPreciosSorted = useMemo(() => sortData(filteredPrecios, sortField, sortDirection), [filteredPrecios, sortData, sortField, sortDirection]);
  const filteredTendenciasSorted = useMemo(() => sortData(filteredTendencias, sortField, sortDirection), [filteredTendencias, sortData, sortField, sortDirection]);

  // Consolidado de eventos para Agenda y Calendario
  const consolidatedEvents = useMemo(() => {
    const list = [];

    // Tareas
    tareas.forEach(t => {
      if (t.fecha) {
        list.push({
          id: `t-${t.id}`,
          date: t.fecha.substring(0, 10),
          time: t.hora ? t.hora.substring(0, 5) : '',
          title: t.titulo,
          subtitle: `Asignado: ${t.asignado || 'N/A'} · Prioridad ${t.prioridad}`,
          type: 'tarea',
          typeLabel: 'Tarea',
          badgeClass: 'event-tarea',
          raw: t
        });
      }
    });

    // Visitas
    visitas.forEach(v => {
      if (v.fecha) {
        list.push({
          id: `v-${v.id}`,
          date: v.fecha.substring(0, 10),
          time: v.hora ? v.hora.substring(0, 5) : '',
          title: v.titulo,
          subtitle: `Lugar: ${v.lugar || 'Sin especificar'} · ${v.tipo}`,
          type: 'visita',
          typeLabel: 'Visita / Reunión',
          badgeClass: 'event-visita',
          raw: v
        });
      }
    });

    // Contactos (Próxima acción)
    contactos.forEach(c => {
      if (c.proxima_accion_fecha) {
        list.push({
          id: `c-${c.id}`,
          date: c.proxima_accion_fecha.substring(0, 10),
          time: c.proxima_accion_hora ? c.proxima_accion_hora.substring(0, 5) : '',
          title: `Próx. Acción: ${c.nombre} (${c.empresa || 'Contacto'})`,
          subtitle: c.proxima_accion,
          type: 'contacto',
          typeLabel: 'Contacto',
          badgeClass: 'event-contacto',
          raw: c
        });
      }
    });

    // Muestras (Fecha envío)
    muestras.forEach(m => {
      if (m.fecha) {
        list.push({
          id: `m-${m.id}`,
          date: m.fecha.substring(0, 10),
          time: '',
          title: `Envío Muestra: ${m.destinatario || 'Cliente'}`,
          subtitle: `Estado: ${m.resultado}`,
          type: 'muestra',
          typeLabel: 'Muestra',
          badgeClass: 'event-muestra',
          raw: m
        });
      }
    });

    // Operaciones (Fecha de entrega)
    operaciones.forEach(op => {
      if (op.fecha_entrega) {
        list.push({
          id: `op-${op.id}`,
          date: op.fecha_entrega.substring(0, 10),
          time: '',
          title: `Entrega Pedido Nº ${op.numero_pedido}`,
          subtitle: `Cliente: ${op.cliente_nombre || 'Registrado'} · ${op.estado}`,
          type: 'operacion',
          typeLabel: 'Operación',
          badgeClass: 'event-operacion',
          raw: op
        });
      }
    });

    return list.sort((a, b) => (a.date + (a.time || '00:00')).localeCompare(b.date + (b.time || '00:00')));
  }, [tareas, visitas, contactos, muestras, operaciones]);

  // Días del mes para el calendario grid
  const calendarMonthDays = useMemo(() => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const startingDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Lunes = 0
    const totalDays = lastDay.getDate();

    const days = [];

    // Días mes anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthLastDay - i;
      const targetDate = new Date(year, month - 1, d);
      const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: false, dateStr, targetDate });
    }

    // Días mes actual
    const todayStr = new Date().toISOString().substring(0, 10);
    for (let d = 1; d <= totalDays; d++) {
      const targetDate = new Date(year, month, d);
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: true, isToday: dateStr === todayStr, dateStr, targetDate });
    }

    // Días mes siguiente
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const targetDate = new Date(year, month + 1, d);
      const dateStr = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: false, dateStr, targetDate });
    }

    return days;
  }, [calendarDate]);

  // Si no está autenticado, muestra login de Microsoft / Fallback local
  if (!isAuthenticated) {
    return <LoginScreen />;
  }

  // Métricas del Dashboard
  const activeContactsCount = contactos.filter(c => c.estado === 'Activo' || c.estado === 'En proceso').length;
  const pendingTasksCount = tareas.filter(t => t.status === 'pendiente').length;
  const activeOpsCount = operaciones.filter(op => op.estado === 'Pedido recibido' || op.estado === 'En proceso').length;
  const totalOpsUSD = operaciones.reduce((sum, op) => sum + parseFloat(op.valor_usd || 0), 0);

  // Datos para el Funnel Comercial (Contactos Calificados por Etapa)
  const funnelEtapas = [
    { name: 'Primer contacto', count: contactos.filter(c => c.etapa_comercial === 'Primer contacto').length, color: '#0d2c5c' },
    { name: 'Reunión exploratoria', count: contactos.filter(c => c.etapa_comercial === 'Reunión exploratoria').length, color: '#0284c7' },
    { name: 'Cotización', count: contactos.filter(c => c.etapa_comercial === 'Cotización').length, color: '#f59e0b' },
    { name: 'Negociación', count: contactos.filter(c => c.etapa_comercial === 'Negociación').length, color: '#7e22ce' },
    { name: 'Habilitación regulatoria', count: contactos.filter(c => c.etapa_comercial === 'Habilitación regulatoria').length, color: '#0d9488' },
    { name: 'Clientes Activos', count: contactos.filter(c => c.estado === 'Activo').length, color: '#059669' }
  ];
  const maxFunnelCount = Math.max(...funnelEtapas.map(f => f.count), 1);

  return (
    <div className="layout">
      <ToastContainer toasts={toast.toasts} removeToast={toast.removeToast} />
      <DbConnectionGuard />

      {/* Modal Lightbox de previsualización de foto */}
      {previewImage && (
        <div className="modal-overlay" onClick={() => setPreviewImage(null)} style={{ zIndex: 9999 }}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '750px', background: 'var(--surface)', padding: '20px', borderRadius: '16px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
              <h4 style={{ margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, fontSize: '1rem', color: 'var(--text)' }}>
                <Camera size={18} className="text-primary" /> Visualización de Fotografías
              </h4>
              <button className="icon-btn" onClick={() => setPreviewImage(null)} style={{ padding: 4 }}><X size={18} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', maxHeight: '70vh', overflowY: 'auto', padding: '10px 0' }}>
              {parseImageUrls(previewImage).length === 0 ? (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No hay imagen disponible</div>
              ) : (
                parseImageUrls(previewImage).map((url, idx) => (
                  <img key={idx} src={url} alt={`Fotografía ${idx + 1}`} style={{ maxWidth: '100%', maxHeight: '550px', borderRadius: '12px', objectFit: 'contain', border: '1px solid var(--border)' }} />
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <ConfirmModal
          open={true}
          title="Confirmar eliminación"
          message={`¿Estás seguro de eliminar "${confirmDelete.name}"? Esta acción no se puede deshacer.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ========== HEADER ========== */}
      <header className="header glass">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Único botón de menú sándwich que colapsa menú en Desktop y abre drawer en Mobile */}
          <button
            className="menu-toggle"
            onClick={() => {
              if (window.innerWidth <= 768) {
                setSidebarOpen(!sidebarOpen);
              } else {
                setSidebarCollapsed(!sidebarCollapsed);
              }
            }}
            title={sidebarCollapsed ? 'Expandir menú' : 'Colapsar menú'}
          >
            <Menu size={20} />
          </button>
          <div className="brand" onClick={() => switchTab('dashboard')} style={{ cursor: 'pointer' }}>
            <img src={logo} alt="Don Yeyo" className="logo" />
            <div className="brand-text hide-mobile">
              <h1>{APP_CONFIG.companyName}</h1>
              <span>{APP_CONFIG.appName} v{APP_CONFIG.appVersion}</span>
            </div>
          </div>
        </div>

        <div className="search-bar hide-mobile">
          <Search size={16} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Buscar contactos, operaciones, visitas..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
          {globalSearch && (
            <button className="icon-btn" onClick={() => setGlobalSearch('')} style={{ padding: 2 }}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Campanita de Notificaciones */}
          <div style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={() => setNotificationsOpen(!notificationsOpen)} title="Notificaciones y Alertas" style={{ position: 'relative' }}>
              <Bell size={18} />
              {hasUnreadAlerts && (
                <span style={{ position: 'absolute', top: -3, right: -3, background: 'var(--dy-red)', color: '#fff', fontSize: '0.65rem', fontWeight: 800, padding: '2px 5px', borderRadius: '99px', minWidth: 16, height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {activeAlerts.length}
                </span>
              )}
            </button>

            {notificationsOpen && (
              <div className="notifications-popover" style={{ position: 'absolute', top: 46, right: 0, width: 320, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', boxShadow: 'var(--shadow-lg)', zIndex: 1000, padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Bell size={16} className="text-primary" /> Alertas del Sistema ({activeAlerts.length})
                  </h4>
                  <button className="icon-btn" onClick={() => setNotificationsOpen(false)} style={{ padding: 2, width: 24, height: 24 }}><X size={14} /></button>
                </div>
                <div style={{ maxHeight: 320, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {activeAlerts.length === 0 ? (
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textAlign: 'center', padding: '16px 0' }}>
                      🎉 Sin alertas pendientes. ¡Todo al día!
                    </div>
                  ) : (
                    activeAlerts.map(alt => (
                      <div key={alt.id} style={{ background: 'var(--surface-hover)', padding: '10px 12px', borderRadius: '8px', cursor: 'pointer', borderLeft: `4px solid ${alt.severity === 'red' ? 'var(--dy-red)' : alt.severity === 'amber' ? 'var(--warning)' : 'var(--dy-blue)'}` }} onClick={() => { switchTab(alt.tab); setNotificationsOpen(false); }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text)' }}>{alt.title}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{alt.subtitle}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="theme-toggle hide-mobile" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {/* Avatar del usuario con desplegable de datos */}
          <div style={{ position: 'relative' }}>
            <div className="user-profile" onClick={() => setUserMenuOpen(!userMenuOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="user-avatar">{account?.name?.[0] || 'U'}</div>
              <div className="user-info hide-mobile">
                <span className="user-name">{account?.name || APP_CONFIG.defaultUserName}</span>
                <span className="user-role">{account?.username || APP_CONFIG.defaultUserEmail}</span>
              </div>
            </div>

            {userMenuOpen && (
              <div className="user-popover-menu" style={{ position: 'absolute', top: 46, right: 0, width: 220, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', boxShadow: 'var(--shadow-lg)', zIndex: 1000, padding: '14px' }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text)' }}>{account?.name || APP_CONFIG.defaultUserName}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 12, wordBreak: 'break-all' }}>{account?.username || APP_CONFIG.defaultUserEmail}</div>
                <div style={{ borderTop: '1px solid var(--border)', paddingTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tema visual</span>
                    <button className="theme-toggle" onClick={toggleTheme} style={{ width: 32, height: 32 }}>
                      {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                    </button>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                    style={{ width: '100%', justifyContent: 'center', color: 'var(--dy-red)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <LogOut size={14} /> Cerrar sesión
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ========== BODY WITH SIDEBAR AND MAIN CONTENT ========== */}
      <div className="app-body">
        {/* ========== SIDEBAR / NAVIGATION ========== */}
        <nav className={`sidebar ${sidebarOpen ? 'open' : ''} ${sidebarCollapsed ? 'collapsed' : ''}`}>
          <div className="nav-group">
            <div className="nav-label">{sidebarCollapsed ? '•' : 'PRINCIPAL'}</div>
            <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => switchTab('dashboard')} title="Dashboard">
              <LayoutDashboard size={18} /> {!sidebarCollapsed && 'Dashboard'}
            </button>
            <button className={`nav-item ${activeTab === 'tareas' ? 'active' : ''}`} onClick={() => switchTab('tareas')} title="Tareas">
              <CheckSquare size={18} /> {!sidebarCollapsed && 'Tareas'}
            </button>
            <button className={`nav-item ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => switchTab('agenda')} title="Agenda / Calendario">
              <CalendarIcon size={18} /> {!sidebarCollapsed && 'Agenda / Calendario'}
            </button>
            <button className={`nav-item ${activeTab === 'alertas' ? 'active' : ''}`} onClick={() => switchTab('alertas')} title="Alertas y Notificaciones">
              <Bell size={18} />
              {!sidebarCollapsed && (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span>Alertas del Sistema</span>
                  {hasUnreadAlerts && (
                    <span style={{
                      background: 'var(--dy-red)',
                      color: '#ffffff',
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      padding: '2px 7px',
                      borderRadius: '99px',
                      marginLeft: 6
                    }}>
                      {activeAlerts.length}
                    </span>
                  )}
                </span>
              )}
            </button>
          </div>

          <div className="nav-group">
            <div className="nav-label">{sidebarCollapsed ? '•' : 'GESTIÓN COMERCIAL'}</div>
            <button className={`nav-item ${activeTab === 'contactos' ? 'active' : ''}`} onClick={() => switchTab('contactos')} title="Contactos">
              <Users size={18} /> {!sidebarCollapsed && 'Contactos'}
            </button>
            <button className={`nav-item ${activeTab === 'visitas' ? 'active' : ''}`} onClick={() => switchTab('visitas')} title="Visitas y Reuniones">
              <Calendar size={18} /> {!sidebarCollapsed && 'Visitas y Reuniones'}
            </button>
            <button className={`nav-item ${activeTab === 'oportunidades' ? 'active' : ''}`} onClick={() => switchTab('oportunidades')} title="Oportunidades">
              <Briefcase size={18} /> {!sidebarCollapsed && 'Oportunidades'}
            </button>
            <button className={`nav-item ${activeTab === 'operaciones' ? 'active' : ''}`} onClick={() => switchTab('operaciones')} title="Operaciones">
              <ShoppingBag size={18} /> {!sidebarCollapsed && 'Operaciones'}
            </button>
            <button className={`nav-item ${activeTab === 'muestras' ? 'active' : ''}`} onClick={() => switchTab('muestras')} title="Muestras y Com.">
              <Package size={18} /> {!sidebarCollapsed && 'Muestras y Com.'}
            </button>
          </div>

          <div className="nav-group">
            <div className="nav-label">{sidebarCollapsed ? '•' : 'INTELIGENCIA & MERCADOS'}</div>
            <button className={`nav-item ${activeTab === 'paises' ? 'active' : ''}`} onClick={() => switchTab('paises')} title="Países destino">
              <Globe size={18} /> {!sidebarCollapsed && 'Países destino'}
            </button>
            <button className={`nav-item ${activeTab === 'inteligencia' ? 'active' : ''}`} onClick={() => switchTab('inteligencia')} title="Inteligencia Comercial">
              <TrendingUp size={18} /> {!sidebarCollapsed && 'Inteligencia Comercial'}
            </button>
            <button className={`nav-item ${activeTab === 'cobranzas' ? 'active' : ''}`} onClick={() => switchTab('cobranzas')} title="Cobranzas">
              <DollarSign size={18} /> {!sidebarCollapsed && 'Cobranzas'}
            </button>
            <button className={`nav-item ${activeTab === 'calculadora' ? 'active' : ''}`} onClick={() => switchTab('calculadora')} title="Calculadora Landed">
              <Calculator size={18} /> {!sidebarCollapsed && 'Calculadora Landed'}
            </button>
          </div>
        </nav>

        {/* ========== CONTENIDO PRINCIPAL ========== */}
        <main className="main-content">
          {loading && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40 }}>
              <RefreshCw className="spin" size={32} style={{ color: 'var(--primary)' }} />
            </div>
          )}

          {/* ===== DASHBOARD ===== */}
          {!loading && activeTab === 'dashboard' && (
            <div>
              <div className="stats-grid">
                <div className="stat-card" onClick={() => switchTab('contactos')} style={{ cursor: 'pointer' }} title="Ver lista de contactos activos">
                  <div className="stat-icon bg-blue"><Users size={20} /></div>
                  <div className="stat-details">
                    <span className="stat-label">Clientes / Contactos Activos</span>
                    <span className="stat-value">{activeContactsCount}</span>
                  </div>
                </div>

                <div className="stat-card" onClick={() => switchTab('tareas')} style={{ cursor: 'pointer' }} title="Ver lista de tareas pendientes">
                  <div className="stat-icon bg-amber"><CheckSquare size={20} /></div>
                  <div className="stat-details">
                    <span className="stat-label">Tareas Pendientes</span>
                    <span className="stat-value">{pendingTasksCount}</span>
                  </div>
                </div>

                <div className="stat-card" onClick={() => switchTab('operaciones')} style={{ cursor: 'pointer' }} title="Ver lista de operaciones en curso">
                  <div className="stat-icon bg-emerald"><ShoppingBag size={20} /></div>
                  <div className="stat-details">
                    <span className="stat-label">Operaciones en Curso</span>
                    <span className="stat-value">{activeOpsCount}</span>
                  </div>
                </div>

                <div className="stat-card" onClick={() => switchTab('cobranzas')} style={{ cursor: 'pointer' }} title="Ver control de cobranzas">
                  <div className="stat-icon bg-purple"><DollarSign size={20} /></div>
                  <div className="stat-details">
                    <span className="stat-label">Valor Total Operaciones</span>
                    <span className="stat-value">${totalOpsUSD.toLocaleString()} USD</span>
                  </div>
                </div>
              </div>

              <div className="grid-2-1" style={{ marginTop: 20 }}>
                {/* Funnel Comercial / Ventas */}
                <div className="card">
                  <div className="section-header">
                    <h3><BarChart3 size={20} /> Funnel Comercial / Desarrollo de Clientes</h3>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Basado en contactos calificados y en proceso</span>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '10px 0' }}>
                    {funnelEtapas.map((stage, i) => {
                      const pct = Math.round((stage.count / maxFunnelCount) * 100);
                      return (
                        <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
                            <span>{stage.name}</span>
                            <span>{stage.count} contactos</span>
                          </div>
                          <div className="progress-bar" style={{ height: 12 }}>
                            <div className="progress-fill" style={{ width: `${pct}%`, background: stage.color }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Tareas Pendientes Rápido */}
                <div className="card">
                  <div className="section-header">
                    <h3><CheckSquare size={20} /> Tareas urgentes</h3>
                    <button className="btn btn-xs btn-outline" onClick={() => openNew('tarea')}>+ Nueva</button>
                  </div>
                  {tareas.filter(t => t.status === 'pendiente').length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon"><CheckSquare size={24} /></div>
                      <div className="empty-state-text">Sin tareas pendientes</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {tareas.filter(t => t.status === 'pendiente').slice(0, 5).map(t => (
                        <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--surface-hover)', borderRadius: 8 }}>
                          <input type="checkbox" checked={false} onChange={() => toggleTareaStatus(t)} style={{ cursor: 'pointer' }} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, wordBreak: 'break-word' }}>{t.titulo}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center', marginTop: 2 }}>
                              {t.fecha && <span>📅 {fmtDate(t.fecha)} {fmtTime(t.hora)}</span>}
                              {prioridadBadge(t.prioridad)}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ===== AGENDA Y CALENDARIO CENTRALIZADO ===== */}
          {!loading && activeTab === 'agenda' && (
            <div className="calendar-wrapper">
              <div className="calendar-topbar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button className="icon-btn" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}>
                    <ChevronLeft size={18} />
                  </button>
                  <h2 style={{ margin: 0, fontSize: '1.2rem' }}>
                    {calendarDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase()}
                  </h2>
                  <button className="icon-btn" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}>
                    <ChevronRight size={18} />
                  </button>
                  <button className="btn btn-xs btn-outline" onClick={() => setCalendarDate(new Date())}>Hoy</button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button className={`btn btn-xs ${calendarViewMode === 'grid' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCalendarViewMode('grid')}>
                    Grid Mes
                  </button>
                  <button className={`btn btn-xs ${calendarViewMode === 'timeline' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setCalendarViewMode('timeline')}>
                    Lista Agenda
                  </button>
                </div>
              </div>

              {/* Vista Grilla Mensual */}
              {calendarViewMode === 'grid' && (
                <div className="card" style={{ padding: 12 }}>
                  <div className="calendar-grid">
                    {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                      <div key={d} className="calendar-day-head">{d}</div>
                    ))}
                    {calendarMonthDays.map((cell, i) => {
                      const dayEvents = consolidatedEvents.filter(e => e.date === cell.dateStr);
                      return (
                        <div
                          key={i}
                          className={`calendar-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isToday ? 'is-today' : ''}`}
                          onClick={() => {
                            if (!cell.isCurrentMonth) {
                              setCalendarDate(cell.targetDate);
                            } else {
                              setSelectedCalDay(cell);
                            }
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          <div className="calendar-day-num">
                            <span>{cell.day}</span>
                            {dayEvents.length > 0 && (
                              <span className="calendar-day-count">
                                {dayEvents.length}
                              </span>
                            )}
                          </div>
                          <div className="calendar-events-container" style={{ display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: 80 }}>
                            {dayEvents.map(e => (
                              <div
                                key={e.id}
                                className={`calendar-event-badge ${e.badgeClass}`}
                                title={`${e.title} (${e.typeLabel}) — Clic para abrir ficha`}
                                onClick={(evt) => {
                                  evt.stopPropagation();
                                  openEdit(e.type, e.raw);
                                }}
                              >
                                <span>{e.time ? e.time : '•'}</span>
                                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.title}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Vista Timeline Agenda */}
              {calendarViewMode === 'timeline' && (
                <div className="card">
                  <div className="section-header">
                    <h3><Clock3 size={20} /> Próximos compromisos y eventos agendados</h3>
                  </div>
                  {consolidatedEvents.length === 0 ? (
                    <div className="empty-state">
                      <div className="empty-state-icon"><CalendarIcon size={28} /></div>
                      <div className="empty-state-text">No hay eventos ni tareas agendadas</div>
                    </div>
                  ) : (
                    <div className="agenda-timeline">
                      {consolidatedEvents.map(e => (
                        <div key={e.id} className="agenda-card" style={{ cursor: 'pointer' }} onClick={() => openEdit(e.type, e.raw)} title="Clic para ver/editar ficha">
                          <div style={{ textAlign: 'center', minWidth: 70, borderRight: '1px solid var(--border)', paddingRight: 12 }}>
                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)' }}>{fmtDate(e.date)}</div>
                            {e.time && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2 }}>{e.time} hs</div>}
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span className={`calendar-event-badge ${e.badgeClass}`}>{e.typeLabel}</span>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{e.title}</span>
                            </div>
                            {e.subtitle && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4 }}>{e.subtitle}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* MODAL DETALLES DEL DÍA EN EL CALENDARIO */}
              {selectedCalDay && (
                <div className="modal-backdrop" onClick={() => setSelectedCalDay(null)}>
                  <div className="modal-content" style={{ maxWidth: 620 }} onClick={e => e.stopPropagation()}>
                    <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                      <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CalendarIcon size={20} /> Compromisos del {fmtDate(selectedCalDay.dateStr)}
                      </h3>
                      <button className="icon-btn" onClick={() => setSelectedCalDay(null)}><X size={16} /></button>
                    </div>

                    <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                      <button className="btn btn-primary btn-sm" onClick={() => { const d = selectedCalDay.dateStr; setSelectedCalDay(null); openNew('tarea'); setFormValues(prev => ({ ...prev, fecha: d })); }}>
                        <Plus size={14} /> + Tarea para este día
                      </button>
                      <button className="btn btn-secondary btn-sm" onClick={() => { const d = selectedCalDay.dateStr; setSelectedCalDay(null); openNew('visita'); setFormValues(prev => ({ ...prev, fecha: d })); }}>
                        <Plus size={14} /> + Reunión para este día
                      </button>
                    </div>

                    <div style={{ maxHeight: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {consolidatedEvents.filter(e => e.date === selectedCalDay.dateStr).length === 0 ? (
                        <div className="empty-state" style={{ padding: '24px 10px' }}>
                          <div className="empty-state-icon"><CalendarIcon size={28} /></div>
                          <div className="empty-state-text">No hay eventos ni tareas agendadas para este día.</div>
                        </div>
                      ) : (
                        consolidatedEvents.filter(e => e.date === selectedCalDay.dateStr).map(ev => (
                          <div key={ev.id} className="sample-row" style={{ cursor: 'pointer' }} onClick={() => { setSelectedCalDay(null); openEdit(ev.type, ev.raw); }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1, minWidth: 0 }}>
                              <span className={`calendar-event-badge ${ev.badgeClass}`}>{ev.typeLabel}</span>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontWeight: 600, fontSize: '0.92rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ev.title}</div>
                                {ev.subtitle && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{ev.subtitle}</div>}
                              </div>
                            </div>
                            {ev.time && <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', whiteSpace: 'nowrap' }}>⏰ {ev.time} hs</span>}
                            <button className="icon-btn" title="Editar"><Edit size={14} /></button>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===== TAREAS ABM ===== */}
          {!loading && activeTab === 'tareas' && (
            <div className="card">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3><CheckSquare size={20} /> Gestión de Tareas y Pendientes</h3>
                <button className="btn btn-primary btn-sm" onClick={() => openNew('tarea')}>
                  <Plus size={14} /> Nueva tarea
                </button>
              </div>

              <div className="filter-bar">
                <select className="form-input" value={tareaFilterStatus} onChange={e => setTareaFilterStatus(e.target.value)}>
                  <option value="">Todos los estados</option>
                  <option value="pendiente">Pendientes</option>
                  <option value="hecha">Completadas</option>
                </select>
                <select className="form-input" value={tareaFilterPrio} onChange={e => setTareaFilterPrio(e.target.value)}>
                  <option value="">Todas las prioridades</option>
                  <option value="alta">Alta</option>
                  <option value="media">Media</option>
                  <option value="baja">Baja</option>
                </select>
                <div className="filter-spacer" />
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Total: <strong>{filteredTareas.length}</strong> tareas ({tareas.filter(t => t.status === 'pendiente').length} pendientes)
                </div>
              </div>

              {filteredTareas.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><CheckSquare size={32} /></div>
                  <div className="empty-state-text">No hay tareas que coincidan con los filtros</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {filteredTareas.map(t => (
                    <div key={t.id} className="task-item" style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: '14px 16px',
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '12px',
                      opacity: t.status === 'hecha' ? 0.65 : 1,
                      transition: 'all 0.15s ease'
                    }}>
                      <input
                        type="checkbox"
                        checked={t.status === 'hecha'}
                        onChange={() => toggleTareaStatus(t)}
                        style={{ cursor: 'pointer', width: 18, height: 18, marginTop: 3, accentColor: 'var(--dy-blue)' }}
                        title={t.status === 'hecha' ? 'Marcar como pendiente' : 'Marcar como completada'}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: '0.95rem',
                          fontWeight: 600,
                          textDecoration: t.status === 'hecha' ? 'line-through' : 'none',
                          color: t.status === 'hecha' ? 'var(--text-muted)' : 'var(--text)'
                        }}>
                          {t.titulo}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 10, alignItems: 'center', marginTop: 6, flexWrap: 'wrap' }}>
                          {t.fecha && (
                            <span style={{ color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                              <CalendarIcon size={12} /> {fmtDate(t.fecha)} {fmtTime(t.hora)}
                            </span>
                          )}
                          {t.status !== 'hecha' && daysFrom(t.fecha) < 0 && (
                            <span style={{
                              background: 'rgba(245, 158, 11, 0.15)',
                              color: '#d97706',
                              fontSize: '0.73rem',
                              fontWeight: 700,
                              padding: '2px 8px',
                              borderRadius: '6px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 4
                            }}>
                              ⚠️ Venció hace {Math.abs(daysFrom(t.fecha))} {Math.abs(daysFrom(t.fecha)) === 1 ? 'día' : 'días'}
                            </span>
                          )}
                          {prioridadBadge(t.prioridad)}
                          {t.pais_nombre && <span>📍 {t.pais_nombre}</span>}
                          {t.asignado && <span>👤 {t.asignado}</span>}
                        </div>
                        {t.notas && (
                          <div style={{ fontSize: '0.8rem', marginTop: 6, color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: t.notas }} />
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <button className="icon-btn" onClick={() => openEdit('tarea', t)} title="Editar"><Edit size={14} /></button>
                        <button className="icon-btn" onClick={() => requestDelete('tareas', t.id, t.titulo)} title="Eliminar"><Trash2 size={14} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===== CONTACTOS ===== */}
          {!loading && activeTab === 'contactos' && (
            <div className="card">
              <div className="section-header">
                <h3><Users size={20} /> Base de Contactos y Clientes</h3>
              </div>

              <div className="filter-bar">
                <select className="form-input" value={contactoFilterEstado} onChange={e => setContactoFilterEstado(e.target.value)}>
                  <option value="">Todos los estados</option>
                  <option>Activo</option>
                  <option>En proceso</option>
                  <option>Prospecto</option>
                  <option>Inactivo</option>
                  <option>Descartado</option>
                </select>
                <div className="filter-spacer" />
                <button className="btn btn-secondary btn-sm" onClick={handleSyncFinnegans} title="Sincronizar clientes desde ERP Finnegans">
                  <RefreshCw size={14} /> Sincronizar Finnegans
                </button>
                <button className="btn btn-primary btn-sm" onClick={() => openNew('contacto')}><Plus size={14} /> Nuevo contacto</button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      {renderSortTh('nombre', 'Nombre / Empresa', 'Nombre del contacto o empresa')}
                      {renderSortTh('rol', 'Rol', 'Rol o cargo')}
                      {renderSortTh('pais_nombre', 'País / Ciudad', 'País y ciudad de origen')}
                      <th>Contacto</th>
                      {renderSortTh('estado', 'Estado / Etapa', 'Estado actual o etapa comercial')}
                      {renderSortTh('proxima_accion_fecha', 'Próx. Acción', 'Fecha de la próxima acción')}
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContactosSorted.length === 0 ? (
                      <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon"><Users size={28} /></div><div className="empty-state-text">No hay contactos cargados</div></div></td></tr>
                    ) : (
                      filteredContactosSorted.map(c => (
                        <tr key={c.id}>
                          <td>
                            <strong>{c.nombre} {c.apellido || ''}</strong>
                            {c.empresa && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.empresa}</div>}
                          </td>
                          <td><span className="badge badge-navy">{c.rol || 'Otro'}</span></td>
                          <td>{c.pais_nombre || '—'} {c.ciudad ? `(${c.ciudad})` : ''}</td>
                          <td style={{ fontSize: '0.8rem' }}>
                            {c.email && <div>✉️ {c.email}</div>}
                            {c.telefono && <div>📞 {c.telefono}</div>}
                          </td>
                          <td>
                            {estadoBadge(c.estado)}
                            {c.estado === 'En proceso' && c.etapa_comercial && (
                              <div style={{ marginTop: 4 }}>{etapaBadge(c.etapa_comercial)}</div>
                            )}
                          </td>
                          <td style={{ fontSize: '0.78rem' }}>
                            {c.proxima_accion ? (
                              <div>
                                <div>{c.proxima_accion}</div>
                                {c.proxima_accion_fecha && (
                                  <div style={{ color: 'var(--primary)', fontWeight: 600, marginTop: 2 }}>
                                    📅 {fmtDate(c.proxima_accion_fecha)} {fmtTime(c.proxima_accion_hora)}
                                  </div>
                                )}
                              </div>
                            ) : '—'}
                          </td>
                          <td>
                            <button className="icon-btn" onClick={() => openEdit('contacto', c)} title="Editar"><Edit size={14} /></button>
                            <button className="icon-btn" onClick={() => requestDelete('contactos', c.id, c.nombre)} title="Eliminar"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== VISITAS Y REUNIONES ===== */}
          {!loading && activeTab === 'visitas' && (
            <div className="card">
              <div className="section-header">
                <h3><Calendar size={20} /> Visitas, Ferias y Reuniones Comerciales</h3>
              </div>

              <div className="filter-bar">
                <select className="form-input" value={visitaFilterTipo} onChange={e => setVisitaFilterTipo(e.target.value)}>
                  <option value="">Todos los tipos</option>
                  <option>Feria internacional</option>
                  <option>Ronda de negocios</option>
                  <option>Reunión comercial</option>
                  <option>Visita a cliente</option>
                  <option>Videoconferencia</option>
                </select>
                <div className="filter-spacer" />
                <button className="btn btn-primary btn-sm" onClick={() => openNew('visita')}><Plus size={14} /> Registrar reunión</button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      {renderSortTh('titulo', 'Evento / Reunión', 'Nombre del evento o reunión')}
                      {renderSortTh('tipo', 'Tipo', 'Tipo de evento')}
                      {renderSortTh('fecha', 'Fecha / Hora', 'Fecha y hora del evento')}
                      {renderSortTh('lugar', 'Lugar', 'Ubicación o país')}
                      <th>Contactos / Calificados</th>
                      {renderSortTh('estado', 'Estado', 'Estado del evento')}
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVisitasSorted.length === 0 ? (
                      <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon"><Calendar size={28} /></div><div className="empty-state-text">Sin visitas o reuniones registradas</div></div></td></tr>
                    ) : (
                      filteredVisitasSorted.map(v => (
                        <tr key={v.id}>
                          <td>
                            <strong>{v.titulo}</strong>
                            {v.contacto_nombre && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Cliente: {v.contacto_nombre}</div>}
                          </td>
                          <td><span className="badge badge-navy">{v.tipo}</span></td>
                          <td style={{ fontSize: '0.82rem', minWidth: '150px', whiteSpace: 'nowrap' }}>
                            📅 {fmtDate(v.fecha)} {v.fecha_fin ? ` a ${fmtDate(v.fecha_fin)}` : ''}
                            {v.hora && <div style={{ color: 'var(--primary)', fontWeight: 600 }}>{fmtTime(v.hora)}</div>}
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>{v.lugar || '—'}</td>
                          <td style={{ fontSize: '0.8rem' }}>
                            {v.contactos || '—'}
                            {v.ronda_importadores > 0 && (
                              <div style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600 }}>
                                {v.ronda_importadores} Contactos calificados
                              </div>
                            )}
                          </td>
                          <td>{estadoBadge(v.estado)}</td>
                          <td>
                            <button className="icon-btn" onClick={() => openEdit('visita', v)}><Edit size={14} /></button>
                            <button className="icon-btn" onClick={() => requestDelete('visitas', v.id, v.titulo)}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== OPORTUNIDADES ===== */}
          {!loading && activeTab === 'oportunidades' && (
            <div className="card">
              <div className="section-header">
                <h3><Briefcase size={20} /> Oportunidades Comerciales</h3>
              </div>

              <div className="filter-bar">
                <select className="form-input" value={oportunidadFilterEtapa} onChange={e => setOportunidadFilterEtapa(e.target.value)}>
                  <option value="">Todas las etapas</option>
                  <option>En análisis</option>
                  <option>En proceso</option>
                  <option>Finalizado</option>
                  <option>Descartado</option>
                </select>
                <div className="filter-spacer" />
                <button className="btn btn-primary btn-sm" onClick={() => openNew('oportunidad')}><Plus size={14} /> Nueva oportunidad</button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      {renderSortTh('nombre', 'Oportunidad', 'Nombre de la oportunidad')}
                      {renderSortTh('pais_nombre', 'País', 'País de la oportunidad')}
                      {renderSortTh('marca', 'Marca', 'Marca cotizada')}
                      {renderSortTh('etapa', 'Etapa', 'Etapa comercial')}
                      {renderSortTh('probabilidad', 'Probabilidad', 'Probabilidad de Cierre (%)')}
                      {renderSortTh('monto', 'Inversión USD', 'Inversión Necesaria (USD)')}
                      {renderSortTh('responsable', 'Responsable', 'Responsable asignado')}
                      {renderSortTh('cierre', 'Cierre Estimado', 'Fecha de cierre estimada')}
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOportunidadesSorted.length === 0 ? (
                      <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon"><Briefcase size={28} /></div><div className="empty-state-text">Sin oportunidades registradas</div></div></td></tr>
                    ) : (
                      filteredOportunidadesSorted.map(o => (
                        <tr key={o.id}>
                          <td>
                            <strong>{o.nombre}</strong>
                            {o.contacto_nombre && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>👤 {o.contacto_nombre}</div>}
                          </td>
                          <td>{o.pais_bandera || ''} {o.pais_nombre || '—'}</td>
                          <td><span className="badge badge-navy">{o.marca === 'Otro' ? (o.marca_otra || 'Otro') : o.marca}</span></td>
                          <td>{etapaBadge(o.etapa)}</td>
                          <td><span className="badge badge-secondary" style={{ fontWeight: 700 }}>{o.probabilidad || '50%'}</span></td>
                          <td style={{ fontWeight: 600 }}>${parseFloat(o.monto || 0).toLocaleString()}</td>
                          <td style={{ fontSize: '0.8rem' }}>{o.responsable || '—'}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{fmtDate(o.cierre)}</td>
                          <td>
                            <button className="icon-btn" onClick={() => openEdit('oportunidad', o)} title="Editar"><Edit size={14} /></button>
                            <button className="icon-btn" onClick={() => requestDelete('oportunidades', o.id, o.nombre)} title="Eliminar"><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== OPERACIONES (NUEVO MÓDULO) ===== */}
          {!loading && activeTab === 'operaciones' && (
            <div className="card">
              <div className="section-header">
                <h3><ShoppingBag size={20} /> Operaciones y Pedidos de Exportación</h3>
              </div>

              <div className="filter-bar">
                <select className="form-input" value={operacionFilterEstado} onChange={e => setOperacionFilterEstado(e.target.value)}>
                  <option value="">Todos los estados</option>
                  <option>Pedido recibido</option>
                  <option>En proceso</option>
                  <option>Despachado</option>
                </select>
                <div className="filter-spacer" />
                <button className="btn btn-primary btn-sm" onClick={() => openNew('operacion')}><Plus size={14} /> Registrar operación</button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      {renderSortTh('numero_pedido', 'Nº Pedido', 'Número de pedido de exportación')}
                      {renderSortTh('cliente_nombre', 'Cliente', 'Cliente o empresa receptora')}
                      {renderSortTh('pais_nombre', 'País Destino', 'País de destino del embarque')}
                      {renderSortTh('estado', 'Estado', 'Estado actual de la operación')}
                      {renderSortTh('fecha_entrega', 'Entrega', 'Fecha programada de entrega')}
                      {renderSortTh('unidades', 'Unidades / Kg', 'Cantidad en unidades y kg')}
                      {renderSortTh('valor_usd', 'Valor USD', 'Monto total en USD')}
                      {renderSortTh('incoterm', 'Incoterm', 'Incoterm acordado')}
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOperacionesSorted.length === 0 ? (
                      <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon"><ShoppingBag size={28} /></div><div className="empty-state-text">Sin operaciones registradas</div></div></td></tr>
                    ) : (
                      filteredOperacionesSorted.map(op => (
                        <tr key={op.id}>
                          <td><strong>Nº {op.numero_pedido}</strong></td>
                          <td>
                            <strong>{op.cliente_nombre || 'Cliente sin asignar'}</strong>
                            {op.cliente_empresa && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{op.cliente_empresa}</div>}
                          </td>
                          <td>{op.pais_bandera || ''} {op.pais_nombre || '—'}</td>
                          <td>{estadoBadge(op.estado)}</td>
                          <td style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
                            📅 {fmtDate(op.fecha_entrega)}
                          </td>
                          <td style={{ fontSize: '0.8rem' }}>
                            <div>{op.unidades ? `${op.unidades} u.` : '—'}</div>
                            {op.kilogramos > 0 && <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{op.kilogramos} kg</div>}
                          </td>
                          <td style={{ fontWeight: 600 }}>${parseFloat(op.valor_usd || 0).toLocaleString()}</td>
                          <td><span className="badge badge-navy">{op.incoterm || 'FOB'}</span></td>
                          <td>
                            <button className="icon-btn" onClick={() => openEdit('operacion', op)}><Edit size={14} /></button>
                            <button className="icon-btn" onClick={() => requestDelete('operaciones', op.id, `Pedido ${op.numero_pedido}`)}><Trash2 size={14} /></button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== MUESTRAS Y COMUNICACIONES ===== */}
          {!loading && activeTab === 'muestras' && (
            <div className="card">
              <div className="section-header"><h3><Package size={20} /> Muestras y Comunicaciones</h3></div>
              <div className="tabs">
                <button className={`tab-btn ${subTab === 'muestras' ? 'active' : ''}`} onClick={() => setSubTab('muestras')}><Send size={14} /> Muestras enviadas</button>
                <button className={`tab-btn ${subTab === 'comunicaciones' ? 'active' : ''}`} onClick={() => setSubTab('comunicaciones')}><MessageCircle size={14} /> Log de comunicaciones</button>
              </div>

              {subTab === 'muestras' && <>
                <div className="filter-bar">
                  <select className="form-input" value={muestraFilterRes} onChange={e => setMuestraFilterRes(e.target.value)}>
                    <option value="">Todos los resultados</option>
                    <option value="Pendiente">Pendiente</option>
                    <option value="Positivo">Positivo → pedido</option>
                    <option value="En evaluación">En evaluación</option>
                    <option value="Negativo">Negativo</option>
                  </select>
                  <div className="filter-spacer" />
                  <button className="btn btn-primary btn-sm" onClick={() => openNew('muestra')}><Plus size={14} /> Registrar muestra</button>
                </div>
                {filteredMuestras.length === 0 ? <div className="empty-state"><div className="empty-state-icon"><Package size={28} /></div><div className="empty-state-text">Sin muestras registradas</div></div> :
                  filteredMuestras.map(m => {
                    let prods = [];
                    try {
                      const parsed = JSON.parse(m.producto);
                      if (Array.isArray(parsed)) {
                        prods = parsed.map(p => typeof p === 'string' ? { nombre: p } : p);
                      } else { prods = [{ nombre: String(m.producto) }]; }
                    } catch { prods = [{ nombre: String(m.producto) }]; }

                    const sampleTitle = [
                      m.destinatario || m.contacto_nombre,
                      m.pais_nombre,
                      fmtDate(m.fecha)
                    ].filter(Boolean).join(' · ') || 'Muestra sin destinatario';

                    return (
                      <div key={m.id} className="sample-row">
                        <div className="sample-row-main" style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)' }}>
                            {sampleTitle}
                          </div>
                          <div className="product-tags" style={{ marginTop: 6 }}>
                            {prods.map((p, i) => (
                              <span key={i} className="product-tag">
                                <span className="product-tag-name">{p.nombre}</span>
                                {p.cantidad && (
                                  <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>
                                    · {/^\d+$/.test(String(p.cantidad).trim()) ? `${p.cantidad} u.` : p.cantidad}
                                  </span>
                                )}
                                {p.lote && <span style={{ opacity: 0.85, fontSize: '0.7rem' }}>· Lote: {p.lote}</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="sample-row-side" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                          {estadoBadge(m.resultado)}
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="icon-btn" onClick={() => openEdit('muestra', m)}><Edit size={14} /></button>
                            <button className="icon-btn" onClick={() => requestDelete('muestras', m.id, sampleTitle)}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                }
              </>}

              {subTab === 'comunicaciones' && <>
                <div className="filter-bar">
                  <select className="form-input" value={comFilterTipo} onChange={e => setComFilterTipo(e.target.value)}>
                    <option value="">Todos los tipos</option>
                    <option>Email</option><option>Llamada</option><option>WhatsApp</option><option>Reunión</option><option>Videollamada</option>
                  </select>
                  <div className="filter-spacer" />
                  <button className="btn btn-primary btn-sm" onClick={() => openNew('comunicacion')}><Plus size={14} /> Registrar contacto</button>
                </div>
                {filteredComunicaciones.length === 0 ? <div className="empty-state"><div className="empty-state-icon"><MessageCircle size={28} /></div><div className="empty-state-text">Sin comunicaciones registradas</div></div> :
                  <div className="timeline">
                    {filteredComunicaciones.map(c => (
                      <div key={c.id} className="tl-item">
                        <div className="tl-dot">{comIcon(c.tipo)}</div>
                        <div style={{ flex: 1, paddingTop: 4 }}>
                          <div style={{ fontWeight: 500, fontSize: '0.85rem' }}>{c.asunto} <span className="badge badge-navy" style={{ marginLeft: 4 }}>{c.tipo}</span></div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>{c.contacto_nombre || ''} · {fmtDate(c.fecha)}</div>
                          {c.resumen && <div style={{ fontSize: '0.75rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', marginTop: 4 }} dangerouslySetInnerHTML={{ __html: c.resumen }} />}
                          <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                            <button className="icon-btn" onClick={() => openEdit('comunicacion', c)}><Edit size={14} /></button>
                            <button className="icon-btn" onClick={() => requestDelete('comunicaciones', c.id, c.asunto)}><Trash2 size={14} /></button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                }
              </>}
            </div>
          )}

          {/* ===== PAÍSES ===== */}
          {!loading && activeTab === 'paises' && (
            <div>
              <div className="section-header"><h3><Globe size={20} /> Países Destino</h3></div>
              <div className="filter-bar">
                <div className="filter-spacer" />
                <button className="btn btn-primary btn-sm" onClick={() => openNew('pais')}><Plus size={14} /> Agregar país</button>
              </div>
              <div className="country-grid">
                {paises.length === 0 ? (
                  <div className="empty-state" style={{ gridColumn: '1 / -1' }}><div className="empty-state-icon"><Globe size={28} /></div><div className="empty-state-text">Agregá los países destino de exportación.</div></div>
                ) : (
                  paises.map(p => (
                    <div key={p.id} className="country-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ fontSize: 32 }}>{p.bandera || '🌐'}</div>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <button className="icon-btn" onClick={() => openEdit('pais', p)} title="Editar"><Edit size={14} /></button>
                          <button className="icon-btn" onClick={() => requestDelete('paises', p.id, p.nombre)} title="Eliminar"><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div style={{ fontWeight: 700, fontSize: '1.05rem', margin: '6px 0 10px 0', color: 'var(--text)' }}>{p.nombre}</div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.8rem', borderTop: '1px solid var(--border)', paddingTop: 8 }}>
                        {p.arancel !== undefined && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Arancel:</span><span style={{ fontWeight: 600 }}>{p.arancel}%</span></div>}
                        {p.incoterm_habitual && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Incoterm:</span><span style={{ fontWeight: 500 }}>{p.incoterm_habitual}</span></div>}
                        {p.ncm && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>NCM:</span><span style={{ fontWeight: 500 }}>{p.ncm}</span></div>}
                        {p.moneda && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Moneda/TC:</span><span style={{ fontWeight: 500 }}>{p.moneda} {p.tipocambio ? `($${p.tipocambio})` : ''}</span></div>}
                        {p.sanitario && <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: 'var(--text-muted)' }}>Org. Sanitario:</span><span style={{ fontWeight: 600, color: 'var(--dy-blue)' }}>{p.sanitario}</span></div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* ===== INTELIGENCIA ===== */}
          {!loading && activeTab === 'inteligencia' && (
            <div className="card">
              <div className="section-header"><h3><TrendingUp size={20} /> Inteligencia Comercial</h3></div>
              <div className="tabs">
                <button className={`tab-btn ${intelTab === 'precios' ? 'active' : ''}`} onClick={() => setIntelTab('precios')}><DollarSign size={14} /> Precios competidores</button>
                <button className={`tab-btn ${intelTab === 'tendencias' ? 'active' : ''}`} onClick={() => setIntelTab('tendencias')}><BarChart3 size={14} /> Tendencias de mercado</button>
              </div>

              <div className="filter-bar" style={{ marginTop: 12 }}>
                <select className="form-input" value={intelFilterPais} onChange={e => setIntelFilterPais(e.target.value)}>
                  <option value="">Todos los países</option>
                  {paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Filtrar por marca o palabra clave..."
                  value={intelFilterMarca}
                  onChange={e => setIntelFilterMarca(e.target.value)}
                />
                <div className="filter-spacer" />
                {intelTab === 'precios' ? (
                  <button className="btn btn-primary btn-sm" onClick={() => openNew('precio')}><Plus size={14} /> Registrar precio</button>
                ) : (
                  <button className="btn btn-primary btn-sm" onClick={() => openNew('tendencia')}><Plus size={14} /> Crear nota</button>
                )}
              </div>

              {intelTab === 'precios' && (
                <div className="table-container">
                  <table>
                    <thead>
                      <tr>
                        {renderSortTh('competidor', 'Competidor / Producto', 'Marca o producto del competidor')}
                        {renderSortTh('pais_nombre', 'País', 'País de relevamiento')}
                        {renderSortTh('categoria', 'Categoría', 'Categoría de producto')}
                        {renderSortTh('precio', 'Precio', 'Precio de venta')}
                        {renderSortTh('unidad', 'Unidad', 'Unidad de medida')}
                        {renderSortTh('peso', 'Precio/kg', 'Precio por kilogramo')}
                        <th>Fotos</th>
                        {renderSortTh('fuente', 'Fuente', 'Fuente del dato')}
                        {renderSortTh('fecha', 'Fecha', 'Fecha de relevamiento')}
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPreciosSorted.length === 0 ? (
                        <tr><td colSpan="10"><div className="empty-state"><div className="empty-state-icon"><DollarSign size={28} /></div><div className="empty-state-text">Sin precios de competidores registrados</div></div></td></tr>
                      ) : (
                        filteredPreciosSorted.map(p => (
                          <tr key={p.id}>
                            <td><strong>{p.competidor}</strong>{p.producto && <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{p.producto}</div>}</td>
                            <td>{p.pais_nombre || '—'}</td>
                            <td><span className="badge badge-navy">{p.categoria || '—'}</span></td>
                            <td style={{ fontWeight: 500 }}>{p.precio > 0 ? `$${parseFloat(p.precio).toLocaleString()}` : '—'}</td>
                            <td>{p.unidad || '—'}</td>
                            <td style={{ color: 'var(--text)', fontWeight: 500 }}>{p.peso > 0 && p.precio > 0 ? (parseFloat(p.precio) / parseFloat(p.peso)).toFixed(2) + ' /kg' : '—'}</td>
                            <td>
                              {p.imagen_url && parseImageUrls(p.imagen_url).length > 0 ? (
                                <button type="button" className="btn btn-xs btn-outline" onClick={() => setPreviewImage(p.imagen_url)}>
                                  <Camera size={11} /> Ver foto ({parseImageUrls(p.imagen_url).length})
                                </button>
                              ) : '—'}
                            </td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.fuente || '—'}</td>
                            <td style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{fmtDate(p.fecha)}</td>
                            <td>
                              <button className="icon-btn" onClick={() => openEdit('precio', p)}><Edit size={14} /></button>
                              <button className="icon-btn" onClick={() => requestDelete('precios', p.id, p.competidor)}><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {intelTab === 'tendencias' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12 }}>
                  {filteredTendenciasSorted.length === 0 ? (
                    <div className="empty-state"><div className="empty-state-icon"><BarChart3 size={28} /></div><div className="empty-state-text">Sin tendencias registradas</div></div>
                  ) : (
                    filteredTendenciasSorted.map(t => (
                      <div key={t.id} className="card" style={{ padding: 14, border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ margin: 0, fontSize: '0.95rem' }}>{t.titulo}</h4>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className="icon-btn" onClick={() => openEdit('tendencia', t)}><Edit size={14} /></button>
                            <button className="icon-btn" onClick={() => requestDelete('tendencias', t.id, t.titulo)}><Trash2 size={14} /></button>
                          </div>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12 }}>
                          {t.pais_nombre && <span>📍 {t.pais_nombre}</span>}
                          {t.categoria && <span>🏷️ {t.categoria}</span>}
                          {t.fuente && <span>📰 Fuente: {t.fuente}</span>}
                        </div>
                        {t.descripcion && <div style={{ fontSize: '0.85rem', marginTop: 8 }} dangerouslySetInnerHTML={{ __html: t.descripcion }} />}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          )}

          {/* ===== COBRANZAS ===== */}
          {!loading && activeTab === 'cobranzas' && (
            <div className="card">
              <div className="section-header" style={{ marginBottom: 16 }}>
                <h3><DollarSign size={20} /> Control de Cobranzas</h3>
              </div>

              {/* TRES CARDS DE RESUMEN POR ENCIMA DE LA GRILLA */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 20 }}>
                <div className="metric-card" style={{ cursor: 'default', background: 'var(--surface-hover)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <CheckCircle2 size={16} style={{ color: 'var(--success)' }} /> Cobrado ({new Date().getFullYear()})
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--success)', marginTop: 6 }}>
                    ${cobradoAnoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                </div>

                <div className="metric-card" style={{ cursor: 'default', background: 'var(--surface-hover)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Clock size={16} style={{ color: 'var(--warning)' }} /> Pendiente de Cobro
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--warning)', marginTop: 6 }}>
                    ${pendienteTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                </div>

                <div className="metric-card" style={{ cursor: 'default', background: 'var(--surface-hover)', padding: '16px 20px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <AlertTriangle size={16} style={{ color: 'var(--dy-red)' }} /> Monto Vencido
                  </div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--dy-red)', marginTop: 6 }}>
                    ${vencidoTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                  </div>
                </div>
              </div>

              <div className="filter-bar">
                <select className="form-input" value={cobranzaFilterEstado} onChange={e => setCobranzaFilterEstado(e.target.value)}>
                  <option value="">Todos los estados</option>
                  <option>Pendiente</option>
                  <option>Cobrado parcial</option>
                  <option>Cobrado total</option>
                  <option>Vencido</option>
                </select>
                <div className="filter-spacer" />
                <button className="btn btn-primary btn-sm" onClick={() => openNew('cobranza')}><Plus size={14} /> Nueva cobranza</button>
              </div>

              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      {renderSortTh('descripcion', 'Operación', 'Referencia de la operación')}
                      {renderSortTh('cliente_nombre', 'Cliente / País', 'Cliente y país de destino')}
                      {renderSortTh('monto', 'Monto USD', 'Monto total en USD')}
                      {renderSortTh('cobrado_monto', 'Cobrado', 'Monto cobrado')}
                      {renderSortTh('saldo', 'Saldo', 'Saldo pendiente de cobro')}
                      {renderSortTh('estado', 'Estado', 'Estado actual de la cobranza')}
                      {renderSortTh('medio_pago', 'Medio Pago', 'Medio de pago')}
                      {renderSortTh('vencimiento', 'Vencimiento', 'Fecha límite de cobro')}
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCobranzasSorted.length === 0 ? (
                      <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon"><DollarSign size={28} /></div><div className="empty-state-text">Sin cobranzas registradas</div></div></td></tr>
                    ) : (
                      filteredCobranzasSorted.map(c => {
                        const total = parseFloat(c.monto || 0);
                        const cobrado = parseFloat(c.cobrado_monto || 0);
                        const saldo = Math.max(0, total - cobrado);
                        return (
                          <tr key={c.id}>
                            <td>
                              <strong>{c.descripcion}</strong>
                              {c.marca && <span className="badge badge-navy" style={{ marginLeft: 6, fontSize: '0.68rem' }}>{c.marca}</span>}
                            </td>
                            <td>{c.cliente_nombre || '—'} {c.pais_nombre ? `(${c.pais_nombre})` : ''}</td>
                            <td style={{ fontWeight: 600 }}>${total.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                            <td style={{ color: 'var(--success)', fontWeight: 600 }}>${cobrado.toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                            <td style={{ color: saldo > 0 ? 'var(--dy-red)' : 'var(--text-muted)', fontWeight: 600 }}>
                              ${saldo.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
                            </td>
                            <td>{estadoBadge(c.estado)}</td>
                            <td style={{ fontSize: '0.8rem' }}>{c.medio_pago || c.condicion || '—'}</td>
                            <td style={{ fontSize: '0.8rem', whiteSpace: 'nowrap' }}>{fmtDate(c.vencimiento)}</td>
                            <td>
                              <button className="icon-btn" onClick={() => openEdit('cobranza', c)}><Edit size={14} /></button>
                              <button className="icon-btn" onClick={() => requestDelete('cobranzas', c.id, c.descripcion)}><Trash2 size={14} /></button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ===== CALCULADORA LANDED ===== */}
          {!loading && activeTab === 'calculadora' && (
            <div className="calc-layout-grid">
              <div className="card">
                <div className="section-header" style={{ marginBottom: 20 }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                    <Calculator size={22} className="text-primary" /> Calculadora de Costos Landed
                  </h3>
                </div>

                <form onSubmit={handleSaveCalc}>
                  <div className="form-group">
                    <label className="form-label">Producto / Descripción</label>
                    <input
                      type="text"
                      className="form-input"
                      list="calc-prod-list"
                      placeholder="Ej: Tapas Don Yeyo 330g"
                      value={calcForm.producto}
                      onChange={e => setCalcForm(prev => ({ ...prev, producto: e.target.value }))}
                    />
                    <datalist id="calc-prod-list">
                      {productosCatalogo.map((p, idx) => (
                        <option key={idx} value={p.nombre || p.descripcion} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">País Destino</label>
                      <select
                        className="form-input"
                        value={calcForm.pais_id}
                        onChange={e => {
                          const pid = e.target.value;
                          const pObj = paises.find(p => String(p.id) === String(pid));
                          setCalcForm(prev => ({
                            ...prev,
                            pais_id: pid,
                            arancel: pObj && pObj.arancel ? pObj.arancel : prev.arancel
                          }));
                        }}
                      >
                        <option value="">Selecciona país...</option>
                        {paises.map(p => (
                          <option key={p.id} value={p.id}>{p.bandera ? `${p.bandera} ` : ''}{p.nombre}</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label className="form-label">Incoterm</label>
                      <select
                        className="form-input"
                        value={calcForm.incoterm}
                        onChange={e => setCalcForm(prev => ({ ...prev, incoterm: e.target.value }))}
                      >
                        <option value="FOB">FOB (Free on Board)</option>
                        <option value="CIF">CIF (Cost, Insurance & Freight)</option>
                        <option value="DAP">DAP (Delivered at Place)</option>
                        <option value="EXW">EXW (Ex Works)</option>
                        <option value="DDP">DDP (Delivered Duty Paid)</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Precio FOB Unitario (USD) *</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        required
                        value={calcForm.fob}
                        onChange={e => setCalcForm(prev => ({ ...prev, fob: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Cantidad (unidades)</label>
                      <input
                        type="number"
                        min="1"
                        className="form-input"
                        placeholder="1"
                        value={calcForm.qty}
                        onChange={e => setCalcForm(prev => ({ ...prev, qty: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Flete Internacional Total (USD)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        value={calcForm.flete}
                        onChange={e => setCalcForm(prev => ({ ...prev, flete: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Seguro Internacional (USD)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        value={calcForm.seguro}
                        onChange={e => setCalcForm(prev => ({ ...prev, seguro: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="form-grid-2">
                    <div className="form-group">
                      <label className="form-label">Arancel Destino (%)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        value={calcForm.arancel}
                        onChange={e => setCalcForm(prev => ({ ...prev, arancel: e.target.value }))}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Otros Gastos en Destino (USD)</label>
                      <input
                        type="number"
                        step="any"
                        min="0"
                        className="form-input"
                        placeholder="0.00"
                        value={calcForm.otros}
                        onChange={e => setCalcForm(prev => ({ ...prev, otros: e.target.value }))}
                      />
                    </div>
                  </div>

                  {/* DESGLOSE EN TIEMPO REAL */}
                  <div className="calc-result-box">
                    <div className="calc-line">
                      <span className="calc-label">Valor FOB Total ({calcQty} u.)</span>
                      <span className="calc-value">${totalFOB.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                    </div>
                    <div className="calc-line">
                      <span className="calc-label">Flete internacional</span>
                      <span className="calc-value">${calcFlete.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                    </div>
                    <div className="calc-line">
                      <span className="calc-label">Seguro</span>
                      <span className="calc-value">${calcSeguro.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                    </div>
                    <div className="calc-line">
                      <span className="calc-label">Valor CIF Total</span>
                      <span className="calc-value" style={{ color: 'var(--dy-blue)', fontWeight: 700 }}>${cifValue.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                    </div>
                    <div className="calc-line">
                      <span className="calc-label">Arancel Destino ({calcArancelPct}%)</span>
                      <span className="calc-value">${arancelUSD.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                    </div>
                    <div className="calc-line">
                      <span className="calc-label">Otros gastos en destino</span>
                      <span className="calc-value">${calcOtros.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD</span>
                    </div>

                    <div className="calc-total-box">
                      <div>
                        <div className="calc-total-title">Costo Landed Total</div>
                        <div style={{ fontSize: '0.78rem', opacity: 0.85, marginTop: 2 }}>
                          Unitario: ${landedUnitario.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD / u.
                        </div>
                      </div>
                      <div className="calc-total-amount">
                        ${landedTotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      💾 Guardar Cálculo
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={handleResetCalc}>
                      Limpiar
                    </button>
                  </div>
                </form>
              </div>

              {/* LISTA DE CÁLCULOS GUARDADOS */}
              <div className="card">
                <div className="section-header" style={{ marginBottom: 20 }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                    <ClipboardList size={22} className="text-primary" /> Cálculos Guardados ({calculos.length})
                  </h3>
                </div>

                {calculos.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon"><Calculator size={36} /></div>
                    <div className="empty-state-text">No hay cálculos guardados aún. Los cálculos que guardes aparecerán en esta lista para su rápida consulta.</div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {calculos.map(c => {
                      const pObj = paises.find(p => String(p.id) === String(c.pais_id));
                      const unitVal = c.qty > 0 ? (parseFloat(c.landed) / parseFloat(c.qty)) : 0;
                      return (
                        <div key={c.id} style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>
                                {c.producto || 'Cálculo sin nombre'}
                              </div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                                {pObj ? (
                                  <span>{pObj.bandera ? `${pObj.bandera} ` : ''}{pObj.nombre}</span>
                                ) : (
                                  <span>{c.pais_nombre || 'Sin país'}</span>
                                )}
                                <span>•</span>
                                <span>{fmtDate(c.fecha)}</span>
                              </div>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--dy-blue)' }}>
                                ${parseFloat(c.landed || 0).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD
                              </div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2 }}>
                                ${unitVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD / u.
                              </div>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', background: 'var(--surface)', padding: '8px 12px', borderRadius: '8px', marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                            <span>FOB: <strong>${parseFloat(c.fob || 0).toLocaleString()}</strong></span>
                            <span>Cant: <strong>{c.qty || 1} u.</strong></span>
                            <span>Flete: <strong>${parseFloat(c.flete || 0).toLocaleString()}</strong></span>
                            <span>Arancel: <strong>{c.arancel || 0}%</strong></span>
                          </div>

                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                            <button
                              className="btn btn-secondary btn-sm"
                              onClick={() => handleLoadCalc(c)}
                              title="Cargar en el formulario para re-calcular"
                            >
                              <RefreshCw size={14} /> Cargar
                            </button>
                            <button
                              className="btn btn-secondary btn-sm"
                              style={{ color: 'var(--error)' }}
                              onClick={() => requestDelete('calculos', c.id, c.producto || 'Cálculo de exportación')}
                              title="Eliminar cálculo"
                            >
                              <Trash2 size={14} /> Eliminar
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ===== ALERTAS Y NOTIFICACIONES ===== */}
          {!loading && activeTab === 'alertas' && (
            <div className="card">
              <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <h3 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
                  <Bell size={22} className="text-primary" /> Alertas y Notificaciones del Sistema
                </h3>
                <span className="badge badge-navy">{activeAlerts.length} Alertas activas</span>
              </div>

              {activeAlerts.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><CheckCircle2 size={36} style={{ color: 'var(--success)' }} /></div>
                  <div className="empty-state-text">🎉 No hay alertas ni notificaciones pendientes. ¡Todo el sistema está al día!</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeAlerts.map(alt => (
                    <div
                      key={alt.id}
                      className="card"
                      onClick={() => switchTab(alt.tab)}
                      style={{
                        padding: '16px 20px',
                        cursor: 'pointer',
                        borderLeft: `5px solid ${alt.severity === 'red' ? 'var(--dy-red)' : alt.severity === 'amber' ? 'var(--warning)' : 'var(--dy-blue)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text)' }}>{alt.title}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{alt.subtitle}</div>
                      </div>
                      <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        Ver detalle <ChevronRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========== MODAL UNIVERSAL ========== */}
          {showModal && (
            <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(null); }}>
              <div className="modal-content">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <h3 style={{ margin: 0, fontSize: '1.1rem' }}>{
                    {
                      contacto: 'Contacto', visita: 'Visita / Reunión', oportunidad: 'Oportunidad',
                      operacion: 'Operación de exportación', cobranza: 'Cobranza', tarea: 'Tarea',
                      muestra: 'Muestra', comunicacion: 'Comunicación', pais: 'País destino',
                      precio: 'Precio competidor', tendencia: 'Nota de inteligencia'
                    }[showModal] || ''
                  }</h3>
                  <button className="icon-btn" onClick={() => setShowModal(null)}><X size={18} /></button>
                </div>

                <form onSubmit={(e) => {
                  const endpointMap = {
                    contacto: 'contactos', visita: 'visitas', oportunidad: 'oportunidades',
                    operacion: 'operaciones', cobranza: 'cobranzas', tarea: 'tareas',
                    muestra: 'muestras', comunicacion: 'comunicaciones', pais: 'paises',
                    precio: 'precios', tendencia: 'tendencias'
                  };
                  handleSave(e, endpointMap[showModal]);
                }}>
                  <div className="modal-body">
                    {/* FORM CONTACTO */}
                    {showModal === 'contacto' && <>
                      <div className="form-grid-2">
                        <div className="form-group"><label className="form-label">Nombre *</label><input type="text" className="form-input" required value={fv('nombre')} onChange={e => setFv('nombre', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Apellido</label><input type="text" className="form-input" value={fv('apellido')} onChange={e => setFv('apellido', e.target.value)} /></div>
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group"><label className="form-label">Empresa</label><input type="text" className="form-input" value={fv('empresa')} onChange={e => setFv('empresa', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Rol</label><select className="form-input" value={fv('rol') || 'Importador'} onChange={e => setFv('rol', e.target.value)}><option>Importador</option><option>Distribuidor</option><option>Broker</option><option>Retailer</option><option>Otro</option></select></div>
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group"><label className="form-label">País</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => { const p = paises.find(x => String(x.id) === String(e.target.value)); setFv('pais_id', e.target.value || null); setFv('pais_nombre', p ? p.nombre : ''); }}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                        <div className="form-group"><label className="form-label">Ciudad</label><input type="text" className="form-input" value={fv('ciudad')} onChange={e => setFv('ciudad', e.target.value)} /></div>
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={fv('email')} onChange={e => setFv('email', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Teléfono</label><input type="text" className="form-input" value={fv('telefono')} onChange={e => setFv('telefono', e.target.value)} /></div>
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group"><label className="form-label">Estado</label><select className="form-input" value={fv('estado') || 'Activo'} onChange={e => setFv('estado', e.target.value)}><option>Activo</option><option>En proceso</option><option>Prospecto</option><option>Inactivo</option><option>Descartado</option></select></div>
                        {fv('estado') === 'En proceso' && (
                          <div className="form-group"><label className="form-label">Etapa comercial</label><select className="form-input" value={fv('etapa_comercial') || 'Primer contacto'} onChange={e => setFv('etapa_comercial', e.target.value)}><option>Primer contacto</option><option>Reunión exploratoria</option><option>Cotización</option><option>Negociación</option><option>Habilitación regulatoria</option></select></div>
                        )}
                      </div>
                      <div className="form-grid-3">
                        <div className="form-group" style={{ gridColumn: '1 / -1' }}><label className="form-label">Próxima acción</label><input type="text" className="form-input" value={fv('proxima_accion')} onChange={e => setFv('proxima_accion', e.target.value)} placeholder="Ej: Enviar cotización CIF Santos" /></div>
                        <div className="form-group"><label className="form-label">Fecha próxima acción</label><input type="date" className="form-input" value={fvDate('proxima_accion_fecha')} onChange={e => setFv('proxima_accion_fecha', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Hora próxima acción</label><input type="time" className="form-input" value={fv('proxima_accion_hora')} onChange={e => setFv('proxima_accion_hora', e.target.value)} /></div>
                      </div>
                      <div className="form-group"><label className="form-label">Notas</label><RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} /></div>
                    </>}

                    {/* FORM VISITA */}
                    {showModal === 'visita' && <>
                      <div className="form-group"><label className="form-label">Título *</label><input type="text" className="form-input" required value={fv('titulo')} onChange={e => setFv('titulo', e.target.value)} placeholder="Ej: Feria APAS 2026 / Ronda ProCórdoba" /></div>
                      <div className="form-grid-2">
                        <div className="form-group"><label className="form-label">Tipo</label><select className="form-input" value={fv('tipo') || 'Feria internacional'} onChange={e => setFv('tipo', e.target.value)}><option>Feria internacional</option><option>Ronda de negocios</option><option>Reunión comercial</option><option>Visita a cliente</option><option>Videoconferencia</option></select></div>
                        <div className="form-group"><label className="form-label">Estado</label><select className="form-input" value={fv('estado') || 'Planificada'} onChange={e => setFv('estado', e.target.value)}><option>Planificada</option><option>Realizada</option><option>Cancelada</option></select></div>
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group"><label className="form-label">Fecha Inicio</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Hora Inicio</label><input type="time" className="form-input" value={fv('hora')} onChange={e => setFv('hora', e.target.value)} /></div>
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group"><label className="form-label">Fecha Fin (multidía)</label><input type="date" className="form-input" value={fvDate('fecha_fin')} onChange={e => setFv('fecha_fin', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Hora Fin</label><input type="time" className="form-input" value={fv('hora_fin')} onChange={e => setFv('hora_fin', e.target.value)} /></div>
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Cliente Vinculado (Base CRM)</label>
                          <select className="form-input" value={fv('contacto_id') || ''} onChange={e => {
                            const val = e.target.value || null;
                            setFv('contacto_id', val);
                            if (val) {
                              const c = contactos.find(x => String(x.id) === String(val));
                              if (c && !fv('contactos')) setFv('contactos', `${c.nombre} ${c.apellido || ''} (${c.empresa || 'Empresa'})`);
                            }
                          }}>
                            <option value="">Selecciona cliente registrado...</option>
                            {contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''} ({c.empresa || 'Empresa'})</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Contacto / Asistentes (Texto Libre)</label>
                          <input type="text" className="form-input" value={fv('contactos')} onChange={e => setFv('contactos', e.target.value)} placeholder="Ej: Juan Pérez / Empresa XYZ (o texto libre)" />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Lugar / Ciudad / Sede</label>
                        <input type="text" className="form-input" value={fv('lugar')} onChange={e => setFv('lugar', e.target.value)} placeholder="São Paulo, Brasil / Stand 45" />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Vincular a Evento Padre / Ronda Marco</label>
                        <select className="form-input" value={fv('actividad_padre_id') || ''} onChange={e => setFv('actividad_padre_id', e.target.value || null)}>
                          <option value="">Ninguno (Es un evento principal)</option>
                          {visitas.filter(v => v.id !== fv('id')).map(v => (
                            <option key={v.id} value={v.id}>{v.titulo} ({v.tipo} - {fmtDate(v.fecha)})</option>
                          ))}
                        </select>
                      </div>

                      {/* PANEL DE OPCIONES EXTRAS DE RONDA DE NEGOCIOS Y FERIAS */}
                      {(fv('tipo') === 'Ronda de negocios' || fv('tipo') === 'Feria internacional' || fv('ronda_importadores') > 0) && (
                        <div style={{ background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)' }}>
                          <h4 className="form-section-title" style={{ fontSize: '0.88rem', fontWeight: 700, margin: '0 0 12px 0', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <Briefcase size={16} /> Opciones Extras: Ronda de Negocios / Feria
                          </h4>
                          <div className="form-grid-2">
                            <div className="form-group">
                              <label className="form-label">Organización / Entidad Organizadora</label>
                              <input type="text" className="form-input" value={fv('ronda_org')} onChange={e => setFv('ronda_org', e.target.value)} placeholder="Ej: ProCórdoba, Cancillería, Cámara Comercio" />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Total Reuniones Agendadas</label>
                              <input type="number" min="0" className="form-input" value={fv('ronda_reuniones')} onChange={e => setFv('ronda_reuniones', e.target.value)} placeholder="0" />
                            </div>
                          </div>
                          <div className="form-grid-2">
                            <div className="form-group">
                              <label className="form-label">Importadores / Contactos Calificados Relevados</label>
                              <input type="number" min="0" className="form-input" value={fv('ronda_importadores')} onChange={e => setFv('ronda_importadores', e.target.value)} placeholder="0" />
                            </div>
                            <div className="form-group">
                              <label className="form-label">Planilla / Adjunto Excel de Relevamiento (Link)</label>
                              <input type="text" className="form-input" value={fv('excel_url')} onChange={e => setFv('excel_url', e.target.value)} placeholder="Link Drive / Excel con importadores" />
                            </div>
                          </div>
                          <div className="form-group" style={{ marginBottom: 0 }}>
                            <label className="form-label">Resultado / Balance de la Ronda</label>
                            <input type="text" className="form-input" value={fv('ronda_resultado')} onChange={e => setFv('ronda_resultado', e.target.value)} placeholder="Ej: 8 reuniones exitosas, 3 cotizaciones solicitadas" />
                          </div>
                        </div>
                      )}

                      <div className="form-group"><label className="form-label">Notas / Minuta de la Reunión</label><RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} /></div>
                    </>}

                    {/* FORM OPORTUNIDAD */}
                    {showModal === 'oportunidad' && <>
                      <div className="form-group">
                        <label className="form-label">Nombre de la Oportunidad *</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          value={fv('nombre')}
                          onChange={e => setFv('nombre', e.target.value)}
                          placeholder="Ej: Tapas Don Yeyo — Walmart México"
                        />
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Contacto / Cliente CRM (opcional)</label>
                          <select
                            className="form-input"
                            value={fv('contacto_id') || ''}
                            onChange={e => {
                              const val = e.target.value || null;
                              const c = contactos.find(x => String(x.id) === String(val));
                              setFv('contacto_id', val);
                              setFv('contacto_nombre', c ? `${c.nombre} ${c.apellido || ''} (${c.empresa || 'Empresa'})` : '');
                            }}
                          >
                            <option value="">Selecciona contacto (opcional)...</option>
                            {contactos.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.nombre} {c.apellido || ''} ({c.empresa || 'Empresa'})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">País de destino (opcional)</label>
                          <select
                            className="form-input"
                            value={fv('pais_id') || ''}
                            onChange={e => {
                              const val = e.target.value || null;
                              const p = paises.find(x => String(x.id) === String(val));
                              setFv('pais_id', val);
                              setFv('pais_nombre', p ? p.nombre : '');
                            }}
                          >
                            <option value="">Selecciona país (opcional)...</option>
                            {paises.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.bandera ? `${p.bandera} ` : ''}{p.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Marca</label>
                          <select className="form-input" value={fv('marca') || 'Don Yeyo'} onChange={e => setFv('marca', e.target.value)}>
                            <option>Don Yeyo</option>
                            <option>DeViano</option>
                            <option>Otro</option>
                          </select>
                        </div>
                        {fv('marca') === 'Otro' && (
                          <div className="form-group">
                            <label className="form-label">Especificar Marca</label>
                            <input type="text" className="form-input" value={fv('marca_otra')} onChange={e => setFv('marca_otra', e.target.value)} />
                          </div>
                        )}
                        <div className="form-group">
                          <label className="form-label">Categoría</label>
                          <select className="form-input" value={fv('categoria') || 'Tapas'} onChange={e => setFv('categoria', e.target.value)}>
                            <option>Tapas</option>
                            <option>Pastas</option>
                            <option>Panificados</option>
                            <option>Tortillas</option>
                            <option>Nuevo desarrollo</option>
                          </select>
                        </div>
                        {fv('categoria') === 'Nuevo desarrollo' && (
                          <div className="form-group">
                            <label className="form-label">Detalle Nuevo Desarrollo</label>
                            <input type="text" className="form-input" value={fv('categoria_detalle')} onChange={e => setFv('categoria_detalle', e.target.value)} />
                          </div>
                        )}
                      </div>
                      <div className="form-grid-3">
                        <div className="form-group">
                          <label className="form-label">Inversión / Monto (USD)</label>
                          <input type="number" step="any" min="0" className="form-input" value={fv('monto')} onChange={e => setFv('monto', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Probabilidad (%)</label>
                          <select className="form-input" value={fv('probabilidad') || '50%'} onChange={e => setFv('probabilidad', e.target.value)}>
                            <option value="10%">10% (Baja)</option>
                            <option value="25%">25% (Media Baja)</option>
                            <option value="50%">50% (Media)</option>
                            <option value="75%">75% (Alta)</option>
                            <option value="90%">90% (Muy Alta)</option>
                            <option value="100%">100% (Ganada / Cerrada)</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Etapa</label>
                          <select className="form-input" value={fv('etapa') || 'En análisis'} onChange={e => setFv('etapa', e.target.value)}>
                            <option>En análisis</option>
                            <option>En proceso</option>
                            <option>Finalizado</option>
                            <option>Descartado</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Responsable</label>
                          <input type="text" className="form-input" value={fv('responsable')} onChange={e => setFv('responsable', e.target.value)} placeholder="Responsable asignado" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Cierre estimado</label>
                          <input type="date" className="form-input" value={fvDate('cierre')} onChange={e => setFv('cierre', e.target.value)} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Notas / Detalle libre</label>
                        <RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} />
                      </div>
                    </>}

                    {/* FORM OPERACION */}
                    {showModal === 'operacion' && <>
                      <div className="form-group"><label className="form-label">Número de pedido *</label><input type="text" className="form-input" required value={fv('numero_pedido')} onChange={e => setFv('numero_pedido', e.target.value)} placeholder="Ej: PED-2026-089" /></div>
                      <div className="form-grid-2">
                        <div className="form-group"><label className="form-label">Cliente activo CRM</label><select className="form-input" value={fv('cliente_id') || ''} onChange={e => setFv('cliente_id', e.target.value || null)}><option value="">Selecciona...</option>{contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''} ({c.empresa || 'Empresa'})</option>)}</select></div>
                        <div className="form-group"><label className="form-label">País destino</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group"><label className="form-label">Estado</label><select className="form-input" value={fv('estado') || 'Pedido recibido'} onChange={e => setFv('estado', e.target.value)}><option>Pedido recibido</option><option>En proceso</option><option>Despachado</option></select></div>
                        <div className="form-group"><label className="form-label">Fecha de entrega programada</label><input type="date" className="form-input" value={fvDate('fecha_entrega')} onChange={e => setFv('fecha_entrega', e.target.value)} /></div>
                      </div>
                      <div className="form-grid-3">
                        <div className="form-group"><label className="form-label">Unidades</label><input type="number" min="0" className="form-input" value={fv('unidades')} onChange={e => setFv('unidades', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Valor en USD</label><input type="number" step="any" min="0" className="form-input" value={fv('valor_usd')} onChange={e => setFv('valor_usd', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Kilogramos (kg)</label><input type="number" step="any" min="0" className="form-input" value={fv('kilogramos')} onChange={e => setFv('kilogramos', e.target.value)} /></div>
                      </div>
                      <div className="form-group"><label className="form-label">Incoterm</label><select className="form-input" value={fv('incoterm') || 'FOB'} onChange={e => setFv('incoterm', e.target.value)}><option>FOB</option><option>CIF</option><option>EXW</option><option>CFR</option><option>DDP</option></select></div>
                    </>}

                    {/* FORM TAREA */}
                    {showModal === 'tarea' && <>
                      {editingItem && editingItem.status !== 'hecha' && daysFrom(editingItem.fecha) < 0 && (
                        <div style={{
                          background: 'rgba(245, 158, 11, 0.15)',
                          border: '1px solid rgba(245, 158, 11, 0.4)',
                          color: '#d97706',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                          marginBottom: 14,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8
                        }}>
                          <AlertTriangle size={16} />
                          <span>⚠️ Esta tarea venció hace {Math.abs(daysFrom(editingItem.fecha))} {Math.abs(daysFrom(editingItem.fecha)) === 1 ? 'día' : 'días'}</span>
                        </div>
                      )}
                      <div className="form-group">
                        <label className="form-label">Título de la tarea *</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          value={fv('titulo')}
                          onChange={e => setFv('titulo', e.target.value)}
                          placeholder="Ej: Enviar fichas técnicas a importador"
                        />
                      </div>
                      <div className="form-grid-3">
                        <div className="form-group">
                          <label className="form-label">Fecha límite</label>
                          <input
                            type="date"
                            className="form-input"
                            value={fvDate('fecha')}
                            onChange={e => setFv('fecha', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Hora inicio</label>
                          <input
                            type="time"
                            className="form-input"
                            value={fv('hora')}
                            onChange={e => setFv('hora', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Prioridad</label>
                          <select
                            className="form-input"
                            value={fv('prioridad') || 'media'}
                            onChange={e => setFv('prioridad', e.target.value)}
                          >
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="baja">Baja</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Asignado a</label>
                          <input
                            type="text"
                            className="form-input"
                            value={fv('asignado')}
                            onChange={e => setFv('asignado', e.target.value)}
                            placeholder="Responsable asignado"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">País relacionado (opcional)</label>
                          <select
                            className="form-input"
                            value={fv('pais_id') || ''}
                            onChange={e => {
                              const val = e.target.value || null;
                              const p = paises.find(x => String(x.id) === String(val));
                              setFv('pais_id', val);
                              setFv('pais_nombre', p ? p.nombre : '');
                            }}
                          >
                            <option value="">Selecciona país (opcional)...</option>
                            {paises.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.bandera ? `${p.bandera} ` : ''}{p.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Notas / Detalle</label>
                        <RichTextEditor
                          value={fv('notas')}
                          onChange={v => setFv('notas', v)}
                        />
                      </div>
                    </>}

                    {/* FORM MUESTRA */}
                    {showModal === 'muestra' && <>
                      <div className="form-group">
                        <label className="form-label">Productos en la Muestra *</label>
                        <MuestraProductosManager
                          value={fv('producto')}
                          onChange={v => setFv('producto', v)}
                          productosFinnegans={productosFinnegans}
                        />
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Cliente Vinculado (Base CRM)</label>
                          <select className="form-input" value={fv('contacto_id') || ''} onChange={e => {
                            const val = e.target.value || null;
                            setFv('contacto_id', val);
                            if (val) {
                              const c = contactos.find(x => String(x.id) === String(val));
                              if (c) setFv('destinatario', `${c.nombre} ${c.apellido || ''} (${c.empresa || 'Empresa'})`);
                            }
                          }}>
                            <option value="">Selecciona cliente registrado...</option>
                            {contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''} ({c.empresa || 'Empresa'})</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Destinatario / Consignatario *</label>
                          <input type="text" className="form-input" required value={fv('destinatario')} onChange={e => setFv('destinatario', e.target.value)} placeholder="Ej: Juan Pérez / Importadora del Sur" />
                        </div>
                      </div>
                      <div className="form-grid-3">
                        <div className="form-group">
                          <label className="form-label">País Destino</label>
                          <select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}>
                            <option value="">Selecciona...</option>
                            {paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Fecha de Envío</label>
                          <input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Resultado / Estado</label>
                          <select className="form-input" value={fv('resultado') || 'Pendiente'} onChange={e => setFv('resultado', e.target.value)}>
                            <option>Pendiente</option>
                            <option>En evaluación</option>
                            <option>Positivo</option>
                            <option>Negativo</option>
                            <option>Aprobada</option>
                            <option>Rechazada</option>
                            <option>En tránsito</option>
                            <option>Feedback recibido</option>
                          </select>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">Costo Envío (USD)</label>
                        <input type="number" step="any" min="0" className="form-input" value={fv('costo')} onChange={e => setFv('costo', e.target.value)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Notas / Comentarios de Seguimiento</label>
                        <RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} />
                      </div>
                    </>}

                    {/* FORM PAÍS */}
                    {showModal === 'pais' && <>
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">País *</label>
                          <input type="text" className="form-input" required value={fv('nombre')} onChange={e => setFv('nombre', e.target.value)} placeholder="Ej: Brasil" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Bandera emoji</label>
                          <input type="text" className="form-input" value={fv('bandera')} onChange={e => setFv('bandera', e.target.value)} placeholder="🇧🇷" />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Incoterm habitual</label>
                          <select className="form-input" value={fv('incoterm_habitual') || 'FOB'} onChange={e => setFv('incoterm_habitual', e.target.value)}>
                            <option>FOB</option>
                            <option>CIF</option>
                            <option>EXW</option>
                            <option>CFR</option>
                            <option>DDP</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Posición arancelaria / NCM</label>
                          <input type="text" className="form-input" value={fv('ncm')} onChange={e => setFv('ncm', e.target.value)} placeholder="Ej: 1905.90.90" />
                        </div>
                      </div>

                      <div className="form-grid-3">
                        <div className="form-group">
                          <label className="form-label">Arancel principal (%)</label>
                          <input type="number" step="any" min="0" className="form-input" value={fv('arancel')} onChange={e => setFv('arancel', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Moneda local</label>
                          <input type="text" className="form-input" value={fv('moneda')} onChange={e => setFv('moneda', e.target.value)} placeholder="BRL, USD, EUR..." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Tipo de cambio (vs USD)</label>
                          <input type="number" step="any" min="0" className="form-input" value={fv('tipocambio')} onChange={e => setFv('tipocambio', e.target.value)} placeholder="Ej: 5.4200" />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Fecha tipo de cambio</label>
                          <input type="date" className="form-input" value={fvDate('tc_fecha')} onChange={e => setFv('tc_fecha', e.target.value)} />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Organismo sanitario regulador</label>
                          <input type="text" className="form-input" value={fv('sanitario')} onChange={e => setFv('sanitario', e.target.value)} placeholder="Ej: ANVISA, FDA, SENASA..." />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Certificados / documentación obligatoria</label>
                        <RichTextEditor value={fv('sanitario_req')} onChange={v => setFv('sanitario_req', v)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Requisitos de etiquetado</label>
                        <RichTextEditor value={fv('etiquetado')} onChange={v => setFv('etiquetado', v)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Notas / Acceso al mercado (campo de texto libre)</label>
                        <RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Fotografías o ejemplos de etiquetado de referencia</label>
                        <ProImageUploader value={fv('etiquetado_fotos')} onChange={v => setFv('etiquetado_fotos', v)} maxFiles={5} />
                      </div>
                    </>}

                    {/* FORM PRECIO */}
                    {showModal === 'precio' && <>
                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Competidor *</label>
                          <input type="text" className="form-input" required value={fv('competidor')} onChange={e => setFv('competidor', e.target.value)} placeholder="Ej: Bauducco, Panzani, etc." />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Producto / Descripción</label>
                          <input type="text" className="form-input" value={fv('producto')} onChange={e => setFv('producto', e.target.value)} placeholder="Ej: Lasagna 500g" />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">País relevamiento (opcional)</label>
                          <select
                            className="form-input"
                            value={fv('pais_id') || ''}
                            onChange={e => {
                              const val = e.target.value || null;
                              const p = paises.find(x => String(x.id) === String(val));
                              setFv('pais_id', val);
                              setFv('pais_nombre', p ? p.nombre : '');
                            }}
                          >
                            <option value="">Selecciona país (opcional)...</option>
                            {paises.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.bandera ? `${p.bandera} ` : ''}{p.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Categoría (opcional)</label>
                          <select
                            className="form-input"
                            value={fv('categoria') || ''}
                            onChange={e => setFv('categoria', e.target.value)}
                          >
                            <option value="">Selecciona categoría (opcional)...</option>
                            <option value="Tapas de Empanadas">Tapas de Empanadas</option>
                            <option value="Pascualinas">Pascualinas</option>
                            <option value="Fideos y Pastas Frescas">Fideos y Pastas Frescas</option>
                            <option value="Pastas Rellenas">Pastas Rellenas</option>
                            <option value="Tortillas de Trigo">Tortillas de Trigo</option>
                            <option value="Panificados y Bolsas">Panificados y Bolsas</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-grid-3">
                        <div className="form-group">
                          <label className="form-label">Precio (USD)</label>
                          <input type="number" step="any" min="0" className="form-input" value={fv('precio')} onChange={e => setFv('precio', e.target.value)} placeholder="Ej: 3.50" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Peso envase (kg)</label>
                          <input type="number" step="any" min="0" className="form-input" value={fv('peso')} onChange={e => setFv('peso', e.target.value)} placeholder="Ej: 0.500" />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Precio / kg (calculado)</label>
                          <input
                            type="text"
                            className="form-input"
                            readOnly
                            disabled
                            value={
                              (parseFloat(fv('precio')) > 0 && parseFloat(fv('peso')) > 0)
                                ? `$${(parseFloat(fv('precio')) / parseFloat(fv('peso'))).toFixed(2)} USD / kg`
                                : 'Automático al ingresar precio y peso'
                            }
                            style={{ background: 'var(--surface-hover)', fontWeight: 600, color: 'var(--dy-blue)' }}
                          />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Fecha de relevamiento</label>
                          <input
                            type="date"
                            className="form-input"
                            value={fvDate('fecha') || new Date().toISOString().substring(0, 10)}
                            onChange={e => setFv('fecha', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Fuente</label>
                          <input type="text" className="form-input" value={fv('fuente')} onChange={e => setFv('fuente', e.target.value)} placeholder="Feria APAS, Visita góndola..." />
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Fotos de producto / góndola</label>
                        <ProImageUploader value={fv('imagen_url')} onChange={v => setFv('imagen_url', v)} maxFiles={5} />
                      </div>
                    </>}

                    {/* FORM TENDENCIA */}
                    {showModal === 'tendencia' && <>
                      <div className="form-group"><label className="form-label">Título *</label><input type="text" className="form-input" required value={fv('titulo')} onChange={e => setFv('titulo', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Descripción</label><RichTextEditor value={fv('descripcion')} onChange={v => setFv('descripcion', v)} /></div>
                      <div className="form-group"><label className="form-label">Fuente</label><input type="text" className="form-input" value={fv('fuente')} onChange={e => setFv('fuente', e.target.value)} /></div>
                    </>}

                    {/* FORM COBRANZA */}
                    {showModal === 'cobranza' && <>
                      <div className="form-group">
                        <label className="form-label">Operación / Referencia de Factura *</label>
                        <input
                          type="text"
                          className="form-input"
                          required
                          value={fv('descripcion')}
                          onChange={e => setFv('descripcion', e.target.value)}
                          placeholder="Ej: Factura EX-2026-042 / Contenedor Santos"
                        />
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Cliente / Empresa</label>
                          <select
                            className="form-input"
                            value={fv('cliente_id') || ''}
                            onChange={e => {
                              const val = e.target.value || null;
                              const c = contactos.find(x => String(x.id) === String(val));
                              setFv('cliente_id', val);
                              setFv('cliente_nombre', c ? `${c.nombre} ${c.apellido || ''} (${c.empresa || 'Empresa'})` : '');
                            }}
                          >
                            <option value="">Selecciona cliente registrado...</option>
                            {contactos.map(c => (
                              <option key={c.id} value={c.id}>
                                {c.nombre} {c.apellido || ''} ({c.empresa || 'Empresa'})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">País destino</label>
                          <select
                            className="form-input"
                            value={fv('pais_id') || ''}
                            onChange={e => {
                              const val = e.target.value || null;
                              const p = paises.find(x => String(x.id) === String(val));
                              setFv('pais_id', val);
                              setFv('pais_nombre', p ? p.nombre : '');
                            }}
                          >
                            <option value="">Selecciona país (opcional)...</option>
                            {paises.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.bandera ? `${p.bandera} ` : ''}{p.nombre}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="form-grid-3">
                        <div className="form-group">
                          <label className="form-label">Monto Total Operación (USD)</label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="form-input"
                            value={fv('monto')}
                            onChange={e => setFv('monto', e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Monto Cobrado (USD)</label>
                          <input
                            type="number"
                            step="any"
                            min="0"
                            className="form-input"
                            value={fv('cobrado_monto')}
                            onChange={e => setFv('cobrado_monto', e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Saldo Pendiente (calculado)</label>
                          <input
                            type="text"
                            className="form-input"
                            readOnly
                            disabled
                            value={`$${Math.max(0, (parseFloat(fv('monto')) || 0) - (parseFloat(fv('cobrado_monto')) || 0)).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`}
                            style={{
                              background: 'var(--surface-hover)',
                              fontWeight: 700,
                              color: ((parseFloat(fv('monto')) || 0) - (parseFloat(fv('cobrado_monto')) || 0)) > 0 ? 'var(--dy-red)' : 'var(--success)'
                            }}
                          />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Unidades exportadas</label>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            value={fv('unidades')}
                            onChange={e => setFv('unidades', e.target.value)}
                            placeholder="Ej: 5000"
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Marca</label>
                          <select
                            className="form-input"
                            value={fv('marca') || 'Don Yeyo'}
                            onChange={e => setFv('marca', e.target.value)}
                          >
                            <option value="Don Yeyo">Don Yeyo</option>
                            <option value="DeViano">DeViano</option>
                            <option value="Otra">Otra</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Fecha de embarque</label>
                          <input
                            type="date"
                            className="form-input"
                            value={fvDate('embarque')}
                            onChange={e => setFv('embarque', e.target.value)}
                          />
                        </div>
                        <div className="form-group">
                          <label className="form-label">Fecha vencimiento cobro (Genera tarea)</label>
                          <input
                            type="date"
                            className="form-input"
                            value={fvDate('vencimiento')}
                            onChange={e => setFv('vencimiento', e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="form-grid-2">
                        <div className="form-group">
                          <label className="form-label">Estado</label>
                          <select
                            className="form-input"
                            value={fv('estado') || 'Pendiente'}
                            onChange={e => setFv('estado', e.target.value)}
                          >
                            <option value="Pendiente">Pendiente</option>
                            <option value="Cobrado parcial">Cobrado parcial</option>
                            <option value="Cobrado total">Cobrado total</option>
                            <option value="Vencido">Vencido</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label className="form-label">Medio de pago</label>
                          <select
                            className="form-input"
                            value={fv('medio_pago') || 'Transferencia'}
                            onChange={e => setFv('medio_pago', e.target.value)}
                          >
                            <option value="Carta de crédito">Carta de crédito</option>
                            <option value="Transferencia">Transferencia</option>
                            <option value="Anticipo">Anticipo</option>
                            <option value="Cobranza documentaria">Cobranza documentaria</option>
                            <option value="Cuenta corriente">Cuenta corriente</option>
                            <option value="Otro">Otro</option>
                          </select>
                        </div>
                      </div>

                      <div className="form-group">
                        <label className="form-label">Notas / Instrucciones bancarias</label>
                        <RichTextEditor
                          value={fv('notas')}
                          onChange={v => setFv('notas', v)}
                        />
                      </div>
                    </>}

                  </div>

                  <div className="modal-footer">
                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(null)}>Cancelar</button>
                    <button type="submit" className="btn btn-primary">Guardar</button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* ========== MODAL VISUALIZADOR DE FOTOS (LIGHTBOX) ========== */}
          {previewImage && (
            <div className="modal-backdrop" onClick={() => setPreviewImage(null)} style={{ zIndex: 1100 }}>
              <div className="modal-content" style={{ maxWidth: '650px', padding: 20, textAlign: 'center' }} onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>📷 Fotografía de Góndola / Producto</h4>
                  <button className="icon-btn" onClick={() => setPreviewImage(null)}><X size={18} /></button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxHeight: '75vh', overflowY: 'auto' }}>
                  {parseImageUrls(previewImage).map((url, idx) => (
                    <img key={idx} src={url} alt={`Góndola ${idx + 1}`} style={{ width: '100%', borderRadius: '10px', objectFit: 'contain', maxHeight: '500px' }} />
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
