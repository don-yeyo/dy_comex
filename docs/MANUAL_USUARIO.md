# Manual de Usuario — TradeCRM

**Sistema de gestión de comercio exterior para Don Yeyo S.A.**

---

## Índice

1. [Navegación general](#navegación-general)
2. [Dashboard](#dashboard)
3. [Tareas](#tareas)
4. [Alertas](#alertas)
5. [Contactos](#contactos)
6. [Visitas y reuniones](#visitas-y-reuniones)
7. [Oportunidades](#oportunidades)
8. [Muestras y comunicaciones](#muestras-y-comunicaciones)
9. [Países destino](#países-destino)
10. [Documentos](#documentos)
11. [Inteligencia comercial](#inteligencia-comercial)
12. [Calculadora de exportación](#calculadora-de-exportación)
13. [Cobranzas](#cobranzas)
14. [Consejos de uso](#consejos-de-uso)

---

## Navegación general

### Menú lateral
- Abrí el menú tocando el ícono **☰** en la esquina superior izquierda.
- Cada opción del menú te lleva a una sección del sistema.
- Los módulos con **badges rojos** indican que hay tareas pendientes o alertas activas.
- El sistema recuerda la última sección visitada para que al volver encuentres donde estabas.

### Tema claro / oscuro
- Usá el ícono de **luna/sol** en el header para alternar entre modo claro y oscuro.
- La preferencia se guarda automáticamente.

### 🔔 Campana de alertas y notificaciones PWA
- En la barra superior (header) tenés el ícono de **campana de alertas**:
  - **Ícono gris**: no tenés alertas sin visualizar.
  - **Badge rojo con número**: indica la cantidad de **alertas nuevas sin visualizar**.
- Al hacer click en la campana, el sistema te redirige directamente a la sección **Alertas** y marca las alertas como leídas.
- **PWA (Progressive Web App)**: podés instalar TradeCRM en tu celular o PC. Si aceptás los permisos de notificación, recibirás alertas push ante vencimientos o visitas próximas.

### Zoom de texto
- En el header hay 3 botones **A** que permiten ajustar el tamaño de texto y controles:
  - **A** chico: más compacto, ideal para pantallas con mucha información.
  - **A** mediano: tamaño estándar.
  - **A** grande: más legible, ideal para presentaciones.

### Filtros
- La mayoría de las pantallas tienen **filtros** en la parte superior que permiten acotar la información mostrada.
- Los filtros se recuerdan entre sesiones: si filtrás por un país o estado, al volver a la pantalla los filtros estarán activos.
- Para limpiar un filtro, seleccioná la opción "Todos" o "Todas".

### Formularios
- Los campos marcados con ***** son obligatorios.
- Los campos de texto libre soportan **formato enriquecido**: podés usar negrita, cursiva, subrayado y cambiar el color del texto con la barra de herramientas que aparece arriba del campo.
- Al crear un registro nuevo, el sistema pre-llena automáticamente el último país y marca que usaste para agilizar la carga.

### Eliminar registros
- Al tocar el ícono de **papelera**, el sistema te pedirá confirmación antes de eliminar.
- La eliminación es permanente y no se puede deshacer.

---

## Dashboard

**¿Para qué sirve?** Es la pantalla principal que te da una visión general del estado de tu operación de exportación.

### Métricas principales
- **Países activos**: cuántos mercados están operando actualmente.
- **Contactos**: total de importadores, distribuidores y brokers registrados.
- **Pipeline USD**: valor total de oportunidades abiertas (no cerradas ni perdidas).
- **Tareas vencidas**: tareas que pasaron su fecha límite y necesitan atención inmediata.

### Volumen de exportación anual
- Muestra las unidades exportadas, el valor total en USD y la cobranza vencida.
- Podés filtrar entre "Este año" y "Todo" para ver datos históricos.
- Abajo se muestra un **desglose por país** con barras de progreso proporcionales.

### Alertas críticas
- Documentos próximos a vencer (30 días) y visitas planificadas (14 días).
- Los badges muestran cuántos días faltan o si ya venció.

### Funnel de oportunidades
- Visualización tipo embudo (kanban simplificado) que muestra las oportunidades organizadas por etapa: Prospecto → Contactado → Propuesta → Negociación → Cerrado.

### Actividad reciente
- Lista de las últimas visitas, contactos y oportunidades registradas.

---

## Tareas

**¿Para qué sirve?** Gestión de tareas pendientes relacionadas con la operación de comercio exterior.

### Funciones
- **Filtrar por estado**: ver solo tareas pendientes o completadas.
- **Filtrar por prioridad**: alta, media o baja.
- **Marcar como hecha**: hacé click en el checkbox de la izquierda para completar una tarea.
- **Crear tarea**: botón "Nueva tarea" para agregar tareas con descripción, fecha límite, prioridad, país relacionado y persona asignada.

### Campos del formulario
| Campo | Descripción | Obligatorio |
|---|---|---|
| Descripción | Qué hay que hacer (máx. 200 caracteres) | Sí |
| Fecha límite | Cuándo debe estar resuelta | No |
| Prioridad | Alta, media o baja | No (default: media) |
| País | País al que está asociada la tarea | No |
| Asignado a | Persona responsable | No |
| Notas | Detalle adicional con formato | No |

### Indicadores
- Las tareas se ordenan por prioridad (alta primero).
- Las tareas vencidas muestran un indicador rojo con los días de retraso.

---

## Alertas

**¿Para qué sirve?** Muestra vencimientos próximos de documentos y compromisos de forma automática. No requiere carga manual.

### ¿Cómo se generan?
- **Documentos**: si un documento tiene fecha de vencimiento dentro de los próximos 30 días, aparece como alerta.
- **Visitas**: si una visita está planificada dentro de los próximos 14 días, aparece como recordatorio.

### Indicadores
- **Badge rojo**: ya venció o vence en menos de 7 días.
- **Badge ámbar**: vence entre 7 y 30 días.
- **Badge azul**: visita próxima.

---

## Contactos

**¿Para qué sirve?** Base de datos de importadores, distribuidores, brokers y retailers con los que trabajás o querés trabajar.

### Funciones
- **Buscar**: escribí un nombre, empresa o apellido para filtrar.
- **Filtrar por país**: acotá la lista a un país específico usando el selector.
- **Filtrar por rol**: importador, distribuidor, broker, retailer u otro.
- **Sincronización con Finnegans ERP**: botón "Sincronizar Finnegans ERP".

### 🔄 ¿Cómo funciona la Sincronización con Finnegans ERP?
1. Al pulsar el botón **"Sincronizar Finnegans ERP"**, el sistema efectúa una llamada en segundo plano a la API de Finnegans utilizando credenciales OAuth2 seguras.
2. Consulta el reporte dinámico `USR_ClientesExportacionDY` configurado en el ERP.
3. Extrae la lista de clientes activos clasificados como clientes de comercio exterior/exportación, obteniendo su código de organización, razón social y país.
4. Los datos sincronizados quedan disponibles en la interfaz para contrastar con la base local y vincular registros comerciales.

### Campos del formulario
| Campo | Descripción | Obligatorio | Máx. caracteres |
|---|---|---|---|
| Nombre | Nombre de pila o Razón Social | Sí | 100 |
| Apellido | Apellido | No | 100 |
| Empresa | Empresa u organización | No | 150 |
| Rol | Importador, Distribuidor, Broker, Retailer, Otro | No | — |
| País | Selector entre los países dados de alta | No | — |
| Ciudad | Ciudad | No | 100 |
| Email | Dirección de correo electrónico | No | 150 |
| Teléfono | Teléfono o WhatsApp | No | 50 |
| Estado | Activo, Prospecto, En proceso, Inactivo | No | — |
| Notas | Observaciones con formato | No | — |

---

## Visitas y reuniones

**¿Para qué sirve?** Registro de ferias internacionales, rondas de negocios, reuniones comerciales, visitas a clientes y videoconferencias.

### Filtros
- Por **tipo** de evento (feria, ronda, reunión, visita, videoconferencia).
- Por **estado** (planificada, realizada, cancelada).

### Rondas de negocios
Cuando seleccionás el tipo "Ronda de negocios", aparecen campos adicionales:
- Organismo organizador (ej: ProArgentina).
- Cantidad de reuniones realizadas.
- Importadores contactados.
- Pedidos generados en USD.
- Resultado general.

### Campos del formulario
| Campo | Descripción | Obligatorio | Máx. caracteres |
|---|---|---|---|
| Título | Nombre del evento | Sí | 200 |
| Tipo | Tipo de visita | No | — |
| Estado | Planificada, Realizada, Cancelada | No | — |
| Fecha | Fecha del evento | No | — |
| Lugar | Ciudad y país | No | 150 |
| Contactos | Participantes | No | 300 |
| Notas | Resultados con formato | No | — |
| Próximo paso | Siguiente acción a tomar | No | 250 |

---

## Oportunidades

**¿Para qué sirve?** Pipeline comercial para rastrear oportunidades de venta desde el primer contacto hasta el cierre (o pérdida).

### Filtros
- Por **etapa**: Prospecto, Contactado, Propuesta, Negociación, Cerrado, Perdido.
- Por **marca**: Don Yeyo, DeViano.

### Indicador de probabilidad
Cada oportunidad muestra una barra de progreso visual con el porcentaje de probabilidad de cierre.

### Campos del formulario
| Campo | Descripción | Obligatorio |
|---|---|---|
| Nombre | Descripción de la oportunidad | Sí (máx. 200) |
| País | País destino | No |
| Contacto | Contacto asociado | No |
| Marca | Don Yeyo, DeViano, Ambas | No |
| Categoría | Tapas, Pastas, Panificados, Tortillas, Mix | No |
| Monto (USD) | Valor estimado | No (mín. 0) |
| Probabilidad | 0 a 100% | No |
| Etapa | Fase del pipeline | No |
| Cierre estimado | Fecha estimada de cierre | No |
| Notas | Detalles con formato | No |

---

## Muestras y comunicaciones

**¿Para qué sirve?** Doble funcionalidad en una misma pantalla con pestañas.

### Pestaña: Muestras enviadas
Registro de muestras de producto enviadas a potenciales clientes.

- **Selección múltiple de productos**: cada muestra puede contener uno o varios productos.
- **Autocompletado inteligente de Finnegans**: al escribir 3 o más caracteres en el buscador de productos, se filtran en tiempo real los productos del catálogo de Finnegans ERP (filtrados por "Productos Terminados"). Busca por código o nombre del producto (coincidencia parcial).
- **Productos personalizados**: además del catálogo de Finnegans, podés ingresar cualquier producto o descripción libremente.
- **Caché diaria**: el catálogo de productos de Finnegans se sincroniza automáticamente una vez al día para garantizar máxima velocidad y disponibilidad offline.
- **Filtrar por resultado**: Pendiente, Positivo (→ pedido), En evaluación, Negativo.
- Cada muestra muestra los productos incluidos, destinatario, país, fecha y costo.

### Pestaña: Log de comunicaciones
Historial cronológico de todas las interacciones con contactos.

- **Filtrar por tipo**: Email, Llamada, WhatsApp, Reunión, Videollamada.
- Se muestra en formato de **timeline** con íconos por tipo.
- Cada comunicación tiene un campo de "Próximo paso" para no perder seguimiento.

---

## Países destino

**¿Para qué sirve?** Base de datos de los mercados a los que exportás o querés exportar, con información regulatoria y arancelaria.

### Información por país
- **Arancel principal**: porcentaje de arancel de importación.
- **Incoterm habitual**: condición de entrega acordada (ej: CIF Santos).
- **Posición arancelaria**: código NCM del producto.
- **Moneda y tipo de cambio**: moneda local y su conversión a USD.
- **Organismo sanitario**: ente regulador (ANVISA, FDA, SENASICA, etc.).
- **Requisitos sanitarios**: detalle de habilitaciones requeridas.
- **Requisitos de etiquetado**: normativa de rotulado.

---

## Documentos

**¿Para qué sirve?** Gestión documental de la operación de comercio exterior con alertas de vencimiento.

### Tipos de documentos soportados
- Invoice
- Bill of Lading
- Packing List
- Certificado fitosanitario
- Certificado de origen
- Contrato
- Otro

### Filtros
- Por **tipo** de documento.
- Por **estado**: Vigente, Vencido, Por vencer.

### Alertas automáticas
Los documentos con vencimiento cercano (30 días) aparecen automáticamente en la sección de Alertas del Dashboard.

---

## Inteligencia comercial

**¿Para qué sirve?** Centro de información competitiva y de mercado con dos sub-secciones.

### Precios de competidores
- Registrá precios de productos competidores observados en ferias, góndolas o investigación online.
- Incluye cálculo automático de **precio por kg** si completás el precio y el peso.
- Campos: competidor, producto, país, categoría, precio, unidad, peso, fuente, fecha.

### Tendencias de mercado
- Notas de inteligencia sobre tendencias de consumo, regulaciones, competencia, logística, oportunidades y riesgos.
- Cada nota puede tener **etiquetas** (tags separadas por coma) para categorizar.
- Campos: título, país, categoría, descripción (con formato), fuente, etiquetas.

---

## Calculadora de exportación

**¿Para qué sirve?** Herramienta para estimar el costo landed (puesto en destino) de una exportación.

### Cómo funciona
1. Completá el producto y precio FOB por unidad.
2. Ingresá cantidad de unidades.
3. Sumá flete internacional y seguro.
4. Indicá el arancel del país destino (%) y otros gastos.
5. Seleccioná el país destino.
6. Hacé click en **Calcular y guardar**.

### Fórmula
```
Total FOB = Precio FOB × Cantidad
CIF = Total FOB + Flete + Seguro
Arancel USD = CIF × (Arancel% / 100)
Costo Landed = CIF + Arancel USD + Otros gastos
```

### Historial
Los cálculos guardados aparecen en el panel derecho para referencia futura.

---

## Cobranzas

**¿Para qué sirve?** Seguimiento de cobros de operaciones de exportación, con métricas de cobranza y desglose por estado.

### Métricas
- **Cobrado (año)**: total cobrado efectivamente.
- **Pendiente**: monto que falta cobrar.
- **Vencido**: monto cuyo plazo de cobro ya expiró.

### Filtros
- **Búsqueda**: por descripción o nombre de cliente.
- **Estado**: Pendiente, Cobrado parcial, Cobrado, Vencido.
- **País**: filtro dinámico basado en los países de las operaciones.

### Campos del formulario
| Campo | Descripción | Obligatorio |
|---|---|---|
| Operación | Descripción de la operación | Sí (máx. 250) |
| Cliente | Contacto asociado | No |
| País | País destino | No |
| Monto total | Valor en USD (mín. 0) | No |
| Monto cobrado | Cuánto se cobró hasta ahora | No |
| Unidades | Cantidad exportada | No |
| Marca | Don Yeyo, DeViano, Ambas | No |
| Embarque | Fecha de embarque | No |
| Vencimiento | Fecha límite de cobro | No |
| Estado | Pendiente, Cobrado parcial, Cobrado, Vencido | No |
| Condición | Tipo de instrumento de pago | No |
| Notas | Detalle con formato | No |

---

## Consejos de uso

1. **Registrá todo desde el primer contacto**: cada visita, comunicación y muestra enviada genera un historial invaluable.
2. **Usá las prioridades de tareas**: el sistema ordena por prioridad, así las tareas urgentes siempre están arriba.
3. **Mantené los documentos actualizados**: el sistema te avisa automáticamente cuando un certificado está por vencer.
4. **Registrá precios de competidores en cada feria**: la sección de Inteligencia te ayuda a construir una base comparativa de precios.
5. **Usá el campo "Próximo paso"**: en visitas y comunicaciones, dejá registrado qué hay que hacer después para no perder seguimiento.
6. **Aprovechá el pre-llenado**: el sistema recuerda el último país y marca que usaste para acelerar la carga.
7. **Revisá el Dashboard periódicamente**: es el termómetro de tu operación.

---

*Manual generado para TradeCRM v1.0.0 — Don Yeyo S.A.*
