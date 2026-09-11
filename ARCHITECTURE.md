# 🏛️ Arquitectura del Sistema — NexusOdonto

> **Versión del Documento:** 6.0.0 (Definitiva y Actualizada)  
> **Estado:** Documentación Oficial de Referencia, Mapeo Estructural del Frontend y Guía de Sustentación Técnica  
> **Ecosistema Tecnológico:** React 19, TypeScript 5 (Strict Mode), Vite 8, Tailwind CSS v4, React Router 7, Axios, Lucide React, Google Fonts (`Playfair Display`, `Plus Jakarta Sans`)  
> **Backend & Persistencia:** ASP.NET Core 10 (.NET), Clean Architecture, Entity Framework Core, Oracle Database 21c (`XEPDB1`), SignalR Hubs  
> **Microservicio de IA & Chatbot:** Python, FastAPI, LangGraph, OpenAI (GPT-4o), Qdrant Vector DB, WebSockets / REST  
> **Última Actualización:** Septiembre 2026  

---

## 1. 🏗️ Visión General y Topología del Sistema

NexusOdonto es una plataforma clínica-odontológica de grado empresarial diseñada con una arquitectura desacoplada de tres capas: una **Single Page Application (SPA)** reactiva en el Frontend, una **API RESTful & Real-time Hub** de Alta Concurrencia en .NET 10 y un **Motor Asistente de IA (RAG)** en FastAPI, todos respaldados por una base de datos relacional corporativa en **Oracle Database 21c XE**.

