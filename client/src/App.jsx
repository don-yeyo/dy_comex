import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  LayoutDashboard, Users, Calendar, Briefcase, Package, 
  Globe, FileText, TrendingUp, Calculator, DollarSign, 
  CheckSquare, LogOut, Sun, Moon, Plus, Trash2, RefreshCw 
} from 'lucide-react';
import './App.css';

// Configurar base URL para Axios
axios.defaults.baseURL = '/api';

export default function App() {
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const [user, setUser] = useState({ name: 'Gabriel Comex', email: 'comercio.exterior@donyeyo.com.ar', rol: 'admin' });
  const [activeTab, setActiveTab] = useState('dashboard');
  
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
  const [showModal, setShowModal] = useState(null); // 'pais', 'contacto', 'visita', 'oportunidad', 'muestra', 'comunicacion', 'documento', 'precio', 'tendencia', 'cobranza', 'tarea'
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

  // Operaciones de Creación y Eliminación Genéricas
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

  // Cálculo de Cobranzas en Dashboard
  const cobradoAnual = cobranzas.filter(c => c.estado === 'Cobrado').reduce((sum, c) => sum + parseFloat(c.monto), 0);
  const cobradoParcial = cobranzas.filter(c => c.estado === 'Cobrado parcial').reduce((sum, c) => sum + parseFloat(c.cobrado_monto), 0);
  const cobranzaTotalCobrada = cobradoAnual + cobradoParcial;
  const cobranzaPendiente = cobranzas.filter(c => c.estado === 'Pendiente' || c.estado === 'Cobrado parcial').reduce((sum, c) => sum + (parseFloat(c.monto) - parseFloat(c.cobrado_monto)), 0);
  const cobranzaVencida = cobranzas.filter(c => c.estado === 'Vencido').reduce((sum, c) => sum + (parseFloat(c.monto) - parseFloat(c.cobrado_monto)), 0);

  return (
    <div className="app-container">
      {/* SIDEBAR */}
      <div className="sidebar">
        <div className="sidebar-header">
          <div className="brand-title">Trade<span>CRM</span></div>
          <div className="brand-sub">Comercio Exterior</div>
        </div>
        
        <div className="sidebar-menu">
          <div className="menu-label">Principal</div>
          <div className={`menu-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
            <LayoutDashboard size={18} /> Dashboard
          </div>
          <div className={`menu-item ${activeTab === 'tareas' ? 'active' : ''}`} onClick={() => setActiveTab('tareas')}>
            <CheckSquare size={18} /> Tareas
          </div>
          
          <div className="menu-label">Gestión</div>
          <div className={`menu-item ${activeTab === 'contactos' ? 'active' : ''}`} onClick={() => setActiveTab('contactos')}>
            <Users size={18} /> Contactos
          </div>
          <div className={`menu-item ${activeTab === 'visitas' ? 'active' : ''}`} onClick={() => setActiveTab('visitas')}>
            <Calendar size={18} /> Visitas
          </div>
          <div className={`menu-item ${activeTab === 'oportunidades' ? 'active' : ''}`} onClick={() => setActiveTab('oportunidades')}>
            <Briefcase size={18} /> Oportunidades
          </div>
          <div className={`menu-item ${activeTab === 'muestras' ? 'active' : ''}`} onClick={() => setActiveTab('muestras')}>
            <Package size={18} /> Muestras
          </div>
          
          <div className="menu-label">Información</div>
          <div className={`menu-item ${activeTab === 'paises' ? 'active' : ''}`} onClick={() => setActiveTab('paises')}>
            <Globe size={18} /> Países
          </div>
          <div className={`menu-item ${activeTab === 'documentos' ? 'active' : ''}`} onClick={() => setActiveTab('documentos')}>
            <FileText size={18} /> Documentos
          </div>
          <div className={`menu-item ${activeTab === 'inteligencia' ? 'active' : ''}`} onClick={() => setActiveTab('inteligencia')}>
            <TrendingUp size={18} /> Inteligencia
          </div>
          <div className={`menu-item ${activeTab === 'calculadora' ? 'active' : ''}`} onClick={() => setActiveTab('calculadora')}>
            <Calculator size={18} /> Calculadora
          </div>
          <div className={`menu-item ${activeTab === 'cobranzas' ? 'active' : ''}`} onClick={() => setActiveTab('cobranzas')}>
            <DollarSign size={18} /> Cobranzas
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="user-profile">
            <div className="avatar">G</div>
            <div>
              <div style={{fontWeight: 600}}>{user.name}</div>
              <div style={{fontSize: 10, color: 'rgba(255,255,255,0.4)'}}>{user.rol}</div>
            </div>
          </div>
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div className="main-content">
        <div className="topbar">
          <div className="topbar-left">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </div>
          <div className="topbar-right">
            <button className="theme-toggle" onClick={toggleTheme}>
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>
            <button className="btn btn-secondary" onClick={() => alert('Cierre de sesión')}>
              <LogOut size={16} /> Salir
            </button>
          </div>
        </div>

        <div className="content-body">
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

              {/* GRÁFICO / DESGLOSE POR PAÍS */}
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

              {/* LISTA ERP FINNEGANS */}
              {finnegansClientes.length > 0 && (
                <div style={{marginBottom: 24, padding: 16, background: 'var(--primary-light)', borderRadius: 'var(--radius)'}}>
                  <h4>Clientes Disponibles en ERP Finnegans</h4>
                  <div style={{display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10}}>
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

              {/* LISTA CÁLCULOS GUARDADOS */}
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
        </div>
      </div>

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
