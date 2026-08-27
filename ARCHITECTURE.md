# Arquitectura del Proyecto - NexusOdonto Frontend

## 📁 Estructura del Proyecto

El proyecto sigue una arquitectura **Feature-First** modular con React + Vite + Tailwind CSS v4.

```
src/
├── api/                          # Cliente HTTP y configuración de API
│   └── axiosClient.ts
├── assets/                       # Imágenes y recursos estáticos
│   ├── fondo-Login-ligh.webp     # Fondo login modo claro
│   ├── fondoLogin.webp           # Fondo login modo oscuro
│   ├── fondo-ligh.webp           # Fondo dashboard modo claro
│   ├── fondo-darck.webp          # Fondo dashboard modo oscuro
│   └── nexus-odonto-logo.webp    # Logo de la marca
├── components/                   # Componentes UI globales reutilizables
│   ├── layout/                   # Componentes de layout compartidos
│   │   ├── PageHeader.tsx        # Header principal con toggle de tema
│   │   └── Sidebar.tsx           # Sidebar de navegación
│   └── ui/                       # Componentes UI atómicos (botones, inputs, etc.)
│       └── Button.tsx
├── context/                      # Contextos globales de React
│   └── ThemeContext.tsx          # Contexto para gestión de tema claro/oscuro
├── features/                     # Módulos por funcionalidad (Feature-First)
│   ├── auth/                     # Módulo de autenticación
│   │   ├── LoginPage.tsx         # Vista de login
│   │   └── components/           # Componentes específicos de auth
│   │       ├── LoginButton.tsx
│   │       └── LoginInput.tsx
│   ├── pacientes/                # Módulo de gestión de pacientes
│   │   ├── PacientesView.tsx    # Vista listado de pacientes
│   │   ├── PacienteRegistroView.tsx  # Vista registro de paciente
│   │   └── components/           # Componentes específicos de pacientes
│   │       ├── PacienteForm.tsx
│   │       └── PacientesTable.tsx
│   └── servicios/                # Módulo de servicios
│       ├── ServiciosView.tsx     # Vista de servicios
│       └── components/
│           └── ServiciosGrid.tsx
├── layouts/                      # Layouts que envuelven vistas
│   └── DashboardLayout.tsx       # Layout principal del dashboard
├── routes/                       # Configuración de rutas
│   ├── ProtectedRoute.tsx        # Ruta protegida (auth)
│   └── index.tsx                 # Definición de rutas con lazy loading
├── types/                        # Definiciones de tipos TypeScript
│   ├── pacientes.ts              # Tipos del módulo pacientes
│   └── servicios.ts              # Tipos del módulo servicios
├── utils/                        # Utilidades y helpers
│   ├── cn.ts                     # Función para combinar clases
│   ├── currency.ts               # Formateo de moneda
│   └── dentalBgStyles.ts         # Estilos para odontograma
├── App.tsx                       # Componente raíz
├── index.css                     # Estilos globales + Tailwind CSS v4
├── main.tsx                      # Punto de entrada de la aplicación
└── vite-env.d.ts                 # Tipos de Vite
```

## 🎨 Sistema de Diseño y Tema

### Gestión de Tema (Claro/Oscuro)

El proyecto usa un **Context Provider global** (`ThemeContext.tsx`) para gestionar el tema:

- **Estado global**: El tema se almacena en `localStorage` y se sincroniza con toda la app
- **Clase `.dark`**: Se aplica a `document.documentElement` para activar el modo oscuro
- **Desconectado del sistema**: El tema NO responde a `prefers-color-scheme` del navegador; el botón Sol/Luna es la única fuente de verdad
- **Variantes Tailwind**: Todos los componentes usan `dark:` para estilos adaptativos

### Variables de Diseño (Tailwind CSS v4)

Definidas en `src/index.css` con la directiva `@theme`:

