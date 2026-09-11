# 🦷 NexusOdonto — Frontend

<div align="center">

![NexusOdonto Logo](src/assets/nexus-odonto-logo.webp)

### **Plataforma Integral de Gestión Odontológica y Asistente Clínico Inteligente**

[![React](https://img.shields.io/badge/React-19.2.8-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.2-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4.3-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![SignalR](https://img.shields.io/badge/SignalR-v10.0-512BD4?logo=dotnet&logoColor=white)](https://learn.microsoft.com/aspnet/core/signalr/)
[![License](https://img.shields.io/badge/Licencia-Privada-blue)](#)
[![QA Status](https://img.shields.io/badge/QA_Audit-Aprobado_100%25-brightgreen)](#)

</div>

---

## 📖 Acerca de NexusOdonto

**NexusOdonto** es una plataforma web empresarial diseñada para la administración clínica, operativa y financiera de centros odontológicos modernos. Ofrece una experiencia reactiva fluida, gestión en tiempo real de citas mediante WebSockets, expediente clínico digital unificado, un **odontograma interactivo anatómico multisuperficie (FDI)** y un **asistente de Inteligencia Artificial (RAG)** para agendamiento y atención automatizada vía Web y WhatsApp.

---

## 🚀 Módulos y Características Principales

### 🔐 1. Autenticación y Control de Acceso (RBAC)
* Inicio de sesión seguro con **JWT** y soporte multicanal: **Número de Documento**, **Código de Empleado (AD001, OD001, RC001)**, **Correo Electrónico** y **Google OAuth 2.0 con un solo clic**.
* Sistema de **Control de Acceso Basado en Roles (RBAC)**: Administrador, Odontólogo, Recepcionista, Paciente y Asistente.
* Rutas protegidas (`ProtectedRoute`), inyección transparente de cabeceras de autorización y manejo de sesiones expiradas.

### 📅 2. Agenda Inteligente y Calendario Clínico
* Vistas interactivas: mensual, semanal y diaria con cálculo dinámico de disponibilidades por doctor y consultorio.
* **Aislamiento de zona horaria (UTC-5):** Formato local estricto (`YYYY-MM-DDTHH:mm:00`) que previene desfases horarios.
* Sincronización instantánea de eventos en tiempo real con **Microsoft SignalR**, eliminando riesgos de doble agendamiento.

### 🦷 3. Odontograma Anatómico Digital
* Odontograma interactivo bajo el sistema **FDI internacional** (32 piezas permanentes y 20 piezas temporales/pediátricas).
* Selección anatómica independiente de 5 superficies dentales por pieza (*Oclusal/Incisal, Mesial, Distal, Vestibular, Lingual/Palatina*).
* Barra de convenciones clínicas: caries activa, obturaciones/resinas, endodoncias, coronas, implantes, extracciones y prótesis.
* Persistencia estructurada con notas clínicas, fecha y profesional tratante.

### 📋 4. Expediente Clínico e Historia Clínica Digital
* Registro estructurado de evoluciones clínicas vinculadas a citas activas.
* Registro simultáneo de diagnósticos con codificación internacional **CIE-10**.
* Anamnesis completa: antecedentes patológicos, farmacológicos, alérgicos, quirúrgicos y familiares.

### 💬 5. Centro de Atención y Chatbot IA (RAG)
* **Widget Asistente Flotante:** Chatbot con recuperación aumentada por generación (RAG) conectado a base de datos vectorial Qdrant.
* **Módulo de Asesor Humano (`AtencionAsesorView`):** Bandeja unificada de conversaciones de WhatsApp y tickets web con respuesta manual o asistencia asistida por IA.

### 🌓 6. Modo Claro / Modo Oscuro y Experiencia de Usuario
* Conmutador de tema persistente en `localStorage` con adaptación visual en todas las vistas y fondos corporativos WebP optimizados.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Descripción |
| :--- | :--- | :--- |
| **Framework UI** | React 19 | Arquitectura basada en componentes funcionales, hooks y `Suspense` |
| **Lenguaje** | TypeScript 6 | Tipado estricto (*Strict Mode, Zero Any*) |
| **Bundler & Build** | Vite 8 | Empaquetado ultrarrápido con Hot Module Replacement (HMR) |
| **Estilos & Diseño** | Tailwind CSS v4 | Diseño responsivo, variables CSS modernas y modo oscuro |
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
src/
├── api/                  # Servicios de comunicación con la API REST (Axios)
│   ├── axiosClient.ts    # Configuración de Axios con interceptores JWT
│   ├── authService.ts    # Endpoints de autenticación, OAuth y registro
│   ├── appointmentService.ts # CRUD de citas médicas
│   ├── clinicalHistoryService.ts # Atenciones y diagnósticos
│   ├── odontogramService.ts # Odontogramas y hallazgos
│   └── ...               # Catálogos (pacientes, personas, roles, etc.)
│
├── assets/               # Recursos gráficos optimizados (.webp, .svg)
├── components/           # Componentes UI reutilizables
│   ├── common/           # Botones, modales, avatares, BrandLogo
│   ├── layout/           # Sidebar, PageHeader, Dropdown de perfil
│   └── chatbot/          # ChatBotWidget flotante
│
├── context/              # Estado global (AuthContext, ThemeContext, NotificationContext)
├── features/             # Módulos organizados por dominio funcional (Feature-First)
│   ├── agenda/           # Calendario interactivo semanal y mensual
│   ├── auth/             # Login, Registro y páginas de acceso
│   ├── citas/            # Gestión y tabla de citas médicas
│   ├── dashboard/        # Métricas principales e indicadores de ocupación
│   ├── historia-clinica/ # Expediente clínico y evolución
│   ├── landing/          # Página pública de captación y bienvenida
│   ├── odontograma/      # Odontograma anatómico FDI multisuperficie
│   ├── pacientes/        # Directorio clínico de pacientes
│   ├── profesionales/    # Directorio de odontólogos y licencias
│   ├── servicios/        # Catálogo de tratamientos y tarifas
│   ├── usuarios/         # Administración de cuentas y activación
│   ├── roles/            # Matriz de permisos RBAC
│   └── chat-asesor/      # Gestión de tickets y WhatsApp
│
├── layouts/              # Plantilla contenedora DashboardLayout
├── routes/               # Configuración de rutas y guardias (ProtectedRoute)
├── utils/                # Utilidades, normalizadores y validaciones
├── index.css             # Directivas de Tailwind CSS y fuentes
└── main.tsx              # Punto de entrada de la aplicación
```

---

## ⚙️ Requisitos e Instalación

### Prerrequisitos
* **Node.js** `>= 18.0.0` (Recomendado: LTS v20 o v22)
* **npm** `>= 9.0.0` o **pnpm**
* Backend de NexusOdonto (.NET Core) en ejecución en `http://localhost:5170`

### 1. Clonar el repositorio
```bash
git clone https://github.com/tu-organizacion/NexusOdontoFrontend.git
cd NexusOdontoFrontend
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basándote en el siguiente ejemplo:

```env
# URL de la API REST Backend (.NET Core)
VITE_API_URL=http://localhost:5170/api

# URL del Microservicio de IA / Chatbot (FastAPI)
VITE_CHATBOT_API_URL=http://localhost:8000
```

---

## 💻 Scripts Disponibles

En la raíz del proyecto puedes ejecutar:

| Comando | Descripción |
| :--- | :--- |
| `npm run dev` | Inicia el servidor de desarrollo local con Vite (por defecto en `http://localhost:5173` o `http://localhost:5174`). |
| `npm run build` | Compila TypeScript (`tsc -b`) y genera el bundle optimizado de producción en `dist/`. |
| `npm run preview` | Previsualiza localmente el build de producción generado. |
| `npm run lint` | Ejecuta ESLint para auditar la calidad estática del código. |

---

## 🧪 Calidad de Software y Certificación QA

NexusOdonto Frontend cumple con estándares de ingeniería de software senior:

* **Compilación TypeScript:** ✅ 0 errores en modo estricto (`strict: true`).
* **Auditoría ESLint:** ✅ 0 errores de código.
* **Persistencia Real:** Todas las operaciones CRUD han sido verificadas en vivo contra la base de datos **Oracle 21c**, garantizando persistencia inmutable tras recargas (`F5`).
* **Zonas Horarias:** Protocolo validado para evitar desfases de horario en zona horaria Colombia (UTC-5).

---

## 👥 Equipo y Créditos

Desarrollado para el ecosistema **NexusOdonto**. Todos los derechos reservados © 2026.
