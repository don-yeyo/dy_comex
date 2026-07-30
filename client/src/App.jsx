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
  CheckCircle2, Clock3, AlertCircle, ShoppingBag, FileSpreadsheet
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

export default function App() {
  const toast = useToast();
  const { account, isAuthenticated } = useAuth();
  const [theme, setTheme] = useState(() => localStorage.getItem('dy_theme') || 'light');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [subTab, setSubTab] = useState('muestras');
  const [intelTab, setIntelTab] = useState('precios');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filtros de búsqueda global e inteligencia
  const [globalSearch, setGlobalSearch] = useState('');
  const [intelFilterPais, setIntelFilterPais] = useState('');
  const [intelFilterMarca, setIntelFilterMarca] = useState('');

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

  // Estados de filtros por sección
  const [tareaFilterStatus, setTareaFilterStatus] = useState('');
  const [tareaFilterPrio, setTareaFilterPrio] = useState('');
  const [contactoFilterEstado, setContactoFilterEstado] = useState('');
  const [visitaFilterTipo, setVisitaFilterTipo] = useState('');
  const [oportunidadFilterEtapa, setOportunidadFilterEtapa] = useState('');
  const [cobranzaFilterEstado, setCobranzaFilterEstado] = useState('');
  const [muestraFilterRes, setMuestraFilterRes] = useState('');
  const [comFilterTipo, setComFilterTipo] = useState('');
  const [operacionFilterEstado, setOperacionFilterEstado] = useState('');

  // Estado del modal de confirmación de eliminación
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Estado del modal universal
  const [showModal, setShowModal] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formValues, setFormValues] = useState({});

  // Lightbox de imágenes
  const [previewImage, setPreviewImage] = useState(null);

  // Muestras: array de productos seleccionados
  const [muestraProductos, setMuestraProductos] = useState([]);
  const [muestraProductoInput, setMuestraProductoInput] = useState('');
  const [muestraCantInput, setMuestraCantInput] = useState('');
  const [muestraLoteInput, setMuestraLoteInput] = useState('');

  // Calendario Centralizado
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [calendarViewMode, setCalendarViewMode] = useState('grid'); // 'grid' | 'timeline'

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
    setFormValues({ ...defaultData });
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

  // Listas filtradas
  const filteredTareas = useMemo(() => {
    return tareas.filter(t => {
      const q = globalSearch.toLowerCase();
      const mQ = !q || (t.titulo?.toLowerCase().includes(q) || t.asignado?.toLowerCase().includes(q) || t.pais_nombre?.toLowerCase().includes(q));
      const mS = !tareaFilterStatus || t.status === tareaFilterStatus;
      const mP = !tareaFilterPrio || t.prioridad === tareaFilterPrio;
      return mQ && mS && mP;
    });
  }, [tareas, globalSearch, tareaFilterStatus, tareaFilterPrio]);

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
      const dateStr = `${month === 0 ? year - 1 : year}-${String(month === 0 ? 12 : month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: false, dateStr });
    }

    // Días mes actual
    const todayStr = new Date().toISOString().substring(0, 10);
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: true, isToday: dateStr === todayStr, dateStr });
    }

    // Días mes siguiente
    const remaining = 42 - days.length;
    for (let d = 1; d <= remaining; d++) {
      const dateStr = `${month === 11 ? year + 1 : year}-${String(month === 11 ? 1 : month + 2).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      days.push({ day: d, isCurrentMonth: false, dateStr });
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

      {/* Modal de confirmación de eliminación */}
      {confirmDelete && (
        <ConfirmModal
          title="Confirmar eliminación"
          message={`¿Estás seguro de eliminar "${confirmDelete.name}"? Esta acción no se puede deshacer.`}
          onConfirm={handleConfirmDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* ========== HEADER ========== */}
      <header className="header glass">
        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu size={20} />
          </button>
          <div className="brand" onClick={() => setActiveTab('dashboard')} style={{cursor: 'pointer'}}>
            <img src={logo} alt="Don Yeyo" className="logo" />
            <div className="brand-text">
              <h1>{APP_CONFIG.companyName}</h1>
              <span>{APP_CONFIG.appName} v{APP_CONFIG.appVersion}</span>
            </div>
          </div>
        </div>

        <div className="search-bar">
          <Search size={16} style={{color: 'var(--text-muted)'}} />
          <input
            type="text"
            placeholder="Buscar contactos, operaciones, visitas..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
          {globalSearch && (
            <button className="icon-btn" onClick={() => setGlobalSearch('')} style={{padding: 2}}>
              <X size={14} />
            </button>
          )}
        </div>

        <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
          <button className="theme-toggle" onClick={toggleTheme} title="Cambiar tema">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <div className="user-profile">
            <div className="user-avatar">{account?.name?.[0] || 'U'}</div>
            <div className="user-info">
              <span className="user-name">{account?.name || APP_CONFIG.defaultUserName}</span>
              <span className="user-role">{account?.username || APP_CONFIG.defaultUserEmail}</span>
            </div>
          </div>
        </div>
      </header>

      {/* ========== BODY WITH SIDEBAR AND MAIN CONTENT ========== */}
      <div className="app-body">
        {/* ========== SIDEBAR / NAVIGATION ========== */}
      <nav className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="nav-group">
          <div className="nav-label">PRINCIPAL</div>
          <button className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => { setActiveTab('dashboard'); setSidebarOpen(false); }}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <button className={`nav-item ${activeTab === 'tareas' ? 'active' : ''}`} onClick={() => { setActiveTab('tareas'); setSidebarOpen(false); }}>
            <CheckSquare size={18} /> Tareas
          </button>
          <button className={`nav-item ${activeTab === 'agenda' ? 'active' : ''}`} onClick={() => { setActiveTab('agenda'); setSidebarOpen(false); }}>
            <CalendarIcon size={18} /> Agenda / Calendario
          </button>
        </div>

        <div className="nav-group">
          <div className="nav-label">GESTIÓN COMERCIAL</div>
          <button className={`nav-item ${activeTab === 'contactos' ? 'active' : ''}`} onClick={() => { setActiveTab('contactos'); setSidebarOpen(false); }}>
            <Users size={18} /> Contactos
          </button>
          <button className={`nav-item ${activeTab === 'visitas' ? 'active' : ''}`} onClick={() => { setActiveTab('visitas'); setSidebarOpen(false); }}>
            <Calendar size={18} /> Visitas y reuniones
          </button>
          <button className={`nav-item ${activeTab === 'oportunidades' ? 'active' : ''}`} onClick={() => { setActiveTab('oportunidades'); setSidebarOpen(false); }}>
            <Briefcase size={18} /> Oportunidades
          </button>
          <button className={`nav-item ${activeTab === 'operaciones' ? 'active' : ''}`} onClick={() => { setActiveTab('operaciones'); setSidebarOpen(false); }}>
            <ShoppingBag size={18} /> Operaciones
          </button>
          <button className={`nav-item ${activeTab === 'muestras' ? 'active' : ''}`} onClick={() => { setActiveTab('muestras'); setSidebarOpen(false); }}>
            <Package size={18} /> Muestras y com.
          </button>
        </div>

        <div className="nav-group">
          <div className="nav-label">INTELIGENCIA & MERCADOS</div>
          <button className={`nav-item ${activeTab === 'paises' ? 'active' : ''}`} onClick={() => { setActiveTab('paises'); setSidebarOpen(false); }}>
            <Globe size={18} /> Países destino
          </button>
          <button className={`nav-item ${activeTab === 'inteligencia' ? 'active' : ''}`} onClick={() => { setActiveTab('inteligencia'); setSidebarOpen(false); }}>
            <TrendingUp size={18} /> Inteligencia comercial
          </button>
          <button className={`nav-item ${activeTab === 'cobranzas' ? 'active' : ''}`} onClick={() => { setActiveTab('cobranzas'); setSidebarOpen(false); }}>
            <DollarSign size={18} /> Cobranzas
          </button>
          <button className={`nav-item ${activeTab === 'calculadora' ? 'active' : ''}`} onClick={() => { setActiveTab('calculadora'); setSidebarOpen(false); }}>
            <Calculator size={18} /> Calculadora Landed
          </button>
        </div>
      </nav>

      {/* ========== CONTENIDO PRINCIPAL ========== */}
      <main className="main-content">
        {loading && (
          <div style={{display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 40}}>
            <RefreshCw className="spin" size={32} style={{color: 'var(--primary)'}} />
          </div>
        )}

        {/* ===== DASHBOARD ===== */}
        {!loading && activeTab === 'dashboard' && (
          <div>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon bg-blue"><Users size={20} /></div>
                <div className="stat-details">
                  <span className="stat-label">Clientes / Contactos Activos</span>
                  <span className="stat-value">{activeContactsCount}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-amber"><CheckSquare size={20} /></div>
                <div className="stat-details">
                  <span className="stat-label">Tareas Pendientes</span>
                  <span className="stat-value">{pendingTasksCount}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-emerald"><ShoppingBag size={20} /></div>
                <div className="stat-details">
                  <span className="stat-label">Operaciones en Curso</span>
                  <span className="stat-value">{activeOpsCount}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon bg-purple"><DollarSign size={20} /></div>
                <div className="stat-details">
                  <span className="stat-label">Valor Total Operaciones</span>
                  <span className="stat-value">${totalOpsUSD.toLocaleString()} USD</span>
                </div>
              </div>
            </div>

            <div className="grid-2-1" style={{marginTop: 20}}>
              {/* Funnel Comercial / Ventas */}
              <div className="card">
                <div className="section-header">
                  <h3><BarChart3 size={20} /> Funnel Comercial / Desarrollo de Clientes</h3>
                  <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>Basado en contactos calificados y en proceso</span>
                </div>
                <div style={{display: 'flex', flexDirection: 'column', gap: 14, padding: '10px 0'}}>
                  {funnelEtapas.map((stage, i) => {
                    const pct = Math.round((stage.count / maxFunnelCount) * 100);
                    return (
                      <div key={i} style={{display: 'flex', flexDirection: 'column', gap: 4}}>
                        <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600}}>
                          <span>{stage.name}</span>
                          <span>{stage.count} contactos</span>
                        </div>
                        <div className="progress-bar" style={{height: 12}}>
                          <div className="progress-fill" style={{width: `${pct}%`, background: stage.color}} />
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
                  <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                    {tareas.filter(t => t.status === 'pendiente').slice(0, 5).map(t => (
                      <div key={t.id} style={{display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'var(--surface-hover)', borderRadius: 8}}>
                        <input type="checkbox" checked={false} onChange={() => toggleTareaStatus(t)} style={{cursor: 'pointer'}} />
                        <div style={{flex: 1, minWidth: 0}}>
                          <div style={{fontSize: '0.85rem', fontWeight: 600, wordBreak: 'break-word'}}>{t.titulo}</div>
                          <div style={{fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', gap: 8, alignItems: 'center', marginTop: 2}}>
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
              <div style={{display: 'flex', alignItems: 'center', gap: 12}}>
                <button className="icon-btn" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}>
                  <ChevronLeft size={18} />
                </button>
                <h2 style={{margin: 0, fontSize: '1.2rem'}}>
                  {calendarDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' }).toUpperCase()}
                </h2>
                <button className="icon-btn" onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}>
                  <ChevronRight size={18} />
                </button>
                <button className="btn btn-xs btn-outline" onClick={() => setCalendarDate(new Date())}>Hoy</button>
              </div>

              <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
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
              <div className="card" style={{padding: 12}}>
                <div className="calendar-grid">
                  {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
                    <div key={d} className="calendar-day-head">{d}</div>
                  ))}
                  {calendarMonthDays.map((cell, i) => {
                    const dayEvents = consolidatedEvents.filter(e => e.date === cell.dateStr);
                    return (
                      <div key={i} className={`calendar-day-cell ${!cell.isCurrentMonth ? 'other-month' : ''} ${cell.isToday ? 'is-today' : ''}`}>
                        <div className="calendar-day-num">
                          <span>{cell.day}</span>
                          {dayEvents.length > 0 && (
                            <span style={{fontSize: '0.65rem', background: 'var(--primary)', color: '#fff', padding: '1px 5px', borderRadius: 10}}>
                              {dayEvents.length}
                            </span>
                          )}
                        </div>
                        <div style={{display: 'flex', flexDirection: 'column', gap: 4, overflowY: 'auto', maxHeight: 80}}>
                          {dayEvents.map(e => (
                            <div key={e.id} className={`calendar-event-badge ${e.badgeClass}`} title={`${e.title} (${e.typeLabel})`}>
                              <span>{e.time ? e.time : '•'}</span>
                              <span style={{overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{e.title}</span>
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
                      <div key={e.id} className="agenda-card">
                        <div style={{textAlign: 'center', minWidth: 70, borderRight: '1px solid var(--border)', paddingRight: 12}}>
                          <div style={{fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)'}}>{fmtDate(e.date)}</div>
                          {e.time && <div style={{fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 2}}>{e.time} hs</div>}
                        </div>
                        <div style={{flex: 1}}>
                          <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                            <span className={`calendar-event-badge ${e.badgeClass}`}>{e.typeLabel}</span>
                            <span style={{fontWeight: 600, fontSize: '0.9rem'}}>{e.title}</span>
                          </div>
                          {e.subtitle && <div style={{fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4}}>{e.subtitle}</div>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ===== TAREAS ABM ===== */}
        {!loading && activeTab === 'tareas' && (
          <div className="card">
            <div className="section-header" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20}}>
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
              <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>
                Total: <strong>{filteredTareas.length}</strong> tareas ({tareas.filter(t => t.status === 'pendiente').length} pendientes)
              </div>
            </div>

            {filteredTareas.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon"><CheckSquare size={32} /></div>
                <div className="empty-state-text">No hay tareas que coincidan con los filtros</div>
              </div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
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
                      style={{cursor: 'pointer', width: 18, height: 18, marginTop: 3, accentColor: 'var(--dy-blue)'}}
                      title={t.status === 'hecha' ? 'Marcar como pendiente' : 'Marcar como completada'}
                    />
                    <div style={{flex: 1, minWidth: 0}}>
                      <div style={{
                        fontSize: '0.95rem',
                        fontWeight: 600,
                        textDecoration: t.status === 'hecha' ? 'line-through' : 'none',
                        color: t.status === 'hecha' ? 'var(--text-muted)' : 'var(--text)'
                      }}>
                        {t.titulo}
                      </div>
                      <div style={{fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: 12, alignItems: 'center', marginTop: 6, flexWrap: 'wrap'}}>
                        {t.fecha && (
                          <span style={{color: 'var(--primary)', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4}}>
                            <CalendarIcon size={12} /> {fmtDate(t.fecha)} {fmtTime(t.hora)}
                          </span>
                        )}
                        {prioridadBadge(t.prioridad)}
                        {t.pais_nombre && <span>📍 {t.pais_nombre}</span>}
                        {t.asignado && <span>👤 {t.asignado}</span>}
                      </div>
                      {t.notas && (
                        <div style={{fontSize: '0.8rem', marginTop: 6, color: 'var(--text-muted)'}} dangerouslySetInnerHTML={{__html: t.notas}} />
                      )}
                    </div>
                    <div style={{display: 'flex', gap: 6, alignItems: 'center'}}>
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
              <button className="btn btn-primary btn-sm" onClick={() => openNew('contacto')}><Plus size={14} /> Nuevo contacto</button>
            </div>

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nombre / Empresa</th>
                    <th>Rol</th>
                    <th>País / Ciudad</th>
                    <th>Contacto</th>
                    <th>Estado / Etapa</th>
                    <th>Próxima Acción</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContactos.length === 0 ? (
                    <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon"><Users size={28} /></div><div className="empty-state-text">No hay contactos cargados</div></div></td></tr>
                  ) : (
                    filteredContactos.map(c => (
                      <tr key={c.id}>
                        <td>
                          <strong>{c.nombre} {c.apellido || ''}</strong>
                          {c.empresa && <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{c.empresa}</div>}
                        </td>
                        <td><span className="badge badge-navy">{c.rol || 'Otro'}</span></td>
                        <td>{c.pais_nombre || '—'} {c.ciudad ? `(${c.ciudad})` : ''}</td>
                        <td style={{fontSize: '0.8rem'}}>
                          {c.email && <div>✉️ {c.email}</div>}
                          {c.telefono && <div>📞 {c.telefono}</div>}
                        </td>
                        <td>
                          {estadoBadge(c.estado)}
                          {c.estado === 'En proceso' && c.etapa_comercial && (
                            <div style={{marginTop: 4}}>{etapaBadge(c.etapa_comercial)}</div>
                          )}
                        </td>
                        <td style={{fontSize: '0.78rem'}}>
                          {c.proxima_accion ? (
                            <div>
                              <div>{c.proxima_accion}</div>
                              {c.proxima_accion_fecha && (
                                <div style={{color: 'var(--primary)', fontWeight: 600, marginTop: 2}}>
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
              <h3><Calendar size={20} /> Visitas, Ferias y Reuniones Comercial</h3>
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
                    <th>Evento / Reunión</th>
                    <th>Tipo</th>
                    <th>Fecha / Hora</th>
                    <th>Lugar</th>
                    <th>Contactos / Calificados</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisitas.length === 0 ? (
                    <tr><td colSpan="7"><div className="empty-state"><div className="empty-state-icon"><Calendar size={28} /></div><div className="empty-state-text">Sin visitas o reuniones registradas</div></div></td></tr>
                  ) : (
                    filteredVisitas.map(v => (
                      <tr key={v.id}>
                        <td>
                          <strong>{v.titulo}</strong>
                          {v.contacto_nombre && <div style={{fontSize: '0.72rem', color: 'var(--text-muted)'}}>Cliente: {v.contacto_nombre}</div>}
                        </td>
                        <td><span className="badge badge-navy">{v.tipo}</span></td>
                        <td style={{fontSize: '0.8rem'}}>
                          📅 {fmtDate(v.fecha)} {v.fecha_fin ? ` a ${fmtDate(v.fecha_fin)}` : ''}
                          {v.hora && <div style={{color: 'var(--primary)', fontWeight: 600}}>{fmtTime(v.hora)}</div>}
                        </td>
                        <td style={{fontSize: '0.8rem'}}>{v.lugar || '—'}</td>
                        <td style={{fontSize: '0.8rem'}}>
                          {v.contactos || '—'}
                          {v.ronda_importadores > 0 && (
                            <div style={{fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600}}>
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
                    <th>Oportunidad / Cliente</th>
                    <th>País</th>
                    <th>Marca</th>
                    <th>Etapa</th>
                    <th>Inversión Necesaria (USD)</th>
                    <th>Responsable</th>
                    <th>Cierre Estimado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOportunidades.length === 0 ? (
                    <tr><td colSpan="8"><div className="empty-state"><div className="empty-state-icon"><Briefcase size={28} /></div><div className="empty-state-text">Sin oportunidades registradas</div></div></td></tr>
                  ) : (
                    filteredOportunidades.map(o => (
                      <tr key={o.id}>
                        <td>
                          <strong>{o.nombre}</strong>
                          {o.contacto_nombre && <div style={{fontSize: '0.72rem', color: 'var(--text-muted)'}}>{o.contacto_nombre}</div>}
                        </td>
                        <td>{o.pais_bandera || ''} {o.pais_nombre || '—'}</td>
                        <td><span className="badge badge-navy">{o.marca === 'Otro' ? (o.marca_otra || 'Otro') : o.marca}</span></td>
                        <td>{etapaBadge(o.etapa)}</td>
                        <td style={{fontWeight: 600}}>${parseFloat(o.monto || 0).toLocaleString()}</td>
                        <td style={{fontSize: '0.8rem'}}>{o.responsable || '—'}</td>
                        <td style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>{fmtDate(o.cierre)}</td>
                        <td>
                          <button className="icon-btn" onClick={() => openEdit('oportunidad', o)}><Edit size={14} /></button>
                          <button className="icon-btn" onClick={() => requestDelete('oportunidades', o.id, o.nombre)}><Trash2 size={14} /></button>
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
                    <th>Nº Pedido</th>
                    <th>Cliente / Empresa</th>
                    <th>País Destino</th>
                    <th>Estado</th>
                    <th>Entrega Programada</th>
                    <th>Unidades / Kg</th>
                    <th>Valor USD</th>
                    <th>Incoterm</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOperaciones.length === 0 ? (
                    <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon"><ShoppingBag size={28} /></div><div className="empty-state-text">Sin operaciones registradas</div></div></td></tr>
                  ) : (
                    filteredOperaciones.map(op => (
                      <tr key={op.id}>
                        <td><strong>Nº {op.numero_pedido}</strong></td>
                        <td>
                          <strong>{op.cliente_nombre || 'Cliente sin asignar'}</strong>
                          {op.cliente_empresa && <div style={{fontSize: '0.72rem', color: 'var(--text-muted)'}}>{op.cliente_empresa}</div>}
                        </td>
                        <td>{op.pais_bandera || ''} {op.pais_nombre || '—'}</td>
                        <td>{estadoBadge(op.estado)}</td>
                        <td style={{fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)'}}>
                          📅 {fmtDate(op.fecha_entrega)}
                        </td>
                        <td style={{fontSize: '0.8rem'}}>
                          <div>{op.unidades ? `${op.unidades} u.` : '—'}</div>
                          {op.kilogramos > 0 && <div style={{fontSize: '0.72rem', color: 'var(--text-muted)'}}>{op.kilogramos} kg</div>}
                        </td>
                        <td style={{fontWeight: 600}}>${parseFloat(op.valor_usd || 0).toLocaleString()}</td>
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
                      <div className="sample-row-main" style={{flex: 1, minWidth: 0}}>
                        <div style={{fontWeight: 600, fontSize: '0.9rem', color: 'var(--text)'}}>
                          {sampleTitle}
                        </div>
                        <div className="product-tags" style={{marginTop: 6}}>
                          {prods.map((p, i) => (
                            <span key={i} className="product-tag">
                              <span className="product-tag-name">{p.nombre}</span>
                              {p.cantidad && <span style={{opacity: 0.85, fontSize: '0.7rem'}}>· {p.cantidad} u.</span>}
                              {p.lote && <span style={{opacity: 0.85, fontSize: '0.7rem'}}>· Lote: {p.lote}</span>}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="sample-row-side" style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6}}>
                        {estadoBadge(m.resultado)}
                        <div style={{display: 'flex', gap: 4}}>
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
                      <div style={{flex: 1, paddingTop: 4}}>
                        <div style={{fontWeight: 500, fontSize: '0.85rem'}}>{c.asunto} <span className="badge badge-navy" style={{marginLeft: 4}}>{c.tipo}</span></div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2}}>{c.contacto_nombre || ''} · {fmtDate(c.fecha)}</div>
                        {c.resumen && <div style={{fontSize: '0.75rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', marginTop: 4}} dangerouslySetInnerHTML={{__html: c.resumen}} />}
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
        {!loading && activeTab === 'paises' && (
          <div>
            <div className="section-header"><h3><Globe size={20} /> Países Destino</h3></div>
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

        {/* ===== INTELIGENCIA ===== */}
        {!loading && activeTab === 'inteligencia' && (
          <div className="card">
            <div className="section-header"><h3><TrendingUp size={20} /> Inteligencia Comercial</h3></div>
            <div className="tabs">
              <button className={`tab-btn ${intelTab === 'precios' ? 'active' : ''}`} onClick={() => setIntelTab('precios')}><DollarSign size={14} /> Precios competidores</button>
              <button className={`tab-btn ${intelTab === 'tendencias' ? 'active' : ''}`} onClick={() => setIntelTab('tendencias')}><BarChart3 size={14} /> Tendencias de mercado</button>
            </div>

            <div className="filter-bar" style={{marginTop: 12}}>
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
                      <th>Competidor / Producto</th>
                      <th>País</th>
                      <th>Categoría</th>
                      <th>Precio</th>
                      <th>Unidad</th>
                      <th>Precio/kg</th>
                      <th>Fotos</th>
                      <th>Fuente</th>
                      <th>Fecha</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrecios.length === 0 ? (
                      <tr><td colSpan="10"><div className="empty-state"><div className="empty-state-icon"><DollarSign size={28} /></div><div className="empty-state-text">Sin precios de competidores registrados</div></div></td></tr>
                    ) : (
                      filteredPrecios.map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.competidor}</strong>{p.producto && <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{p.producto}</div>}</td>
                          <td>{p.pais_nombre || '—'}</td>
                          <td><span className="badge badge-navy">{p.categoria || '—'}</span></td>
                          <td style={{fontWeight: 500}}>{p.precio > 0 ? `$${parseFloat(p.precio).toLocaleString()}` : '—'}</td>
                          <td>{p.unidad || '—'}</td>
                          <td style={{color: 'var(--text)', fontWeight: 500}}>{p.peso > 0 && p.precio > 0 ? (parseFloat(p.precio) / parseFloat(p.peso)).toFixed(2) + ' /kg' : '—'}</td>
                          <td>
                            {p.imagen_url ? (
                              <button type="button" className="btn btn-xs btn-outline" onClick={() => setPreviewImage(p.imagen_url)}>
                                <Camera size={11} /> Ver foto
                              </button>
                            ) : '—'}
                          </td>
                          <td style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{p.fuente || '—'}</td>
                          <td style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{fmtDate(p.fecha)}</td>
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
              <div style={{display: 'flex', flexDirection: 'column', gap: 12, marginTop: 12}}>
                {filteredTendencias.length === 0 ? (
                  <div className="empty-state"><div className="empty-state-icon"><BarChart3 size={28} /></div><div className="empty-state-text">Sin tendencias registradas</div></div>
                ) : (
                  filteredTendencias.map(t => (
                    <div key={t.id} className="card" style={{padding: 14, border: '1px solid var(--border)'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <h4 style={{margin: 0, fontSize: '0.95rem'}}>{t.titulo}</h4>
                        <div style={{display: 'flex', gap: 4}}>
                          <button className="icon-btn" onClick={() => openEdit('tendencia', t)}><Edit size={14} /></button>
                          <button className="icon-btn" onClick={() => requestDelete('tendencias', t.id, t.titulo)}><Trash2 size={14} /></button>
                        </div>
                      </div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 12}}>
                        {t.pais_nombre && <span>📍 {t.pais_nombre}</span>}
                        {t.categoria && <span>🏷️ {t.categoria}</span>}
                        {t.fuente && <span>📰 Fuente: {t.fuente}</span>}
                      </div>
                      {t.descripcion && <div style={{fontSize: '0.85rem', marginTop: 8}} dangerouslySetInnerHTML={{__html: t.descripcion}} />}
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
            <div className="section-header"><h3><DollarSign size={20} /> Control de Cobranzas</h3></div>
            <div className="filter-bar">
              <select className="form-input" value={cobranzaFilterEstado} onChange={e => setCobranzaFilterEstado(e.target.value)}>
                <option value="">Todos los estados</option>
                <option>Pendiente</option>
                <option>Cobrado parcial</option>
                <option>Cobrado</option>
                <option>Vencido</option>
              </select>
              <div className="filter-spacer" />
              <button className="btn btn-primary btn-sm" onClick={() => openNew('cobranza')}><Plus size={14} /> Nueva cobranza</button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Operación</th>
                    <th>Cliente / País</th>
                    <th>Monto USD</th>
                    <th>Cobrado</th>
                    <th>Estado</th>
                    <th>Medio de Pago</th>
                    <th>Condición de Pago</th>
                    <th>Vencimiento</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCobranzas.length === 0 ? (
                    <tr><td colSpan="9"><div className="empty-state"><div className="empty-state-icon"><DollarSign size={28} /></div><div className="empty-state-text">Sin cobranzas registradas</div></div></td></tr>
                  ) : (
                    filteredCobranzas.map(c => (
                      <tr key={c.id}>
                        <td><strong>{c.descripcion}</strong></td>
                        <td>{c.cliente_nombre || '—'} {c.pais_nombre ? `(${c.pais_nombre})` : ''}</td>
                        <td style={{fontWeight: 600}}>${parseFloat(c.monto || 0).toLocaleString()}</td>
                        <td style={{color: 'var(--success)', fontWeight: 600}}>${parseFloat(c.cobrado_monto || 0).toLocaleString()}</td>
                        <td>{estadoBadge(c.estado)}</td>
                        <td style={{fontSize: '0.8rem'}}>{c.medio_pago || c.condicion || '—'}</td>
                        <td style={{fontSize: '0.8rem'}}>{c.condicion_pago || '—'}</td>
                        <td style={{fontSize: '0.8rem'}}>{fmtDate(c.vencimiento)}</td>
                        <td>
                          <button className="icon-btn" onClick={() => openEdit('cobranza', c)}><Edit size={14} /></button>
                          <button className="icon-btn" onClick={() => requestDelete('cobranzas', c.id, c.descripcion)}><Trash2 size={14} /></button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== CALCULADORA LANDED ===== */}
        {!loading && activeTab === 'calculadora' && (
          <div className="card">
            <div className="section-header"><h3><Calculator size={20} /> Calculadora de Costos Landed</h3></div>
            <div className="empty-state">
              <div className="empty-state-icon"><Calculator size={36} /></div>
              <div className="empty-state-text">Calculá el costo final de exportación puesto en destino (CIF + Aranceles + Impuestos locales).</div>
            </div>
          </div>
        )}

        {/* ========== MODAL UNIVERSAL ========== */}
        {showModal && (
          <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(null); }}>
            <div className="modal-content">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                <h3 style={{margin: 0, fontSize: '1.1rem'}}>{
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
                      <div className="form-group" style={{gridColumn: '1 / -1'}}><label className="form-label">Próxima acción</label><input type="text" className="form-input" value={fv('proxima_accion')} onChange={e => setFv('proxima_accion', e.target.value)} placeholder="Ej: Enviar cotización CIF Santos" /></div>
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
                      <div className="form-group"><label className="form-label">Cliente / Contacto vinculado</label><select className="form-input" value={fv('contacto_id') || ''} onChange={e => setFv('contacto_id', e.target.value || null)}><option value="">Ninguno / Múltiples</option>{contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''} ({c.empresa || 'Empresa'})</option>)}</select></div>
                      <div className="form-group"><label className="form-label">Lugar / Ciudad / Sede</label><input type="text" className="form-input" value={fv('lugar')} onChange={e => setFv('lugar', e.target.value)} placeholder="São Paulo, Brasil / Stand 45" /></div>
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
                      <div style={{background: 'var(--surface-hover)', padding: '16px', borderRadius: '12px', marginBottom: '16px', border: '1px solid var(--border)'}}>
                        <h4 style={{fontSize: '0.88rem', fontWeight: 700, margin: '0 0 12px 0', color: 'var(--dy-blue)', display: 'flex', alignItems: 'center', gap: 6}}>
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
                        <div className="form-group" style={{marginBottom: 0}}>
                          <label className="form-label">Resultado / Balance de la Ronda</label>
                          <input type="text" className="form-input" value={fv('ronda_resultado')} onChange={e => setFv('ronda_resultado', e.target.value)} placeholder="Ej: 8 reuniones exitosas, 3 cotizaciones solicitadas" />
                        </div>
                      </div>
                    )}

                    <div className="form-group"><label className="form-label">Notas / Minuta de la Reunión</label><RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} /></div>
                  </>}

                  {/* FORM OPORTUNIDAD */}
                  {showModal === 'oportunidad' && <>
                    <div className="form-group"><label className="form-label">Nombre *</label><input type="text" className="form-input" required value={fv('nombre')} onChange={e => setFv('nombre', e.target.value)} placeholder="Ej: Tapas Don Yeyo — Walmart México" /></div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Marca</label><select className="form-input" value={fv('marca') || 'Don Yeyo'} onChange={e => setFv('marca', e.target.value)}><option>Don Yeyo</option><option>DeViano</option><option>Otro</option></select></div>
                      {fv('marca') === 'Otro' && (
                        <div className="form-group"><label className="form-label">Especificar Marca</label><input type="text" className="form-input" value={fv('marca_otra')} onChange={e => setFv('marca_otra', e.target.value)} /></div>
                      )}
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Categoría</label><select className="form-input" value={fv('categoria') || 'Tapas'} onChange={e => setFv('categoria', e.target.value)}><option>Tapas</option><option>Pastas</option><option>Panificados</option><option>Tortillas</option><option>Nuevo desarrollo</option></select></div>
                      {fv('categoria') === 'Nuevo desarrollo' && (
                        <div className="form-group"><label className="form-label">Detalle Nuevo Desarrollo</label><input type="text" className="form-input" value={fv('categoria_detalle')} onChange={e => setFv('categoria_detalle', e.target.value)} /></div>
                      )}
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Inversión Necesaria (USD)</label><input type="number" step="any" min="0" className="form-input" value={fv('monto')} onChange={e => setFv('monto', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Etapa</label><select className="form-input" value={fv('etapa') || 'En análisis'} onChange={e => setFv('etapa', e.target.value)}><option>En análisis</option><option>En proceso</option><option>Finalizado</option><option>Descartado</option></select></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Responsable</label><input type="text" className="form-input" value={fv('responsable')} onChange={e => setFv('responsable', e.target.value)} placeholder="Responsable asignado" /></div>
                      <div className="form-group"><label className="form-label">Cierre estimado</label><input type="date" className="form-input" value={fvDate('cierre')} onChange={e => setFv('cierre', e.target.value)} /></div>
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
                    <div className="form-group"><label className="form-label">Descripción *</label><input type="text" className="form-input" required value={fv('titulo')} onChange={e => setFv('titulo', e.target.value)} /></div>
                    <div className="form-grid-3">
                      <div className="form-group"><label className="form-label">Fecha límite</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Hora específica</label><input type="time" className="form-input" value={fv('hora')} onChange={e => setFv('hora', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Prioridad</label><select className="form-input" value={fv('prioridad') || 'media'} onChange={e => setFv('prioridad', e.target.value)}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></div>
                    </div>
                    <div className="form-group"><label className="form-label">Asignado a</label><input type="text" className="form-input" value={fv('asignado')} onChange={e => setFv('asignado', e.target.value)} /></div>
                  </>}

                  {/* FORM MUESTRA */}
                  {showModal === 'muestra' && <>
                    <div className="form-group"><label className="form-label">Cliente destinatario</label><select className="form-input" value={fv('contacto_id') || ''} onChange={e => { const c = contactos.find(x => String(x.id) === String(e.target.value)); setFv('contacto_id', e.target.value || null); setFv('destinatario', c ? `${c.nombre} (${c.empresa || ''})` : ''); }}><option value="">Selecciona cliente registrado...</option>{contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''} ({c.empresa || 'Empresa'})</option>)}</select></div>
                    <div className="form-group"><label className="form-label">Productos de la muestra *</label><input type="text" className="form-input" required value={fv('producto')} onChange={e => setFv('producto', e.target.value)} placeholder="Ej: Tapas de empanadas Criollas x 50 u." /></div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Fecha de envío</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Resultado</label><select className="form-input" value={fv('resultado') || 'Pendiente'} onChange={e => setFv('resultado', e.target.value)}><option>Pendiente</option><option>En evaluación</option><option>Positivo</option><option>Negativo</option></select></div>
                    </div>
                  </>}

                  {/* FORM PAÍS */}
                  {showModal === 'pais' && <>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">País *</label><input type="text" className="form-input" required value={fv('nombre')} onChange={e => setFv('nombre', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Bandera emoji</label><input type="text" className="form-input" value={fv('bandera')} onChange={e => setFv('bandera', e.target.value)} placeholder="🇧🇷" /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Arancel principal (%)</label><input type="number" step="0.01" className="form-input" value={fv('arancel')} onChange={e => setFv('arancel', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Moneda local</label><input type="text" className="form-input" value={fv('moneda')} onChange={e => setFv('moneda', e.target.value)} placeholder="BRL" /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Certificados / documentación obligatoria</label><RichTextEditor value={fv('sanitario_req')} onChange={v => setFv('sanitario_req', v)} /></div>
                    <div className="form-group"><label className="form-label">Requisitos de etiquetado</label><RichTextEditor value={fv('etiquetado')} onChange={v => setFv('etiquetado', v)} /></div>
                    <div className="form-group"><label className="form-label">Fotografías o ejemplos de etiquetado de referencia</label><ProImageUploader value={fv('etiquetado_fotos')} onChange={v => setFv('etiquetado_fotos', v)} maxFiles={5} /></div>
                  </>}

                  {/* FORM PRECIO */}
                  {showModal === 'precio' && <>
                    <div className="form-group"><label className="form-label">Competidor *</label><input type="text" className="form-input" required value={fv('competidor')} onChange={e => setFv('competidor', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Producto</label><input type="text" className="form-input" value={fv('producto')} onChange={e => setFv('producto', e.target.value)} /></div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Precio</label><input type="number" step="0.01" className="form-input" value={fv('precio')} onChange={e => setFv('precio', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Peso envase (kg)</label><input type="number" step="0.001" className="form-input" value={fv('peso')} onChange={e => setFv('peso', e.target.value)} /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Fuente</label><input type="text" className="form-input" value={fv('fuente')} onChange={e => setFv('fuente', e.target.value)} placeholder="Feria APAS, Visita góndola..." /></div>
                    <div className="form-group"><label className="form-label">Fotos de producto / góndola</label><ProImageUploader value={fv('imagen_url')} onChange={v => setFv('imagen_url', v)} maxFiles={5} /></div>
                  </>}

                  {/* FORM TENDENCIA */}
                  {showModal === 'tendencia' && <>
                    <div className="form-group"><label className="form-label">Título *</label><input type="text" className="form-input" required value={fv('titulo')} onChange={e => setFv('titulo', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Descripción</label><RichTextEditor value={fv('descripcion')} onChange={v => setFv('descripcion', v)} /></div>
                    <div className="form-group"><label className="form-label">Fuente</label><input type="text" className="form-input" value={fv('fuente')} onChange={e => setFv('fuente', e.target.value)} /></div>
                  </>}

                  {/* FORM TAREA */}
                  {showModal === 'tarea' && <>
                    <div className="form-group"><label className="form-label">Título de la Tarea *</label><input type="text" className="form-input" required value={fv('titulo')} onChange={e => setFv('titulo', e.target.value)} placeholder="Ej: Enviar fichas técnicas a comprador de Walmart" /></div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Fecha Límite</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Hora Inicio</label><input type="time" className="form-input" value={fv('hora')} onChange={e => setFv('hora', e.target.value)} /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Hora Fin</label><input type="time" className="form-input" value={fv('hora_fin')} onChange={e => setFv('hora_fin', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Prioridad</label><select className="form-input" value={fv('prioridad') || 'media'} onChange={e => setFv('prioridad', e.target.value)}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">País Vincular</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                      <div className="form-group"><label className="form-label">Asignado a</label><input type="text" className="form-input" value={fv('asignado')} onChange={e => setFv('asignado', e.target.value)} placeholder="Ej: Gabriel T." /></div>
                    </div>
                    <div className="form-group"><label className="form-label">Notas / Instrucciones</label><RichTextEditor value={fv('notas')} onChange={v => setFv('notas', v)} /></div>
                  </>}

                  {/* FORM COBRANZA */}
                  {showModal === 'cobranza' && <>
                    <div className="form-group"><label className="form-label">Operación / Referencia *</label><input type="text" className="form-input" required value={fv('descripcion')} onChange={e => setFv('descripcion', e.target.value)} /></div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Monto (USD)</label><input type="number" step="any" className="form-input" value={fv('monto')} onChange={e => setFv('monto', e.target.value)} /></div>
                      <div className="form-group"><label className="form-label">Monto cobrado (USD)</label><input type="number" step="any" className="form-input" value={fv('cobrado_monto')} onChange={e => setFv('cobrado_monto', e.target.value)} /></div>
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group"><label className="form-label">Medio de pago</label><input type="text" className="form-input" value={fv('medio_pago')} onChange={e => setFv('medio_pago', e.target.value)} placeholder="Transferencia bancaria, Carta de crédito..." /></div>
                      <div className="form-group"><label className="form-label">Condición de pago</label><select className="form-input" value={fv('condicion_pago') || 'Anticipado'} onChange={e => setFv('condicion_pago', e.target.value)}><option>Anticipado</option><option>50% anticipado / 50% contra BL</option><option>15 días</option><option>30 días</option><option>60 días</option><option>Otro</option></select></div>
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
      </main>
      </div>
    </div>
  );
}
