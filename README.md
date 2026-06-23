# TradeCRM — Comercio Exterior Don Yeyo S.A.

TradeCRM es una herramienta de gestión de relaciones con clientes (CRM) y control de operaciones de Comercio Exterior diseñada específicamente para Don Yeyo S.A.

Este proyecto hereda la arquitectura robusta y la estética premium (incluyendo soporte nativo para Modo Oscuro/Claro y Autenticación con Microsoft Azure AD) del sistema `dy_control_ingresos_egresos`.

---

## 🛠️ Estructura del Proyecto (Monorepo)

```
dy_comex/
├── client/                 # Frontend React + Vite + CSS Vanilla
│   ├── src/
│   │   ├── main.jsx        # Punto de entrada de React
│   │   ├── App.jsx         # Vistas interactivas de CRM
│   │   ├── App.css         # Estética Premium (Modo Oscuro/Claro)
│   │   └── authConfig.js   # Configuración de MSAL Azure AD
│   └── package.json
├── server/                 # Backend Node.js + Express
│   ├── config/db.js        # Conexión a MySQL
│   ├── middleware/auth.js  # Autenticación Microsoft AD Token Validator
│   ├── controllers/        # Controladores de la API
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

## 🔒 Configuración de Autenticación con Microsoft (Azure AD)

Para que el login corporativo funcione con cuentas `@donyeyo.com.ar`, se debe registrar la aplicación en el portal de Azure:

1. Ve a **Microsoft Entra ID (Azure Active Directory)** > **App registrations** > **New registration**.
2. Completa los detalles:
   - **Name**: `TradeCRM - Comercio Exterior`
   - **Supported account types**: `Accounts in this organizational directory only` (Single tenant) o `Multitenant`.
   - **Redirect URI**: Selecciona `Single-page application (SPA)` y coloca `http://localhost:3000` (desarrollo local) y la URL de tu Netlify en producción.
3. En la sección **Authentication**:
   - Asegúrate de habilitar **Access tokens** e **ID tokens** (Implicit grant flow si utilizas flujos simplificados, aunque MSAL Browser v3 prefiere Proof Key for Code Exchange (PKCE)).
4. En **API permissions**:
   - Otorga el permiso `User.Read` (Microsoft Graph) para poder leer los datos básicos del usuario logueado.
5. Copia el **Application (client) ID** y el **Directory (tenant) ID** e introdúcelos en tu archivo `.env`.

---

## 🚀 Instalación y Ejecución Local

### Prerrequisitos
- Node.js (v20 o superior)
- Docker Desktop (para la base de datos MySQL local)

### Paso 1: Configurar Variables de Entorno
Copia el archivo `.env.template` en `.env` en la raíz del proyecto y completa con tus datos:
```bash
cp .env.template .env
```

### Paso 2: Levantar Base de Datos MySQL
Si ya tienes la instancia Docker de MySQL configurada mediante el `docker-compose.yml` en la raíz de `Proyectos`, puedes importar el esquema ejecutando:
```bash
mysql -u root -p -h localhost < schema.sql
```

### Paso 3: Instalar dependencias e iniciar el Monorepo
Desde la raíz del proyecto, instala todas las dependencias e inicia el cliente y servidor concurrentemente:
```bash
npm run install-all
npm run dev
```

El frontend estará disponible en `http://localhost:3000` y el backend en `http://localhost:5000`.

---

## 🐳 Despliegue con Docker
Para construir y levantar toda la arquitectura de manera contenerizada:
```bash
docker-compose up --build
```