```
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                             NEXUSODONTO FRONTEND (React 19 + Vite 8)                             │
│  • SPA basada en componentes funcionales con TypeScript Estricto.                                │
│  • Acabado UI Glassmorphism: Navbar y Sidebar translúcidos con backdrop-blur sobre wallpapers.   │
│  • Estado Global: AuthContext (Sesión, RBAC y JWT), ThemeContext, NotificationContext (SignalR). │
│  • Interceptores Axios: Inyección automática de Bearer Token y refresh silencioso.              │
│  • Capa de Enriquecimiento: Resolución en memoria de UUIDs a Nombres Reales Clínicos.           │
│  • Seguridad en Enrutamiento: ProtectedRoute (RBAC por Roles) + PublicOnlyRoute.                 │
│  • Blindaje de Navegación: Control del historial popstate con { replace: true }.                 │
│  • Animaciones y Microinteracciones: DentistryReloadIcon y CSS keyframe animations adaptativas.  │
│  • Páginas de Error Editoriales: ErrorAccessPage (401/403) y NotFoundPage (404).                │
│  • Módulo Asesor / Chatbot: AtencionAsesorView con gestión de tickets y mensajería en vivo.      │
│  • Asistente Flotante: ChatBotWidget inyectado en Layout con fallback contextual resiliente.     │
└────────────────────────────────┬─────────────────────────────────┬───────────────────────────────┘
                                 │ HTTP / REST JSON (Bearer JWT)   │ HTTP POST /chat (JSON)
                                 ▼                                 ▼
┌────────────────────────────────────────────────┐ ┌──────────────────────────────────────────────┐
│        BACKEND API PRINCIPAL (.NET 10)         │ │         MICROSERVICIO CHATBOT IA             │
│  • Arquitectura Limpia (Domain, App, Infra).   │ │  • FastAPI, LangGraph, Qdrant Vector DB.     │
│  • Autenticación JWT + Google OAuth2.          │ │  • RAG Clínico y Consulta de Disponibilidad. │
│  • EF Core con Proveedor Oracle Oficial.       │ │  • Gestión de Tickets y Escalamiento Humano. │
│  • Puerto: 5170                                │ │  • Puerto: 8000                              │
└───────────────────────┬────────────────────────┘ └──────────────────────────────────────────────┘
                        │ Conexión TCP/IP (Oracle Net Services)
                        ▼
┌──────────────────────────────────────────────────────────────────────────────────────────────────┐
│                              BASE DE DATOS ORACLE 21c (`XEPDB1`)                                 │
│  • Esquema Relacional Normalizado con Claves Primarias RAW(16) / GUIDs.                          │
│  • Tablas Principales: USERS, PERSONS, PATIENTS, PROFESSIONALS, APPOINTMENTS, SERVICES.         │
│  • Seguridad: USER_ROLES, ROLE_PERMISSIONS, ACTION_PERMISSIONS, USER_EXTERNAL_LOGINS.            │
└──────────────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 📂 Inventario y Mapeo Estructural de Archivos (`src/`)

El frontend está organizado bajo el patrón **Feature-First / Domain-Driven Design (DDD)**, agrupando lógica, interfaces y componentes por dominio de negocio:

```
NexusOdontoFrontend/
├── ARCHITECTURE.md                  # Este documento maestro de arquitectura y sustentación
├── index.html                       # Documento raíz con inyección de fuentes Playfair Display y favicon SVG
├── package.json                     # Declaración de dependencias (React 19, Tailwind v4, Sharp, Lucide)
├── tsconfig.json                    # Reglas estrictas de compilación TypeScript (Strict Mode)
├── vite.config.ts                   # Configuración del bundler Vite y plugins de React
├── public/                          # Recursos Estáticos Servidos Directamente
│   ├── favicon.svg                  # Favicon vectorial cuadrado (1:1) de alta fidelidad
│   ├── favicon.webp                 # Isotipo cuadrado 1:1 transparente
│   ├── icons.svg                    # Sprites SVG de redes y utilidades
│   └── robots.txt                   # Instrucciones de indexación para motores de búsqueda
│
└── src/
    ├── api/                         # 🌐 Capa de Abstracción de Red (Service Layer)
    │   ├── axiosClient.ts           # Instancia central de Axios con interceptores JWT
    │   ├── authService.ts           # Endpoints de Login, Register, Google OAuth y Perfil
    │   ├── appointmentService.ts    # CRUD completo de citas médicas (/v1/Appointments)
    │   ├── patientService.ts        # Gestión de fichas de pacientes (/v1/Patients)
    │   ├── personService.ts         # Datos de identidad civil (/v1/Persons)
    │   ├── professionalService.ts   # Directorio de odontólogos y licencias (/v1/Professionals)
    │   ├── employeeService.ts      # Gestión de empleados clínicos y administrativos
    │   ├── specialtyService.ts      # Catálogo de especialidades odontológicas
    │   ├── sexService.ts            # Catálogo de sexos biológicos para historia clínica
    │   ├── serviceCatalogService.ts # Catálogo y precios de procedimientos (/v1/Services)
    │   ├── roleService.ts           # Catálogo de roles (/v1/Roles)
    │   ├── documentTypeService.ts   # Catálogo de tipos de documento (CC, TI, CE, Pasaporte)
    │   ├── userService.ts           # Gestión de usuarios y estados (/v1/Users)
    │   ├── signalrService.ts        # Conexión WebSocket en tiempo real para eventos de clínica
    │   └── chatbotService.ts        # Comunicación con el microservicio RAG y gestión de tickets
    │
    ├── assets/                      # 🖼️ Recursos Multimedia Optimizados
    │   ├── nexus-odonto-logo.webp   # Isotipo oficial transparente de la clínica
    │   ├── fondoLogin.webp          # Fondo visual modo oscuro para autenticación
    │   ├── fondo-Login-ligh.webp    # Fondo visual modo claro para autenticación
    │   ├── fondo-darck.webp         # Fondo para el Dashboard en modo oscuro (wallpaper fluido)
    │   ├── fondo-ligh.webp          # Fondo para el Dashboard en modo claro (wallpaper fluido)
    │   ├── landingfondo-black.webp  # Fondo landing page oscuro
    │   ├── landingfondo-white.webp  # Fondo landing page claro
    │   ├── error_403_darck.webp     # Fondo modo oscuro para vistas 401 y 403
    │   ├── error_403_light.webp     # Fondo modo claro para vistas 401 y 403
    │   ├── error_404_darck.webp     # Fondo modo oscuro para vista 404
    │   ├── error_404_light.webp     # Fondo modo claro para vista 404
    │   └── icons/
    │       └── dentistry.gif        # Animación dental con canal alfa transparente y relleno blanco puro
    │
    ├── components/                  # 🧩 Componentes Reutilizables Transversales
    │   ├── common/                  # Componentes atómicos de UI
    │   │   ├── BrandLogo.tsx        # Isotipo + tipografía adaptativa Light/Dark en tiempo real
    │   │   ├── DentistryReloadIcon.tsx # Icono animado transparente para botones de recarga y loading
    │   │   ├── UserAvatar.tsx       # Avatar resiliente con soporte Base64 e iniciales dinámicas
    │   │   ├── ThemeToggle.tsx      # Selector de tema Dark / Light
    │   │   ├── SelectOrWriteInput.tsx # Selector dual inteligente (filtrado dinámico o texto libre)
    │   │   └── ErrorBoundary.tsx    # Capturador de excepciones React en tiempo de renderizado
    │   ├── layout/                  # Componentes estructurales del cascarón
    │   │   ├── PageHeader.tsx       # Navbar Glassmorphism con notificaciones, tema y usuario
    │   │   ├── Sidebar.tsx          # Sidebar Glassmorphism colapsable en Desktop y Drawer z-50 en Móvil
    │   │   └── UserProfileDropdown.tsx # Dropdown de perfil de usuario con logout seguro
    │   └── chatbot/                 # Módulo de Inteligencia Artificial
    │       └── ChatBotWidget.tsx    # Botón flotante FAB y ventana de chat con asistente RAG
    │
    ├── context/                     # 🌐 Proveedores de Estado Global (Context API)
    │   ├── AuthContext.tsx          # Gestión de sesión, tokens JWT, roles y auto-sincronización
    │   ├── ThemeContext.tsx         # Gestión del tema visual persistido en localStorage
    │   └── NotificationContext.tsx  # Sistema global de notificaciones toast y recordatorios en tiempo real
    │
    ├── features/                    # 💼 Módulos de Negocio (Dominios Funcionales)
    │   ├── landing/                 # Pantalla de Bienvenida Pública
    │   │   └── LandingPage.tsx      # Portada animada con accesos directos y presentación clínica
    │   ├── auth/                    # Autenticación, Onboarding y Errores de Acceso
    │   │   ├── LoginPage.tsx        # Formulario de inicio de sesión tradicional y Google OAuth
    │   │   ├── RegisterPage.tsx     # Registro de nuevos pacientes (tradicional y onboarding)
    │   │   ├── ChangePasswordPage.tsx # Restablecimiento seguro de contraseña
    │   │   ├── AuthCallback.tsx     # Receptor y sanitizador de tokens de Google OAuth
    │   │   ├── ErrorAccessPage.tsx  # Pantalla editorial inmersiva para errores 401 y 403
    │   │   └── components/          # GoogleAuthButton, inputs y botones estilizados
    │   ├── dashboard/               # Métricas e Información en Tiempo Real
    │   │   └── DashboardPage.tsx    # KPIs operativos, citas enriquecidas y accesos rápidos por rol
    │   ├── pacientes/               # Directorio y Ficha Clínica de Pacientes
    │   │   ├── PacientesView.tsx    # Listado unificado (Oracle Persons + Patients + Local Cache)
    │   │   ├── components/PacienteForm.tsx # Modal de registro de pacientes en base de datos
    │   │   └── PacienteRegistroView.tsx # Formulario extendido de historia clínica y antecedentes
    │   ├── citas/                   # Agenda y Ciclo de Vida de Citas
    │   │   ├── CitasView.tsx        # Gestión de citas, enriquecimiento de IDs, modal y contadores
    │   │   ├── components/CitasTable.tsx # Tabla interactiva con badges de estado y acciones
    │   │   └── types.ts             # Definición de interfaces TypeScript (Cita, EstadoCita)
    │   ├── agenda/                  # Vista de Calendario Clínico
    │   │   ├── AgendaView.tsx       # Matriz horaria con nombres reales de pacientes y doctores
    │   │   └── AgendaData.tsx       # Estructuras de datos de turnos y bloques horarios
    │   ├── chat-asesor/             # Centro de Atención y Escalamiento con Asesor
    │   │   └── AtencionAsesorView.tsx # Gestión de conversaciones WhatsApp/Web, tickets y respuestas
    │   ├── servicios/               # Catálogo de Procedimientos Odontológicos
    │   │   ├── ServiciosView.tsx    # Tarifas, tiempos y traductor de categorías/descripciones
    │   │   └── ServicioRegistroView.tsx # Formulario de creación de nuevos servicios
    │   ├── profesionales/           # Gestión de Personal Médico
    │   │   └── ProfesionalesView.tsx# Odontólogos, números de licencia y especialidades
    │   ├── usuarios/                # Seguridad y Cuentas de Acceso
    │   │   ├── UsuariosView.tsx     # Lista de usuarios, toggle de activación y roles en español
    │   │   └── components/UsuariosTable.tsx # Tabla interactiva con prevención de auto-desactivación
    │   ├── roles/                   # Control de Acceso Basado en Roles (RBAC)
    │   │   └── RolesPermisosView.tsx# Matriz interactiva de permisos y traducciones al español
    │   ├── historia-clinica/        # Expediente Clínico Digital
    │   │   └── HistoriaClinicaView.tsx # Evolución clínica con enriquecimiento de citas y diagnósticos
    │   ├── odontograma/             # Odontograma Gráfico Interactivo
    │   │   ├── OdontogramaUI.tsx    # Interfaz completa del odontograma anatómico
    │   │   └── components/          # Superficies dentales, cuadrículas y convenciones
    │   ├── configuracion/           # Parámetros del Sistema
    │   │   └── ConfiguracionView.tsx# Configuración general y ajustes de la clínica
    │   └── perfil/                  # Configuración de Cuenta de Usuario
    │       └── PerfilView.tsx       # Actualización de datos personales y valores por defecto para admin
    │
    ├── pages/                       # 📄 Páginas de Nivel Superior
    │   └── NotFoundPage.tsx         # Pantalla editorial inmersiva para error 404 (Not Found)
    │
    ├── layouts/                     # 📐 Plantillas de Envoltura (Layout Templates)
    │   └── DashboardLayout.tsx      # Cascarón privado con wallpaper fluido, Sidebar y PageHeader
    │
    ├── routes/                      # 🚦 Enrutamiento y Guardias de Seguridad
    │   ├── index.tsx                # Rutas declarativas con React.lazy y LoadingFallback dental
    │   ├── ProtectedRoute.tsx       # Guardia RBAC: bloqueo por roles y validación de sesión
    │   └── PublicOnlyRoute.tsx      # Guardia de no-autenticados: redirige a /dashboard si hay sesión
    │
    ├── utils/                       # 🛠️ Utilidades y Helpers
    │   ├── routePermissions.ts      # Matriz RBAC de permisos por ruta y extractor de roles
    │   ├── roleUtils.ts             # Normalizador de nombres de rol y comparador seguro areGuidsEqual
    │   └── currency.ts              # Formateador de moneda colombiana (COP)
    │
    ├── index.css                    # Directivas de Tailwind CSS v4, animaciones de iconos y tipografías
    └── main.tsx                     # Punto de entrada de inicialización de la SPA en el DOM
