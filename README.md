# ComEx CRM — Comercio Exterior Don Yeyo S.A.

ComEx CRM es una herramienta de gestión de relaciones con clientes (CRM) y control de operaciones de Comercio Exterior diseñada específicamente para Don Yeyo S.A.

Este proyecto cuenta con una arquitectura robusta y estética premium (soporte nativo para Modo Oscuro/Claro, Autenticación corporativa con Microsoft Azure AD, Agenda / Calendario Centralizado y control de Operaciones de Exportación).

---

## 🛠️ Estructura del Proyecto (Monorepo)

```
dy_comex/
├── client/                 # Frontend React + Vite + CSS Vanilla
│   ├── src/
│   │   ├── main.jsx        # Punto de entrada de React
│   │   ├── App.jsx         # Vistas interactivas del CRM
│   │   ├── App.css         # Estética Premium (Modo Oscuro/Claro, Agenda & Operaciones)
│   │   └── authConfig.js   # Configuración de MSAL Azure AD
│   └── package.json
├── server/                 # Backend Node.js + Express
│   ├── config/db.js        # Conexión a MySQL
│   ├── middleware/auth.js  # Autenticación Microsoft AD Token Validator
│   ├── controllers/        # Controladores de la API (con sincronización automática de tareas)
│   ├── routes/             # Enrutador de llamadas de API
│   ├── services/
│   │   └── finnegansService.js # Integración con Finnegans ERP
│   └── package.json
├── schema.sql              # Estructura del modelo de datos de MySQL
├── Dockerfile              # Dockerfile multi-stage
├── docker-compose.yml      # Configuración de servicios Docker local
├── netlify.toml            # Configuración para despliegue Serverless en Netlify
└── package.json            # Scripts del Monorepo
```

---

## 📋 Módulos del CRM

| Módulo | Descripción |
|---|---|
| **Dashboard** | Métricas clave, Funnel Comercial / Ventas por etapa de clientes, tareas urgentes y valor total de operaciones. |
| **Agenda / Calendario** | **[NUEVO]** Vista centralizada mensual (grid) y lista cronológica (timeline) que consolida tareas, visitas, próximas acciones, envíos de muestras y entregas de operaciones. |
| **Tareas** | Gestión de tareas con asignación de hora específica (`HH:mm`), prioridad, fecha límite y ordenamiento por fecha/hora/prioridad. |
| **Contactos** | Base de clientes con estados (*Activo*, *En proceso*, *Prospecto*, *Inactivo*, *Descartado*), Etapa Comercial (*Primer contacto*, *Reunión exploratoria*, *Cotización*, *Negociación*, *Habilitación regulatoria*) y creación automática de tareas a partir de *Próxima Acción*. |
| **Visitas / Reuniones** | Registro de ferias y viajes multidía con fecha fin y hora, reuniones individuales agrupadas, selección de cliente registrado, seguimiento de *Contactos calificados* y adjuntos Excel. |
| **Oportunidades** | Registro con marca personalizada (*Otro*), categoría libre (*Nuevo desarrollo*), *Inversión necesaria*, asignación de *Responsable* y etapas (*En análisis*, *En proceso*, *Finalizado*, *Descartado*). |
| **Operaciones** | **[NUEVO - Reemplaza Documentos]** Seguimiento de pedidos de exportación (Nº de pedido, cliente CRM, país destino, estado, fecha de entrega programada, unidades, valor USD, kg, Incoterm y documentos adjuntos). |
| **Muestras & Com.** | Registro de muestras con autocompletado del catálogo Finnegans ERP, selección de cliente registrado y sincronización automática de la fecha de envío a la Agenda. |
| **Países Destino** | Ficha por país destino (*Certificados / documentación obligatoria*, fotos/ejemplos de etiquetado, arancel, moneda). |
| **Inteligencia comercial** | Precios de competidores con visualización corregida de columnas (*Fotos*, *Fuente*, *Fecha*) y filtros cruzados por País y Marca. Notas de tendencias. |
| **Cobranzas** | Control de cobranzas con diferenciación entre *Medio de pago* y *Condición de pago* (*Anticipado*, *50% contra BL*, *15/30/60 días*). |
| **Calculadora Landed** | Cálculo de costo puesto en destino (CIF + Aranceles + Impuestos). |

---

## 🚀 Instalación y Ejecución Local

### Paso 1: Configurar Variables de Entorno
Copia los templates e introduce las variables correspondientes:
```bash
# Servidor
cd server && cp .env.template .env

# Cliente
cd client && cp .env.template .env
```

### Paso 2: Base de Datos MySQL
Importa la estructura actualizada del esquema:
```bash
mysql -u root -p dy_comex < schema.sql
```

### Paso 3: Iniciar Servidor y Cliente
```bash
# Backend (Puerto 5000)
cd server && npm install && npm run dev

# Frontend (Puerto 3000)
cd client && npm install && npm run dev
```
