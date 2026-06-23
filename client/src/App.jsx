import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Calendar, Briefcase, Package, 
  Globe, FileText, TrendingUp, Calculator, DollarSign, 
  CheckSquare, Menu, Sun, Moon, Plus, Trash2, RefreshCw, X, User
} from 'lucide-react';
import logo from './assets/logo-don-yeyo-png-sin-fondo.png';
import './App.css';

// Configurar base URL para Axios
axios.defaults.baseURL = '/api';

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
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

  useEffect(() => {
    fetchData();
  }, []);

  // Manejo de Tema (Claro / Oscuro)
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

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

  const handleSave = async (e, endpoint) => {
    e.preventDefault();
    try {
      await axios.post(`/${endpoint}`, formValues);
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

  const toggleTaskStatus = async (task) => {
    try {
      const newStatus = task.status === 'hecha' ? 'pendiente' : 'hecha';
      await axios.put(`/tareas/${task.id}`, { status: newStatus });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Totales de Cobranzas en Dashboard
  const cobradoAnual = cobranzas.filter(c => c.estado === 'Cobrado').reduce((sum, c) => sum + parseFloat(c.monto), 0);
  const cobradoParcial = cobranzas.filter(c => c.estado === 'Cobrado parcial').reduce((sum, c) => sum + parseFloat(c.cobrado_monto), 0);
  const cobranzaTotalCobrada = cobradoAnual + cobradoParcial;
  const cobranzaPendiente = cobranzas.filter(c => c.estado === 'Pendiente' || c.estado === 'Cobrado parcial').reduce((sum, c) => sum + (parseFloat(c.monto) - parseFloat(c.cobrado_monto)), 0);
  const cobranzaVencida = cobranzas.filter(c => c.estado === 'Vencido').reduce((sum, c) => sum + (parseFloat(c.monto) - parseFloat(c.cobrado_monto)), 0);

  // Iniciales del usuario para avatar
  const initials = user.name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', key: 'dashboard' },
    { icon: <CheckSquare size={20} />, label: 'Tareas', key: 'tareas' },
    { icon: <Users size={20} />, label: 'Contactos', key: 'contactos' },
    { icon: <Calendar size={20} />, label: 'Visitas', key: 'visitas' },
    { icon: <Briefcase size={20} />, label: 'Oportunidades', key: 'oportunidades' },
    { icon: <Package size={20} />, label: 'Muestras', key: 'muestras' },
    { icon: <Globe size={20} />, label: 'Países', key: 'paises' },
    { icon: <FileText size={20} />, label: 'Documentos', key: 'documentos' },
    { icon: <TrendingUp size={20} />, label: 'Inteligencia', key: 'inteligencia' },
    { icon: <Calculator size={20} />, label: 'Calculadora', key: 'calculadora' },
    { icon: <DollarSign size={20} />, label: 'Cobranzas', key: 'cobranzas' }
  ];

  return (
    <div className="layout">
      {/* HEADER SUPERIOR (AL ESTILO CONTROL DE INGRESOS Y EGRESOS) */}
      <header className="header glass">
        <div className="header-left">
          <button className="mode-toggle" onClick={() => setDrawerOpen(true)}>
            <Menu size={24} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logo} alt="Don Yeyo" style={{ height: '36px', objectFit: 'contain' }} />
            <h2 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, color: 'var(--primary)' }}>
              Comercio Exterior <span style={{ fontSize: '0.65rem', fontWeight: 500, opacity: 0.6, backgroundColor: 'rgba(0,0,0,0.05)', padding: '2px 6px', borderRadius: '4px' }}>v1.0.0</span>
            </h2>
          </div>
        </div>

        <div className="header-right">
          <button className="mode-toggle" onClick={toggleTheme} title="Cambiar modo">
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <div
            className="avatar-container"
            onClick={() => setShowUserMenu(!showUserMenu)}
            style={{ position: 'relative' }}
          >
            <span className="user-name desktop-only">{user.name}</span>
            <div className="avatar">
              {initials || <User size={20} />}
            </div>

            {showUserMenu && (
              <div className="glass" style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '8px',
                minWidth: '180px',
                borderRadius: '12px',
                overflow: 'hidden',
                zIndex: 150,
                textAlign: 'left'
              }}>
                <button
                  onClick={() => alert('Cierre de sesión')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: 0,
                    justifyContent: 'flex-start',
                    color: 'var(--error)',
                    background: 'transparent',
                    fontSize: '0.9rem',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  Cerrar Sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* DRAWER / SIDEBAR COLAPSABLE */}
      <div className={`drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setDrawerOpen(false)} />
      <div className={`drawer ${isDrawerOpen ? 'open' : ''} glass`}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.2rem', color: 'var(--drawer-title)', fontWeight: 800 }}>Menú</h2>
          <button className="mode-toggle" onClick={() => setDrawerOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1 }}>
          {menuItems.map((item) => {
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                className={`drawer-menu-btn ${isActive ? 'active' : ''}`}
                onClick={() => {
                  setActiveTab(item.key);
                  setDrawerOpen(false);
                }}
              >
                <span>{item.icon}</span>
                {item.label}
              </button>
            );
          })}
        </nav>

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--drawer-footer)', fontWeight: 700 }}>DON YEYO S.A.</p>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>v1.0.0</p>
        </div>
      </div>

      {/* CUERPO DE CONTENIDO */}
      <main className="content">
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div>
            <div className="metrics-grid">
              <div className="metric-card">
                <div className="metric-header">Países Destino</div>
                <div className="metric-value">{paises.length}</div>
                <div className="metric-footer">en cartera de exportación</div>
              </div>
              <div className="metric-card">
                <div className="metric-header">Volumen Cobrado</div>
                <div className="metric-value">${cobranzaTotalCobrada.toLocaleString('es-AR')}</div>
                <div className="metric-footer">operaciones liquidadas</div>
              </div>
              <div className="metric-card">
                <div className="metric-header">Cobranza Pendiente</div>
                <div className="metric-value" style={{color: 'var(--warning)'}}>${cobranzaPendiente.toLocaleString('es-AR')}</div>
                <div className="metric-footer">en plazo de pago</div>
              </div>
              <div className="metric-card">
                <div className="metric-header">Cobranza Vencida</div>
                <div className="metric-value" style={{color: 'var(--danger)'}}>${cobranzaVencida.toLocaleString('es-AR')}</div>
                <div className="metric-footer">requiere acción urgente</div>
              </div>
            </div>

            <div className="card">
              <h3>Volumen de exportación por país</h3>
              <div style={{marginTop: 16}}>
                {paises.map(p => {
                  const totalPais = cobranzas.filter(c => c.pais_id === p.id).reduce((sum, c) => sum + parseFloat(c.monto), 0);
                  return (
                    <div key={p.id} style={{display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12}}>
                      <span style={{fontSize: 20}}>{p.bandera}</span>
                      <span style={{width: 120, fontWeight: 500}}>{p.nombre}</span>
                      <div style={{flex: 1, height: 10, background: 'var(--border-color)', borderRadius: 5, overflow: 'hidden'}}>
                        <div style={{width: `${Math.min(100, (totalPais / (cobranzaTotalCobrada || 1)) * 100)}%`, height: '100%', background: 'var(--primary)'}}></div>
                      </div>
                      <span style={{fontWeight: 600}}>${totalPais.toLocaleString('es-AR')}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* CONTACTOS TAB */}
        {activeTab === 'contactos' && (
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
              <button className="btn btn-secondary" onClick={syncFinnegansClientes} disabled={loadingSync}>
                <RefreshCw size={16} /> {loadingSync ? 'Sincronizando...' : 'Sincronizar Finnegans ERP'}
              </button>
              <button className="btn btn-primary" onClick={() => setShowModal('contacto')}>
                <Plus size={16} /> Nuevo Contacto
              </button>
            </div>

            {finnegansClientes.length > 0 && (
              <div style={{marginBottom: 24, padding: 16, background: 'var(--primary-light)', borderRadius: 'var(--radius)'}}>
                <h4 style={{fontWeight: 700, color: 'var(--primary)', marginBottom: 10}}>Clientes Disponibles en ERP Finnegans</h4>
                <div style={{display: 'flex', gap: 8, flexWrap: 'wrap'}}>
                  {finnegansClientes.map(fc => (
                    <div key={fc.codigo} className="badge badge-primary" style={{cursor: 'pointer'}} onClick={() => {
                      setFormValues({ nombre: fc.nombre, pais_nombre: fc.pais, finnegans_id: fc.codigo });
                      setShowModal('contacto');
                    }}>
                      {fc.nombre} ({fc.pais})
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Empresa</th>
                    <th>Rol</th>
                    <th>País</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {contactos.map(c => (
                    <tr key={c.id}>
                      <td><strong>{c.nombre} {c.apellido}</strong></td>
                      <td>{c.empresa || '—'}</td>
                      <td>{c.rol}</td>
                      <td>{c.pais_nombre || '—'}</td>
                      <td>{c.email || '—'}</td>
                      <td>
                        <span className={`badge ${c.estado === 'Activo' ? 'badge-success' : 'badge-warning'}`}>
                          {c.estado}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{padding: 6}} onClick={() => handleDelete('contactos', c.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VISITAS TAB */}
        {activeTab === 'visitas' && (
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
              <h3>Registro de Visitas y Rondas de Negocios</h3>
              <button className="btn btn-primary" onClick={() => setShowModal('visita')}>
                <Plus size={16} /> Registrar Actividad
              </button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Título</th>
                    <th>Tipo</th>
                    <th>Fecha</th>
                    <th>Lugar</th>
                    <th>Ronda de Negocios (Reuniones / Pedidos)</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {visitas.map(v => (
                    <tr key={v.id}>
                      <td><strong>{v.titulo}</strong></td>
                      <td><span className="badge badge-primary">{v.tipo}</span></td>
                      <td>{new Date(v.fecha).toLocaleDateString()}</td>
                      <td>{v.lugar || '—'}</td>
                      <td>
                        {v.tipo === 'Ronda de negocios' ? (
                          <span>{v.ronda_reuniones} reun. / <strong>${parseFloat(v.ronda_pedidos || 0).toLocaleString()}</strong></span>
                        ) : '—'}
                      </td>
                      <td>
                        <button className="btn btn-secondary" style={{padding: 6}} onClick={() => handleDelete('visitas', v.id)}>
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* OPORTUNIDADES TAB */}
        {activeTab === 'oportunidades' && (
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
              <h3>Pipeline de Negocios</h3>
              <button className="btn btn-primary" onClick={() => setShowModal('oportunidad')}>
                <Plus size={16} /> Nueva Oportunidad
              </button>
            </div>
            <div className="funnel-container">
              {['Prospecto', 'Contactado', 'Propuesta', 'Negociación', 'Cerrado'].map(stage => (
                <div key={stage} className="funnel-column">
                  <div className="funnel-header">{stage}</div>
                  {oportunidades.filter(o => o.etapa === stage).map(o => (
                    <div key={o.id} className="funnel-card">
                      <strong>{o.nombre}</strong>
                      <div style={{fontSize: 12, color: 'var(--text-muted)'}}>{o.marca}</div>
                      <div style={{fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginTop: 4}}>${parseFloat(o.monto).toLocaleString()}</div>
                      <div style={{display: 'flex', justifyContent: 'space-between', marginTop: 8}}>
                        <span style={{fontSize: 11}} className="badge badge-primary">{o.prob}%</span>
                        <button style={{background: 'none', border: 'none', cursor: 'pointer', color: 'var(--danger)'}} onClick={() => handleDelete('oportunidades', o.id)}>
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CALCULADORA TAB */}
        {activeTab === 'calculadora' && (
          <div className="card">
            <h3>Calculadora FOB a Landed Cost</h3>
            <form style={{marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16}} onSubmit={(e) => {
              e.preventDefault();
              const totalFOB = parseFloat(formValues.fob || 0) * parseInt(formValues.qty || 1);
              const cif = totalFOB + parseFloat(formValues.flete || 0) + parseFloat(formValues.seguro || 0);
              const arancelUSD = cif * (parseFloat(formValues.arancel || 0) / 100);
              const landed = cif + arancelUSD + parseFloat(formValues.otros || 0);
              
              axios.post('/calculos', {
                producto: formValues.producto,
                pais_id: formValues.pais_id,
                fob: formValues.fob,
                qty: formValues.qty,
                flete: formValues.flete,
                seguro: formValues.seguro,
                arancel: formValues.arancel,
                otros: formValues.otros,
                landed: landed.toFixed(2),
                fecha: new Date().toISOString().split('T')[0]
              }).then(() => {
                alert(`Cálculo guardado. Costo Landed Estimado: $${landed.toLocaleString('es-AR')}`);
                setFormValues({});
                fetchData();
              });
            }}>
              <div className="form-group">
                <label className="form-label">Producto</label>
                <input type="text" className="form-input" required onChange={e => setFormValues({...formValues, producto: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">País Destino</label>
                <select className="form-input" onChange={e => setFormValues({...formValues, pais_id: e.target.value})}>
                  <option value="">Selecciona...</option>
                  {paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Precio FOB (USD / Unidad)</label>
                <input type="number" step="any" className="form-input" required onChange={e => setFormValues({...formValues, fob: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Cantidad</label>
                <input type="number" className="form-input" required onChange={e => setFormValues({...formValues, qty: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Flete Internacional (USD)</label>
                <input type="number" step="any" className="form-input" onChange={e => setFormValues({...formValues, flete: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Seguro Internacional (USD)</label>
                <input type="number" step="any" className="form-input" onChange={e => setFormValues({...formValues, seguro: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Arancel Destino (%)</label>
                <input type="number" step="any" className="form-input" onChange={e => setFormValues({...formValues, arancel: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="form-label">Otros Costos Destino (USD)</label>
                <input type="number" step="any" className="form-input" onChange={e => setFormValues({...formValues, otros: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{gridColumn: 'span 2'}}>Calcular & Guardar</button>
            </form>

            <div style={{marginTop: 32}}>
              <h4>Cálculos Guardados</h4>
              <div className="table-container" style={{marginTop: 12}}>
                <table>
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>País</th>
                      <th>Costo Landed Total</th>
                      <th>Costo Unitario Landed</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {calculos.map(c => (
                      <tr key={c.id}>
                        <td>{c.producto}</td>
                        <td>{c.pais_nombre || '—'}</td>
                        <td><strong>${parseFloat(c.landed).toLocaleString()}</strong></td>
                        <td>${(parseFloat(c.landed) / (c.qty || 1)).toLocaleString()} / u</td>
                        <td>
                          <button className="btn btn-secondary" style={{padding: 6}} onClick={() => handleDelete('calculos', c.id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* COBRANZAS TAB */}
        {activeTab === 'cobranzas' && (
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
              <h3>Registro de Cobranzas</h3>
              <button className="btn btn-primary" onClick={() => setShowModal('cobranza')}>
                <Plus size={16} /> Nueva Cobranza
              </button>
            </div>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Descripción / Operación</th>
                    <th>Cliente</th>
                    <th>País</th>
                    <th>Monto Total</th>
                    <th>Cobrado</th>
                    <th>Saldo</th>
                    <th>Vencimiento</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {cobranzas.map(c => {
                    const saldo = parseFloat(c.monto) - parseFloat(c.cobrado_monto);
                    return (
                      <tr key={c.id}>
                        <td><strong>{c.descripcion}</strong></td>
                        <td>{c.cliente_nombre || '—'}</td>
                        <td>{c.pais_nombre || '—'}</td>
                        <td>${parseFloat(c.monto).toLocaleString()}</td>
                        <td style={{color: 'var(--success)'}}>${parseFloat(c.cobrado_monto).toLocaleString()}</td>
                        <td style={{color: saldo > 0 ? 'var(--warning)' : 'var(--success)'}}>
                          ${saldo.toLocaleString()}
                        </td>
                        <td>{new Date(c.vencimiento).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${
                            c.estado === 'Cobrado' ? 'badge-success' :
                            c.estado === 'Cobrado parcial' ? 'badge-warning' : 'badge-danger'
                          }`}>
                            {c.estado}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-secondary" style={{padding: 6}} onClick={() => handleDelete('cobranzas', c.id)}>
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAREAS TAB */}
        {activeTab === 'tareas' && (
          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 20}}>
              <h3>Checklist de Tareas</h3>
              <button className="btn btn-primary" onClick={() => setShowModal('tarea')}>
                <Plus size={16} /> Nueva Tarea
              </button>
            </div>
            <div>
              {tareas.map(t => (
                <div key={t.id} style={{display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: '1px solid var(--border-color)'}}>
                  <input type="checkbox" checked={t.status === 'hecha'} onChange={() => toggleTaskStatus(t)} style={{width: 18, height: 18}} />
                  <span style={{textDecoration: t.status === 'hecha' ? 'line-through' : 'none', flex: 1}}>
                    {t.titulo}
                  </span>
                  <span className="badge badge-warning">{t.prioridad}</span>
                  <button className="btn btn-secondary" style={{padding: 6}} onClick={() => handleDelete('tareas', t.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FORMULARIO MODAL COMPARTIDO */}
      {showModal && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h3 style={{marginBottom: 20}}>Agregar {showModal}</h3>
            <form onSubmit={(e) => handleSave(e, showModal === 'contacto' ? 'contactos' : showModal === 'visita' ? 'visitas' : showModal === 'oportunidad' ? 'oportunidades' : showModal === 'cobranza' ? 'cobranzas' : 'tareas')}>
              {showModal === 'contacto' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input type="text" className="form-input" required value={formValues.nombre || ''} onChange={e => setFormValues({...formValues, nombre: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Empresa</label>
                    <input type="text" className="form-input" value={formValues.empresa || ''} onChange={e => setFormValues({...formValues, empresa: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Rol</label>
                    <select className="form-input" onChange={e => setFormValues({...formValues, rol: e.target.value})}>
                      <option value="Importador">Importador</option>
                      <option value="Distribuidor">Distribuidor</option>
                      <option value="Broker">Broker</option>
                      <option value="Retailer">Retailer</option>
                    </select>
                  </div>
                </>
              )}

              {showModal === 'visita' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Título</label>
                    <input type="text" className="form-input" required onChange={e => setFormValues({...formValues, titulo: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select className="form-input" onChange={e => setFormValues({...formValues, tipo: e.target.value})}>
                      <option value="Reunión comercial">Reunión comercial</option>
                      <option value="Ronda de negocios">Ronda de negocios</option>
                      <option value="Feria internacional">Feria internacional</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Fecha</label>
                    <input type="date" className="form-input" required onChange={e => setFormValues({...formValues, fecha: e.target.value})} />
                  </div>
                  {formValues.tipo === 'Ronda de negocios' && (
                    <>
                      <div className="form-group">
                        <label className="form-label">Cantidad de Reuniones</label>
                        <input type="number" className="form-input" onChange={e => setFormValues({...formValues, ronda_reuniones: e.target.value})} />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Pedidos Proyectados (USD)</label>
                        <input type="number" step="any" className="form-input" onChange={e => setFormValues({...formValues, ronda_pedidos: e.target.value})} />
                      </div>
                    </>
                  )}
                </>
              )}

              {showModal === 'oportunidad' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Nombre</label>
                    <input type="text" className="form-input" required onChange={e => setFormValues({...formValues, nombre: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">País</label>
                    <select className="form-input" onChange={e => setFormValues({...formValues, pais_id: e.target.value})}>
                      <option value="">Selecciona...</option>
                      {paises.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monto (USD)</label>
                    <input type="number" step="any" className="form-input" required onChange={e => setFormValues({...formValues, monto: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Etapa</label>
                    <select className="form-input" onChange={e => setFormValues({...formValues, etapa: e.target.value})}>
                      <option value="Prospecto">Prospecto</option>
                      <option value="Contactado">Contactado</option>
                      <option value="Propuesta">Propuesta</option>
                      <option value="Negociación">Negociación</option>
                      <option value="Cerrado">Cerrado</option>
                    </select>
                  </div>
                </>
              )}

              {showModal === 'cobranza' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Descripción</label>
                    <input type="text" className="form-input" required onChange={e => setFormValues({...formValues, descripcion: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Cliente</label>
                    <select className="form-input" onChange={e => setFormValues({...formValues, cliente_id: e.target.value})}>
                      <option value="">Selecciona...</option>
                      {contactos.map(c => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Monto Total (USD)</label>
                    <input type="number" step="any" className="form-input" required onChange={e => setFormValues({...formValues, monto: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vencimiento</label>
                    <input type="date" className="form-input" required onChange={e => setFormValues({...formValues, vencimiento: e.target.value})} />
                  </div>
                </>
              )}

              {showModal === 'tarea' && (
                <>
                  <div className="form-group">
                    <label className="form-label">Descripción de la Tarea</label>
                    <input type="text" className="form-input" required onChange={e => setFormValues({...formValues, titulo: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Prioridad</label>
                    <select className="form-input" onChange={e => setFormValues({...formValues, prioridad: e.target.value})}>
                      <option value="baja">Baja</option>
                      <option value="media">Media</option>
                      <option value="alta">Alta</option>
                    </select>
                  </div>
                </>
              )}

              <div style={{display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 24}}>
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