```

---

## 3. 🎨 Sistema Visual y Experiencia de Usuario (UI / UX)

### 3.1 Efecto Glassmorphism y Fluidez de Fondos
El sistema utiliza un diseño translúcido de alta estética clínica:
* **Contenedor Raíz (`DashboardLayout.tsx`):** El wallpaper temático (`fondo-darck.webp` / `fondo-ligh.webp`) se renderiza con `bg-cover bg-center bg-fixed`, proyectando su arte de manera continua por debajo del Navbar y del Sidebar.
* **Navbar (`PageHeader.tsx`):** `sticky top-0 z-20 bg-white/40 border-slate-200/50 backdrop-blur-md dark:bg-[#06141d]/50 dark:border-teal-500/10 dark:backdrop-blur-md`.
* **Sidebar (`Sidebar.tsx`):** `bg-white/40 border-slate-200/50 backdrop-blur-md dark:bg-[#06141d]/50 dark:border-teal-500/10 dark:backdrop-blur-md`.

### 3.2 Jerarquía Estricta de Capas (`z-index`) para Móvil y Desktop
Para garantizar que los menús desplegables y modales operen con nitidez absoluta y sin solapamientos:

| Capa | Componente | Clase Tailwind | Comportamiento |
| :--- | :--- | :--- | :--- |
| **0 / 10** | Wallpaper y Contenido Principal | `z-0` / `z-10` | Flujo de tarjetas, tablas y formularios. |
| **20** | Barra Superior (Navbar) | `z-20` | Sticky top con accesos a perfil y notificaciones. |
| **30** | Sidebar en Desktop | `lg:z-30` | Barra lateral estática o sticky en pantallas grandes. |
| **40** | Backdrop Móvil (Overlay) | `z-40` | `fixed inset-0 bg-slate-950/60 backdrop-blur-md lg:hidden`. |
| **50** | Drawer Móvil (Sidebar Abierto) | `z-50` | `fixed inset-y-0 left-0 w-72` posicionado al frente del backdrop. |
| **50+** | Modales y Toasts | `z-50` / `z-60` | Modales de creación de citas, edición y mensajes flotantes. |

### 3.3 Iconografía Animada y Microinteracciones
* **`DentistryReloadIcon.tsx`:** Componente transversal que renderiza `dentistry.gif` (65 fotogramas procesados con Sharp para $100\%$ de transparencia exterior y relleno blanco puro interior). Utilizado en todos los botones de refresco (`onClick`) y estados de carga globales (`LoadingFallback` y `ProtectedRoute`).
* **Micro-interacciones en Botones e Iconos:** Animaciones CSS suaves (`animate-icon-bounce`, `animate-icon-pulse`, `animate-icon-wiggle`) al interactuar con las tarjetas del dashboard, menú de navegación y botones de acción.

---

## 4. 🧠 Pipeline de Enriquecimiento y Consistencia de Datos

### 4.1 Cruce de Identificadores (UUIDs) a Datos Clínicos Reales
El backend entrega entidades desacopladas (ej. `GET /api/v1/Appointments` retorna únicamente `patientId`, `professionalId`, `serviceId`). Para evitar textos ficticios o genéricos (*"Paciente Registrado"*, *"Dr. Especialista"*):

```mermaid
flowchart LR
    subgraph Backend_APIs [Endpoints RESTful .NET / Oracle]
        A[GET /v1/Appointments<br>patientId, profId, serviceId]
        B[GET /v1/Patients + /v1/Persons<br>id, personId, firstName, lastName]
        C[GET /v1/Professionals<br>id, firstName, lastName, specialty]
        D[GET /v1/Services<br>id, name, basePrice, duration]
    end

    subgraph Frontend_Enrichment [Capa de Enriquecimiento en Memoria]
        E[Diccionarios Hash en Memoria<br>patientMap, doctorMap, serviceMap]
        F[Comparación Inmune a Mayúsculas<br>areGuidsEqual]
    end

    subgraph Views [Vistas Operativas]
        G[Dashboard: KPIs y Citas del Día]
        H[Agenda: Calendario con Nombres Reales]
        I[Citas: Tabla con Filtros y Contadores]
        J[Historia Clínica: Próxima Cita Enriquecida]
    end

    A --> E
    B --> E
    C --> E
    D --> E
    E --> F
    F --> G
    F --> H
    F --> I
    F --> J
```

### 4.2 Modal "Nueva Cita Directa" y Control de Estado Temporal
* **Vinculación React Controlada:** Sincronización estricta de `formHora` y `formFecha` evitando desfases con el DOM.
* **Normalización de Horas:** Soporte integral para entradas `12h` (AM/PM) transformadas a formato estándar `24h` (`HH:mm`).
* **Validación Temporal Estricta:** Bloqueo reactivo e informativo en caso de intentar agendar citas en fechas u horas pasadas.

### 4.3 Gestión de Usuarios y Prevención de Auto-Bloqueo
* **Toggle de Estado:** `userService.update(id, { isActive: boolean })` actualiza el estado operativo.
* **Auto-Lockout Guard:** Comprueba mediante `areGuidsEqual` y comparación de correos que el usuario en sesión no pueda auto-desactivarse.

---

## 5. 🌐 Estandarización de Idioma (I18n / Localización al Español)

Para mantener uniformidad cuando el backend entrega catálogos con cadenas en inglés:
* **Servicios (`ServiciosView.tsx`):** Transformadores `translateCategory` y `translateDescription` traducen términos como *"prophylaxis"*, *"whitening"*, *"assessment"* a español profesional.
* **Roles (`RolesPermisosView.tsx` y `UsuariosTable.tsx`):** Mapeo de roles (*Administrator $\rightarrow$ Administrador del Sistema*, *Doctor $\rightarrow$ Odontólogo Especialista*, *Receptionist $\rightarrow$ Recepcionista / Admisiones*).

---

## 6. 🗄️ Diccionario de Integración: Frontend ↔ Endpoints ↔ Tablas de Oracle

| Componente / Vista (Frontend) | Acción del Usuario | Endpoint Consumido (Backend .NET / Python) | Tablas Consultadas / Afectadas en Oracle (`XEPDB1`) | Campos Clave y Relaciones |
| :--- | :--- | :--- | :--- | :--- |
| **`LoginPage.tsx`** | Login con credenciales | `POST /api/auth/login` | `USERS`<br>`PERSONS`<br>`USER_ROLES`<br>`ROLES` | `USERS.ID`, `USERS.PERSON_ID = PERSONS.ID`, `USERS.PASSWORD_HASH`, `USER_ROLES.ROLE_ID = ROLES.ID` |
| **`RegisterPage.tsx`** | Registro tradicional | `POST /api/auth/register` | `PERSONS`<br>`USERS`<br>`USER_ROLES` | `PERSONS.DOCUMENT_NUMBER`, `PERSONS.EMAIL`, `USERS.PERSON_ID`, `USER_ROLES.ROLE_ID` (`PACIENTE`) |
| **`AuthCallback.tsx`** | Autenticación Google OAuth | `POST /api/auth/google-callback` | `USERS`<br>`USER_EXTERNAL_LOGINS` | `EXTERNAL_PROVIDER = 'Google'`, `PROVIDER_KEY = Google Subject ID` |
| **`PacientesView.tsx`** | Listar directorio clínico | `GET /api/v1/Persons`<br>`GET /api/v1/Patients` | `PERSONS`<br>`PATIENTS`<br>`DOCUMENT_TYPES`<br>`SEXES` | `PATIENTS.PERSON_ID = PERSONS.ID`, `PERSONS.DOCUMENT_TYPE_ID = DOCUMENT_TYPES.ID`, `PERSONS.FIRST_NAME`, `PERSONS.PHONE` |
| **`CitasView.tsx`** | Listar citas médicas | `GET /api/v1/Appointments` | `APPOINTMENTS`<br>`PATIENTS`<br>`PERSONS`<br>`PROFESSIONALS`<br>`SERVICES`<br>`APPOINTMENT_STATUSES` | `APPOINTMENTS.PATIENT_ID = PATIENTS.ID`, `PATIENTS.PERSON_ID = PERSONS.ID`, `APPOINTMENTS.PROFESSIONAL_ID = PROFESSIONALS.ID`, `APPOINTMENTS.SERVICE_ID = SERVICES.ID` |
| **`CitasView.tsx`** | Agendar nueva cita | `POST /api/v1/Appointments` | `APPOINTMENTS` | `ID` (GUID), `PATIENT_ID`, `PROFESSIONAL_ID`, `SERVICE_ID`, `APPOINTMENT_STATUS_ID`, `STARTS_AT`, `ENDS_AT`, `REASON_FOR_VISIT` |
| **`CitasView.tsx`** | Modificar / Eliminar cita | `PUT /api/v1/Appointments/{id}`<br>`DELETE /api/v1/Appointments/{id}` | `APPOINTMENTS` | Actualización de horarios y estados o eliminación de registros |
| **`UsuariosView.tsx`** | Activar / Desactivar usuario | `PUT /api/v1/Users/{id}` | `USERS` | `USERS.IS_ACTIVE` (1 / 0) |
| **`AtencionAsesorView.tsx`** | Gestión de tickets y chat | `GET/POST /api/v1/Chatbot/tickets`<br>`POST /api/v1/Chatbot/messages` | Microservicio Python / Tablas de Tickets | Consulta y respuesta directa a mensajes de usuarios escalados desde WhatsApp |
| **`ChatBotWidget.tsx`** | Asistente RAG con IA | `POST http://localhost:8000/chat` | FastAPI ↔ .NET ↔ Oracle | Consulta semántica en Qdrant + disponibilidad en `APPOINTMENTS` |

---

## 7. 🚀 Comandos de Construcción y Verificación

```powershell
# 1. Comprobación estricta de tipos TypeScript (0 errores)
npx tsc --noEmit

# 2. Compilación de producción (Vite Bundler optimizado)
npm run build

# 3. Servidor de desarrollo local
npm run dev
```
