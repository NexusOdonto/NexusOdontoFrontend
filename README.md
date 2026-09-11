# 🦷 NexusOdonto — Frontend

<div align="center">

![NexusOdonto Logo](src/assets/nexus-odonto-logo.webp)

### **Plataforma Integral de Gestión Odontológica y Asistente Clínico Inteligente**
#### *Single Page Application (SPA), Odontograma Anatómico FDI Multisuperficie & Experiencia de Usuario de Última Generación*

[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SignalR](https://img.shields.io/badge/SignalR-v10.0-512BD4?logo=dotnet&logoColor=white)](https://learn.microsoft.com/aspnet/core/signalr/)
[![Google Auth](https://img.shields.io/badge/Google_OAuth-1--Click-4285F4?logo=google&logoColor=white)](https://developers.google.com/identity)
[![License](https://img.shields.io/badge/Licencia-Privada-blue)](#)
[![QA Audit](https://img.shields.io/badge/QA_Audit-Aprobado_100%25-brightgreen)](#)

</div>

---

## 📖 Acerca de NexusOdonto

**NexusOdonto** es una plataforma web médica de nivel empresarial diseñada para la administración integral, clínica, operativa y financiera de centros odontológicos modernos. 

Ofrece una interfaz ultrarrápida y reactiva, gestión en tiempo real de citas mediante WebSockets (SignalR), expediente clínico digital unificado (CIE-10), un **odontograma interactivo anatómico multisuperficie (FDI)** de alta precisión, y un **asistente de Inteligencia Artificial (RAG)** para agendamiento autónomo y soporte a través de Web y WhatsApp.

---

## 🚀 Módulos y Características Principales

### 🔐 1. Autenticación Híbrida y Control de Acceso (RBAC)
* **Inicio de Sesión Multicanal:** Soporte para **Número de Documento**, **Código de Empleado (AD001, OD001, RC001)**, **Correo Electrónico** y **Google OAuth 2.0 con un solo clic**.
* **Control de Acceso Basado en Roles (RBAC):** Vistas y flujos especializados para **Administrador**, **Odontólogo**, **Recepcionista**, **Paciente** y **Asistente**.
* **Seguridad de Rutas:** Guardianes de ruta (`ProtectedRoute`), refresco proactivo de sesión e inyección de cabeceras `Authorization: Bearer <token>`.

### 📅 2. Agenda Inteligente y Calendario Clínico
* **Vistas Dinámicas:** Calendario mensual, semanal y diario con cálculo en vivo de disponibilidad por doctor y consultorio.
* **Aislamiento Horario UTC-5:** Formateo local estricto (`YYYY-MM-DDTHH:mm:00`) que elimina desfases de zonas horarias.
* **Sincronización WebSockets (SignalR):** Notificaciones y actualización en caliente de citas sin recargar la página.

### 🦷 3. Odontograma Anatómico Digital (FDI)
* Visualización anatómica del sistema **FDI internacional** (32 piezas adultas y 20 piezas pediátricas/temporales).
* Selección independiente de 5 superficies por pieza dental (*Oclusal/Incisal, Mesial, Distal, Vestibular, Lingual/Palatina*).
* Paleta de convenciones estandarizada: caries activa, resinas, endodoncias, coronas, implantes, prótesis y extracciones.
* Guardado estructurado por paciente, fecha, doctor tratante y observaciones clínicas.

### 📋 4. Expediente Clínico e Historia Digital
* Registro cronológico de evoluciones médicas vinculadas a citas activas.
* Diagnósticos codificados bajo el estándar internacional **CIE-10**.
* Anamnesis completa: antecedentes patológicos, quirúrgicos, alérgicos, farmacológicos y familiares.

### 💬 5. Centro de Atención y Chatbot IA (RAG)
* **Widget Asistente Flotante:** Chatbot con recuperación aumentada por generación (RAG) conectado a base de datos vectorial Qdrant.
* **Módulo de Asesor Humano (`AtencionAsesorView`):** Bandeja unificada para atender chats de WhatsApp y tickets web, con soporte de respuestas sugeridas por IA y prevención de duplicados.

### 🌓 6. Modo Claro / Modo Oscuro & Diseño Glassmorphism
* Sistema de temas persistente en `localStorage` con microinteracciones fluidas y fondos corporativos WebP optimizados.
* Estandarización global de notificaciones flotantes (Toasts) en la esquina inferior derecha (`bottom-right`) para máxima ergonomía visual.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Framework UI** | React 19 | Arquitectura basada en componentes funcionales, hooks y `Suspense` |
| **Lenguaje** | TypeScript 6 | Tipado estricto (*Strict Mode, Zero Any*) |
| **Bundler & Build** | Vite 8 | Empaquetado ultrarrápido con Hot Module Replacement (HMR) |
| **Estilos & Diseño** | Tailwind CSS v4 | Diseño responsivo, variables CSS modernas, glassmorphism y tema oscuro |
| **Enrutamiento** | React Router 7 | SPA routing declarativo con protección de rutas por roles |
| **Cliente HTTP** | Axios | Interceptores automáticos de Bearer Token y manejo de errores |
| **Tiempo Real** | Microsoft SignalR | WebSockets para sincronización de agendas y notificaciones push |
| **Iconografía** | Lucide React | Iconos vectoriales limpios y accesibles |
| **Backend Principal** | ASP.NET Core (.NET 10) | Clean Architecture, EF Core, REST API (`localhost:5170`) |
| **Base de Datos** | Oracle Database 21c | Persistencia relacional corporativa de alto rendimiento (`XEPDB1`) |
| **Microservicio IA** | FastAPI / Python | RAG con LangGraph, OpenAI (GPT-4o) y Qdrant Vector DB |

---

## 📂 Estructura del Proyecto

```text
NexusOdontoFrontend/
├── src/
│   ├── api/                  # Servicios de comunicación con la API REST (Axios)
│   │   ├── axiosClient.ts    # Configuración de Axios con interceptores JWT
│   │   ├── authService.ts    # Endpoints de autenticación, OAuth y registro
│   │   ├── appointmentService.ts # CRUD de citas médicas
│   │   ├── clinicalHistoryService.ts # Atenciones y diagnósticos CIE-10
│   │   ├── odontogramService.ts # Odontogramas y hallazgos
│   │   └── ...               # Catálogos (pacientes, personas, roles, servicios)
│   │
│   ├── assets/               # Recursos gráficos optimizados (.webp, .svg, .gif)
│   ├── components/           # Componentes UI reutilizables
│   │   ├── common/           # Botones, modales, avatares, BrandLogo, Toasts
│   │   ├── layout/           # Sidebar, PageHeader, Dropdown de perfil
│   │   └── chatbot/          # ChatBotWidget flotante y asistente RAG
│   │
│   ├── context/              # Estado global (AuthContext, ThemeContext, NotificationContext)
│   ├── features/             # Módulos organizados por dominio funcional (Feature-First)
│   │   ├── agenda/           # Calendario interactivo semanal y mensual
│   │   ├── auth/             # Login, Registro, AuthCallback, LinkGoogle
│   │   ├── citas/            # Gestión y tabla de citas médicas
│   │   ├── dashboard/        # Métricas principales e indicadores de ocupación
│   │   ├── historia-clinica/ # Expediente clínico y evolución
│   │   ├── landing/          # Página pública de captación y bienvenida
│   │   ├── odontograma/      # Odontograma anatómico FDI multisuperficie
│   │   ├── pacientes/        # Directorio clínico de pacientes
│   │   ├── profesionales/    # Directorio de odontólogos y licencias
│   │   ├── servicios/        # Catálogo de tratamientos y tarifas
│   │   ├── usuarios/         # Administración de cuentas y activación
│   │   ├── roles/            # Matriz de permisos RBAC
│   │   └── chat-asesor/      # Gestión de tickets y WhatsApp
│   │
│   ├── layouts/              # Plantilla contenedora DashboardLayout
│   ├── routes/               # Configuración de rutas y guardias (ProtectedRoute)
│   ├── utils/                # Utilidades, normalizadores y validaciones
│   ├── index.css             # Directivas de Tailwind CSS y tipografías
│   └── main.tsx              # Punto de entrada de la aplicación
```

---

## ⚙️ Requisitos e Instalación

### Prerrequisitos
* **Node.js** `>= 18.0.0` (Recomendado: LTS v20 o v22)
* **npm** `>= 9.0.0` o **pnpm**
* Backend de NexusOdonto (.NET Core) en ejecución en `http://localhost:5170`

### 1. Clonar el repositorio
```bash
git clone https://github.com/NexusOdonto/NexusOdontoFrontend.git
cd NexusOdontoFrontend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto:

```env
# URL de la API REST Backend (.NET Core)
VITE_API_URL=http://localhost:5170/api

# URL del Hub de Notificaciones SignalR
VITE_SIGNALR_URL=http://localhost:5170/hubs/notifications

# URL del Microservicio de IA / Chatbot (FastAPI)
VITE_CHATBOT_API_URL=http://localhost:8000
```

---

## 💻 Scripts Disponibles

En la raíz del proyecto puedes ejecutar:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con Vite (`http://localhost:5173` o `http://localhost:5174`). |
| `npm run build` | Compila TypeScript (`tsc -b`) y genera el bundle optimizado de producción en `dist/`. |
| `npm run preview` | Previsualiza localmente el build de producción generado. |
| `npm run lint` | Ejecuta ESLint para auditar la calidad estática del código. |

---

## 🧪 Calidad de Software y Certificación QA

NexusOdonto Frontend cumple con los más altos estándares de calidad e ingeniería:

* **Compilación TypeScript:** ✅ 0 errores en modo estricto (`strict: true`).
* **Auditoría ESLint:** ✅ 0 errores de sintaxis y código.
* **Persistencia Real en Oracle 21c:** Operaciones CRUD probadas en vivo contra base de datos relacional con claves canónicas.
* **Aislamiento Horario UTC-5:** Prevención total de desfases en fechas y horas clínicas.
* **Ergonomía UI/UX:** Notificaciones estandarizadas y contraste visual garantizado en temas claro y oscuro.

---

## 👥 Equipo y Créditos

Desarrollado para el ecosistema **NexusOdonto**.
Todos los derechos reservados © 2026.
