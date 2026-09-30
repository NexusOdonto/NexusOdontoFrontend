# 📘 GUÍA MAESTRA DE CÓDIGO Y ARQUITECTURA — NexusOdonto Frontend
> **Fecha de Entrega:** 30 de Septiembre de 2026 · **Entorno:** Producción (`nexusodonto.chatcampuslands.com`)
> **Stack Tecnológico:** React 19.2.8 + TypeScript 6.0 + Vite 8.2 + Tailwind CSS v4.3 + .NET 9 (Clean Architecture) + Oracle 21c XE + FastAPI / LangGraph (IA)

Esta guía explica **todo el código del frontend** de forma integral y didáctica: cómo arranca la aplicación, arquitectura de comunicación, autenticación y presencia, gestión de horarios y citas afectadas, módulos clínicos y administrativos, persistencia multi-dispositivo de configuración, auditoría de producción (Lighthouse, WCAG AA, SEO), y el mapa de sustentación final.

---

## 📑 ÍNDICE GENERAL

1. [Cómo Arranca la App y Flujo de Providers](#1-cómo-arranca-la-app)
2. [Árbol de Carpetas Completo y Actualizado](#2-árbol-de-carpetas)
3. [Conexión con el Backend (Axios + SignalR + FastAPI)](#3-conexión-con-el-backend)
4. [Autenticación, Seguridad y Gestión de Sesión](#4-autenticación-y-sesión)
5. [Sistema de Rutas, Guards y Control de Acceso por Rol](#5-sistema-de-rutas-y-permisos)
6. [Sistema de Presencia Híbrido (Online / Offline)](#6-sistema-de-presencia-onlineoffline)
7. [Centro de Notificaciones Scoped y Campana en Tiempo Real](#7-centro-de-notificaciones-y-campana)
8. [Layout, Diseño Glassmorphism y Componentes UI](#8-layout-y-diseño)
9. [Catálogo Completo de Servicios API y DTOs](#9-servicios-api)
10. [Gestión de Horarios, Disponibilidades y Citas Afectadas](#10-gestión-de-horarios-y-disponibilidad)
11. [Módulos Clínicos (Odontograma, Historia Clínica, Agenda)](#11-módulos-clínicos)
12. [Módulos Administrativos (Pacientes, Profesionales, Servicios, Configuración, Usuarios)](#12-módulos-administrativos)
13. [Dashboard Clínico y Módulo "Equipo en Turno Hoy"](#13-dashboard-clínico-y-equipo-en-turno)
14. [Chatbot AI, WhatsApp y Atención de Asesores](#14-chatbot-y-whatsapp)
15. [Auditoría de Producción: Rendimiento, Accesibilidad y SEO](#15-auditoría-de-producción-y-optimización)
16. [Backend .NET 9 y Base de Datos Oracle 21c](#16-backend-y-base-de-datos)
17. [Mapa de Conexiones: Componente → Servicio → Endpoint → BD](#17-mapa-de-conexiones)
18. [Guía para la Sustentación Final del Proyecto](#18-guía-para-la-sustentación)

---

## 1. CÓMO ARRANCA LA APP

El ciclo de arranque sigue una cascada estricta de responsabilidades:
```
main.tsx  ──►  App.tsx  ──►  Árbol de Providers (6 capas)  ──►  AppRoutes (Lazy)
```

### 1.1 Punto de Entrada (`src/main.tsx`)
```tsx
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### 1.2 Jerarquía de Contextos (`src/App.tsx`)
```tsx
<ThemeProvider>          {/* 1. Tema Dark/Light: persiste en localStorage y manipula la clase html */}
  <BrowserRouter>        {/* 2. React Router: historial del navegador HTML5 */}
    <AuthProvider>       {/* 3. Sesión JWT, usuario actual, login/logout, auto-expiración */}
      <NotificationProvider> {/* 4. Centro de notificaciones con SignalR + aislamiento por usuario */}
        <ErrorBoundary>  {/* 5. Trampa de excepciones de renderizado React para evitar caídas */}
          <AppRoutes />  {/* 6. Enrutamiento con Suspense y code-splitting */}
        </ErrorBoundary>
      </NotificationProvider>
    </AuthProvider>
  </BrowserRouter>
</ThemeProvider>
```

> **Por qué este orden:**
> - `ThemeProvider` va en la raíz para evitar el molesto "flash" de tema no estilizado en la Landing o Login.
> - `AuthProvider` requiere estar dentro de `BrowserRouter` porque utiliza `useNavigate()` para redirigir tras autenticación o caducidad del token.
> - `NotificationProvider` requiere de `AuthProvider` para saber a qué usuario pertenecen las notificaciones y aislar su lectura (`user-scoped`).

---

## 2. ÁRBOL DE CARPETAS

```
src/
├── main.tsx                      # Punto de montaje React DOM
├── App.tsx                       # Orquestador de Providers globales
├── index.css                     # Tailwind CSS v4, fuentes Prata/Instrument, animaciones
│
├── api/                          # 📡 CAPA DE COMUNICACIÓN CON BACKENDS
│   ├── axiosClient.ts            # Cliente Axios con inyección automática de Bearer JWT
│   ├── authService.ts            # Login, registro, perfil /me, Google OAuth
│   ├── availabilityService.ts    # [NUEVO] Horarios semanales, impacto y reprogramaciones
│   ├── clinicSettingsService.ts  # [NUEVO] Configuración clínica persistente multi-dispositivo
│   ├── hubNotificationService.ts # [NUEVO] Notificaciones dirigidas desde el backend
│   ├── appointmentService.ts     # Citas médicas, estados, inasistencias y contexto clínico
│   ├── clinicalHistoryService.ts # Historias clínicas, evoluciones y diagnósticos CIE-10
│   ├── odontogramService.ts      # Odontograma FDI completo, superficies y hallazgos
│   ├── patientService.ts         # Pacientes (unificación de entidad paciente y persona)
│   ├── personService.ts          # Datos personales (documento, nombres, contacto)
│   ├── professionalService.ts    # Odontólogos y especialistas
│   ├── serviceCatalogService.ts  # Catálogo de servicios, tarifas y duración de sillón
│   ├── userService.ts            # Administración de cuentas y roles de usuario
│   ├── roleService.ts            # Roles y permisos del sistema
│   ├── chatbotService.ts         # Orquestador dual: .NET + FastAPI WhatsApp AI
│   └── signalrService.ts         # Cliente WebSocket SignalR para presencia y eventos
│
├── assets/                       # 🖼️ Recursos estáticos optimizados
│   ├── cuadro-landing-dark.webp  # Fondos WebP de alta compresión
│   ├── fondo-darck.webp / fondo-ligh.webp
│   └── icons/dentistry.gif       # Animación dental institucional para pantallas de carga
│
├── components/                   # 🧩 COMPONENTES REUTILIZABLES
│   ├── common/
│   │   ├── BrandLogo.tsx         # Logo interactivo con efectos de gradiente
│   │   ├── DentistryReloadIcon.tsx # Loader animado con temática odontológica
│   │   ├── ErrorBoundary.tsx     # Capturador de fallos de interfaz
│   │   ├── GlassDatePicker.tsx   # Selector de fecha glassmorphism
│   │   ├── GlassSelect.tsx       # Select estilizado de alto contraste
│   │   ├── GlassTimePicker.tsx   # Selector de horas y minutos am/pm
│   │   ├── RequiresRescheduleBadge.tsx # [NUEVO] Badge de alerta "Requiere reprogramación"
│   │   └── UserAvatar.tsx        # Avatar con iniciales, foto y halo de rol
│   ├── layout/
│   │   ├── Sidebar.tsx           # Menú lateral dinámico filtrado por permisos de rol
│   │   ├── PageHeader.tsx        # Cabecera con breadcrumbs, campana y perfil
│   │   └── UserProfileDropdown.tsx # Menú flotante de cuenta y cierre de sesión
│   └── ui/
│       ├── notification-bell.tsx # Campana animada con badge de conteo no leído
│       ├── folder-component.tsx  # Agrupador animado de expedientes y citas
│       └── animated-counter.tsx  # Métricas numéricas animadas del dashboard
│
├── context/                      # 🌐 ESTADOS GLOBALES DE LA APLICACIÓN
│   ├── ThemeContext.tsx          # Gestión Dark/Light con persistencia
│   └── NotificationContext.tsx   # Almacén de notificaciones aislado por usuario
│
├── features/                     # 🏗️ MÓDULOS DE NEGOCIO (Domain-Driven UI)
│   ├── agenda/                   # Agenda semanal interactiva con franjas horarias
│   │   ├── AgendaView.tsx        # Vista general tipo matriz horaria
│   │   └── AgendaData.tsx        # Normalización de citas por día y consultorio
│   ├── auth/                     # Autenticación, sesión y presencia
│   │   ├── AuthContext.tsx       # Almacén de sesión activa y permisos
│   │   ├── LoginPage.tsx         # Formulario de acceso con validación
│   │   ├── RegisterPage.tsx      # Registro de nuevos pacientes
│   │   ├── ChangePasswordPage.tsx# Cambio forzado de credenciales temporales
│   │   ├── presenceService.ts    # Motor de presencia (Local + SignalR)
│   │   ├── usePresenceSync.ts    # Sincronizador de presencia en background
│   │   └── usePresenceTick.ts    # Heartbeat cada 30 segundos
│   ├── chat-asesor/              # Bandeja de atención humana (WhatsApp)
│   │   └── AtencionAsesorView.tsx# Chat en vivo con resolución de contactos E.164/LID
│   ├── citas/                    # Listado, filtrado y creación de citas
│   │   ├── CitasView.tsx         # Contenedor principal de citas
│   │   └── components/CitasTable.tsx # Tabla responsiva con acciones y estados
│   ├── configuracion/            # [ACTUALIZADO] Configuración general de clínica
│   │   └── ConfiguracionView.tsx # Persistencia multi-dispositivo en backend
│   ├── dashboard/                # Panel de control por rol
│   │   ├── DashboardPage.tsx     # Métricas, accesos rápidos y turnos del día
│   │   └── equipoEnTurno.ts      # [NUEVO] Cálculo dinámico de doctores y consultorios hoy
│   ├── historia-clinica/         # Expediente clínico integral
│   │   ├── HistoriaClinicaView.tsx # Evoluciones, atenciones y diagnósticos CIE-10
│   │   └── components/           # Generadores de PDF de expediente y recetas
│   ├── landing/                  # Landing page pública institucional
│   │   └── LandingPage.tsx       # Optimizada para SEO con jerarquía H1 única
│   ├── odontograma/              # Odontograma interactivo FDI de 32 piezas
│   │   ├── OdontogramaUI.tsx     # Lienzo de mapeo patológico por superficies
│   │   └── components/           # Dientes SVG, convenciones y visor PDF
│   ├── pacientes/                # Directorio clínico de pacientes
│   ├── profesionales/            # Gestión de odontólogos y turnos semanales
│   ├── roles/                    # Matriz de permisos por rol
│   ├── servicios/                # Tarifario oficial y duración en sillón dental
│   └── usuarios/                 # Directorio de cuentas del sistema
│
├── layouts/
│   └── DashboardLayout.tsx       # Estructura visual protegida (Sidebar + Header + Body)
├── routes/
│   ├── index.tsx                 # Definición centralizada con React.lazy()
│   ├── ProtectedRoute.tsx        # Guard de autenticación y autorización por rol
│   └── PublicOnlyRoute.tsx       # Redirección de usuarios autenticados fuera del login
└── utils/                        # 🛠️ UTILIDADES TRANSVERSALES
    ├── appointmentStatusStyle.ts # [NUEVO] Paleta unificada de estados de cita
    ├── clinicSchedule.ts         # Reglas y franjas horarias de atención clínica
    ├── consultorioLabel.ts       # [NUEVO] Conversión de "Sillón" a "Consultorio"
    ├── doctorSchedules.ts        # [NUEVO] Gestión de turnos y descansos de doctores
    ├── routePermissions.ts       # Diccionario de acceso a rutas por rol
    ├── renderPdfBlob.ts          # Carga dinámica perezosa de @react-pdf/renderer
    └── useRequiresReschedule.ts  # [NUEVO] Hook de detección de citas desfasadas
```

---

## 3. CONEXIÓN CON EL BACKEND

La aplicación utiliza una **arquitectura híbrida** conectada a dos servidores especializados:
1. **API Principal .NET 9 (`VITE_API_URL`):** Orquesta la lógica transaccional, seguridad JWT, catálogos, historias clínicas, odontograma y persistencia en **Oracle Database 21c**.
2. **Microservicio Chatbot AI FastAPI (`VITE_CHATBOT_API_URL`):** Ejecuta el agente conversacional en Python con LangGraph, memoria semántica en Qdrant y pasarela WhatsApp.

```
                  ┌───────────────────────────────┐
                  │      NexusOdonto Frontend     │
                  │   (React 19 + TypeScript 6)   │
                  └──┬─────────────────────────┬──┘
                     │                         │
     Axios HTTP + SignalR WS             Axios REST
     (Bearer JWT en localStorage)       (Agent API / Direct)
                     │                         │
                     ▼                         ▼
         ┌───────────────────────┐ ┌───────────────────────┐
         │  Backend .NET 9 API   │ │   FastAPI Chatbot AI  │
         │  (Clean Architecture) │ │ (LangGraph + Qdrant)  │
         └───────────┬───────────┘ └───────────┬───────────┘
                     │                         │
                     ▼                         ▼
         ┌───────────────────────┐ ┌───────────────────────┐
         │   Oracle 21c XE DB    │ │  Evolution WhatsApp   │
         │  (Tablas Clínicas)    │ │      (Mensajería)     │
         └───────────────────────┘ └───────────────────────┘
```

### 3.1 Cliente Axios con Interceptores (`src/api/axiosClient.ts`)
- **Inyección de Token:** Antes de cada petición, el interceptor evalúa si la ruta es pública. Si no lo es, adjunta `Authorization: Bearer <token>` extraído de `localStorage['auth_token']`.
- **Detección de 401 Unauthorized:** Si una petición protegida responde con `401`, el cliente limpia las credenciales almacenadas y emite el evento global `window.dispatchEvent(new CustomEvent('auth:expired'))`. El `AuthContext` escucha este evento y cierra la sesión de forma limpia, mostrando el toast correspondiente.

### 3.2 WebSocket SignalR Persistente (`src/api/signalrService.ts`)
- **Hub:** `/hubs/notifications`
- **Estrategia de Conexión:** WebSockets nativos con fallback inteligente a Long Polling.
- **Reconexión Automática:** Delays exponenciales `[0ms, 2000ms, 5000ms, 10000ms, 30000ms]`.
- **Canal de Presencia:** Transmite y recibe eventos `UserOnline`, `UserOffline` y `PresenceSnapshot`.

---

## 4. AUTENTICACIÓN Y SESIÓN

### 4.1 Ciclo de Vida del Usuario en `AuthContext.tsx`
El contexto expone el estado y los métodos fundamentales para toda la aplicación:
```ts
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (identification: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateUser: (partialData: Partial<User>) => void;
  changePassword: (newPassword: string) => Promise<boolean>;
  loginWithGoogleCallback: (token: string) => Promise<boolean>;
}
```

### 4.2 Mecanismos de Seguridad Activa
1. **Time-out por Inactividad (20 minutos):** Los eventos de usuario (`mousemove`, `keydown`, `touchstart`, `scroll`) actualizan un timestamp en memoria. Si transcurren 20 minutos sin actividad, se fuerza el logout automático para proteger datos sensibles de salud oral.
2. **Verificación Periódica de Expiración JWT (15 segundos):** El hook decodifica el claim `exp` del JWT y desconecta al usuario proactivamente al expirar.
3. **Forzado de Primer Cambio de Clave:** Si `mustChangePassword === true`, cualquier intento de navegar al Dashboard redirige obligatoriamente a `/cambiar-password`.
4. **Protección de Cuentas de Servicio:** Las cuentas reservadas del sistema (como los bots de atención) no pueden iniciar sesión vía formulario web interactivo.

---

## 5. SISTEMA DE RUTAS Y PERMISOS

Todas las vistas de la aplicación están definidas con **carga diferida** (`React.lazy`) en `src/routes/index.tsx`, garantizando que un usuario no descargue código de módulos para los cuales no tiene privilegios.

### 5.1 Matriz de Control de Acceso por Rol
| Módulo / Ruta | Administrador | Odontólogo | Recepcionista | Paciente |
|---|:---:|:---:|:---:|:---:|
| `/dashboard` | ✅ Completo | ✅ Clínico | ✅ Operativo | ✅ Portal Paciente |
| `/citas` | ✅ Total | ✅ Sus Citas | ✅ Agendamiento | ✅ Ver Propias |
| `/agenda` | ✅ Vista Global | ✅ Sus Turnos | ✅ Vista General | ❌ Bloqueado |
| `/atencion-chat` | ✅ Supervisión | ❌ Bloqueado | ✅ Atención Directa | ❌ Bloqueado |
| `/pacientes` | ✅ Gestión Total | ✅ Vista Clínica | ✅ Admisión | ❌ Bloqueado |
| `/historia-clinica` | ✅ Auditoría | ✅ Evoluciones/CIE-10 | ❌ Bloqueado | ✅ Vista Propia |
| `/odontograma` | ✅ Auditoría | ✅ Mapeo y Diagnóstico | ❌ Bloqueado | ✅ Vista Propia |
| `/profesionales` | ✅ Gestión Turnos | ✅ Ver Colegas | ✅ Ver Disponibilidad | ✅ Ver Directorio |
| `/servicios` | ✅ Configurar Tarifas| ✅ Ver Catálogo | ✅ Ver Tarifas | ✅ Ver Precios |
| `/configuracion` | ✅ Multi-dispositivo | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |
| `/usuarios` | ✅ CRUD y Bloqueos | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |
| `/roles-permisos` | ✅ Matriz de Roles | ❌ Bloqueado | ❌ Bloqueado | ❌ Bloqueado |

### 5.2 Algoritmo de Resolución de Roles (`getUserRole()`)
1. Comprueba coincidencia exacta de GUIDs contra el seeder de base de datos Oracle:
   - `ADMINISTRADOR`: `13000000-0000-0000-0000-000000000001`
   - `ODONTOLOGO`: `13000000-0000-0000-0000-000000000002`
   - `RECEPCIONISTA`: `13000000-0000-0000-0000-000000000003`
   - `PACIENTE`: `13000000-0000-0000-0000-000000000005`
2. Si los GUIDs no coinciden, evalúa las cadenas textuales normalizadas del perfil.
3. Como salvaguarda, infiere el rol analizando los permisos asignados (`USERS:VIEW` $\rightarrow$ Admin, `CLINICAL:CREATE` $\rightarrow$ Odontólogo).

---

## 6. SISTEMA DE PRESENCIA (ONLINE/OFFLINE)

El estado de conexión de doctores y pacientes se determina mediante un motor híbrido bidireccional (`presenceService.ts`):

```
┌─────────────────────────────────────────────────────────┐
│               CAPA LOCAL (Navegador Actual)             │
│  • localStorage['nexus_online_users']                   │
│  • BroadcastChannel('nexus_presence') entre pestañas   │
│  • TTL de seguridad: 2 minutos sin pulso = offline     │
└────────────────────────────┬────────────────────────────┘
                             │  Unificación en memoria
┌────────────────────────────▼────────────────────────────┐
│              CAPA REMOTA (Servidor SignalR)             │
│  • Hub WebSocket: /hubs/notifications                   │
│  • Eventos emitidos: UserOnline / UserOffline           │
│  • Snapshot inicial de todos los usuarios conectados    │
└─────────────────────────────────────────────────────────┘
```

- **Normalización de Identificadores:** Un paciente se considera online si coincide cualquiera de sus datos clave (cédula, correo o GUID), limpiando espacios, tildes y caracteres especiales.

---

## 7. CENTRO DE NOTIFICACIONES Y CAMPANA

El componente de campana (`notification-bell.tsx`) y su proveedor (`NotificationContext.tsx`) fueron optimizados con aislamiento de usuario (**User-Scoped Notifications**):
- **Problema corregido:** En versiones anteriores, las notificaciones y su estado de lectura se guardaban de forma genérica en el navegador, provocando que un doctor viera las notificaciones de un recepcionista.
- **Implementación actual:**
  - Las llaves de almacenamiento en `localStorage` tienen el prefijo `nexus_notifications_<userId>` y `nexus_read_notifs_<userId>`.
  - Se conecta con `hubNotificationService.getMine()` (`GET /v1/HubNotifications/mine`) para descargar avisos dirigidos específicamente al ID de usuario o a sus roles.
  - Genera avisos automáticos cuando ocurren cambios en los horarios de los doctores o cuando se detectan citas que requieren reprogramación.

---

## 8. LAYOUT Y DISEÑO

### 8.1 Sistema Visual Glassmorphism
- **Estilos:** Construido sobre Tailwind CSS v4 con efectos `backdrop-blur-md`, bordes traslúcidos `border-white/10` y fondos graduados en profundidad.
- **Paleta de Colores de Estados de Cita (`appointmentStatusStyle.ts`):**
  - **Pendiente:** Ámbar (`bg-amber-500/15 text-amber-700 dark:text-amber-300`).
  - **Confirmada:** Verde azulado Teal (`bg-teal-500/15 text-teal-700 dark:text-teal-300`).
  - **En Atención:** Azul médico (`bg-blue-500/15 text-blue-700 dark:text-blue-300`).
  - **Completada:** Púrpura clínico (`bg-purple-500/15 text-purple-700 dark:text-purple-300`).
  - **No Asistió:** Pizarra neutro (`bg-slate-500/15 text-slate-700 dark:text-slate-300`).
  - **Cancelada:** Rosa rojizo (`bg-rose-500/15 text-rose-700 dark:text-rose-300`).

---

## 9. SERVICIOS API

A continuación se documentan los servicios principales del frontend y sus endpoints REST correspondientes:

### 9.1 `availabilityService.ts` — Horarios y Citas Afectadas
| Método | Endpoint Backend | Descripción |
|---|---|---|
| `getAll()` | `GET /v1/Availabilities` | Obtiene todas las filas de disponibilidad de la clínica |
| `getActiveByProfessional(id)` | `GET /v1/Availabilities` (filtrado cliente) | Disponibilidades vigentes hoy para el odontólogo indicado |
| `getImpact(id, rows)` | `POST /v1/Availabilities/impact` | Simula qué citas futuras colisionan si se cambia el horario |
| `replaceForProfessional(id, rows, notify)` | `PUT /v1/Availabilities/professional/{id}` | Guarda nuevo horario semanal (rige a partir de mañana) |
| `getRequiresReschedule()` | `GET /v1/Appointments/requires-reschedule` | Listado de citas que quedaron huérfanas tras cambios de turno |

### 9.2 `clinicSettingsService.ts` — Configuración de Clínica Persistente
| Método | Endpoint Backend | Descripción |
|---|---|---|
| `getSettings()` | `GET /v1/clinic-settings` | Carga datos de la clínica (NIT, WhatsApp, horarios, logo) |
| `saveSettings(data)` | `PUT /v1/clinic-settings` | Actualiza la configuración con persistencia en base de datos |

> **Resiliencia Multi-dispositivo:** Si el backend no tiene aún el endpoint desplegado, guarda y sincroniza automáticamente mediante `localStorage` emitiendo el evento `nexus_configuracion_updated` para que cualquier cambio se refleje en tiempo real.

### 9.3 `appointmentService.ts` — Gestión de Citas
| Método | Endpoint Backend | Descripción |
|---|---|---|
| `getAll()` | `GET /v1/Appointments` | Listado completo de citas |
| `create(data)` | `POST /v1/Appointments` | Agendamiento de cita con asignación de consultorio |
| `update(id, data)` | `PUT /v1/Appointments/{id}` | Edición de fecha, hora o profesional |
| `delete(id)` | `DELETE /v1/Appointments/{id}` | Cancelación lógica de cita |
| `markNoShow(id, reason)` | `POST /v1/Appointments/{id}/no-show` | Registra inasistencia del paciente con justificación |
| `getClinicalContext(id)` | `GET /v1/Appointments/{id}/clinical-context` | Datos clínicos listos para abrir atención médica |

---

## 10. GESTIÓN DE HORARIOS Y DISPONIBILIDAD

Uno de los avances más importantes incorporados en la versión final es la política de consistencia horaria:

### 10.1 Política Institucional: "Los cambios rigen desde mañana"
Para evitar cancelar o alterar citas que ya están en curso durante el día actual:
1. Al modificar el horario semanal de un profesional en `ProfesionalesView`, el sistema calcula la fecha de vigencia:
   ```ts
   effectiveFrom = colombiaTomorrowIso(); // Siempre YYYY-MM-DD del día de mañana
   ```
2. Las citas del día de hoy se mantienen protegidas e inalteradas.
3. El backend o el cliente calculan el impacto en citas agendadas de mañana en adelante. Si alguna cita cae fuera del nuevo horario de atención o en la hora de almuerzo del doctor, la cita se etiqueta automáticamente con **"Requiere reprogramación"** (`RequiresRescheduleBadge.tsx`).
4. Se emite una alerta a la campana de notificaciones del doctor y recepcionistas.

---

## 11. MÓDULOS CLÍNICOS

### 11.1 Odontograma FDI Interactivo (`features/odontograma/`)
- Mapea las **32 piezas dentales** permanentes y las piezas temporales según el estándar internacional FDI.
- Cada diente modela **5 superficies anatómicas independientes**: Mesial (M), Distal (D), Vestibular (V), Lingual/Palatino (L) y Oclusal/Incisal (O).
- Permite diagnosticar caries, obturaciones, coronas, endodoncias, prótesis y extracciones.
- **Sincronización:** Emite el evento `nexus_odontograma_updated` para que la Historia Clínica actualice sus diagnósticos CIE-10 en tiempo real sin recargar la página.
- **Exportación en PDF:** Genera el diagrama vectorial e informe clínico utilizando `@react-pdf/renderer` cargado en demanda.

### 11.2 Historia Clínica Digital (`features/historia-clinica/`)
- Registro de evolución médica encadenado a una cita activa atendida.
- Asignación de diagnósticos estandarizados según el catálogo **CIE-10**.
- Visualización de antecedentes médicos, alergias y prescripciones farmacológicas en carpetas animadas (`folder-component.tsx`).

### 11.3 Agenda Semanal (`features/agenda/`)
- Matriz de 7 días (Lunes a Domingo) con franjas horarias de 60 minutos.
- **Agrupamiento inteligente:** Si existen múltiples citas en la misma franja horaria, se agrupan en un dossier visual indicando la cantidad de pacientes.
- **Regla de integridad:** Las citas canceladas o marcadas como inasistencia (`No asistió`) se distinguen cromáticamente y deshabilitan el botón de atención clínica.

---

## 12. MÓDULOS ADMINISTRATIVOS

### 12.1 Procedimientos y Tarifas (`features/servicios/`)
- **Tarifa Oficial Abierta:** Se eliminaron los selectores rígidos de botones fijos (\$10k, \$50k) para permitir escribir libremente cualquier valor numérico en pesos colombianos (COP).
- **Duración en Sillón Dental:** El tiempo estimado en minutos ahora es un campo numérico editable libremente, adaptándose a procedimientos cortos (15 min) o cirugías extensas (120+ min).

### 12.2 Configuración General de la Clínica (`features/configuracion/`)
- Permite personalizar los datos institucionales: Nombre de la clínica, NIT, teléfono, correo de contacto, línea oficial de WhatsApp, horarios de apertura y cierre, y tiempo predeterminado por cita.
- **Persistencia Multi-dispositivo:** Los datos se guardan en la base de datos central a través de la API, permitiendo que cualquier miembro del equipo administrativo vea la misma información sin importar desde qué computador o tablet inicie sesión.

### 12.3 Directorio de Profesionales (`features/profesionales/`)
- Alta y edición de especialistas en un modal ergonómico de 12 columnas sin scroll excesivo.
- Asignación de turnos, días de descanso y horarios de almuerzo por doctor.

---

## 13. DASHBOARD CLÍNICO Y EQUIPO EN TURNO

El panel principal (`DashboardPage.tsx`) incorpora la sección **"Equipo en Turno Hoy"** alimentada por el módulo `src/features/dashboard/equipoEnTurno.ts`:
- Analiza la hora del servidor y los turnos semanales vigentes de todos los odontólogos.
- Muestra el estado en vivo de cada doctor:
  - 🟢 **En consulta / Turno activo** (con indicador de citas agendadas para el día).
  - 🟡 **En receso de almuerzo** (respetando la franja configurada).
  - ⚪ **Fuera de turno hoy**.
- **Nomenclatura Institucional:** Siguiendo las directrices clínicas, se adoptó el término **"Consultorio"** (ej. "Consultorio 1", "Consultorio 2") en reemplazo de "Sillón" en toda la interfaz mediante la utilidad `consultorioLabel.ts`.

---

## 14. CHATBOT Y WHATSAPP

El módulo de atención humana (`AtencionAsesorView.tsx`) conecta a los recepcionistas con pacientes que escriben a través de WhatsApp:
1. **Resolución de Contactos LID:** Corrige la visualización de contactos Linked Identity Device (LID) de WhatsApp Web, resolviendo su número en formato internacional E.164 (`+57...`) para que el asesor identifique al paciente con claridad.
2. **Selección Suave de Chats:** Se eliminó la recarga total de la lista de conversaciones al abrir un chat, evitando parpadeos visuales y pérdida de la posición del scroll.
3. **Supresión de Avisos Ruidosos:** Se silenciaron los mensajes automáticos de sistema que anunciaban el traspaso entre bot e intervención humana en el chat del cliente.

---

## 15. AUDITORÍA DE PRODUCCIÓN Y OPTIMIZACIÓN

Previo al lanzamiento, la aplicación fue sometida a una auditoría técnica en el entorno de producción (`https://nexusodonto.chatcampuslands.com/`):

| Criterio Evaluado | Calificación | Diagnóstico y Acciones Aplicadas |
|---|:---:|---|
| ⚡ **Rendimiento (Lighthouse)** | **97 / 100** | Carga inicial inferior a 1.2 segundos. Precarga selectiva de WebPs solo en la ruta `/`. |
| ♿ **Accesibilidad (WCAG AA)** | **100 / 100** | Todos los controles con etiquetas `aria-label`, contraste cromático verificado y soporte total de teclado. |
| 🔍 **SEO Semántico** | **100 / 100** | Unificación del Hero de la Landing Page en un **único `<h1>` semántico** (`Atención odontológica <span ...>clara, cercana y especializada</span>`), eliminando encabezados duplicados. |
| 🛡️ **Seguridad de Rutas** | **100%** | Redirección inmediata a `/login` ante peticiones no autenticadas en rutas clínicas y administrativas. |
| 📦 **Code-Splitting** | **Optimizado** | La librería de PDFs (`@react-pdf/renderer`), con un peso superior a 1.19 MB, fue aislada mediante `import()` dinámico. El bundle inicial de la Landing Page pesa tan solo **32.7 kB** (7.12 kB gzipped). |

---

## 16. BACKEND Y BASE DE DATOS

El backend implementa **Clean Architecture** en .NET 9 sobre **Oracle Database 21c XE**:
- **Capa Api:** Controladores RESTful agrupados por dominio (`Auth`, `Clinical`, `Schedule`, `People`, `Catalogs`, `Security`) y Hubs de SignalR.
- **Capa Application:** Servicios de negocio, interfaces, validadores FluentValidation y DTOs de transporte.
- **Capa Domain:** Entidades ricas, Value Objects (`Email`, `Cedula`, `Phone`), enumeraciones y excepciones de negocio.
- **Capa Infrastructure:** Mapeo relacional con Entity Framework Core para Oracle, repositorios genéricos y especializados, y seeders de datos iniciales.

---

## 17. MAPA DE CONEXIONES

| Módulo Frontend | Archivo Servicio | Endpoint REST / WS | Entidad / Tabla Oracle |
|---|---|---|---|
| Acceso y Seguridad | `authService.ts` | `POST /api/auth/login` | `USERS`, `PERSONS` |
| Horarios y Turnos | `availabilityService.ts` | `PUT /v1/Availabilities/professional/{id}` | `AVAILABILITIES` |
| Configuración Clínica | `clinicSettingsService.ts` | `GET / PUT /v1/clinic-settings` | `CLINIC_SETTINGS` |
| Campana Notificaciones | `hubNotificationService.ts`| `GET /v1/HubNotifications/mine` | `HUB_NOTIFICATIONS` |
| Gestión de Pacientes | `patientService.ts` | `GET /v1/Patients` + `GET /v1/Persons` | `PATIENTS`, `PERSONS` |
| Citas y Estados | `appointmentService.ts` | `GET / POST / PUT /v1/Appointments` | `APPOINTMENTS` |
| Historias Clínicas | `clinicalHistoryService.ts`| `POST /v1/ClinicalAttentions` | `CLINICAL_ATTENTIONS` |
| Odontograma FDI | `odontogramService.ts` | `POST /v1/Odontograms/full` | `ODONTOGRAMS`, `ODONTOGRAM_TEETH` |
| Tarifario Oficial | `serviceCatalogService.ts` | `GET / PUT /v1/Services` | `SERVICES` |
| Presencia en Vivo | `signalrService.ts` | `WS /hubs/notifications` | En memoria (SignalR Hub) |
| WhatsApp & IA | `chatbotService.ts` | `POST /chat` (FastAPI :8000) | Memoria Vectorial Qdrant |

---

## 18. GUÍA PARA LA SUSTENTACIÓN

### Preguntas Clave que Pueden Hacer los Evaluadores:

1. **¿Por qué los cambios de horario de los odontólogos no aplican inmediatamente el mismo día?**
   - *Respuesta:* Por integridad clínica y respeto al paciente. Si un doctor cambia su turno a las 10:00 AM, no podemos cancelar automáticamente a los pacientes que ya están en sala de espera ese mismo día. La política de la clínica establece que cualquier cambio rige a partir de mañana, detectando citas afectadas y marcándolas con "Requiere reprogramación" para su gestión asistida.

2. **¿Cómo garantizan que la aplicación cargue rápido si incluye librerías tan pesadas como generación de PDFs y odontogramas interactivos?**
   - *Respuesta:* Aplicamos **Code-Splitting a nivel de rutas** con `React.lazy` y **carga dinámica diferida** (`await import(...)`). El generador de PDF `@react-pdf/renderer` (que pesa ~1.2 MB) no se descarga cuando el usuario entra a la Landing Page o al Login; solo se transfiere por red en el instante exacto en que el doctor pulsa el botón "Descargar PDF".

3. **¿Cómo funciona la persistencia de la configuración de la clínica entre diferentes dispositivos?**
   - *Respuesta:* En `clinicSettingsService`, la configuración se envía al endpoint `/v1/clinic-settings` para guardarse en la base de datos central. Además, cuenta con una estrategia de caché y fallback en `localStorage` con emisión de eventos reactivos (`nexus_configuracion_updated`), asegurando que cualquier cambio se sincronice de inmediato en toda la interfaz.

4. **¿Cómo se manejaron los estándares de accesibilidad y SEO en el frontend?**
   - *Respuesta:* El proyecto alcanzó **100/100 en Accesibilidad (WCAG AA)** y **100/100 en SEO**. Unificamos la jerarquía semántica para que cada página contenga una única etiqueta `<h1>` representativa, añadimos etiquetas descriptivas ARIA en todos los componentes interactivos y optimizamos los contrastes tanto en tema claro como en tema oscuro.

---
*NexusOdonto — Sistema Integral de Gestión Odontológica y Clínica · Documentación Oficial de Código*