- **Colores primarios**: Celeste Cian (#00A8CC) y Menta Tech (#66D2B1)
- **Colores de acento**: Indigo, Purple, Sky para diferentes módulos
- **Estados del sistema**: Success, Warning, Danger, Info

## 🚀 Buenas Prácticas de Desarrollo

### Importación de Componentes

**Componentes UI Globales:**
```typescript
import { Button } from "@/components/ui/Button";
import { PageHeader } from "@/components/layout/PageHeader";
```

**Componentes de Features:**
```typescript
import { PacientesView } from "@/features/pacientes/PacientesView";
import { PacienteForm } from "@/features/pacientes/components/PacienteForm";
```

### Tipos Centralizados

Siempre usa tipos centralizados desde `src/types/`:

```typescript
import { type Paciente } from "@/types/pacientes";
import { type Servicio } from "@/types/servicios";
```

### Hooks Personalizados

```typescript
import { useTheme } from "@/context/ThemeContext";

const { theme, toggleTheme } = useTheme();
```

## 🛠️ Guía Paso a Paso: Crear una Nueva Vista

Ejemplo: Crear una vista de **Citas** (Appointments)

### Paso 1: Estructura de la Feature

Crea la carpeta de la feature dentro de `src/features/`:

```bash
src/features/citas/
├── CitasView.tsx              # Vista principal
├── components/                # Componentes específicos
│   ├── CitasList.tsx
│   ├── CitaCard.tsx
│   └── CitaForm.tsx
└── types.ts                   # Tipos específicos (opcional)
```

### Paso 2: Creación del Componente y Vista

**Archivo: `src/features/citas/CitasView.tsx`**

```typescript
import { useState } from "react";
import { CitasList } from "./components/CitasList";
import { CitaForm } from "./components/CitaForm";

interface Cita {
  id: number;
  paciente: string;
  fecha: string;
  hora: string;
  estado: "pendiente" | "confirmada" | "cancelada";
}

export function CitasView() {
  const [citas, setCitas] = useState<Cita[]>([]);
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              Citas
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Gestión de citas del consultorio.
            </p>
          </div>
          <button
            type="button"
            className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-700 text-white font-medium rounded-lg hover:from-primary-600 hover:to-primary-800 transition-all"
            onClick={() => setShowForm(true)}
          >
            + Nueva Cita
          </button>
        </div>

        {showForm && <CitaForm onCancel={() => setShowForm(false)} />}
        <CitasList citas={citas} />
      </div>
    </div>
  );
}
```

### Paso 3: Lógica y Estado

**Usar hooks personalizados:**

```typescript
import { useTheme } from "@/context/ThemeContext";

export function CitasView() {
  const { theme } = useTheme();
  const [citas, setCitas] = useState<Cita[]>([]);
  
  // Ejemplo: cargar datos desde API
  useEffect(() => {
    const fetchCitas = async () => {
      const response = await axiosClient.get('/citas');
      setCitas(response.data);
    };
    fetchCitas();
  }, []);
  
  // ...
}
```

### Paso 4: Estilizado con Tailwind CSS v4

**Clases adaptativas a modo claro/oscuro:**

```typescript
// Contenedor principal
<div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6">

// Textos
<h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">
<p className="text-sm text-slate-600 dark:text-slate-400">

// Botones
<button className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">

// Inputs
<input className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-primary-500">

// Transiciones suaves
<div className="transition-colors duration-300">
```

**Reglas de contraste:**
- **Modo claro**: `text-slate-900` (texto principal), `text-slate-600` (secundario)
- **Modo oscuro**: `dark:text-slate-100` (texto principal), `dark:text-slate-400` (secundario)
- **Bordes**: `border-slate-200 dark:border-slate-800`
- **Fondos**: `bg-white dark:bg-slate-900`

### Paso 5: Registro e Integración en el Enrutador

**Archivo: `src/routes/index.tsx`**

Agrega el import lazy al inicio del archivo:

```typescript
import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

// Helper function para lazy loading de named exports
const lazyImport = <T extends Record<string, any>, K extends keyof T>(
  factory: () => Promise<T>,
  key: K
) =>
  lazy(() =>
    factory().then((module) => ({
      default: module[key],
    }))
  );

// Imports existentes...
const LoginPage = lazy(() => import("../features/auth/LoginPage"));
const DashboardLayout = lazyImport(() => import("../layouts/DashboardLayout"), "DashboardLayout");

// NUEVO: Importar CitasView
const CitasView = lazyImport(() => import("../features/citas/CitasView"), "CitasView");
```

Agrega la ruta dentro de `<Routes>`:

```typescript
<Route
  path="/citas"
  element={
    <DashboardLayout>
      <CitasView />
    </DashboardLayout>
  }
/>
```

**Agrega el enlace en el Sidebar:**

**Archivo: `src/components/layout/Sidebar.tsx`**

```typescript
import { CalendarDays } from "lucide-react";

const menuItems = [
  // ... items existentes
  {
    label: "Citas",
    icon: CalendarDays,
    path: "/citas",
  },
  // ... más items
];
```

## 📦 Optimizaciones de Rendimiento

### Code Splitting

Todas las vistas se cargan de forma diferida usando `React.lazy`:

- El bundle inicial solo contiene el código necesario para el Login
- Las vistas del Dashboard (Pacientes, Servicios, Citas) se cargan bajo demanda
- Chunks manuales separan React, íconos y código de aplicación

### Imágenes Optimizadas

- Formato: WebP (más eficiente que JPEG/PNG)
- Tamaño objetivo: 80-150 KB por imagen
- Compresión: 75-80% de calidad
- Resolución máxima: 1920px de ancho

## 🔧 Scripts de Desarrollo

```bash
# Instalar dependencias
npm install

# Servidor de desarrollo
npm run dev

# Build de producción
npm run build

# Preview del build
npm run preview
```

## 📝 Convenciones de Código

- **TypeScript**: Usar tipos estrictos en todas las interfaces
- **Componentes**: Usar `export function` en lugar de componentes con nombre
- **Imports**: Usar imports nombrados de Lucide React para tree-shaking
- **Estilos**: 100% Tailwind CSS v4, sin archivos CSS adicionales
- **Tema**: Siempre usar variantes `dark:` para soporte de modo oscuro
- **Naming**: Usar PascalCase para componentes, camelCase para funciones/hooks
