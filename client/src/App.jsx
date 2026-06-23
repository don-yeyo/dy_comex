import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Calendar, Briefcase, Package, 
  Globe, FileText, TrendingUp, Calculator, DollarSign, 
  CheckSquare, Menu, Sun, Moon, Plus, Trash2, RefreshCw, X, User, Edit,
  Bell, MessageSquare, ZoomIn
} from 'lucide-react';
import logo from './assets/logo-don-yeyo-png-sin-fondo.png';
import './App.css';

// Configurar base URL para Axios
axios.defaults.baseURL = '/api';

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
  const m = { Activo: 'badge-green', Prospecto: 'badge-gray', 'En proceso': 'badge-amber', Inactivo: 'badge-red', Vigente: 'badge-green', 'Por vencer': 'badge-amber', Vencido: 'badge-red', Realizada: 'badge-green', Planificada: 'badge-blue', Cancelada: 'badge-red', Pendiente: 'badge-gray', 'En evaluación': 'badge-amber', 'Positivo': 'badge-green', Negativo: 'badge-red', Cobrado: 'badge-green', 'Cobrado parcial': 'badge-amber' };
  return <span className={`badge ${m[e] || 'badge-gray'}`}>{e}</span>;
};

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [uiZoom, setUiZoom] = useState(localStorage.getItem('uiZoom') || 'md');
  const [user, setUser] = useState({ name: 'Gabriel Comex', email: 'gabrielt@donyeyo.com.ar', rol: 'admin' });
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
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
  // Tab dentro de muestras/inteligencia
  const [subTab, setSubTab] = useState('muestras');
  const [intelTab, setIntelTab] = useState('precios');

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

  // Tema
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Zoom
  useEffect(() => {
    document.documentElement.setAttribute('data-zoom', uiZoom);
    localStorage.setItem('uiZoom', uiZoom);
  }, [uiZoom]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  // Sincronizar clientes con Finnegans ERP
  const syncFinnegansClientes = async () => {
    setLoadingSync(true);
    try {
      const res = await axios.get('/finnegans/clientes');
      setFinnegansClientes(res.data);
      alert('Sincronización con Finnegans ERP completada con éxito.');
    } catch (err) {
      console.error(err);
      alert('Error al conectar con Finnegans ERP.');
    } finally {
      setLoadingSync(false);
    }
  };

  // ========== CRUD genérico ==========
  const handleSave = async (e, endpoint) => {
    e.preventDefault();
    try {
      if (formValues.id) {
        await axios.put(`/${endpoint}/${formValues.id}`, formValues);
      } else {
        await axios.post(`/${endpoint}`, formValues);
      }
      setShowModal(null);
      setFormValues({});
      fetchData();
    } catch (err) {
      alert('Error al guardar el registro');
    }
  };

  const handleDelete = async (endpoint, id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este registro?')) return;
    try {
      await axios.delete(`/${endpoint}/${id}`);
      fetchData();
    } catch (err) {
      alert('Error al eliminar');
    }
  };

  const openEdit = (modalType, item) => {
    setFormValues({ ...item });
    setShowModal(modalType);
  };

  const openNew = (modalType) => {
    setFormValues({});
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

  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const menuItems = [
    { icon: <LayoutDashboard size={18} />, label: 'Dashboard', key: 'dashboard' },
    { icon: <CheckSquare size={18} />, label: 'Tareas', key: 'tareas', badge: tareas.filter(t => t.status !== 'hecha').length },
    { icon: <Bell size={18} />, label: 'Alertas', key: 'alertas' },
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

  // ========== ALERTAS ENGINE ==========
  const alertas = [
    ...documentos.filter(d => d.vencimiento && daysFrom(d.vencimiento) <= 30 && daysFrom(d.vencimiento) >= -5).map(d => ({
      tipo: 'Documento', icono: '📄', titulo: d.nombre, detalle: `Vence ${fmtDate(d.vencimiento)}`, dias: daysFrom(d.vencimiento),
      color: daysFrom(d.vencimiento) < 0 ? 'badge-red' : daysFrom(d.vencimiento) <= 7 ? 'badge-red' : 'badge-amber'
    })),
    ...visitas.filter(v => v.estado === 'Planificada' && v.fecha && daysFrom(v.fecha) >= 0 && daysFrom(v.fecha) <= 14).map(v => ({
      tipo: 'Visita', icono: '📅', titulo: v.titulo, detalle: `${fmtDate(v.fecha)} · ${v.lugar || ''}`, dias: daysFrom(v.fecha), color: 'badge-blue'
    }))
  ].sort((a, b) => a.dias - b.dias);

  // ========== RENDER FORM HELPER ==========
  const fv = (key) => formValues[key] || '';
  const fvDate = (key) => formValues[key] ? String(formValues[key]).substring(0, 10) : '';
  const setFv = (key, val) => setFormValues(prev => ({ ...prev, [key]: val }));

  return (
    <div className="layout">
      {/* HEADER */}
      <header className="header">
        <div className="header-left">
          <button className="mode-toggle" onClick={() => setDrawerOpen(true)}><Menu size={22} /></button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logo} alt="Don Yeyo" style={{ height: '32px', objectFit: 'contain' }} />
            <h2 className="desktop-only" style={{ fontSize: '0.95rem', margin: 0, fontWeight: 700, color: 'var(--primary)' }}>
              Comercio Exterior
            </h2>
          </div>
        </div>

        <div className="header-right">
          {/* Zoom selector */}
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
                <button onClick={() => alert('Cierre de sesión')} style={{ width: '100%', padding: '10px 14px', borderRadius: 0, justifyContent: 'flex-start', color: 'var(--error)', background: 'transparent', fontSize: '0.85rem', border: 'none', textAlign: 'left', cursor: 'pointer' }}>
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
              {item.badge > 0 && <span className="badge badge-red" style={{ marginLeft: 'auto' }}>{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div style={{ marginTop: 'auto', paddingTop: '16px' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--drawer-footer)', fontWeight: 700 }}>DON YEYO S.A.</p>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>v1.0.0</p>
        </div>
      </div>

      {/* CONTENIDO */}
      <main className="content">

        {/* ===== DASHBOARD ===== */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="metrics-grid">
              <div className="metric-card"><div className="metric-header">Países activos</div><div className="metric-value">{paises.length}</div><div className="metric-footer">exportando actualmente</div></div>
              <div className="metric-card"><div className="metric-header">Contactos</div><div className="metric-value">{contactos.length}</div><div className="metric-footer">importadores y distribuidores</div></div>
              <div className="metric-card"><div className="metric-header">Pipeline USD</div><div className="metric-value">${pipeline.toLocaleString('es-AR')}</div><div className="metric-footer">oportunidades abiertas</div></div>
              <div className="metric-card"><div className="metric-header">Tareas vencidas</div><div className="metric-value" style={{color: 'var(--danger)'}}>{tareasVencidas.length}</div><div className="metric-footer">requieren atención</div></div>
            </div>

            {/* Volumen exportación anual */}
            <div className="card">
              <h3>📦 Volumen de exportación anual</h3>
              <div className="metrics-grid" style={{marginBottom: 16}}>
                <div className="metric-card" style={{background: 'var(--primary-light)'}}><div className="metric-header" style={{color: 'var(--dy-blue)'}}>Unidades exportadas</div><div className="metric-value" style={{fontSize: '1.4rem'}}>{cobranzas.reduce((s, c) => s + (parseInt(c.unidades) || 0), 0).toLocaleString('es-AR')}</div><div className="metric-footer">total del período</div></div>
                <div className="metric-card" style={{background: 'var(--success-light)'}}><div className="metric-header" style={{color: 'var(--success)'}}>Valor exportado (USD)</div><div className="metric-value" style={{fontSize: '1.4rem'}}>${cobranzas.reduce((s, c) => s + (parseFloat(c.monto) || 0), 0).toLocaleString('es-AR')}</div><div className="metric-footer">operaciones cerradas</div></div>
                <div className="metric-card" style={{background: 'var(--danger-light)'}}><div className="metric-header" style={{color: 'var(--danger)'}}>Cobranza vencida</div><div className="metric-value" style={{fontSize: '1.4rem', color: 'var(--danger)'}}>${cobranzaVencida.toLocaleString('es-AR')}</div><div className="metric-footer">requiere seguimiento</div></div>
              </div>
              <h4 style={{fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-muted)', margin: '16px 0 10px'}}>Desglose por país de destino</h4>
              {paises.map(p => {
                const totalPais = cobranzas.filter(c => c.pais_id === p.id).reduce((s, c) => s + parseFloat(c.monto || 0), 0);
                const unitsPais = cobranzas.filter(c => c.pais_id === p.id).reduce((s, c) => s + (parseInt(c.unidades) || 0), 0);
                const maxVal = Math.max(1, ...paises.map(pp => cobranzas.filter(c => c.pais_id === pp.id).reduce((s, c) => s + parseFloat(c.monto || 0), 0)));
                const pct = (totalPais / maxVal) * 100;
                return (
                  <div key={p.id} style={{display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, padding: '6px 0', borderBottom: '1px solid var(--border)'}}>
                    <span style={{fontSize: 18}}>{p.bandera}</span>
                    <span style={{width: 100, fontWeight: 500, fontSize: '0.85rem'}}>{p.nombre}</span>
                    <div style={{flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden'}}>
                      <div style={{width: `${Math.min(100, pct)}%`, height: '100%', background: 'var(--dy-blue)', borderRadius: 3}} />
                    </div>
                    <div style={{textAlign: 'right', minWidth: 120}}>
                      <span style={{fontWeight: 600, fontSize: '0.85rem'}}>${totalPais.toLocaleString('es-AR')}</span>
                      <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{unitsPais.toLocaleString()} u</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Alertas y Visitas */}
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 20}}>
              <div className="card" style={{margin: 0}}>
                <h3>🔔 Alertas críticas</h3>
                {alertas.length === 0 ? <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">Sin alertas pendientes</div></div> :
                  alertas.slice(0, 4).map((a, i) => <div key={i} style={{display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem'}}><span>{a.icono}</span><div style={{flex: 1}}><strong>{a.titulo}</strong><div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{a.detalle}</div></div><span className={`badge ${a.color}`}>{a.dias < 0 ? `Vencido` : a.dias === 0 ? 'Hoy' : `${a.dias}d`}</span></div>)
                }
              </div>
              <div className="card" style={{margin: 0}}>
                <h3>📅 Próximas visitas</h3>
                {visitas.filter(v => v.estado === 'Planificada').length === 0 ? <div className="empty-state"><div className="empty-state-icon">📅</div><div className="empty-state-text">Sin visitas programadas</div></div> :
                  visitas.filter(v => v.estado === 'Planificada').slice(0, 4).map(v => <div key={v.id} style={{display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem'}}><div><strong>{v.titulo}</strong><div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{v.lugar}</div></div>{estadoBadge('Planificada')}</div>)
                }
              </div>
            </div>

            {/* Funnel */}
            <div className="card">
              <h3>💼 Funnel de oportunidades</h3>
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
              <h3>📋 Actividad reciente</h3>
              {[...visitas.slice(0, 3).map(v => ({icon: '📅', text: `Visita: ${v.titulo} (${v.tipo})`})), ...contactos.slice(0, 3).map(c => ({icon: '👤', text: `Contacto: ${c.nombre} ${c.apellido || ''}`}))].map((a, i) =>
                <div key={i} style={{display: 'flex', gap: 8, fontSize: '0.85rem', borderBottom: '1px solid var(--border)', padding: '6px 0'}}><span>{a.icon}</span><span>{a.text}</span></div>
              )}
            </div>
          </div>
        )}

        {/* ===== TAREAS ===== */}
        {activeTab === 'tareas' && (
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
              <h3 style={{margin: 0}}>Tareas</h3>
              <button className="btn btn-primary btn-sm" onClick={() => openNew('tarea')}><Plus size={14} /> Nueva tarea</button>
            </div>
            {tareas.length === 0 ? <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">Sin tareas pendientes</div></div> :
              tareas.map(t => {
                const done = t.status === 'hecha';
                const dias = t.fecha ? daysFrom(t.fecha) : null;
                return (
                  <div key={t.id} className="task-item">
                    <input type="checkbox" checked={done} onChange={() => toggleTaskStatus(t)} style={{width: 16, height: 16, marginTop: 2, cursor: 'pointer'}} />
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: 500, textDecoration: done ? 'line-through' : 'none', color: done ? 'var(--text-muted)' : 'var(--text)', fontSize: '0.85rem'}}>{t.titulo}</div>
                      <div style={{display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', alignItems: 'center'}}>
                        {priorBadge(t.prioridad)}
                        {t.fecha && <span style={{fontSize: '0.7rem', color: dias < 0 && !done ? 'var(--danger)' : 'var(--text-muted)'}}>
                          {dias < 0 ? `Venció hace ${Math.abs(dias)}d` : `${fmtDate(t.fecha)}`}
                        </span>}
                        {t.pais_nombre && <span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>🌍 {t.pais_nombre}</span>}
                        {t.asignado && <span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>👤 {t.asignado}</span>}
                      </div>
                      {t.notas && <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 3}}>{t.notas}</div>}
                    </div>
                    <button className="icon-btn" onClick={() => openEdit('tarea', t)} title="Editar"><Edit size={14} /></button>
                    <button className="icon-btn" onClick={() => handleDelete('tareas', t.id)} title="Eliminar"><Trash2 size={14} /></button>
                  </div>
                );
              })
            }
          </div>
        )}

        {/* ===== ALERTAS ===== */}
        {activeTab === 'alertas' && (
          <div className="card">
            <h3>🔔 Alertas</h3>
            <p style={{fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 16}}>Vencimientos próximos de documentos y compromisos registrados.</p>
            {alertas.length === 0 ? <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">Sin alertas activas. Todo al día.</div></div> :
              alertas.map((a, i) => (
                <div key={i} style={{display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', borderRadius: 'var(--radius-sm)', marginBottom: 6, background: 'var(--surface)', border: '1px solid var(--border)'}}>
                  <span style={{fontSize: 18}}>{a.icono}</span>
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
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
              <h3 style={{margin: 0}}>Contactos</h3>
              <div style={{display: 'flex', gap: 8}}>
                <button className="btn btn-secondary btn-sm" onClick={syncFinnegansClientes} disabled={loadingSync}><RefreshCw size={14} /> {loadingSync ? 'Sincronizando...' : 'Sync Finnegans'}</button>
                <button className="btn btn-primary btn-sm" onClick={() => openNew('contacto')}><Plus size={14} /> Nuevo contacto</button>
              </div>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Nombre</th><th>Empresa</th><th>País</th><th>Rol</th><th>Estado</th><th>Email</th><th></th></tr></thead>
                <tbody>
                  {contactos.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.nombre} {c.apellido || ''}</strong></td>
                      <td>{c.empresa || '—'}</td>
                      <td>{c.pais_nombre || '—'}</td>
                      <td><span className="badge badge-navy">{c.rol}</span></td>
                      <td>{estadoBadge(c.estado)}</td>
                      <td style={{color: 'var(--text-muted)'}}>{c.email || '—'}</td>
                      <td><button className="icon-btn" onClick={() => openEdit('contacto', c)}><Edit size={14} /></button> <button className="icon-btn" onClick={() => handleDelete('contactos', c.id)}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== VISITAS ===== */}
        {activeTab === 'visitas' && (
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
              <h3 style={{margin: 0}}>Visitas y reuniones</h3>
              <button className="btn btn-primary btn-sm" onClick={() => openNew('visita')}><Plus size={14} /> Nueva visita</button>
            </div>
            {visitas.map(v => (
              <div key={v.id} style={{display: 'flex', gap: 14, padding: '12px 14px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', marginBottom: 6}}>
                <div style={{minWidth: 80, fontSize: '0.75rem', color: 'var(--text-muted)'}}>{fmtDate(v.fecha)}<br/><span style={{fontSize: '0.7rem'}}>{v.lugar || ''}</span></div>
                <div style={{flex: 1}}>
                  <div style={{fontWeight: 500, marginBottom: 2}}>{v.titulo}</div>
                  <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{v.tipo} {v.contactos ? `· ${v.contactos}` : ''}</div>
                  {v.notas && <div style={{fontSize: '0.75rem', color: 'var(--text)', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', marginTop: 4}}>{v.notas}</div>}
                  {v.proximo && <div style={{fontSize: '0.75rem', color: 'var(--dy-blue)', marginTop: 4}}>→ {v.proximo}</div>}
                </div>
                <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4}}>
                  {estadoBadge(v.estado)}
                  <div style={{display: 'flex', gap: 4}}>
                    <button className="icon-btn" onClick={() => openEdit('visita', v)}><Edit size={14} /></button>
                    <button className="icon-btn" onClick={() => handleDelete('visitas', v.id)}><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ===== OPORTUNIDADES ===== */}
        {activeTab === 'oportunidades' && (
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
              <h3 style={{margin: 0}}>Pipeline de negocios</h3>
              <button className="btn btn-primary btn-sm" onClick={() => openNew('oportunidad')}><Plus size={14} /> Nueva oportunidad</button>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Oportunidad</th><th>País</th><th>Marca</th><th>Etapa</th><th>Monto USD</th><th>Probabilidad</th><th>Cierre estimado</th><th></th></tr></thead>
                <tbody>
                  {oportunidades.map(o => (
                    <tr key={o.id}>
                      <td><strong>{o.nombre}</strong></td>
                      <td>{o.pais_nombre || '—'}</td>
                      <td><span className="badge badge-navy">{o.marca || '—'}</span></td>
                      <td>{etapaBadge(o.etapa)}</td>
                      <td style={{fontWeight: 600}}>${parseFloat(o.monto || 0).toLocaleString()}</td>
                      <td>{o.prob || 0}%</td>
                      <td style={{color: 'var(--text-muted)', fontSize: '0.8rem'}}>{fmtDate(o.cierre)}</td>
                      <td><button className="icon-btn" onClick={() => openEdit('oportunidad', o)}><Edit size={14} /></button> <button className="icon-btn" onClick={() => handleDelete('oportunidades', o.id)}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== MUESTRAS + COMUNICACIONES ===== */}
        {activeTab === 'muestras' && (
          <div className="card">
            <div className="tabs">
              <button className={`tab-btn ${subTab === 'muestras' ? 'active' : ''}`} onClick={() => setSubTab('muestras')}>📦 Muestras enviadas</button>
              <button className={`tab-btn ${subTab === 'comunicaciones' ? 'active' : ''}`} onClick={() => setSubTab('comunicaciones')}>💬 Log de comunicaciones</button>
            </div>

            {subTab === 'muestras' && <>
              <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 12}}>
                <button className="btn btn-primary btn-sm" onClick={() => openNew('muestra')}><Plus size={14} /> Registrar muestra</button>
              </div>
              {muestras.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📦</div><div className="empty-state-text">Sin muestras registradas</div></div> :
                muestras.map(m => (
                  <div key={m.id} className="sample-row">
                    <div style={{flex: 1}}>
                      <div style={{fontWeight: 500, fontSize: '0.85rem'}}>{m.producto}</div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{m.destinatario || ''} · {m.pais_nombre || ''} · {fmtDate(m.fecha)}</div>
                      {m.notas && <div style={{fontSize: '0.75rem', marginTop: 2}}>{m.notas}</div>}
                    </div>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4}}>
                      {estadoBadge(m.resultado)}
                      {m.costo > 0 && <span style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>${parseFloat(m.costo).toLocaleString()}</span>}
                      <div style={{display: 'flex', gap: 4}}>
                        <button className="icon-btn" onClick={() => openEdit('muestra', m)}><Edit size={14} /></button>
                        <button className="icon-btn" onClick={() => handleDelete('muestras', m.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </>}

            {subTab === 'comunicaciones' && <>
              <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 12}}>
                <button className="btn btn-primary btn-sm" onClick={() => openNew('comunicacion')}><Plus size={14} /> Registrar contacto</button>
              </div>
              {comunicaciones.length === 0 ? <div className="empty-state"><div className="empty-state-icon">💬</div><div className="empty-state-text">Sin comunicaciones registradas</div></div> :
                <div className="timeline">
                  {comunicaciones.map(c => (
                    <div key={c.id} className="tl-item">
                      <div className="tl-dot">{({Email:'📧',Llamada:'📞',WhatsApp:'💬',Reunión:'🤝',Videollamada:'🎥'})[c.tipo] || '💬'}</div>
                      <div style={{flex: 1, paddingTop: 4}}>
                        <div style={{fontWeight: 500, fontSize: '0.85rem'}}>{c.asunto} <span className="badge badge-navy" style={{marginLeft: 4}}>{c.tipo}</span></div>
                        <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 2}}>{c.contacto_nombre || ''} · {fmtDate(c.fecha)}</div>
                        {c.resumen && <div style={{fontSize: '0.75rem', background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 4, padding: '4px 8px', marginTop: 4}}>{c.resumen}</div>}
                        {c.proximo && <div style={{fontSize: '0.75rem', color: 'var(--dy-blue)', marginTop: 4}}>→ {c.proximo}</div>}
                        <div style={{display: 'flex', gap: 4, marginTop: 4}}>
                          <button className="icon-btn" onClick={() => openEdit('comunicacion', c)}><Edit size={14} /></button>
                          <button className="icon-btn" onClick={() => handleDelete('comunicaciones', c.id)}><Trash2 size={14} /></button>
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
            <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 14}}>
              <button className="btn btn-primary btn-sm" onClick={() => openNew('pais')}><Plus size={14} /> Agregar país</button>
            </div>
            <div className="country-grid">
              {paises.map(p => (
                <div key={p.id} className="country-card">
                  <div style={{fontSize: 28, marginBottom: 6}}>{p.bandera || '🌐'}</div>
                  <div style={{fontWeight: 600, fontSize: '0.95rem', marginBottom: 8}}>{p.nombre}</div>
                  {p.arancel > 0 && <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0', borderTop: '1px solid var(--border)'}}><span style={{color: 'var(--text-muted)'}}>Arancel</span><span style={{fontWeight: 500}}>{p.arancel}%</span></div>}
                  {p.incoterm && <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0', borderTop: '1px solid var(--border)'}}><span style={{color: 'var(--text-muted)'}}>Incoterm</span><span style={{fontWeight: 500}}>{p.incoterm}</span></div>}
                  {p.moneda && <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0', borderTop: '1px solid var(--border)'}}><span style={{color: 'var(--text-muted)'}}>Moneda</span><span style={{fontWeight: 500}}>{p.moneda}</span></div>}
                  {p.sanitario && <div style={{display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', padding: '3px 0', borderTop: '1px solid var(--border)'}}><span style={{color: 'var(--text-muted)'}}>Org. sanitario</span><span style={{fontWeight: 500, color: 'var(--success)'}}>{p.sanitario}</span></div>}
                  <div style={{display: 'flex', gap: 4, marginTop: 8}}>
                    <button className="icon-btn" onClick={() => openEdit('pais', p)} style={{flex: 1}}><Edit size={14} /></button>
                    <button className="icon-btn" onClick={() => handleDelete('paises', p.id)} style={{flex: 1}}><Trash2 size={14} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== DOCUMENTOS ===== */}
        {activeTab === 'documentos' && (
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
              <h3 style={{margin: 0}}>Documentos</h3>
              <button className="btn btn-primary btn-sm" onClick={() => openNew('documento')}><Plus size={14} /> Agregar documento</button>
            </div>
            <div className="table-container">
              <table>
                <thead><tr><th>Documento</th><th>Tipo</th><th>País / Contacto</th><th>Vencimiento</th><th>Estado</th><th></th></tr></thead>
                <tbody>
                  {documentos.map(d => (
                    <tr key={d.id}>
                      <td><strong>{d.nombre}</strong>{d.numero && <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{d.numero}</div>}</td>
                      <td>{d.tipo}</td>
                      <td>{d.pais_nombre || '—'}</td>
                      <td style={{color: d.vencimiento && daysFrom(d.vencimiento) <= 7 ? 'var(--danger)' : d.vencimiento && daysFrom(d.vencimiento) <= 30 ? 'var(--warning)' : 'var(--text)', fontWeight: d.vencimiento && daysFrom(d.vencimiento) <= 30 ? 500 : 400}}>
                        {fmtDate(d.vencimiento)}
                      </td>
                      <td>{estadoBadge(d.estado)}</td>
                      <td><button className="icon-btn" onClick={() => openEdit('documento', d)}><Edit size={14} /></button> <button className="icon-btn" onClick={() => handleDelete('documentos', d.id)}><Trash2 size={14} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== INTELIGENCIA ===== */}
        {activeTab === 'inteligencia' && (
          <div className="card">
            <div className="tabs">
              <button className={`tab-btn ${intelTab === 'precios' ? 'active' : ''}`} onClick={() => setIntelTab('precios')}>💰 Precios competidores</button>
              <button className={`tab-btn ${intelTab === 'tendencias' ? 'active' : ''}`} onClick={() => setIntelTab('tendencias')}>📈 Tendencias de mercado</button>
            </div>

            {intelTab === 'precios' && <>
              <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 12}}>
                <button className="btn btn-primary btn-sm" onClick={() => openNew('precio')}><Plus size={14} /> Registrar precio</button>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Competidor / Producto</th><th>País</th><th>Categoría</th><th>Precio</th><th>Unidad</th><th>Precio/kg</th><th>Fuente</th><th>Fecha</th><th></th></tr></thead>
                  <tbody>
                    {precios.map(p => (
                      <tr key={p.id}>
                        <td><strong>{p.competidor}</strong>{p.producto && <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{p.producto}</div>}</td>
                        <td>{p.pais_nombre || '—'}</td>
                        <td><span className="badge badge-navy">{p.categoria || '—'}</span></td>
                        <td style={{fontWeight: 500}}>{p.precio || '—'}</td>
                        <td>{p.unidad || '—'}</td>
                        <td style={{color: 'var(--dy-blue)', fontWeight: 500}}>{p.peso > 0 && p.precio > 0 ? (parseFloat(p.precio) / parseFloat(p.peso)).toFixed(2) + ' /kg' : '—'}</td>
                        <td style={{color: 'var(--text-muted)'}}>{p.fuente || '—'}</td>
                        <td style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{fmtDate(p.fecha)}</td>
                        <td><button className="icon-btn" onClick={() => openEdit('precio', p)}><Edit size={14} /></button> <button className="icon-btn" onClick={() => handleDelete('precios', p.id)}><Trash2 size={14} /></button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>}

            {intelTab === 'tendencias' && <>
              <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 12}}>
                <button className="btn btn-primary btn-sm" onClick={() => openNew('tendencia')}><Plus size={14} /> Agregar nota</button>
              </div>
              {tendencias.length === 0 ? <div className="empty-state"><div className="empty-state-icon">📈</div><div className="empty-state-text">Agregá notas de inteligencia de mercado</div></div> :
                tendencias.map(t => (
                  <div key={t.id} className="intel-card">
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6}}>
                      <div><strong style={{fontSize: '0.9rem'}}>{t.titulo}</strong><span style={{marginLeft: 8, fontSize: '0.75rem', color: 'var(--text-muted)'}}>{t.pais_nombre || ''}</span></div>
                      <div style={{display: 'flex', gap: 4, alignItems: 'center'}}>
                        <span className="badge badge-blue">{t.categoria || '—'}</span>
                        <button className="icon-btn" onClick={() => openEdit('tendencia', t)}><Edit size={14} /></button>
                        <button className="icon-btn" onClick={() => handleDelete('tendencias', t.id)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {t.descripcion && <div style={{fontSize: '0.8rem', lineHeight: 1.5}}>{t.descripcion}</div>}
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 6}}>
                      {t.fuente && <span style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>Fuente: {t.fuente}</span>}
                      {t.tags && <div style={{display: 'flex', gap: 4, flexWrap: 'wrap'}}>{t.tags.split(',').map((tag, i) => <span key={i} className="badge badge-gray">{tag.trim()}</span>)}</div>}
                    </div>
                  </div>
                ))
              }
            </>}
          </div>
        )}

        {/* ===== CALCULADORA ===== */}
        {activeTab === 'calculadora' && (
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
            <div className="card">
              <h3>🧮 Calculadora de costo de exportación</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const totalFOB = parseFloat(formValues.fob || 0) * parseInt(formValues.qty || 1);
                const cif = totalFOB + parseFloat(formValues.flete || 0) + parseFloat(formValues.seguro || 0);
                const arancelUSD = cif * (parseFloat(formValues.arancel || 0) / 100);
                const landed = cif + arancelUSD + parseFloat(formValues.otros || 0);
                axios.post('/calculos', { producto: formValues.producto, pais_id: formValues.pais_id, fob: formValues.fob, qty: formValues.qty, flete: formValues.flete, seguro: formValues.seguro, arancel: formValues.arancel, otros: formValues.otros, landed: landed.toFixed(2), fecha: new Date().toISOString().split('T')[0] }).then(() => {
                  alert(`Cálculo guardado. Costo Landed Estimado: $${landed.toLocaleString('es-AR')}`);
                  setFormValues({});
                  fetchData();
                });
              }}>
                <div className="form-group"><label className="form-label">Producto / descripción</label><input type="text" className="form-input" required value={fv('producto')} onChange={e => setFv('producto', e.target.value)} placeholder="Ej: Tapas Don Yeyo x 24u" /></div>
                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">Precio FOB (USD/unidad)</label><input type="number" step="any" className="form-input" required value={fv('fob')} onChange={e => setFv('fob', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Cantidad (unidades)</label><input type="number" className="form-input" required value={fv('qty')} onChange={e => setFv('qty', e.target.value)} /></div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">Flete internacional (USD)</label><input type="number" step="any" className="form-input" value={fv('flete')} onChange={e => setFv('flete', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Seguro (USD)</label><input type="number" step="any" className="form-input" value={fv('seguro')} onChange={e => setFv('seguro', e.target.value)} /></div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group"><label className="form-label">Arancel destino (%)</label><input type="number" step="any" className="form-input" value={fv('arancel')} onChange={e => setFv('arancel', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Otros gastos destino (USD)</label><input type="number" step="any" className="form-input" value={fv('otros')} onChange={e => setFv('otros', e.target.value)} /></div>
                </div>
                <div className="form-group"><label className="form-label">País destino</label><select className="form-input" value={fv('pais_id')} onChange={e => setFv('pais_id', e.target.value)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                <button type="submit" className="btn btn-primary" style={{width: '100%', marginTop: 8}}>Calcular y guardar</button>
              </form>
            </div>
            <div className="card">
              <h3>📋 Cálculos guardados</h3>
              {calculos.length === 0 ? <div className="empty-state"><div className="empty-state-icon">💾</div><div className="empty-state-text">Los cálculos guardados aparecen aquí</div></div> :
                calculos.map(c => (
                  <div key={c.id} style={{padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '0.85rem'}}>
                    <div style={{fontWeight: 500}}>{c.producto}</div>
                    <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 2}}>
                      <span style={{color: 'var(--text-muted)'}}>{c.pais_nombre || ''} · {fmtDate(c.fecha)}</span>
                      <span style={{fontWeight: 600}}>${parseFloat(c.landed).toLocaleString()} landed</span>
                    </div>
                    <button className="icon-btn" style={{marginTop: 4}} onClick={() => handleDelete('calculos', c.id)}><Trash2 size={14} /></button>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ===== COBRANZAS ===== */}
        {activeTab === 'cobranzas' && (
          <div>
            <div className="metrics-grid" style={{marginBottom: 16}}>
              <div className="metric-card" style={{borderLeft: '4px solid var(--success)'}}><div className="metric-header">Cobrado (año)</div><div className="metric-value">${cobranzaTotalCobrada.toLocaleString('es-AR')}</div><div className="metric-footer">{cobranzas.filter(c => c.estado === 'Cobrado').length} operaciones cobradas</div></div>
              <div className="metric-card" style={{borderLeft: '4px solid var(--warning)'}}><div className="metric-header">Pendiente</div><div className="metric-value" style={{color: 'var(--warning)'}}>${cobranzaPendiente.toLocaleString('es-AR')}</div><div className="metric-footer">{cobranzas.filter(c => c.estado === 'Pendiente' || c.estado === 'Cobrado parcial').length} operaciones en curso</div></div>
              <div className="metric-card" style={{borderLeft: '4px solid var(--danger)'}}><div className="metric-header">Vencido</div><div className="metric-value" style={{color: 'var(--danger)'}}>${cobranzaVencida.toLocaleString('es-AR')}</div><div className="metric-footer">{cobranzas.filter(c => c.estado === 'Vencido').length} operaciones vencidas</div></div>
            </div>
            <div className="card">
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16}}>
                <h3 style={{margin: 0}}>Registro de cobranzas</h3>
                <button className="btn btn-primary btn-sm" onClick={() => openNew('cobranza')}><Plus size={14} /> Nueva operación</button>
              </div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Operación / Cliente</th><th>País</th><th>Monto (USD)</th><th>Unidades</th><th>Cobrado</th><th>Saldo</th><th>Vencimiento</th><th>Estado</th><th></th></tr></thead>
                  <tbody>
                    {cobranzas.map(c => {
                      const saldo = parseFloat(c.monto || 0) - parseFloat(c.cobrado_monto || 0);
                      return (
                        <tr key={c.id}>
                          <td><strong>{c.descripcion}</strong>{c.cliente_nombre && <div style={{fontSize: '0.7rem', color: 'var(--text-muted)'}}>{c.cliente_nombre}</div>}</td>
                          <td>{c.pais_nombre || '—'}</td>
                          <td style={{fontWeight: 500}}>${parseFloat(c.monto || 0).toLocaleString()}</td>
                          <td>{c.unidades || 0}</td>
                          <td style={{color: 'var(--success)'}}>${parseFloat(c.cobrado_monto || 0).toLocaleString()}</td>
                          <td style={{color: saldo > 0 ? 'var(--warning)' : 'var(--success)', fontWeight: 500}}>${saldo.toLocaleString()}</td>
                          <td style={{fontSize: '0.8rem'}}>{fmtDate(c.vencimiento)}</td>
                          <td>{estadoBadge(c.estado)}</td>
                          <td><button className="icon-btn" onClick={() => openEdit('cobranza', c)}><Edit size={14} /></button> <button className="icon-btn" onClick={() => handleDelete('cobranzas', c.id)}><Trash2 size={14} /></button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* ========== MODAL UNIVERSAL ========== */}
      {showModal && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setShowModal(null); }}>
          <div className="modal-content">
            <div className="modal-header">
              <span className="modal-title">{formValues.id ? 'Editar' : 'Nuevo'} {showModal}</span>
              <button className="icon-btn" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <form onSubmit={(e) => {
              const endpointMap = { contacto: 'contactos', visita: 'visitas', oportunidad: 'oportunidades', cobranza: 'cobranzas', tarea: 'tareas', muestra: 'muestras', comunicacion: 'comunicaciones', documento: 'documentos', pais: 'paises', precio: 'precios', tendencia: 'tendencias' };
              handleSave(e, endpointMap[showModal]);
            }}>
              <div className="modal-body">

                {/* --- CONTACTO --- */}
                {showModal === 'contacto' && <>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Nombre *</label><input type="text" className="form-input" required value={fv('nombre')} onChange={e => setFv('nombre', e.target.value)} placeholder="Nombre completo" /></div>
                    <div className="form-group"><label className="form-label">Apellido</label><input type="text" className="form-input" value={fv('apellido')} onChange={e => setFv('apellido', e.target.value)} /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Empresa</label><input type="text" className="form-input" value={fv('empresa')} onChange={e => setFv('empresa', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Rol</label><select className="form-input" value={fv('rol') || 'Importador'} onChange={e => setFv('rol', e.target.value)}><option>Importador</option><option>Distribuidor</option><option>Broker</option><option>Retailer</option><option>Otro</option></select></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">País</label><input type="text" className="form-input" value={fv('pais_nombre')} onChange={e => setFv('pais_nombre', e.target.value)} placeholder="País" /></div>
                    <div className="form-group"><label className="form-label">Ciudad</label><input type="text" className="form-input" value={fv('ciudad')} onChange={e => setFv('ciudad', e.target.value)} /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Email</label><input type="email" className="form-input" value={fv('email')} onChange={e => setFv('email', e.target.value)} placeholder="email@empresa.com" /></div>
                    <div className="form-group"><label className="form-label">Teléfono / WhatsApp</label><input type="text" className="form-input" value={fv('telefono')} onChange={e => setFv('telefono', e.target.value)} placeholder="+1 555 0000" /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Estado</label><select className="form-input" value={fv('estado') || 'Activo'} onChange={e => setFv('estado', e.target.value)}><option>Activo</option><option>Prospecto</option><option>En proceso</option><option>Inactivo</option></select></div>
                  <div className="form-group"><label className="form-label">Notas</label><textarea className="form-input" value={fv('notas')} onChange={e => setFv('notas', e.target.value)} placeholder="Observaciones, intereses..."></textarea></div>
                </>}

                {/* --- VISITA --- */}
                {showModal === 'visita' && <>
                  <div className="form-group"><label className="form-label">Título *</label><input type="text" className="form-input" required value={fv('titulo')} onChange={e => setFv('titulo', e.target.value)} placeholder="Ej: Expofood Brasil 2025" /></div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Tipo</label><select className="form-input" value={fv('tipo') || 'Feria internacional'} onChange={e => setFv('tipo', e.target.value)}><option>Feria internacional</option><option>Ronda de negocios</option><option>Reunión comercial</option><option>Visita a cliente</option><option>Videoconferencia</option></select></div>
                    <div className="form-group"><label className="form-label">Estado</label><select className="form-input" value={fv('estado') || 'Planificada'} onChange={e => setFv('estado', e.target.value)}><option>Planificada</option><option>Realizada</option><option>Cancelada</option></select></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Fecha</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">País / Ciudad</label><input type="text" className="form-input" value={fv('lugar')} onChange={e => setFv('lugar', e.target.value)} placeholder="São Paulo, Brasil" /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Contactos participantes</label><input type="text" className="form-input" value={fv('contactos')} onChange={e => setFv('contactos', e.target.value)} placeholder="Nombres o empresas" /></div>
                  {(fv('tipo') === 'Ronda de negocios') && (
                    <div style={{background: 'var(--primary-light)', borderRadius: 'var(--radius-sm)', padding: '12px 14px', marginBottom: 14}}>
                      <div style={{fontSize: '0.8rem', fontWeight: 600, color: 'var(--dy-blue)', marginBottom: 8}}>📋 Datos de ronda de negocios</div>
                      <div className="form-grid-2">
                        <div className="form-group"><label className="form-label">Organismo organizador</label><input className="form-input" value={fv('ronda_org')} onChange={e => setFv('ronda_org', e.target.value)} placeholder="ProArgentina, Cancillería" /></div>
                        <div className="form-group"><label className="form-label">Nro. de reuniones</label><input type="number" className="form-input" value={fv('ronda_reuniones')} onChange={e => setFv('ronda_reuniones', e.target.value)} /></div>
                      </div>
                      <div className="form-grid-2">
                        <div className="form-group"><label className="form-label">Importadores contactados</label><input className="form-input" value={fv('ronda_importadores')} onChange={e => setFv('ronda_importadores', e.target.value)} /></div>
                        <div className="form-group"><label className="form-label">Pedidos generados (USD)</label><input type="number" className="form-input" value={fv('ronda_pedidos')} onChange={e => setFv('ronda_pedidos', e.target.value)} /></div>
                      </div>
                      <div className="form-group" style={{marginBottom: 0}}><label className="form-label">Resultado general</label><select className="form-input" value={fv('ronda_resultado') || 'Positivo'} onChange={e => setFv('ronda_resultado', e.target.value)}><option>Muy positivo</option><option>Positivo</option><option>Neutral</option><option>Sin resultados</option></select></div>
                    </div>
                  )}
                  <div className="form-group"><label className="form-label">Resultados / Notas</label><textarea className="form-input" value={fv('notas')} onChange={e => setFv('notas', e.target.value)} placeholder="Qué se habló, muestras entregadas..."></textarea></div>
                  <div className="form-group"><label className="form-label">Próximo paso</label><input className="form-input" value={fv('proximo')} onChange={e => setFv('proximo', e.target.value)} placeholder="Ej: Enviar propuesta antes del 30/6" /></div>
                </>}

                {/* --- OPORTUNIDAD --- */}
                {showModal === 'oportunidad' && <>
                  <div className="form-group"><label className="form-label">Nombre de la oportunidad *</label><input type="text" className="form-input" required value={fv('nombre')} onChange={e => setFv('nombre', e.target.value)} placeholder="Ej: Grupo Arcos — Tapas Don Yeyo" /></div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">País</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">Contacto</label><select className="form-input" value={fv('contacto_id') || ''} onChange={e => setFv('contacto_id', e.target.value || null)}><option value="">Selecciona...</option>{contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''}</option>)}</select></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Marca</label><select className="form-input" value={fv('marca') || 'Don Yeyo'} onChange={e => setFv('marca', e.target.value)}><option>Don Yeyo</option><option>DeViano</option><option>Ambas</option></select></div>
                    <div className="form-group"><label className="form-label">Categoría de producto</label><select className="form-input" value={fv('categoria') || 'Tapas'} onChange={e => setFv('categoria', e.target.value)}><option>Tapas</option><option>Pastas</option><option>Panificados</option><option>Tortillas</option><option>Mix</option></select></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Monto estimado (USD)</label><input type="number" step="any" className="form-input" value={fv('monto')} onChange={e => setFv('monto', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Probabilidad (%)</label><input type="number" className="form-input" value={fv('prob')} onChange={e => setFv('prob', e.target.value)} min="0" max="100" /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Etapa</label><select className="form-input" value={fv('etapa') || 'Prospecto'} onChange={e => setFv('etapa', e.target.value)}><option>Prospecto</option><option>Contactado</option><option>Propuesta</option><option>Negociación</option><option>Cerrado</option><option>Perdido</option></select></div>
                    <div className="form-group"><label className="form-label">Cierre estimado</label><input type="date" className="form-input" value={fvDate('cierre')} onChange={e => setFv('cierre', e.target.value)} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Notas</label><textarea className="form-input" value={fv('notas')} onChange={e => setFv('notas', e.target.value)} placeholder="Detalles, condiciones..."></textarea></div>
                </>}

                {/* --- TAREA --- */}
                {showModal === 'tarea' && <>
                  <div className="form-group"><label className="form-label">Descripción *</label><input type="text" className="form-input" required value={fv('titulo')} onChange={e => setFv('titulo', e.target.value)} placeholder="¿Qué hay que hacer?" /></div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Fecha límite</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Prioridad</label><select className="form-input" value={fv('prioridad') || 'media'} onChange={e => setFv('prioridad', e.target.value)}><option value="alta">Alta</option><option value="media">Media</option><option value="baja">Baja</option></select></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Relacionado con (país)</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona un país...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">Asignado a</label><input type="text" className="form-input" value={fv('asignado')} onChange={e => setFv('asignado', e.target.value)} placeholder="Nombre" /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Notas</label><textarea className="form-input" value={fv('notas')} onChange={e => setFv('notas', e.target.value)} placeholder="Detalle adicional..." style={{minHeight: 60}}></textarea></div>
                </>}

                {/* --- COBRANZA --- */}
                {showModal === 'cobranza' && <>
                  <div className="form-group"><label className="form-label">Operación / descripción *</label><input type="text" className="form-input" required value={fv('descripcion')} onChange={e => setFv('descripcion', e.target.value)} placeholder="Ej: Invoice #2025-089 — Tapas Don Yeyo" /></div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Cliente / Empresa</label><select className="form-input" value={fv('cliente_id') || ''} onChange={e => setFv('cliente_id', e.target.value || null)}><option value="">Selecciona...</option>{contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">País</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                  </div>
                  <div className="form-grid-3">
                    <div className="form-group"><label className="form-label">Monto total (USD)</label><input type="number" step="any" className="form-input" value={fv('monto')} onChange={e => setFv('monto', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Monto cobrado (USD)</label><input type="number" step="any" className="form-input" value={fv('cobrado_monto')} onChange={e => setFv('cobrado_monto', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Saldo (USD)</label><input type="text" className="form-input" value={`$${(parseFloat(fv('monto') || 0) - parseFloat(fv('cobrado_monto') || 0)).toLocaleString()}`} readOnly style={{background: 'var(--background)', fontWeight: 500}} /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Unidades exportadas</label><input type="number" className="form-input" value={fv('unidades')} onChange={e => setFv('unidades', e.target.value)} /></div>
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
                  <div className="form-group"><label className="form-label">Notas</label><textarea className="form-input" value={fv('notas')} onChange={e => setFv('notas', e.target.value)} placeholder="Referencias, nro carta de crédito..." style={{minHeight: 60}}></textarea></div>
                </>}

                {/* --- MUESTRA --- */}
                {showModal === 'muestra' && <>
                  <div className="form-group"><label className="form-label">Producto / descripción *</label><input type="text" className="form-input" required value={fv('producto')} onChange={e => setFv('producto', e.target.value)} placeholder="Ej: Tapas Don Yeyo x 12u" /></div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Destinatario</label><input className="form-input" value={fv('destinatario')} onChange={e => setFv('destinatario', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">País</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Fecha de envío</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Resultado</label><select className="form-input" value={fv('resultado') || 'Pendiente'} onChange={e => setFv('resultado', e.target.value)}><option>Pendiente</option><option>En evaluación</option><option>Positivo</option><option>Negativo</option></select></div>
                  </div>
                  <div className="form-group"><label className="form-label">Costo estimado (USD)</label><input type="number" step="0.01" className="form-input" value={fv('costo')} onChange={e => setFv('costo', e.target.value)} /></div>
                  <div className="form-group"><label className="form-label">Notas / feedback</label><textarea className="form-input" value={fv('notas')} onChange={e => setFv('notas', e.target.value)} placeholder="Feedback del cliente..." style={{minHeight: 60}}></textarea></div>
                </>}

                {/* --- COMUNICACIÓN --- */}
                {showModal === 'comunicacion' && <>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Tipo</label><select className="form-input" value={fv('tipo') || 'Email'} onChange={e => setFv('tipo', e.target.value)}><option>Email</option><option>Llamada</option><option>WhatsApp</option><option>Reunión</option><option>Videollamada</option></select></div>
                    <div className="form-group"><label className="form-label">Fecha</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Contacto</label><select className="form-input" value={fv('contacto_id') || ''} onChange={e => setFv('contacto_id', e.target.value || null)}><option value="">Selecciona...</option>{contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido || ''}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">País</label><input className="form-input" value={fv('pais')} onChange={e => setFv('pais', e.target.value)} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Asunto / tema</label><input type="text" className="form-input" required value={fv('asunto')} onChange={e => setFv('asunto', e.target.value)} placeholder="¿De qué se trató?" /></div>
                  <div className="form-group"><label className="form-label">Resumen</label><textarea className="form-input" value={fv('resumen')} onChange={e => setFv('resumen', e.target.value)} placeholder="Qué se dijo, compromisos..."></textarea></div>
                  <div className="form-group"><label className="form-label">Próximo paso</label><input className="form-input" value={fv('proximo')} onChange={e => setFv('proximo', e.target.value)} placeholder="Ej: Responder con oferta formal el lunes" /></div>
                </>}

                {/* --- DOCUMENTO --- */}
                {showModal === 'documento' && <>
                  <div className="form-group"><label className="form-label">Nombre / descripción *</label><input type="text" className="form-input" required value={fv('nombre')} onChange={e => setFv('nombre', e.target.value)} placeholder="Ej: Certificado fitosanitario SENASA #44812" /></div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Tipo</label><select className="form-input" value={fv('tipo') || 'Invoice'} onChange={e => setFv('tipo', e.target.value)}><option>Invoice</option><option>Bill of Lading</option><option>Packing List</option><option>Certificado fitosanitario</option><option>Certificado de origen</option><option>Contrato</option><option>Otro</option></select></div>
                    <div className="form-group"><label className="form-label">Estado</label><select className="form-input" value={fv('estado') || 'Vigente'} onChange={e => setFv('estado', e.target.value)}><option>Vigente</option><option>Por vencer</option><option>Vencido</option></select></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">País / Contacto</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">Fecha de vencimiento</label><input type="date" className="form-input" value={fvDate('vencimiento')} onChange={e => setFv('vencimiento', e.target.value)} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Número / referencia</label><input className="form-input" value={fv('numero')} onChange={e => setFv('numero', e.target.value)} placeholder="Número de documento" /></div>
                  <div className="form-group"><label className="form-label">Notas</label><textarea className="form-input" value={fv('notas')} onChange={e => setFv('notas', e.target.value)} style={{minHeight: 60}}></textarea></div>
                </>}

                {/* --- PAÍS --- */}
                {showModal === 'pais' && <>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">País *</label><input type="text" className="form-input" required value={fv('nombre')} onChange={e => setFv('nombre', e.target.value)} placeholder="Ej: Brasil" /></div>
                    <div className="form-group"><label className="form-label">Emoji bandera</label><input className="form-input" value={fv('bandera')} onChange={e => setFv('bandera', e.target.value)} placeholder="🇧🇷" /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Arancel principal (%)</label><input type="number" step="0.01" className="form-input" value={fv('arancel')} onChange={e => setFv('arancel', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Incoterm habitual</label><input className="form-input" value={fv('incoterm')} onChange={e => setFv('incoterm', e.target.value)} placeholder="CIF Santos" /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Posición arancelaria</label><input className="form-input" value={fv('ncm')} onChange={e => setFv('ncm', e.target.value)} placeholder="NCM 1902.19" /></div>
                    <div className="form-group"><label className="form-label">Moneda local</label><input className="form-input" value={fv('moneda')} onChange={e => setFv('moneda', e.target.value)} placeholder="BRL" /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Tipo de cambio (vs USD)</label><input type="number" step="0.0001" className="form-input" value={fv('tipocambio')} onChange={e => setFv('tipocambio', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Fecha tipo de cambio</label><input type="date" className="form-input" value={fvDate('tc_fecha')} onChange={e => setFv('tc_fecha', e.target.value)} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Organismo sanitario regulador</label><input className="form-input" value={fv('sanitario')} onChange={e => setFv('sanitario', e.target.value)} placeholder="ANVISA, SENASICA, FDA..." /></div>
                  <div className="form-group"><label className="form-label">Requisitos de habilitación sanitaria</label><textarea className="form-input" value={fv('sanitario_req')} onChange={e => setFv('sanitario_req', e.target.value)} style={{minHeight: 50}}></textarea></div>
                  <div className="form-group"><label className="form-label">Requisitos de etiquetado</label><textarea className="form-input" value={fv('etiquetado')} onChange={e => setFv('etiquetado', e.target.value)} style={{minHeight: 50}}></textarea></div>
                  <div className="form-group"><label className="form-label">Notas / acceso al mercado</label><textarea className="form-input" value={fv('notas')} onChange={e => setFv('notas', e.target.value)} style={{minHeight: 50}}></textarea></div>
                </>}

                {/* --- PRECIO COMPETIDOR --- */}
                {showModal === 'precio' && <>
                  <div className="form-group"><label className="form-label">Competidor / marca *</label><input type="text" className="form-input" required value={fv('competidor')} onChange={e => setFv('competidor', e.target.value)} placeholder="Matarazzo, La Salteña..." /></div>
                  <div className="form-group"><label className="form-label">Descripción del producto</label><input className="form-input" value={fv('producto')} onChange={e => setFv('producto', e.target.value)} placeholder="Tapas de empanadas x 12u 500g" /></div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">País</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">Categoría</label><select className="form-input" value={fv('categoria') || 'Tapas'} onChange={e => setFv('categoria', e.target.value)}><option>Tapas</option><option>Pastas</option><option>Panificados</option><option>Tortillas</option><option>Otro</option></select></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Precio</label><input type="number" step="0.01" className="form-input" value={fv('precio')} onChange={e => setFv('precio', e.target.value)} /></div>
                    <div className="form-group"><label className="form-label">Moneda / unidad</label><input className="form-input" value={fv('unidad')} onChange={e => setFv('unidad', e.target.value)} placeholder="USD/kg, BRL/paq" /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Peso neto envase (kg)</label><input type="number" step="0.001" className="form-input" value={fv('peso')} onChange={e => setFv('peso', e.target.value)} placeholder="0.500" /></div>
                    <div className="form-group"><label className="form-label">Precio / kg (calculado)</label><input className="form-input" readOnly value={fv('precio') && fv('peso') ? (parseFloat(fv('precio')) / parseFloat(fv('peso'))).toFixed(2) + ' / kg' : ''} style={{background: 'var(--background)', color: 'var(--dy-blue)', fontWeight: 500}} /></div>
                  </div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">Fuente</label><input className="form-input" value={fv('fuente')} onChange={e => setFv('fuente', e.target.value)} placeholder="visita feria, web..." /></div>
                    <div className="form-group"><label className="form-label">Fecha</label><input type="date" className="form-input" value={fvDate('fecha')} onChange={e => setFv('fecha', e.target.value)} /></div>
                  </div>
                  <div className="form-group"><label className="form-label">Notas</label><textarea className="form-input" value={fv('notas')} onChange={e => setFv('notas', e.target.value)} style={{minHeight: 60}}></textarea></div>
                </>}

                {/* --- TENDENCIA --- */}
                {showModal === 'tendencia' && <>
                  <div className="form-group"><label className="form-label">Título *</label><input type="text" className="form-input" required value={fv('titulo')} onChange={e => setFv('titulo', e.target.value)} placeholder="Crecimiento del mercado free-gluten en México" /></div>
                  <div className="form-grid-2">
                    <div className="form-group"><label className="form-label">País / Región</label><select className="form-input" value={fv('pais_id') || ''} onChange={e => setFv('pais_id', e.target.value || null)}><option value="">Selecciona...</option>{paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select></div>
                    <div className="form-group"><label className="form-label">Categoría</label><select className="form-input" value={fv('categoria') || 'Tendencia de consumo'} onChange={e => setFv('categoria', e.target.value)}><option>Tendencia de consumo</option><option>Regulación / normativa</option><option>Competencia</option><option>Logística / costos</option><option>Oportunidad</option><option>Riesgo</option></select></div>
                  </div>
                  <div className="form-group"><label className="form-label">Descripción</label><textarea className="form-input" value={fv('descripcion')} onChange={e => setFv('descripcion', e.target.value)} placeholder="Detalle de la tendencia, datos, fuentes..."></textarea></div>
                  <div className="form-group"><label className="form-label">Fuente</label><input className="form-input" value={fv('fuente')} onChange={e => setFv('fuente', e.target.value)} placeholder="Informe USDA, Feria Anuga..." /></div>
                  <div className="form-group"><label className="form-label">Etiquetas</label><input className="form-input" value={fv('tags')} onChange={e => setFv('tags', e.target.value)} placeholder="pasta, gluten-free, Europa (separadas por coma)" /></div>
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
    </div>
  );
}
