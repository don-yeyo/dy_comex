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
  Filter, PieChart, Boxes, Send
} from 'lucide-react';
import logo from './assets/logo-don-yeyo-png-sin-fondo.png';
import { ToastContainer, useToast } from './components/Toast';
import ConfirmModal from './components/ConfirmModal';
import RichTextEditor from './components/RichTextEditor';
import './App.css';

// Config from env
const APP_CONFIG = {
  companyName: import.meta.env.VITE_COMPANY_NAME || 'DON YEYO S.A.',
  appVersion: import.meta.env.VITE_APP_VERSION || '1.0.0',
  appName: import.meta.env.VITE_APP_NAME || 'TradeCRM',
  defaultUserName: import.meta.env.VITE_DEFAULT_USER_NAME || 'Usuario',
  defaultUserEmail: import.meta.env.VITE_DEFAULT_USER_EMAIL || 'usuario@empresa.com'
};

// Configurar base URL para Axios
axios.defaults.baseURL = '/api';

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
    contactos: { maxLength: 300, label: 'Contactos' }
  },
  oportunidad: {
    nombre: { required: true, maxLength: 200, label: 'Nombre' },
    monto: { min: 0, label: 'Monto' },
    prob: { min: 0, max: 100, label: 'Probabilidad' }
  },
  tarea: {
    titulo: { required: true, maxLength: 200, label: 'Descripción' }
  },
  cobranza: {
    descripcion: { required: true, maxLength: 250, label: 'Operación' },
    monto: { min: 0, label: 'Monto' }
  },
  muestra: {
    producto: { required: true, maxLength: 200, label: 'Producto' },
    destinatario: { maxLength: 150, label: 'Destinatario' }
  },
  comunicacion: {
    asunto: { required: true, maxLength: 200, label: 'Asunto' }
  },
  documento: {
    nombre: { required: true, maxLength: 200, label: 'Nombre' },
    numero: { maxLength: 100, label: 'Número' }
  },
  pais: {
    nombre: { required: true, maxLength: 100, label: 'País' },
    bandera: { maxLength: 4, label: 'Bandera' },
    incoterm: { maxLength: 50, label: 'Incoterm' },
    moneda: { maxLength: 10, label: 'Moneda' },
    ncm: { maxLength: 30, label: 'NCM' }
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

// Helper para formatear fecha
const fmtDate = (d) => {
  if (!d) return '—';
  const dt = new Date(d + 'T12:00');
  return dt.toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' });
};

// Helper para días desde hoy
const daysFrom = (d) => {
  if (!d) return 9999;
  return Math.round((new Date(d + 'T12:00') - new Date()) / (1000 * 60 * 60 * 24));
};

// Badge de prioridad
const priorBadge = (p) => {
  const m = { alta: 'badge-red', media: 'badge-amber', baja: 'badge-gray' };
  return <span className={`badge ${m[p] || 'badge-gray'}`}>{p || 'media'}</span>;
};

// Badge de etapa
const etapaBadge = (e) => {
  const m = { Prospecto: 'badge-gray', Contactado: 'badge-blue', Propuesta: 'badge-amber', Negociación: 'badge-purple', Cerrado: 'badge-green', Perdido: 'badge-red' };
  return <span className={`badge ${m[e] || 'badge-gray'}`}>{e}</span>;
};

// Badge de estado
const estadoBadge = (e) => {
  const m = { Activo: 'badge-green', Prospecto: 'badge-gray', 'En proceso': 'badge-amber', Inactivo: 'badge-red', Vigente: 'badge-green', 'Por vencer': 'badge-amber', Vencido: 'badge-red', Realizada: 'badge-green', Planificada: 'badge-blue', Cancelada: 'badge-red', Pendiente: 'badge-gray', 'En evaluación': 'badge-amber', 'Positivo': 'badge-green', Negativo: 'badge-red', Cobrado: 'badge-green', 'Cobrado parcial': 'badge-amber', 'En Negociacion': 'badge-amber' };
  return <span className={`badge ${m[e] || 'badge-gray'}`}>{e}</span>;
};

// Lucide icon por tipo de visita
const visitaIconMap = {
  'Feria internacional': <Landmark size={16} />,
  'Ronda de negocios': <Handshake size={16} />,
  'Reunión comercial': <BriefcaseBusiness size={16} />,
  'Visita a cliente': <Store size={16} />,
  'Videoconferencia': <Video size={16} />
};
const visitaIcon = (tipo) => visitaIconMap[tipo] || <Calendar size={16} />;

// Lucide icon por tipo de documento
const docIconMap = {
  'Invoice': <Receipt size={16} />,
  'Bill of Lading': <Ship size={16} />,
  'Packing List': <ClipboardList size={16} />,
  'Certificado fitosanitario': <Leaf size={16} />,
  'Certificado de origen': <Scroll size={16} />,
  'Contrato': <FileSignature size={16} />,
  'Otro': <File size={16} />
};
const docIcon = (tipo) => docIconMap[tipo] || <File size={16} />;

// Lucide icon por tipo de comunicación
const comIconMap = {
  Email: <Mail size={16} />,
  Llamada: <Phone size={16} />,
  WhatsApp: <MessageCircle size={16} />,
  Reunión: <Handshake size={16} />,
  Videollamada: <Camera size={16} />
};
const comIcon = (tipo) => comIconMap[tipo] || <MessageCircle size={16} />;

// ========== LOCALSTORAGE helpers ==========
const lsGet = (key, fallback = '') => {
  try { return localStorage.getItem(`dy_${key}`) || fallback; } catch { return fallback; }
};
const lsSet = (key, val) => {
  try { localStorage.setItem(`dy_${key}`, val); } catch { /* noop */ }
};

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [uiZoom, setUiZoom] = useState(localStorage.getItem('uiZoom') || 'md');
  const [user] = useState({ name: APP_CONFIG.defaultUserName, email: APP_CONFIG.defaultUserEmail, rol: 'admin' });
  const [activeTab, setActiveTab] = useState(lsGet('activeTab', 'dashboard'));
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Toast & Confirm
  const { toasts, addToast, removeToast } = useToast();
  const [confirmState, setConfirmState] = useState({ open: false, title: '', message: '', onConfirm: null });

  // Estados de Negocio
  const [paises, setPaises] = useState([]);
  const [contactos, setContactos] = useState([]);
  const [finnegansClientes, setFinnegansClientes] = useState([]);
  const [visitas, setVisitas] = useState([]);
  const [oportunidades, setOportunidades] = useState([]);
  const [muestras, setMuestras] = useState([]);
  const [comunicaciones, setComunicaciones] = useState([]);
  const [documentos, setDocumentos] = useState([]);
  const [precios, setPrecios] = useState([]);
  const [tendencias, setTendencias] = useState([]);
  const [calculos, setCalculos] = useState([]);
  const [cobranzas, setCobranzas] = useState([]);
  const [tareas, setTareas] = useState([]);

  // Estados de Formularios y Modales
  const [showModal, setShowModal] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [loadingSync, setLoadingSync] = useState(false);
  const [subTab, setSubTab] = useState('muestras');
  const [intelTab, setIntelTab] = useState('precios');

  // ========== FILTROS (con localStorage) ==========
  const [taskFilterStatus, setTaskFilterStatus] = useState(lsGet('f_taskStatus'));
  const [taskFilterPrior, setTaskFilterPrior] = useState(lsGet('f_taskPrior'));
  const [contactSearch, setContactSearch] = useState('');
  const [contactFilterPais, setContactFilterPais] = useState(lsGet('f_contactPais'));
  const [contactFilterRol, setContactFilterRol] = useState(lsGet('f_contactRol'));
  const [visitaFilterTipo, setVisitaFilterTipo] = useState(lsGet('f_visitaTipo'));
  const [visitaFilterEstado, setVisitaFilterEstado] = useState(lsGet('f_visitaEstado'));
  const [opFilterEtapa, setOpFilterEtapa] = useState(lsGet('f_opEtapa'));
  const [opFilterMarca, setOpFilterMarca] = useState(lsGet('f_opMarca'));
  const [muestraFilterRes, setMuestraFilterRes] = useState(lsGet('f_muestraRes'));
  const [comFilterTipo, setComFilterTipo] = useState(lsGet('f_comTipo'));
  const [docFilterTipo, setDocFilterTipo] = useState(lsGet('f_docTipo'));
  const [docFilterEstado, setDocFilterEstado] = useState(lsGet('f_docEstado'));
  const [cobFilterEstado, setCobFilterEstado] = useState(lsGet('f_cobEstado'));
  const [cobFilterPais, setCobFilterPais] = useState(lsGet('f_cobPais'));
  const [cobSearch, setCobSearch] = useState('');
  const [dashYearFilter, setDashYearFilter] = useState('');

  // Persist filters to localStorage
  useEffect(() => { lsSet('f_taskStatus', taskFilterStatus); }, [taskFilterStatus]);
  useEffect(() => { lsSet('f_taskPrior', taskFilterPrior); }, [taskFilterPrior]);
  useEffect(() => { lsSet('f_contactPais', contactFilterPais); }, [contactFilterPais]);
  useEffect(() => { lsSet('f_contactRol', contactFilterRol); }, [contactFilterRol]);
  useEffect(() => { lsSet('f_visitaTipo', visitaFilterTipo); }, [visitaFilterTipo]);
  useEffect(() => { lsSet('f_visitaEstado', visitaFilterEstado); }, [visitaFilterEstado]);
  useEffect(() => { lsSet('f_opEtapa', opFilterEtapa); }, [opFilterEtapa]);
  useEffect(() => { lsSet('f_opMarca', opFilterMarca); }, [opFilterMarca]);
  useEffect(() => { lsSet('f_muestraRes', muestraFilterRes); }, [muestraFilterRes]);
  useEffect(() => { lsSet('f_comTipo', comFilterTipo); }, [comFilterTipo]);
  useEffect(() => { lsSet('f_docTipo', docFilterTipo); }, [docFilterTipo]);
  useEffect(() => { lsSet('f_docEstado', docFilterEstado); }, [docFilterEstado]);
  useEffect(() => { lsSet('f_cobEstado', cobFilterEstado); }, [cobFilterEstado]);
  useEffect(() => { lsSet('f_cobPais', cobFilterPais); }, [cobFilterPais]);

  // Persist active tab
  useEffect(() => { lsSet('activeTab', activeTab); }, [activeTab]);

  // Carga Inicial de Datos
  const fetchData = async () => {
    try {
      const [
        paisesRes, contactosRes, visitasRes, oportunidadesRes, 
        muestrasRes, comunicacionesRes, documentosRes, preciosRes, 
        tendenciasRes, calculosRes, cobranzasRes, tareasRes
      ] = await Promise.all([
        axios.get('/paises'),
        axios.get('/contactos'),
        axios.get('/visitas'),
        axios.get('/oportunidades'),
        axios.get('/muestras'),
        axios.get('/comunicaciones'),
        axios.get('/documentos'),
        axios.get('/precios'),
        axios.get('/tendencias'),
        axios.get('/calculos'),
        axios.get('/cobranzas'),
        axios.get('/tareas')
      ]);

      setPaises(paisesRes.data);
      setContactos(contactosRes.data);
      setVisitas(visitasRes.data);
      setOportunidades(oportunidadesRes.data);
      setMuestras(muestrasRes.data);
      setComunicaciones(comunicacionesRes.data);
      setDocumentos(documentosRes.data);
      setPrecios(preciosRes.data);
      setTendencias(tendenciasRes.data);
      setCalculos(calculosRes.data);
      setCobranzas(cobranzasRes.data);
      setTareas(tareasRes.data);
    } catch (err) {
      console.error('Error cargando datos de la API:', err);
    }
  };

  useEffect(() => { fetchData(); }, []);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-zoom', uiZoom);
    localStorage.setItem('uiZoom', uiZoom);
  }, [uiZoom]);

  useEffect(() => {
    if (showModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => document.body.classList.remove('modal-open');
  }, [showModal]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Sincronizar clientes con Finnegans ERP
  const syncFinnegansClientes = async () => {
    setLoadingSync(true);
    try {
      const res = await axios.get('/finnegans/clientes');
      setFinnegansClientes(res.data);
      addToast({ type: 'success', title: 'Sincronización completada', message: 'Los clientes de Finnegans ERP se sincronizaron correctamente.' });
    } catch (err) {
      console.error(err);
      addToast({ type: 'error', title: 'Error de sincronización', message: 'No se pudo conectar con Finnegans ERP. Verificá la configuración.' });
    } finally {
      setLoadingSync(false);
    }
  };

  // ========== CRUD genérico con validación ==========
  const handleSave = async (e, endpoint) => {
    e.preventDefault();
    // Validar
    const errors = validateForm(showModal, formValues);
    if (errors.length > 0) {
      addToast({ type: 'error', title: 'Error de validación', message: errors.join(' · '), duration: 6000 });
      return;
    }
    try {
      if (formValues.id) {
        await axios.put(`/${endpoint}/${formValues.id}`, formValues);
      } else {
        await axios.post(`/${endpoint}`, formValues);
        // Guardar valores frecuentes para siguiente ingreso
        if (formValues.pais_id) lsSet('lastPaisId', formValues.pais_id);
        if (formValues.marca) lsSet('lastMarca', formValues.marca);
      }
      addToast({ type: 'success', message: formValues.id ? 'Registro actualizado correctamente.' : 'Registro creado correctamente.' });
      setShowModal(null);
      setFormValues({});
      fetchData();
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo guardar el registro. Intentá nuevamente.' });
    }
  };

  // Confirmación de eliminación via modal custom
  const requestDelete = (endpoint, id, label) => {
    setConfirmState({
      open: true,
      title: '¿Eliminar registro?',
      message: label ? `Estás por eliminar "${label}". Esta acción no se puede deshacer.` : 'Esta acción eliminará el registro de forma permanente.',
      onConfirm: () => executeDelete(endpoint, id)
    });
  };

  const executeDelete = async (endpoint, id) => {
    setConfirmState({ open: false });
    try {
      await axios.delete(`/${endpoint}/${id}`);
      addToast({ type: 'success', message: 'Registro eliminado.' });
      fetchData();
    } catch (err) {
      addToast({ type: 'error', title: 'Error', message: 'No se pudo eliminar el registro.' });
    }
  };

  const openEdit = (modalType, item) => {
    setFormValues({ ...item });
    setShowModal(modalType);
  };

  const openNew = (modalType) => {
    // Pre-fill with last used values from localStorage
    const prefill = {};
    const lastPais = lsGet('lastPaisId');
    const lastMarca = lsGet('lastMarca');
    if (['oportunidad', 'muestra', 'cobranza', 'documento', 'precio', 'tendencia', 'tarea'].includes(modalType) && lastPais) {
      prefill.pais_id = lastPais;
    }
    if (['oportunidad', 'cobranza'].includes(modalType) && lastMarca) {
      prefill.marca = lastMarca;
    }
    setFormValues(prefill);
    setShowModal(modalType);
  };

  const toggleTaskStatus = async (task) => {
    try {
      const newStatus = task.status === 'hecha' ? 'pendiente' : 'hecha';
      await axios.put(`/tareas/${task.id}`, { ...task, status: newStatus });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // ========== MÉTRICAS ==========
  const cobradoAnual = cobranzas.filter(c => c.estado === 'Cobrado').reduce((sum, c) => sum + parseFloat(c.monto || 0), 0);
  const cobradoParcial = cobranzas.filter(c => c.estado === 'Cobrado parcial').reduce((sum, c) => sum + parseFloat(c.cobrado_monto || 0), 0);
  const cobranzaTotalCobrada = cobradoAnual + cobradoParcial;
  const cobranzaPendiente = cobranzas.filter(c => c.estado === 'Pendiente' || c.estado === 'Cobrado parcial').reduce((sum, c) => sum + (parseFloat(c.monto || 0) - parseFloat(c.cobrado_monto || 0)), 0);
  const cobranzaVencida = cobranzas.filter(c => c.estado === 'Vencido').reduce((sum, c) => sum + (parseFloat(c.monto || 0) - parseFloat(c.cobrado_monto || 0)), 0);
  const pipeline = oportunidades.filter(o => o.etapa !== 'Cerrado' && o.etapa !== 'Perdido').reduce((s, o) => s + parseFloat(o.monto || 0), 0);
  const tareasVencidas = tareas.filter(t => t.status !== 'hecha' && t.fecha && daysFrom(t.fecha) < 0);
  const tareasPendientes = tareas.filter(t => t.status !== 'hecha');

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  // ========== ALERTAS ENGINE ==========
  const alertas = useMemo(() => [
    ...documentos.filter(d => d.vencimiento && daysFrom(d.vencimiento) <= 30 && daysFrom(d.vencimiento) >= -5).map(d => ({
      tipo: 'Documento', icono: <FileText size={16} />, titulo: d.nombre, detalle: `Vence ${fmtDate(d.vencimiento)}`, dias: daysFrom(d.vencimiento),
      color: daysFrom(d.vencimiento) < 0 ? 'badge-red' : daysFrom(d.vencimiento) <= 7 ? 'badge-red' : 'badge-amber'
    })),
    ...visitas.filter(v => v.estado === 'Planificada' && v.fecha && daysFrom(v.fecha) >= 0 && daysFrom(v.fecha) <= 14).map(v => ({
      tipo: 'Visita', icono: <Calendar size={16} />, titulo: v.titulo, detalle: `${fmtDate(v.fecha)} · ${v.lugar || ''}`, dias: daysFrom(v.fecha), color: 'badge-blue'
    }))
  ].sort((a, b) => a.dias - b.dias), [documentos, visitas]);

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', key: 'dashboard' },
    { icon: <CheckSquare size={18} />, label: 'Tareas', key: 'tareas', badge: tareasPendientes.length },
    { icon: <Bell size={18} />, label: 'Alertas', key: 'alertas', badge: alertas.length, badgeColor: 'badge-red' },
    { icon: <Users size={18} />, label: 'Contactos', key: 'contactos' },
    { icon: <Calendar size={18} />, label: 'Visitas', key: 'visitas' },
    { icon: <Briefcase size={18} />, label: 'Oportunidades', key: 'oportunidades' },
    { icon: <Package size={18} />, label: 'Muestras', key: 'muestras' },
    { icon: <Globe size={18} />, label: 'Países', key: 'paises' },
    { icon: <FileText size={18} />, label: 'Documentos', key: 'documentos' },
    { icon: <TrendingUp size={18} />, label: 'Inteligencia', key: 'inteligencia' },
    { icon: <Calculator size={18} />, label: 'Calculadora', key: 'calculadora' },
    { icon: <DollarSign size={18} />, label: 'Cobranzas', key: 'cobranzas' }
  ];

  // ========== DATOS FILTRADOS ==========
  const filteredTareas = useMemo(() => {
    let data = [...tareas];
    if (taskFilterStatus) data = data.filter(t => t.status === taskFilterStatus);
    if (taskFilterPrior) data = data.filter(t => t.prioridad === taskFilterPrior);
    data.sort((a, b) => { const pa = { alta: 0, media: 1, baja: 2 }; return (pa[a.prioridad] || 1) - (pa[b.prioridad] || 1); });
    return data;
  }, [tareas, taskFilterStatus, taskFilterPrior]);

  const filteredContactos = useMemo(() => {
    let data = [...contactos];
    if (contactSearch) data = data.filter(c => `${c.nombre} ${c.apellido || ''} ${c.empresa || ''}`.toLowerCase().includes(contactSearch.toLowerCase()));
    if (contactFilterPais) data = data.filter(c => c.pais_nombre === contactFilterPais);
    if (contactFilterRol) data = data.filter(c => c.rol === contactFilterRol);
    return data;
  }, [contactos, contactSearch, contactFilterPais, contactFilterRol]);

  const filteredVisitas = useMemo(() => {
    let data = [...visitas];
    if (visitaFilterTipo) data = data.filter(v => v.tipo === visitaFilterTipo);
    if (visitaFilterEstado) data = data.filter(v => v.estado === visitaFilterEstado);
    data.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    return data;
  }, [visitas, visitaFilterTipo, visitaFilterEstado]);

  const filteredOportunidades = useMemo(() => {
    let data = [...oportunidades];
    if (opFilterEtapa) data = data.filter(o => o.etapa === opFilterEtapa);
    if (opFilterMarca) data = data.filter(o => o.marca === opFilterMarca);
    return data;
  }, [oportunidades, opFilterEtapa, opFilterMarca]);

  const filteredMuestras = useMemo(() => {
    let data = [...muestras];
    if (muestraFilterRes) data = data.filter(m => m.resultado === muestraFilterRes);
    return data;
  }, [muestras, muestraFilterRes]);

  const filteredComunicaciones = useMemo(() => {
    let data = [...comunicaciones];
    if (comFilterTipo) data = data.filter(c => c.tipo === comFilterTipo);
    data.sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
    return data;
  }, [comunicaciones, comFilterTipo]);

  const filteredDocumentos = useMemo(() => {
    let data = [...documentos];
    if (docFilterTipo) data = data.filter(d => d.tipo === docFilterTipo);
    if (docFilterEstado) data = data.filter(d => d.estado === docFilterEstado);
    return data;
  }, [documentos, docFilterTipo, docFilterEstado]);

  const filteredCobranzas = useMemo(() => {
    let data = [...cobranzas];
    if (cobFilterEstado) data = data.filter(c => c.estado === cobFilterEstado);
    if (cobFilterPais) data = data.filter(c => c.pais_nombre === cobFilterPais);
    if (cobSearch) data = data.filter(c => `${c.descripcion || ''} ${c.cliente_nombre || ''}`.toLowerCase().includes(cobSearch.toLowerCase()));
    return data;
  }, [cobranzas, cobFilterEstado, cobFilterPais, cobSearch]);

  const dashCobranzas = useMemo(() => {
    if (dashYearFilter === 'all') return cobranzas;
    const curYear = new Date().getFullYear();
    return cobranzas.filter(c => {
      const yr = c.embarque ? new Date(c.embarque).getFullYear() : null;
      return yr === curYear;
    });
  }, [cobranzas, dashYearFilter]);

  const paisesUnicos = useMemo(() => [...new Set(contactos.map(c => c.pais_nombre).filter(Boolean))], [contactos]);
  const paisesCobUnicos = useMemo(() => [...new Set(cobranzas.map(c => c.pais_nombre).filter(Boolean))], [cobranzas]);

  // ========== RENDER FORM HELPER ==========
  const fv = (key) => formValues[key] || '';
  const fvDate = (key) => formValues[key] ? String(formValues[key]).substring(0, 10) : '';
  const setFv = (key, val) => setFormValues(prev => ({ ...prev, [key]: val }));
  const maxLen = (modalType, field) => VALIDATION_RULES[modalType]?.[field]?.maxLength;

  return (
    <div className="layout">
      {/* TOASTS */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />

      {/* CONFIRM MODAL */}
      <ConfirmModal open={confirmState.open} title={confirmState.title} message={confirmState.message} onConfirm={confirmState.onConfirm} onCancel={() => setConfirmState({ open: false })} />

      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <button className="mode-toggle" onClick={() => setDrawerOpen(true)}><Menu size={22} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logo} alt={APP_CONFIG.companyName} style={{ height: '32px', objectFit: 'contain' }} />
            <h2 className="desktop-only" style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700, color: 'var(--primary)' }}>
              Comercio Exterior
            </h2>
          </div>
        </div>

        <div className="header-right">
          <div className="zoom-selector">
            <button className={`zoom-btn ${uiZoom === 'sm' ? 'active' : ''}`} onClick={() => setUiZoom('sm')} title="Texto chico">A</button>
            <button className={`zoom-btn ${uiZoom === 'md' ? 'active' : ''}`} onClick={() => setUiZoom('md')} title="Texto mediano" style={{fontSize: '0.8rem'}}>A</button>
            <button className={`zoom-btn ${uiZoom === 'lg' ? 'active' : ''}`} onClick={() => setUiZoom('lg')} title="Texto grande" style={{fontSize: '0.95rem'}}>A</button>
          </div>

          <button className="mode-toggle" onClick={toggleTheme} title="Cambiar modo">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <div className="avatar-container" onClick={() => setShowUserMenu(!showUserMenu)} style={{ position: 'relative' }}>
            <span className="user-name desktop-only">{user.name}</span>
            <div className="avatar">{initials || <User size={18} />}</div>
            {showUserMenu && (
              <div className="glass" style={{ position: 'absolute', top: '100%', right: 0, marginTop: '6px', minWidth: '160px', borderRadius: '10px', overflow: 'hidden', zIndex: 150, textAlign: 'left' }}>
                <button onClick={() => addToast({ type: 'info', message: 'Función de cierre de sesión disponible con autenticación activa.' })} style={{ width: '100%', padding: '10px 14px', borderRadius: 0, justifyContent: 'flex-start', color: 'var(--error)', background: 'transparent', fontSize: '0.85rem', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* DRAWER */}
      <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <div className={`drawer ${isDrawerOpen ? 'open' : ''} glass`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.1rem', color: 'var(--drawer-title)', fontWeight: 700 }}>Menú</h2>
          <button className="mode-toggle" onClick={() => setDrawerOpen(false)}><X size={22} /></button>
        </div>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflowY: 'auto', flex: 1 }}>
          {menuItems.map(item => (
            <button key={item.key} className={`drawer-menu-btn ${activeTab === item.key ? 'active' : ''}`} onClick={() => { setActiveTab(item.key); setDrawerOpen(false); }}>
              <span>{item.icon}</span>
              {item.label}
              {item.badge > 0 && <span className={`badge ${item.badgeColor || 'badge-red'}`} style={{ marginLeft: 'auto' }}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--drawer-footer)', fontWeight: 700 }}>{APP_CONFIG.companyName}</p>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>v{APP_CONFIG.appVersion}</p>
        </div>
      </div>

      {/* CONTENIDO */}
      <main className="content">

        {/* ===== DASHBOARD ===== */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="section-header"><h3><LayoutDashboard size={20} /> Dashboard</h3></div>
            <div className="metrics-grid">
              <div className="metric-card"><div className="metric-header">Países activos</div><div className="metric-value">{paises.length}</div><div className="metric-footer">exportando actualmente</div></div>
              <div className="metric-card"><div className="metric-header">Contactos</div><div className="metric-value">{contactos.length}</div><div className="metric-footer">importadores y distribuidores</div></div>
              <div className="metric-card"><div className="metric-header">Pipeline USD</div><div className="metric-value">${pipeline.toLocaleString('es-AR')}</div><div className="metric-footer">oportunidades abiertas</div></div>
              <div className="metric-card"><div className="metric-header">Tareas vencidas</div><div className="metric-value" style={{color: 'var(--danger)'}}>{tareasVencidas.length}</div><div className="metric-footer">requieren atención</div></div>
            </div>

            {/* Volumen exportación anual */}
            <div className="card">
              <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14}}>
                <h3 style={{margin: 0, display: 'flex', alignItems: 'center', gap: 8}}><Boxes size={18} /> Volumen de exportación anual</h3>
                <select className="form-input" style={{width: 130, fontSize: '0.8rem', padding: '6px 10px'}} value={dashYearFilter} onChange={e => setDashYearFilter(e.target.value)}>
                  <option value="">Este año</option>
                  <option value="all">Todo</option>
                </select>
              </div>
              <div className="metrics-grid" style={{marginBottom: 16}}>
                <div className="metric-card" style={{background: 'var(--primary-light)'}}><div className="metric-header" style={{color: 'var(--dy-blue)'}}>Unidades exportadas</div><div className="metric-value" style={{fontSize: '1.4rem'}}>{dashCobranzas.reduce((s, c) => s + (parseInt(c.unidades) || 0), 0).toLocaleString('es-AR')}</div><div className="metric-footer">total del período</div></div>
                <div className="metric-card" style={{background: 'var(--success-light)'}}><div className="metric-header" style={{color: 'var(--success)'}}>Valor exportado (USD)</div><div className="metric-value" style={{fontSize: '1.4rem'}}>${dashCobranzas.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0).toLocaleString('es-AR')}</div><div className="metric-footer">operaciones cerradas</div></div>
                <div className="metric-card" style={{background: 'var(--danger-light)'}}><div className="metric-header" style={{color: 'var(--danger)'}}>Cobranza vencida</div><div className="metric-value" style={{fontSize: '1.4rem', color: 'var(--danger)'}}>${cobranzaVencida.toLocaleString('es-AR')}</div><div className="metric-footer">requiere seguimiento</div></div>
              </div>
              <h4 style={{fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', margin: '16px 0 10px'}}>Desglose por país de destino</h4>
              {paises.length === 0 ? <div className="empty-state" style={{padding: 16}}><div className="empty-state-icon"><Boxes size={24} /></div><div className="empty-state-text" style={{fontSize: '0.8rem'}}>Registrá exportaciones en Cobranzas para ver el desglose por país.</div></div> :
                paises.map(p => {
                  const totalPais = dashCobranzas.filter(c => c.pais_id === p.id).reduce((s, c) => s + parseFloat(c.monto || 0), 0);
                  const unitsPais = dashCobranzas.filter(c => c.pais_id === p.id).reduce((s, c) => s + (parseInt(c.unidades) || 0), 0);
                  const maxVal = Math.max(1, ...paises.map(pp => dashCobranzas.filter(c => c.pais_id === pp.id).reduce((s, c) => s + parseFloat(c.monto || 0), 0)));
                  const pct = (totalPais / maxVal) * 100;
                  return (
                    <div key={p.id} style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 0', borderBottom: '1px solid var(--border)'}}>
                      <span style={{fontSize: 18}}>{p.bandera}</span>
                      <span style={{width: 100, fontWeight: 500, fontSize: '0.85rem'}}>{p.nombre}</span>
                      <div style={{flex: 1}}><div className="progress-bar"><div className="progress-fill" style={{width: `${Math.min(100, pct)}%`}} /></div></div>
                      <div style={{textAlign: 'right', minWidth: 120}}>
                        <span style={{fontWeight: 600, fontSize: '0.85rem'}}>${totalPais.toLocaleString('es-AR')}</span>
                        <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{unitsPais.toLocaleString()} u</div>
                      </div>
                    </div>
                  );
                })
              }
            </div>

            {/* Alertas y Visitas */}
            <div className="metrics-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', marginBottom: 20}}>
              <div className="card" style={{margin: 0}}>
                <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}><Bell size={18} /> Alertas críticas</h3>
                {alertas.length === 0 ? <div className="empty-state"><div className="empty-state-icon"><CheckSquare size={24} /></div><div className="empty-state-text">Sin alertas pendientes</div></div> :
                  alertas.slice(0, 4).map((a, i) => <div key={i} style={{display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem'}}><span style={{marginTop: 2}}>{a.icono}</span><div style={{flex: 1}}><strong>{a.titulo}</strong><div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{a.detalle}</div></div><span className={`badge ${a.color}`}>{a.dias < 0 ? `Vencido` : a.dias === 0 ? 'Hoy' : `${a.dias}d`}</span></div>)
                }
              </div>
              <div className="card" style={{margin: 0}}>
                <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}><Calendar size={18} /> Próximas visitas</h3>
                {visitas.filter(v => v.estado === 'Planificada').length === 0 ? <div className="empty-state"><div className="empty-state-icon"><Calendar size={24} /></div><div className="empty-state-text">Sin visitas programadas</div></div> :
                  visitas.filter(v => v.estado === 'Planificada').slice(0, 4).map(v => <div key={v.id} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem'}}><div><strong>{v.titulo}</strong><div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{v.lugar}</div></div>{estadoBadge('Planificada')}</div>)
                }
              </div>
            </div>

            {/* Funnel */}
            <div className="card">
              <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}><Target size={18} /> Funnel de oportunidades</h3>
              <div className="funnel-container">
                {['Prospecto', 'Contactado', 'Propuesta', 'Negociación', 'Cerrado'].map(stage => (
                  <div key={stage} className="funnel-column">
                    <div className="funnel-header">{stage}</div>
                    {oportunidades.filter(o => o.etapa === stage).length === 0 ? <div style={{fontSize: '0.7rem', color: 'var(--text-muted)', textAlign: 'center', padding: 8}}>—</div> :
                      oportunidades.filter(o => o.etapa === stage).map(o => <div key={o.id} className="funnel-card"><strong>{o.nombre}</strong><div style={{color: 'var(--dy-blue)', fontWeight: 600, marginTop: 2, fontSize: '0.8rem'}}>${parseFloat(o.monto).toLocaleString()}</div></div>)
                    }
                  </div>
                ))}
              </div>
            </div>

            {/* Actividad reciente */}
            <div className="card">
              <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}><Activity size={18} /> Actividad reciente</h3>
              {[...visitas.slice(0, 3).map(v => ({icon: <Calendar size={14} />, text: `Visita: ${v.titulo} (${v.tipo})`})), ...contactos.slice(0, 3).map(c => ({icon: <User size={14} />, text: `Contacto: ${c.nombre} ${c.apellido || ''}`})), ...oportunidades.slice(0, 2).map(o => ({icon: <Briefcase size={14} />, text: `Oportunidad: ${o.nombre}`}))].map((a, i) =>
                <div key={i} style={{display: 'flex', gap: 8, fontSize: '0.85rem', borderBottom: '1px solid var(--border)', padding: '6px 0', alignItems: 'center'}}><span style={{color: 'var(--text-muted)'}}>{a.icon}</span><span>{a.text}</span></div>
              )}
              {visitas.length === 0 && contactos.length === 0 && <div className="empty-state"><div className="empty-state-text">Sin actividad aún. Comenzá registrando un contacto o visita.</div></div>}
            </div>
          </div>
        )}

        {/* ===== TAREAS ===== */}
        {activeTab === 'tareas' && (
          <div className="card">
            <div className="section-header"><h3><CheckSquare size={20} /> Tareas</h3></div>
            <div className="filter-bar">
              <select className="form-input" value={taskFilterStatus} onChange={e => setTaskFilterStatus(e.target.value)}>
                <option value="">Todas</option>
                <option value="pendiente">Pendientes</option>
                <option value="hecha">Completadas</option>
              </select>
              <select className="form-input" value={taskFilterPrior} onChange={e => setTaskFilterPrior(e.target.value)}>
                <option value="">Toda prioridad</option>
                <option value="alta">Alta</option>
                <option value="media">Media</option>
                <option value="baja">Baja</option>
              </select>
              <div className="filter-spacer" />
              <button className="btn btn-primary btn-sm" onClick={() => openNew('tarea')}><Plus size={14} /> Nueva tarea</button>
            </div>
            {filteredTareas.length === 0 ? <div className="empty-state"><div className="empty-state-icon"><CheckSquare size={28} /></div><div className="empty-state-text">Sin tareas pendientes</div></div> :
              filteredTareas.map(t => {
                const done = t.status === 'hecha';
                const dias = t.fecha ? daysFrom(t.fecha) : null;
                return (
                  <div key={t.id} className="task-item">
                    <input type="checkbox" checked={done} onChange={() => toggleTaskStatus(t)} style={{width: 16, height: 16, marginTop: 2, cursor: 'pointer'}} />
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: 500, textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--text-muted)' : 'var(--text)', fontSize: '0.85rem'}}>{t.titulo}</div>
                      <div style={{display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center'}}>
                        {priorBadge(t.prioridad)}
                        {t.fecha && <span style={{fontSize: '0.7rem', color: dias < 0 && !done ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3}}>
                          <Clock size={11} />
                          {dias < 0 ? `Venció hace ${Math.abs(dias)}d` : `En ${dias}d · ${fmtDate(t.fecha)}`}
                        </span>}
                        {t.pais_nombre && <span style={{fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3}}><Globe size={11} /> {t.pais_nombre}</span>}
                        {t.asignado && <span style={{fontSize: '0.7rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3}}><User size={11} /> {t.asignado}</span>}
                      </div>
                      {t.notas && <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3}} dangerouslySetInnerHTML={{__html: t.notas}} />}
                    </div>
                    <button className="icon-btn" onClick={() => openEdit('tarea', t)} title="Editar"><Edit size={14} /></button>
                    <button className="icon-btn" onClick={() => requestDelete('tareas', t.id, t.titulo)} title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* ===== ALERTAS ===== */}
        {activeTab === 'alertas' && (
          <div className="card">
            <div className="section-header"><h3><Bell size={20} /> Alertas</h3></div>
            <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16}}>Vencimientos próximos de documentos y compromisos registrados. Las alertas se generan automáticamente.</p>
            {alertas.length === 0 ? <div className="empty-state"><div className="empty-state-icon"><CheckSquare size={28} /></div><div className="empty-state-text">Sin alertas activas. Todo al día.</div></div> :
              alertas.map((a, i) => (
                <div key={i} style={{display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 6, background: 'var(--surface)', border: '1px solid var(--border)'}}>
                  <span style={{marginTop: 2}}>{a.icono}</span>
                  <div style={{flex: 1}}><div style={{fontWeight: 500}}>{a.titulo}</div><div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{a.detalle}</div></div>
                  <span className={`badge ${a.color}`}>{a.dias < 0 ? `Vencido hace ${Math.abs(a.dias)}d` : a.dias === 0 ? 'Hoy' : `En ${a.dias}d`}</span>
                </div>
              ))
            }
          </div>
        )}

        {/* ===== CONTACTOS ===== */}
        {activeTab === 'contactos' && (
          <div className="card">
            <div className="section-header"><h3><Users size={20} /> Contactos</h3></div>
            <div className="filter-bar">
              <input type="text" className="form-input search-input" placeholder="Buscar contacto..." value={contactSearch} onChange={e => setContactSearch(e.target.value)} />
              <select className="form-input" value={contactFilterPais} onChange={e => setContactFilterPais(e.target.value)}>
                <option value="">Todos los países</option>
                {paisesUnicos.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
              <select className="form-input" value={contactFilterRol} onChange={e => setContactFilterRol(e.target.value)}>
                <option value="">Todos los roles</option>
                <option>Importador</option><option>Distribuidor</option><option>Broker</option><option>Retailer</option><option>Otro</option>
              </select>
              <div className="filter-spacer" />
              <button className="btn btn-secondary btn-sm" onClick={syncFinnegansClientes} disabled={loadingSync}><RefreshCw size={14} /> {loadingSync ? 'Sync...' : 'Sync ERP'}</button>
              <button className="btn btn-primary btn-sm" onClick={() => openNew('contacto')}><Plus size={14} /> Nuevo</button>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Nombre</th><th>Empresa</th><th>País</th><th>Rol</th><th>Estado</th><th>Email</th><th></th></tr></thead>
                <tbody>
                  {filteredContactos.length === 0 ? <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon"><Users size={28} /></div><div className="empty-state-text">Sin contactos. Agregá el primero.</div></div></td></tr> :
                    filteredContactos.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.nombre} {c.apellido || ''}</strong></td>
                        <td>{c.empresa || '—'}</td>
                        <td>{c.pais_nombre || '—'}</td>
                        <td><span className="badge badge-navy">{c.rol}</span></td>
                        <td>{estadoBadge(c.estado)}</td>
                        <td style={{color: 'var(--text-muted)'}}>{c.email || '—'}</td>
                        <td><button className="icon-btn" onClick={() => openEdit('contacto', c)}><Edit size={14} /></button> <button className="icon-btn" onClick={() => requestDelete('contactos', c.id, `${c.nombre} ${c.apellido || ''}`)}><Trash2 size={14} /></button></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== VISITAS ===== */}
        {activeTab === 'visitas' && (
          <div className="card">
            <div className="section-header"><h3><Calendar size={20} /> Visitas y reuniones</h3></div>
            <div className="filter-bar">
              <select className="form-input" value={visitaFilterTipo} onChange={e => setVisitaFilterTipo(e.target.value)}>
                <option value="">Todos los tipos</option>
                <option>Feria internacional</option><option>Ronda de negocios</option><option>Reunión comercial</option><option>Visita a cliente</option><option>Videoconferencia</option>
              </select>
              <select className="form-input" value={visitaFilterEstado} onChange={e => setVisitaFilterEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option>Planificada</option><option>Realizada</option><option>Cancelada</option>
              </select>
              <div className="filter-spacer" />
              <button className="btn btn-primary btn-sm" onClick={() => openNew('visita')}><Plus size={14} /> Nueva visita</button>
            </div>
            {filteredVisitas.length === 0 ? <div className="empty-state"><div className="empty-state-icon"><Calendar size={28} /></div><div className="empty-state-text">Sin visitas. Registrá una feria o reunión.</div></div> :
              filteredVisitas.map(v => (
                <div key={v.id} style={{display: 'flex', gap: 14, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 6}}>
                  <div style={{minWidth: 80, fontSize: '0.75rem', color: 'var(--text-muted)'}}>{fmtDate(v.fecha)}<br/><span style={{fontSize: '0.7rem'}}>{v.lugar || ''}</span></div>
                  <div style={{flex: 1}}>
                    <div style={{fontWeight: 500, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6}}>{visitaIcon(v.tipo)} {v.titulo}</div>
                    <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{v.tipo} {v.contactos ? `· ${v.contactos}` : ''}</div>
                    {v.tipo === 'Ronda de negocios' && (v.ronda_org || v.ronda_reuniones) && (
                      <div style={{background: 'var(--primary-light)', borderRadius: 4, padding: '6px 10px', fontSize: '0.75rem', marginTop: 4, marginBottom: 4, display: 'flex', gap: 12, flexWrap: 'wrap'}}>
                        {v.ronda_org && <span><b>Org:</b> {v.ronda_org}</span>}
                        {v.ronda_reuniones && <span><b>Reuniones:</b> {v.ronda_reuniones}</span>}
                        {v.ronda_pedidos && <span><b>Pedidos:</b> ${parseFloat(v.ronda_pedidos).toLocaleString()}</span>}
                        {v.ronda_resultado && <span><b>Resultado:</b> {v.ronda_resultado}</span>}
                      </div>
                    )}
                    {v.notas && <div style={{fontSize: '0.75rem', color: 'var(--text)', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', marginTop: 4}} dangerouslySetInnerHTML={{__html: v.notas}} />}
                    {v.proximo && <div style={{fontSize: '0.75rem', color: 'var(--dy-blue)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4}}><ArrowRight size={12} /> {v.proximo}</div>}
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4}}>
                    {estadoBadge(v.estado)}
                    {v.tipo === 'Ronda de negocios' && <span className="badge badge-blue"><Handshake size={10} /> Ronda</span>}
                    <div style={{display: 'flex', gap: 4}}>
                      <button className="icon-btn" onClick={() => openEdit('visita', v)}><Edit size={14} /></button>
                      <button className="icon-btn" onClick={() => requestDelete('visitas', v.id, v.titulo)}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))
            }
          </div>
        )}

        {/* ===== OPORTUNIDADES ===== */}
        {activeTab === 'oportunidades' && (
          <div className="card">
            <div className="section-header"><h3><Briefcase size={20} /> Oportunidades</h3></div>
            <div className="filter-bar">
              <select className="form-input" value={opFilterEtapa} onChange={e => setOpFilterEtapa(e.target.value)}>
                <option value="">Todas las etapas</option>
                <option>Prospecto</option><option>Contactado</option><option>Propuesta</option><option>Negociación</option><option>Cerrado</option><option>Perdido</option>
              </select>
              <select className="form-input" value={opFilterMarca} onChange={e => setOpFilterMarca(e.target.value)}>
                <option value="">Todas las marcas</option>
                <option>Don Yeyo</option><option>DeViano</option>
              </select>
              <div className="filter-spacer" />
              <button className="btn btn-primary btn-sm" onClick={() => openNew('oportunidad')}><Plus size={14} /> Nueva oportunidad</button>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Oportunidad</th><th>País</th><th>Marca</th><th>Etapa</th><th>Monto USD</th><th>Probabilidad</th><th>Cierre estimado</th><th></th></tr></thead>
                <tbody>
                  {filteredOportunidades.length === 0 ? <tr><td colSpan="8"><div className="empty-state"><div className="empty-state-icon"><Briefcase size={28} /></div><div className="empty-state-text">Sin oportunidades registradas.</div></div></td></tr> :
                    filteredOportunidades.map(o => (
                      <tr key={o.id}>
                        <td><strong>{o.nombre}</strong></td>
                        <td>{o.pais_nombre || '—'}</td>
                        <td><span className="badge badge-navy">{o.marca || '—'}</span></td>
                        <td>{etapaBadge(o.etapa)}</td>
                        <td style={{fontWeight: 600}}>${parseFloat(o.monto || 0).toLocaleString()}</td>
                        <td>
                          <div style={{display: 'flex', alignItems: 'center', gap: 6, minWidth: 80}}>
                            <div className="progress-bar" style={{flex: 1}}><div className="progress-fill" style={{width: `${o.prob || 0}%`}} /></div>
                            <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{o.prob || 0}%</span>
                          </div>
                        </td>
                        <td style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>{fmtDate(o.cierre)}</td>
                        <td><button className="icon-btn" onClick={() => openEdit('oportunidad', o)}><Edit size={14} /></button> <button className="icon-btn" onClick={() => requestDelete('oportunidades', o.id, o.nombre)}><Trash2 size={14} /></button></td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== MUESTRAS + COMUNICACIONES ===== */}
        {activeTab === 'muestras' && (
          <div className="card">
            <div className="section-header"><h3><Package size={20} /> Muestras y comunicaciones</h3></div>
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
                filteredMuestras.map(m => (
                  <div key={m.id} className="sample-row">
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: 500, fontSize: '0.85rem'}}>{m.producto}</div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{m.destinatario || ''} · {m.pais_nombre || ''} · {fmtDate(m.fecha)}</div>
                      {m.notas && <div style={{fontSize: '0.75rem', marginTop: 2}} dangerouslySetInnerHTML={{__html: m.notas}} />}
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4}}>
                      {estadoBadge(m.resultado)}
                      {m.costo > 0 && <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>${parseFloat(m.costo).toLocaleString()}</span>}
                      <div style={{display: 'flex', gap: 4}}>
                        <button className="icon-btn" onClick={() => openEdit('muestra', m)}><Edit size={14} /></button>
                        <button className="icon-btn" onClick={() => requestDelete('muestras', m.id, m.producto)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))
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
                      <div style={{flex: 1, paddingTop: 4}}>
                        <div style={{fontWeight: 500, fontSize: '0.85rem'}}>{c.asunto} <span className="badge badge-navy" style={{marginLeft: 4}}>{c.tipo}</span></div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2}}>{c.contacto_nombre || ''} · {fmtDate(c.fecha)}</div>
                        {c.resumen && <div style={{fontSize: '0.75rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', marginTop: 4}} dangerouslySetInnerHTML={{__html: c.resumen}} />}
                        {c.proximo && <div style={{fontSize: '0.75rem', color: 'var(--dy-blue)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4}}><ArrowRight size={12} /> {c.proximo}</div>}
                        <div style={{display: 'flex', gap: 4, marginTop: 4}}>
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
        {activeTab === 'paises' && (
          <div>
            <div className="section-header"><h3><Globe size={20} /> Países destino</h3></div>
            <div className="filter-bar">
              <div className="filter-spacer" />
              <button className="btn btn-primary btn-sm" onClick={() => openNew('pais')}><Plus size={14} /> Agregar país</button>
            </div>
            <div className="country-grid">
              {paises.length === 0 ? <div className="empty-state" style={{gridColumn: '1 / -1'}}><div className="empty-state-icon"><Globe size={28} /></div><div className="empty-state-text">Agregá los países destino de exportación.</div></div> :
                paises.map(p => (
                  <div key={p.id} className="country-card">
                    <div style={{fontSize: 28, marginBottom: 6}}>{p.bandera || '🌐'}</div>
                    <div style={{fontWeight: 600, fontSize: '0.95rem', marginBottom: 8}}>{p.nombre}</div>
                    {p.arancel > 0 && <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0', borderTop: '1px solid var(--border)'}}><span style={{color: 'var(--text-muted)'}}>Arancel</span><span style={{fontWeight: 500}}>{p.arancel}%</span></div>}
                    {p.incoterm && <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0', borderTop: '1px solid var(--border)'}}><span style={{color: 'var(--text-muted)'}}>Incoterm</span><span style={{fontWeight: 500}}>{p.incoterm}</span></div>}
                    {p.moneda && <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0', borderTop: '1px solid var(--border)'}}><span style={{color: 'var(--text-muted)'}}>Moneda</span><span style={{fontWeight: 500}}>{p.moneda}</span></div>}
                    {p.sanitario && <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0', borderTop: '1px solid var(--border)'}}><span style={{color: 'var(--text-muted)'}}>Org. sanitario</span><span style={{fontWeight: 500, color: 'var(--success)'}}>{p.sanitario}</span></div>}
                    <div style={{display: 'flex', gap: 4, marginTop: 8}}>
                      <button className="icon-btn" onClick={() => openEdit('pais', p)} style={{flex: 1}}><Edit size={14} /></button>
                      <button className="icon-btn" onClick={() => requestDelete('paises', p.id, p.nombre)} style={{flex: 1}}><Trash2 size={14} /></button>
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ===== DOCUMENTOS ===== */}
        {activeTab === 'documentos' && (
          <div className="card">
            <div className="section-header"><h3><FileText size={20} /> Documentos</h3></div>
            <div className="filter-bar">
              <select className="form-input" value={docFilterTipo} onChange={e => setDocFilterTipo(e.target.value)}>
                <option value="">Todos los tipos</option>
                <option>Invoice</option><option>Bill of Lading</option><option>Packing List</option><option>Certificado fitosanitario</option><option>Certificado de origen</option><option>Contrato</option><option>Otro</option>
              </select>
              <select className="form-input" value={docFilterEstado} onChange={e => setDocFilterEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option>Vigente</option><option>Vencido</option><option>Por vencer</option>
              </select>
              <div className="filter-spacer" />
              <button className="btn btn-primary btn-sm" onClick={() => openNew('documento')}><Plus size={14} /> Agregar documento</button>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Documento</th><th>Tipo</th><th>País / Contacto</th><th>Vencimiento</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {filteredDocumentos.length === 0 ? <tr><td colSpan="6"><div className="empty-state"><div className="empty-state-icon"><FileText size={28} /></div><div className="empty-state-text">Sin documentos registrados.</div></div></td></tr> :
                    filteredDocumentos.map(d => {
                      const dias = d.vencimiento ? daysFrom(d.vencimiento) : null;
                      return (
                        <tr key={d.id}>
                          <td><div style={{display: 'flex', alignItems: 'center', gap: 8}}><span style={{color: 'var(--text-muted)'}}>{docIcon(d.tipo)}</span><div><strong>{d.nombre}</strong>{d.numero && <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{d.numero}</div>}</div></div></td>
                          <td>{d.tipo}</td>
                          <td>{d.pais_nombre || '—'}</td>
                          <td style={{color: dias !== null && dias <= 7 ? 'var(--danger)' : dias !== null && dias <= 30 ? 'var(--warning)' : 'var(--text)', fontWeight: dias !== null && dias <= 30 ? 500 : 400}}>
                            {fmtDate(d.vencimiento)}
                            {dias !== null && dias <= 30 && dias >= 0 && <span className="badge badge-amber" style={{marginLeft: 6}}>En {dias}d</span>}
                          </td>
                          <td>{estadoBadge(d.estado)}</td>
                          <td><button className="icon-btn" onClick={() => openEdit('documento', d)}><Edit size={14} /></button> <button className="icon-btn" onClick={() => requestDelete('documentos', d.id, d.nombre)}><Trash2 size={14} /></button></td>
                        </tr>
                      );
                    })
                  }
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== INTELIGENCIA ===== */}
        {activeTab === 'inteligencia' && (
          <div className="card">
            <div className="section-header"><h3><TrendingUp size={20} /> Inteligencia comercial</h3></div>
            <div className="tabs">
              <button className={`tab-btn ${intelTab === 'precios' ? 'active' : ''}`} onClick={() => setIntelTab('precios')}><DollarSign size={14} /> Precios competidores</button>
              <button className={`tab-btn ${intelTab === 'tendencias' ? 'active' : ''}`} onClick={() => setIntelTab('tendencias')}><BarChart3 size={14} /> Tendencias de mercado</button>
            </div>

            {intelTab === 'precios' && <>
              <div className="filter-bar">
                <div className="filter-spacer" />
                <button className="btn btn-primary btn-sm" onClick={() => openNew('precio')}><Plus size={14} /> Registrar precio</button>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Competidor / Producto</th><th>País</th><th>Categoría</th><th>Precio</th><th>Unidad</th><th>Precio/kg</th><th>Fuente</th><th>Fecha</th><th></th></tr></thead>
                  <tbody>
                    {precios.length === 0 ? <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon"><DollarSign size={28} /></div><div className="empty-state-text">Registrá precios de competidores en ferias, visitas o investigación online.</div></div></td></tr> :
                      precios.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.competidor}</strong>{p.producto && <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{p.producto}</div>}</td>
                          <td>{p.pais_nombre || '—'}</td>
                          <td><span className="badge badge-navy">{p.categoria || '—'}</span></td>
                          <td style={{fontWeight: 500}}>{p.precio || '—'}</td>
                          <td>{p.unidad || '—'}</td>
                          <td style={{color: 'var(--dy-blue)', fontWeight: 500}}>{p.peso > 0 && p.precio > 0 ? (parseFloat(p.precio) / parseFloat(p.peso)).toFixed(2) + ' /kg' : '—'}</td>
                          <td style={{color: 'var(--text-muted)'}}>{p.fuente || '—'}</td>
                          <td style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{fmtDate(p.fecha)}</td>
                          <td><button className="icon-btn" onClick={() => openEdit('precio', p)}><Edit size={14} /></button> <button className="icon-btn" onClick={() => requestDelete('precios', p.id, p.competidor)}><Trash2 size={14} /></button></td>
                        </tr>
                      ))
                    }
                  </tbody>
                </table>
              </div>
            </>}

            {intelTab === 'tendencias' && <>
              <div className="filter-bar">
                <div className="filter-spacer" />
                <button className="btn btn-primary btn-sm" onClick={() => openNew('tendencia')}><Plus size={14} /> Agregar nota</button>
              </div>
              {tendencias.length === 0 ? <div className="empty-state"><div className="empty-state-icon"><BarChart3 size={28} /></div><div className="empty-state-text">Agregá notas de inteligencia de mercado</div></div> :
                tendencias.map(t => (
                  <div key={t.id} className="intel-card">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6}}>
                      <div><strong style={{fontSize: '0.9rem'}}>{t.titulo}</strong><span style={{marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)'}}>{t.pais_nombre || ''}</span></div>
                      <div style={{display: 'flex', gap: 4, alignItems: 'center'}}>
                        <span className="badge badge-blue">{t.categoria || '—'}</span>
                        <button className="icon-btn" onClick={() => openEdit('tendencia', t)}><Edit size={14} /></button>
                        <button className="icon-btn" onClick={() => requestDelete('tendencias', t.id, t.titulo)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {t.descripcion && <div style={{fontSize: '0.8rem', lineHeight: 1.5}} dangerouslySetInnerHTML={{__html: t.descripcion}} />}
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 6}}>
                      {t.fuente && <span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>Fuente: {t.fuente}</span>}
                      {t.tags && <div style={{display: 'flex', gap: 4, flexWrap: 'wrap'}}>{t.tags.split(',').map((tag, i) => <span key={i} className="badge badge-gray"><Tag size={9} /> {tag.trim()}</span>)}</div>}
                    </div>
                  </div>
                ))
              }
            </>}
          </div>
        )}

        {/* ===== CALCULADORA ===== */}
        {activeTab === 'calculadora' && (
          <div>
            <div className="section-header"><h3><Calculator size={20} /> Calculadora de exportación</h3></div>
            <div className="metrics-grid" style={{gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))'}}>
              <div className="card">
                <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}><Calculator size={18} /> Costo de exportación</h3>
                <form onSubmit={(e) => {
                  e.preventDefault();
                  const totalFOB = parseFloat(formValues.fob || 0) * parseInt(formValues.qty || 1);
                  const cif = totalFOB + parseFloat(formValues.flete || 0) + parseFloat(formValues.seguro || 0);
                  const arancelUSD = cif * (parseFloat(formValues.arancel || 0) / 100);
                  const landed = cif + arancelUSD + parseFloat(formValues.otros || 0);
                  axios.post('/calculos', { producto: formValues.producto, pais_id: formValues.pais_id, fob: formValues.fob, qty: formValues.qty, flete: formValues.flete, seguro: formValues.seguro, arancel: formValues.arancel, otros: formValues.otros, landed: landed.toFixed(2), fecha: new Date().toISOString().split('T')[0] }).then(() => {
                    addToast({ type: 'success', title: 'Cálculo guardado', message: `Costo Landed Estimado: $${landed.toLocaleString('es-AR')}` });
                    if (formValues.pais_id) lsSet('lastPaisId', formValues.pais_id);
                    setFormValues({});
                    fetchData();
                  }).catch(() => addToast({ type: 'error', message: 'Error al guardar el cálculo.' }));
                }}>
                  <div className="form-group"><label className="form-label">Producto / descripción</label><input type="text" className="form-input" required maxLength={200} value={fv('producto')} onChange={e => setFv('producto', e.target.value)} placeholder="Ej: Tapas Don Yeyo x 24u" /></div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Precio FOB (USD/unidad)</label><input type="number" step="any" min="0" className="form-input" required value={fv('fob')} onChange={e => setFv('fob', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Cantidad (unidades)</label><input type="number" min="1" className="form-input" value={fv('qty')} onChange={e => setFv('qty', e.target.value)} /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Flete internacional (USD)</label><input type="number" step="any" min="0" className="form-input" value={fv('flete')} onChange={e => setFv('flete', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Seguro (USD)</label><input type="number" step="any" min="0" className="form-input" value={fv('seguro')} onChange={e => setFv('seguro', e.target.value)} /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Arancel destino (%)</label><input type="number" step="any" min="0" max="100" className="form-input" value={fv('arancel')} onChange={e => setFv('arancel', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Otros gastos destino (USD)</label><input type="number" step="any" min="0" className="form-input" value={fv('otros')} onChange={e => setFv('otros', e.target.value)} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">País destino</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                  <div style={{display: 'flex', gap: 8, marginTop: 14}}>
                    <button type="submit" className="btn btn-primary">Calcular y guardar</button>
                  </div>
                </form>
              </div>
              <div className="card">
                <h3 style={{display: 'flex', alignItems: 'center', gap: 8}}><ClipboardList size={18} /> Cálculos guardados</h3>
                {calculos.length === 0 ? <div className="empty-state"><div className="empty-state-icon"><Calculator size={24} /></div><div className="empty-state-text" style={{fontSize: '0.8rem'}}>Los cálculos guardados aparecen aquí.</div></div> :
                  calculos.map(c => (
                    <div key={c.id} style={{padding: '10px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem'}}>
                      <div style={{fontWeight: 500}}>{c.producto}</div>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 2}}>
                        <span style={{color: 'var(--text-muted)'}}>{c.pais_nombre || ''} · {fmtDate(c.fecha)}</span>
                        <span style={{fontWeight: 500, color: 'var(--dy-blue)'}}>${parseFloat(c.landed).toLocaleString()} landed</span>
                      </div>
                      <button className="icon-btn" style={{marginTop: 4}} onClick={() => requestDelete('calculos', c.id, c.producto)}><Trash2 size={14} /></button>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}

        {/* ===== COBRANZAS ===== */}
        {activeTab === 'cobranzas' && (
          <div>
            <div className="section-header"><h3><DollarSign size={20} /> Cobranzas</h3></div>
            <div className="metrics-grid" style={{marginBottom: 20}}>
              <div className="metric-card" style={{borderLeft: '4px solid var(--success)'}}><div className="metric-header">Cobrado (año)</div><div className="metric-value">${cobranzaTotalCobrada.toLocaleString('es-AR')}</div><div className="metric-footer">{cobranzas.filter(c => c.estado === 'Cobrado').length} operaciones</div></div>
              <div className="metric-card" style={{borderLeft: '4px solid var(--warning)'}}><div className="metric-header">Pendiente</div><div className="metric-value">${cobranzaPendiente.toLocaleString('es-AR')}</div><div className="metric-footer">{cobranzas.filter(c => c.estado === 'Pendiente' || c.estado === 'Cobrado parcial').length} operaciones</div></div>
              <div className="metric-card" style={{borderLeft: '4px solid var(--danger)'}}><div className="metric-header">Vencido</div><div className="metric-value" style={{color: 'var(--danger)'}}>${cobranzaVencida.toLocaleString('es-AR')}</div><div className="metric-footer">{cobranzas.filter(c => c.estado === 'Vencido').length} operaciones</div></div>
            </div>
            <div className="card">
              <div className="filter-bar">
                <input type="text" className="form-input search-input" placeholder="Buscar operación..." value={cobSearch} onChange={e => setCobSearch(e.target.value)} />
                <select className="form-input" value={cobFilterEstado} onChange={e => setCobFilterEstado(e.target.value)}>
                  <option value="">Todos los estados</option>
                  <option>Pendiente</option><option>Cobrado parcial</option><option>Cobrado</option><option>Vencido</option>
                </select>
                <select className="form-input" value={cobFilterPais} onChange={e => setCobFilterPais(e.target.value)}>
                  <option value="">Todos los países</option>
                  {paisesCobUnicos.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <div className="filter-spacer" />
                <button className="btn btn-primary btn-sm" onClick={() => openNew('cobranza')}><Plus size={14} /> Nueva cobranza</button>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Operación</th><th>País</th><th>Monto USD</th><th>Unid.</th><th>Cobrado</th><th>Saldo</th><th>Vencimiento</th><th>Estado</th><th></th></tr></thead>
                  <tbody>
                    {filteredCobranzas.length === 0 ? <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon"><DollarSign size={28} /></div><div className="empty-state-text">Sin operaciones. Registrá la primera cobranza.</div></div></td></tr> :
                      filteredCobranzas.map(c => {
                        const monto = parseFloat(c.monto || 0);
                        const cobM = parseFloat(c.cobrado_monto || 0);
                        const saldo = monto - cobM;
                        const dias = c.vencimiento ? daysFrom(c.vencimiento) : null;
                        return (
                          <tr key={c.id}>
                            <td><strong>{c.descripcion}</strong>{c.cliente_nombre && <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{c.cliente_nombre}{c.condicion ? ` · ${c.condicion}` : ''}</div>}</td>
                            <td>{c.pais_nombre || '—'}</td>
                            <td style={{fontWeight: 500}}>${monto.toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                            <td style={{color: 'var(--text-muted)'}}>{c.unidades ? Number(c.unidades).toLocaleString() + ' u' : '—'}</td>
                            <td style={{color: 'var(--success)', fontWeight: 500}}>{cobM > 0 ? '$' + cobM.toLocaleString('es-AR', {minimumFractionDigits: 2}) : '—'}</td>
                            <td style={{color: saldo > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 500}}>{saldo > 0 ? '$' + saldo.toLocaleString('es-AR', {minimumFractionDigits: 2}) : '✓'}</td>
                            <td style={{color: dias !== null && dias < 0 && c.estado !== 'Cobrado' ? 'var(--danger)' : 'var(--text)', fontWeight: dias !== null && dias < 0 ? 500 : 400}}>
                              {fmtDate(c.vencimiento)}
                              {dias !== null && dias < 0 && c.estado !== 'Cobrado' && <><br/><span className="badge badge-red" style={{fontSize: '0.6rem'}}>{Math.abs(dias)}d vencido</span></>}
                            </td>
                            <td>{estadoBadge(c.estado)}</td>
                            <td><button className="icon-btn" onClick={() => openEdit('cobranza', c)}><Edit size={14} /></button> <button className="icon-btn" onClick={() => requestDelete('cobranzas', c.id, c.descripcion)}><Trash2 size={14} /></button></td>
                          </tr>
                        );
                      })
                    }
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========== MODAL UNIVERSAL ========== */}
        {showModal && (
          <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(null); }}>
            <div className="modal-content">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexShrink: 0}}>
                <h3 style={{margin: 0, fontSize: '1.1rem'}}>{
                  {contacto: 'Contacto', visita: 'Visita / reunión', oportunidad: 'Oportunidad', cobranza: 'Operación de cobranza', tarea: 'Tarea', muestra: 'Muestra', comunicacion: 'Comunicación', documento: 'Documento', pais: 'País destino', precio: 'Precio de competidor', tendencia: 'Nota de inteligencia'}[showModal] || ''
                }</h3>
                <button className="icon-btn" onClick={() => setShowModal(null)}><X size={18} /></button>
              </div>
              <form onSubmit={(e) => {
                const endpointMap = { contacto: 'contactos', visita: 'visitas', oportunidad: 'oportunidades', cobranza: 'cobranzas', tarea: 'tareas', muestra: 'muestras', comunicacion: 'comunicaciones', documento: 'documentos', pais: 'paises', precio: 'precios', tendencia: 'tendencias' };
                handleSave(e, endpointMap[showModal]);
              }} style={{display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden'}}>
                <div className="modal-body">

                  {/* --- CONTACTO --- */}
                  {showModal === 'contacto' && <>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Nombre *</label><input type="text" className="form-input" required maxLength={maxLen('contacto','nombre')} value={fv('nombre')} onChange={e => setFv('nombre', e.target.value)} placeholder="Nombre completo" /></div>
                      <div className="form-group"><label className="form-label">Apellido</label><input type="text" className="form-input" maxLength={maxLen('contacto','apellido')} value={fv('apellido')} onChange={e => setFv('apellido', e.target.value)} /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Empresa</label><input type="text" className="form-input" maxLength={maxLen('contacto','empresa')} value={fv('empresa')} onChange={e => setFv('empresa', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Rol</label><select className="form-input" value={fv('rol') || 'Importador'} onChange={e => setFv('rol', e.target.value)}><option>Importador</option><option>Distribuidor</option><option>Broker</option><option>Retailer</option><option>Otro</option></select></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">País</label><input type="text" className="form-input" value={fv('pais_nombre')} onChange={e => setFv('pais_nombre', e.target.value)} placeholder="País" /></div>
                      <div className="form-group"><label className="form-label">Ciudad</label><input type="text" className="form-input" maxLength={maxLen('contacto','ciudad')} value={fv('ciudad')} onChange={e => setFv('ciudad', e.target.value)} /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" maxLength={maxLen('contacto','email')} value={fv('email')} onChange={e => setFv('email', e.target.value)} placeholder="email@empresa.com" /></div>
                      <div className="form-group"><label className="form-label">Teléfono / WhatsApp</label><input type="text" className="form-input" maxLength={maxLen('contacto','telefono')} value={fv('telefono')} onChange={e => setFv('telefono', e.target.value)} placeholder="+1 555 0000" /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Estado</label><select className="form-input" value={fv('estado') || 'Activo'} onChange={e => setFv('estado', e.target.value)}><option>Activo</option><option>Prospecto</option><option>En proceso</option><option>Inactivo</option></select></div>
                    <div className="form-group"><label className="form-label">Notas</label><RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} placeholder="Observaciones, intereses..." /></div>
                  </>}

                  {/* --- VISITA --- */}
                  {showModal === 'visita' && <>
                    <div className="form-group"><label className="form-label">Título *</label><input type="text" className="form-input" required maxLength={maxLen('visita','titulo')} value={fv('titulo')} onChange={e => setFv('titulo', e.target.value)} placeholder="Ej: Expofood Brasil 2025" /></div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Tipo</label><select className="form-input" value={fv('tipo') || 'Feria internacional'} onChange={e => setFv('tipo', e.target.value)}><option>Feria internacional</option><option>Ronda de negocios</option><option>Reunión comercial</option><option>Visita a cliente</option><option>Videoconferencia</option></select></div>
                      <div className="form-group"><label className="form-label">Estado</label><select className="form-input" value={fv('estado') || 'Planificada'} onChange={e => setFv('estado', e.target.value)}><option>Planificada</option><option>Realizada</option><option>Cancelada</option></select></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Fecha</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">País / Ciudad</label><input type="text" className="form-input" maxLength={maxLen('visita','lugar')} value={fv('lugar')} onChange={e => setFv('lugar', e.target.value)} placeholder="São Paulo, Brasil" /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Contactos participantes</label><input type="text" className="form-input" maxLength={maxLen('visita','contactos')} value={fv('contactos')} onChange={e => setFv('contactos', e.target.value)} placeholder="Nombres o empresas" /></div>
                    {(fv('tipo') === 'Ronda de negocios') && (
                      <div style={{background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 14}}>
                        <div style={{fontSize: '0.8rem', fontWeight: 600, color: 'var(--dy-blue)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6}}><Handshake size={14} /> Datos de ronda de negocios</div>
                        <div className="form-grid-2">
                          <div className="form-group"><label className="form-label">Organismo organizador</label><input className="form-input" maxLength={150} value={fv('ronda_org')} onChange={e => setFv('ronda_org', e.target.value)} placeholder="ProArgentina, Cancillería" /></div>
                          <div className="form-group"><label className="form-label">Nro. de reuniones</label><input type="number" min="0" className="form-input" value={fv('ronda_reuniones')} onChange={e => setFv('ronda_reuniones', e.target.value)} /></div>
                        </div>
                        <div className="form-grid-2">
                          <div className="form-group"><label className="form-label">Importadores contactados</label><input className="form-input" maxLength={200} value={fv('ronda_importadores')} onChange={e => setFv('ronda_importadores', e.target.value)} /></div>
                          <div className="form-group"><label className="form-label">Pedidos generados (USD)</label><input type="number" min="0" className="form-input" value={fv('ronda_pedidos')} onChange={e => setFv('ronda_pedidos', e.target.value)} /></div>
                        </div>
                        <div className="form-group" style={{marginBottom: 0}}><label className="form-label">Resultado general</label><select className="form-input" value={fv('ronda_resultado') || 'Positivo'} onChange={e => setFv('ronda_resultado', e.target.value)}><option>Muy positivo</option><option>Positivo</option><option>Neutral</option><option>Sin resultados</option></select></div>
                      </div>
                    )}
                    <div className="form-group"><label className="form-label">Resultados / Notas</label><RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} placeholder="Qué se habló, muestras entregadas..." /></div>
                    <div className="form-group"><label className="form-label">Próximo paso</label><input className="form-input" maxLength={250} value={fv('proximo')} onChange={e => setFv('proximo', e.target.value)} placeholder="Ej: Enviar propuesta antes del 30/6" /></div>
                  </>}

                  {/* --- OPORTUNIDAD --- */}
                  {showModal === 'oportunidad' && <>
                    <div className="form-group"><label className="form-label">Nombre de la oportunidad *</label><input type="text" className="form-input" required maxLength={maxLen('oportunidad','nombre')} value={fv('nombre')} onChange={e => setFv('nombre', e.target.value)} placeholder="Ej: Grupo Arcos — Tapas Don Yeyo" /></div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">País</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                      <div className="form-group"><label className="form-label">Contacto</label><select className="form-input" value={fv('contacto_id') || ''} onChange={e => setFv('contacto_id', e.target.value || null)}><option value="">Selecciona...</option>{contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''}</option>)}</select></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Marca</label><select className="form-input" value={fv('marca') || 'Don Yeyo'} onChange={e => setFv('marca', e.target.value)}><option>Don Yeyo</option><option>DeViano</option><option>Ambas</option></select></div>
                      <div className="form-group"><label className="form-label">Categoría de producto</label><select className="form-input" value={fv('categoria') || 'Tapas'} onChange={e => setFv('categoria', e.target.value)}><option>Tapas</option><option>Pastas</option><option>Panificados</option><option>Tortillas</option><option>Mix</option></select></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Monto estimado (USD)</label><input type="number" step="any" min="0" className="form-input" value={fv('monto')} onChange={e => setFv('monto', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Probabilidad (%)</label><input type="number" className="form-input" value={fv('prob')} onChange={e => setFv('prob', e.target.value)} min="0" max="100" /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Etapa</label><select className="form-input" value={fv('etapa') || 'Prospecto'} onChange={e => setFv('etapa', e.target.value)}><option>Prospecto</option><option>Contactado</option><option>Propuesta</option><option>Negociación</option><option>Cerrado</option><option>Perdido</option></select></div>
                      <div className="form-group"><label className="form-label">Cierre estimado</label><input type="date" className="form-input" value={fvDate('cierre')} onChange={e => setFv('cierre', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Notas</label><RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} placeholder="Detalles, condiciones..." /></div>
                  </>}

                  {/* --- TAREA --- */}
                  {showModal === 'tarea' && <>
                    <div className="form-group"><label className="form-label">Descripción *</label><input type="text" className="form-input" required maxLength={maxLen('tarea','titulo')} value={fv('titulo')} onChange={e => setFv('titulo', e.target.value)} placeholder="¿Qué hay que hacer?" /></div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Fecha límite</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Prioridad</label><select className="form-input" value={fv('prioridad') || 'media'} onChange={e => setFv('prioridad', e.target.value)}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Relacionado con (país)</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona un país...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                      <div className="form-group"><label className="form-label">Asignado a</label><input type="text" className="form-input" maxLength={100} value={fv('asignado')} onChange={e => setFv('asignado', e.target.value)} placeholder="Nombre" /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Notas</label><RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} placeholder="Detalle adicional..." minHeight={100} /></div>
                  </>}

                  {/* --- COBRANZA --- */}
                  {showModal === 'cobranza' && <>
                    <div className="form-group"><label className="form-label">Operación / descripción *</label><input type="text" className="form-input" required maxLength={maxLen('cobranza','descripcion')} value={fv('descripcion')} onChange={e => setFv('descripcion', e.target.value)} placeholder="Ej: Invoice #2025-089 — Tapas Don Yeyo" /></div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Cliente / Empresa</label><select className="form-input" value={fv('cliente_id') || ''} onChange={e => setFv('cliente_id', e.target.value || null)}><option value="">Selecciona...</option>{contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''}</option>)}</select></div>
                      <div className="form-group"><label className="form-label">País</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                    </div>
                    <div className="form-grid-3">
                      <div className="form-group"><label className="form-label">Monto total (USD)</label><input type="number" step="any" min="0" className="form-input" value={fv('monto')} onChange={e => setFv('monto', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Monto cobrado (USD)</label><input type="number" step="any" min="0" className="form-input" value={fv('cobrado_monto')} onChange={e => setFv('cobrado_monto', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Saldo (USD)</label><input type="text" className="form-input" value={`$${(parseFloat(fv('monto') || 0) - parseFloat(fv('cobrado_monto') || 0)).toLocaleString()}`} readOnly style={{background: 'var(--background)', fontWeight: 500}} /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Unidades exportadas</label><input type="number" min="0" className="form-input" value={fv('unidades')} onChange={e => setFv('unidades', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Marca</label><select className="form-input" value={fv('marca') || 'Don Yeyo'} onChange={e => setFv('marca', e.target.value)}><option>Don Yeyo</option><option>DeViano</option><option>Ambas</option></select></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Fecha de embarque</label><input type="date" className="form-input" value={fvDate('embarque')} onChange={e => setFv('embarque', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Fecha vencimiento cobro</label><input type="date" className="form-input" value={fvDate('vencimiento')} onChange={e => setFv('vencimiento', e.target.value)} /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Estado</label><select className="form-input" value={fv('estado') || 'Pendiente'} onChange={e => setFv('estado', e.target.value)}><option>Pendiente</option><option>Cobrado parcial</option><option>Cobrado</option><option>Vencido</option></select></div>
                      <div className="form-group"><label className="form-label">Condición de pago</label><select className="form-input" value={fv('condicion') || 'Carta de crédito'} onChange={e => setFv('condicion', e.target.value)}><option>Carta de crédito</option><option>Transferencia anticipada</option><option>Cobranza documentaria</option><option>Cuenta corriente</option><option>Otro</option></select></div>
                    </div>
                    <div className="form-group"><label className="form-label">Notas</label><RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} placeholder="Referencias, nro carta de crédito..." /></div>
                  </>}

                  {/* --- MUESTRA --- */}
                  {showModal === 'muestra' && <>
                    <div className="form-group"><label className="form-label">Producto / descripción *</label><input type="text" className="form-input" required maxLength={maxLen('muestra','producto')} value={fv('producto')} onChange={e => setFv('producto', e.target.value)} placeholder="Ej: Tapas Don Yeyo x 12u" /></div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Destinatario</label><input className="form-input" maxLength={maxLen('muestra','destinatario')} value={fv('destinatario')} onChange={e => setFv('destinatario', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">País</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Fecha de envío</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Resultado</label><select className="form-input" value={fv('resultado') || 'Pendiente'} onChange={e => setFv('resultado', e.target.value)}><option>Pendiente</option><option>En evaluación</option><option>Positivo</option><option>Negativo</option></select></div>
                    </div>
                    <div className="form-group"><label className="form-label">Costo estimado (USD)</label><input type="number" step="0.01" min="0" className="form-input" value={fv('costo')} onChange={e => setFv('costo', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Notas / feedback</label><RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} placeholder="Feedback del cliente..." /></div>
                  </>}

                  {/* --- COMUNICACIÓN --- */}
                  {showModal === 'comunicacion' && <>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Tipo</label><select className="form-input" value={fv('tipo') || 'Email'} onChange={e => setFv('tipo', e.target.value)}><option>Email</option><option>Llamada</option><option>WhatsApp</option><option>Reunión</option><option>Videollamada</option></select></div>
                      <div className="form-group"><label className="form-label">Fecha</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Contacto</label><select className="form-input" value={fv('contacto_id') || ''} onChange={e => setFv('contacto_id', e.target.value || null)}><option value="">Selecciona...</option>{contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''}</option>)}</select></div>
                      <div className="form-group"><label className="form-label">País</label><input className="form-input" maxLength={100} value={fv('pais')} onChange={e => setFv('pais', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Asunto / tema *</label><input type="text" className="form-input" required maxLength={maxLen('comunicacion','asunto')} value={fv('asunto')} onChange={e => setFv('asunto', e.target.value)} placeholder="¿De qué se trató?" /></div>
                    <div className="form-group"><label className="form-label">Resumen</label><RichTextEditor value={fv('resumen')} onChange={v => setFv('resumen', v)} placeholder="Qué se dijo, compromisos..." /></div>
                    <div className="form-group"><label className="form-label">Próximo paso</label><input className="form-input" maxLength={250} value={fv('proximo')} onChange={e => setFv('proximo', e.target.value)} placeholder="Ej: Responder con oferta formal el lunes" /></div>
                  </>}

                  {/* --- DOCUMENTO --- */}
                  {showModal === 'documento' && <>
                    <div className="form-group"><label className="form-label">Nombre / descripción *</label><input type="text" className="form-input" required maxLength={maxLen('documento','nombre')} value={fv('nombre')} onChange={e => setFv('nombre', e.target.value)} placeholder="Ej: Certificado fitosanitario SENASA #44812" /></div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Tipo</label><select className="form-input" value={fv('tipo') || 'Invoice'} onChange={e => setFv('tipo', e.target.value)}><option>Invoice</option><option>Bill of Lading</option><option>Packing List</option><option>Certificado fitosanitario</option><option>Certificado de origen</option><option>Contrato</option><option>Otro</option></select></div>
                      <div className="form-group"><label className="form-label">Estado</label><select className="form-input" value={fv('estado') || 'Vigente'} onChange={e => setFv('estado', e.target.value)}><option>Vigente</option><option>Por vencer</option><option>Vencido</option></select></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">País / Contacto</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                      <div className="form-group"><label className="form-label">Fecha de vencimiento</label><input type="date" className="form-input" value={fvDate('vencimiento')} onChange={e => setFv('vencimiento', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Número / referencia</label><input className="form-input" maxLength={maxLen('documento','numero')} value={fv('numero')} onChange={e => setFv('numero', e.target.value)} placeholder="Número de documento" /></div>
                    <div className="form-group"><label className="form-label">Notas</label><RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} /></div>
                  </>}

                  {/* --- PAÍS --- */}
                  {showModal === 'pais' && <>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">País *</label><input type="text" className="form-input" required maxLength={maxLen('pais','nombre')} value={fv('nombre')} onChange={e => setFv('nombre', e.target.value)} placeholder="Ej: Brasil" /></div>
                      <div className="form-group"><label className="form-label">Emoji bandera</label><input className="form-input" maxLength={maxLen('pais','bandera')} value={fv('bandera')} onChange={e => setFv('bandera', e.target.value)} placeholder="🇧🇷" /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Arancel principal (%)</label><input type="number" step="0.01" min="0" max="100" className="form-input" value={fv('arancel')} onChange={e => setFv('arancel', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Incoterm habitual</label><input className="form-input" maxLength={maxLen('pais','incoterm')} value={fv('incoterm')} onChange={e => setFv('incoterm', e.target.value)} placeholder="CIF Santos" /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Posición arancelaria</label><input className="form-input" maxLength={maxLen('pais','ncm')} value={fv('ncm')} onChange={e => setFv('ncm', e.target.value)} placeholder="NCM 1902.19" /></div>
                      <div className="form-group"><label className="form-label">Moneda local</label><input className="form-input" maxLength={maxLen('pais','moneda')} value={fv('moneda')} onChange={e => setFv('moneda', e.target.value)} placeholder="BRL" /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Tipo de cambio (vs USD)</label><input type="number" step="0.0001" min="0" className="form-input" value={fv('tipocambio')} onChange={e => setFv('tipocambio', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Fecha tipo de cambio</label><input type="date" className="form-input" value={fvDate('tc_fecha')} onChange={e => setFv('tc_fecha', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Organismo sanitario regulador</label><input className="form-input" maxLength={150} value={fv('sanitario')} onChange={e => setFv('sanitario', e.target.value)} placeholder="ANVISA, SENASICA, FDA..." /></div>
                    <div className="form-group"><label className="form-label">Requisitos de habilitación sanitaria</label><RichTextEditor value={fv('sanitario_req')} onChange={v => setFv('sanitario_req', v)} minHeight={80} /></div>
                    <div className="form-group"><label className="form-label">Requisitos de etiquetado</label><RichTextEditor value={fv('etiquetado')} onChange={v => setFv('etiquetado', v)} minHeight={80} /></div>
                    <div className="form-group"><label className="form-label">Notas / acceso al mercado</label><RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} minHeight={80} /></div>
                  </>}

                  {/* --- PRECIO COMPETIDOR --- */}
                  {showModal === 'precio' && <>
                    <div className="form-group"><label className="form-label">Competidor / marca *</label><input type="text" className="form-input" required maxLength={maxLen('precio','competidor')} value={fv('competidor')} onChange={e => setFv('competidor', e.target.value)} placeholder="Matarazzo, La Salteña..." /></div>
                    <div className="form-group"><label className="form-label">Descripción del producto</label><input className="form-input" maxLength={maxLen('precio','producto')} value={fv('producto')} onChange={e => setFv('producto', e.target.value)} placeholder="Tapas de empanadas x 12u 500g" /></div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">País</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                      <div className="form-group"><label className="form-label">Categoría</label><select className="form-input" value={fv('categoria') || 'Tapas'} onChange={e => setFv('categoria', e.target.value)}><option>Tapas</option><option>Pastas</option><option>Panificados</option><option>Tortillas</option><option>Otro</option></select></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Precio</label><input type="number" step="0.01" min="0" className="form-input" value={fv('precio')} onChange={e => setFv('precio', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Moneda / unidad</label><input className="form-input" maxLength={30} value={fv('unidad')} onChange={e => setFv('unidad', e.target.value)} placeholder="USD/kg, BRL/paq" /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Peso neto envase (kg)</label><input type="number" step="0.001" min="0" className="form-input" value={fv('peso')} onChange={e => setFv('peso', e.target.value)} placeholder="0.500" /></div>
                      <div className="form-group"><label className="form-label">Precio / kg (calculado)</label><input className="form-input" readOnly value={fv('precio') && fv('peso') ? (parseFloat(fv('precio')) / parseFloat(fv('peso'))).toFixed(2) + ' / kg' : ''} style={{background: 'var(--background)', color: 'var(--dy-blue)', fontWeight: 500}} /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Fuente</label><input className="form-input" maxLength={150} value={fv('fuente')} onChange={e => setFv('fuente', e.target.value)} placeholder="visita feria, web..." /></div>
                      <div className="form-group"><label className="form-label">Fecha</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Notas</label><RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} /></div>
                  </>}

                  {/* --- TENDENCIA --- */}
                  {showModal === 'tendencia' && <>
                    <div className="form-group"><label className="form-label">Título *</label><input type="text" className="form-input" required maxLength={maxLen('tendencia','titulo')} value={fv('titulo')} onChange={e => setFv('titulo', e.target.value)} placeholder="Crecimiento del mercado free-gluten en México" /></div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">País / Región</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                      <div className="form-group"><label className="form-label">Categoría</label><select className="form-input" value={fv('categoria') || 'Tendencia de consumo'} onChange={e => setFv('categoria', e.target.value)}><option>Tendencia de consumo</option><option>Regulación / normativa</option><option>Competencia</option><option>Logística / costos</option><option>Oportunidad</option><option>Riesgo</option></select></div>
                    </div>
                    <div className="form-group"><label className="form-label">Descripción</label><RichTextEditor value={fv('descripcion')} onChange={v => setFv('descripcion', v)} placeholder="Detalle de la tendencia, datos, fuentes..." /></div>
                    <div className="form-group"><label className="form-label">Fuente</label><input className="form-input" maxLength={200} value={fv('fuente')} onChange={e => setFv('fuente', e.target.value)} placeholder="Informe USDA, Feria Anuga..." /></div>
                    <div className="form-group"><label className="form-label">Etiquetas</label><input className="form-input" maxLength={200} value={fv('tags')} onChange={e => setFv('tags', e.target.value)} placeholder="pasta, gluten-free, Europa (separadas por coma)" /></div>
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
      </main>
    </div>
  );
}
