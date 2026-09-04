# QA Report — Frontend (`NexusOdontoFrontend`)

## 1. Resumen

Este informe contiene exclusivamente los errores, inconsistencias, problemas de interfaz (UI/UX), manejo de estado y consumo de APIs detectados en el **Frontend Web de NexusOdonto** (`NexusOdontoFrontend`), desarrollado con React 19, TypeScript, Vite y Tailwind CSS.

---

## 2. Errores Encontrados

### QA-FE-001 — Desfase horario UTC en renderizado de fechas y citas del calendario

**Severidad:** 🟠 Alto

**Archivo:** `src/features/agenda/AgendaData.tsx` y `src/features/citas/CitasView.tsx`

**Línea:** `120-145`

**Funcionalidad afectada:**
Módulo de Agenda interactiva, visualización de citas por Día, Semana y Mes, y filtrado cronológico.

**Descripción:**
Al convertir fechas recibidas en formato ISO UTC desde la API (por ejemplo `"2026-09-05T00:00:00Z"`), el uso directo de `new Date(fechaStr)` en navegadores ubicados en husos horarios occidentales como Colombia, Ecuador o Perú (`UTC-5`) resta 5 horas automáticamente. Esto traslada la cita a las 7:00 PM del día anterior, ubicando la tarjeta médica en el día erróneo del calendario semanal.

**Cómo reproducirlo:**
1. Crear una cita en base de datos para el día 5 de Septiembre a las 08:00 AM UTC.
2. Abrir la vista `/agenda` en modo Semana o Mes con la zona horaria del navegador en GMT-5.
3. Observar la columna en la que se posiciona la cita.

**Resultado esperado:**
La cita debe posicionarse en la columna correspondiente al día 5 de Septiembre.

**Resultado actual:**
La cita se posiciona visualmente en la columna del día 4 de Septiembre a última hora.

**Causa probable:**
El método `new Date(isoString)` interpreta la fecha en tiempo universal (UTC) y la convierte al horario local restando el offset horario sin normalizar previamente año, mes y día de forma local.

**Impacto:**
Pérdida de sincronía visual entre el odontólogo y el paciente, provocando errores en la asistencia y control de la agenda médica.

**Solución sugerida:**
Parsear las fechas extrayendo directamente la porción `"YYYY-MM-DD"` (`fechaStr.split('T')[0]`) o utilizar librerías con soporte de timezone estricto como `date-fns-tz` o `dayjs`.

---

### QA-FE-002 — Peticiones HTTP redundantes y ausencia de caché en catálogos estáticos

**Severidad:** 🟡 Medio

**Archivo:** `src/features/pacientes/PacientesView.tsx`, `src/features/servicios/ServiciosView.tsx`

**Línea:** `useEffect` en montaje de vistas

**Funcionalidad afectada:**
Navegación general, consumo de red y rendimiento del cliente.

**Descripción:**
Cada vez que el usuario navega entre los módulos de Pacientes, Citas, Agenda y Servicios, cada componente ejecuta peticiones `GET` independientes a endpoints que devuelven catálogos estáticos (`/api/v1/DocumentTypes`, `/api/v1/Sexes`, `/api/v1/Specialties`), multiplicando el tráfico de red de forma innecesaria.

**Cómo reproducirlo:**
1. Abrir las herramientas de desarrollo del navegador (pestaña Red / Network).
2. Alternar repetidamente entre "Pacientes", "Agenda", "Servicios" y "Citas".
3. Observar la duplicación de solicitudes idénticas a `/v1/DocumentTypes`.

**Resultado esperado:**
Los catálogos estáticos deben consultarse una única vez por sesión activa y almacenarse en memoria.

**Resultado actual:**
Se disparan de 3 a 5 peticiones GET idénticas por cada cambio de pestaña.

**Causa probable:**
Cada vista gestiona su propio estado local mediante `useEffect` sin una capa de caché compartida.

**Impacto:**
Sobrecarga innecesaria en la base de datos Oracle y mayor latencia percibida por el usuario en conexiones móviles.

**Solución sugerida:**
Implementar un Contexto global (`CatalogContext`) o integrar `TanStack Query (React Query)` para cachear catálogos con un `staleTime` prolongado (ej: 1 hora).

---

### QA-FE-003 — Desplazamiento horizontal forzado en tablas clínicas en pantallas móviles

**Severidad:** 🟡 Medio

**Archivo:** `src/features/historia-clinica/HistoriaClinicaView.tsx`, `src/features/usuarios/UsuariosView.tsx`

**Línea:** `310-380`

**Funcionalidad afectada:**
Módulo de Historias Clínicas y Administración de Usuarios en dispositivos móviles.

**Descripción:**
En resoluciones móviles (<640px), las tablas de atenciones clínicas y listado de usuarios renderizan más de 6 columnas en una cuadrícula rígida `table`, provocando desbordamiento y requiriendo scroll horizontal obligatorio para acceder a los botones de acción.

**Cómo reproducirlo:**
1. Abrir la vista `/historia-clinica` o `/usuarios` en un teléfono móvil o en el emulador a 375px de ancho.
2. Intentar consultar las acciones del último registro de la tabla.

**Resultado esperado:**
La interfaz debe transformar la tabla en tarjetas verticales responsivas (`Card View`) en pantallas pequeñas.

**Resultado actual:**
Aparece una barra de desplazamiento horizontal y los botones de acción quedan fuera de la pantalla visible.

**Causa probable:**
Uso de elementos `<table>` estándar sin clases condicionales `hidden sm:table-cell` o vista alternativa en tarjetas.

**Impacto:**
Dificultad de uso y mala experiencia de usuario (UX) para odontólogos que utilicen tablets o teléfonos móviles.

**Solución sugerida:**
Aplicar un patrón de visualización híbrido: `<div className="md:hidden space-y-3">...tarjetas...</div>` y `<table className="hidden md:table">...</table>`.

---

### QA-FE-004 — Ausencia de validación de formato internacional (E.164) en campos de teléfono

**Severidad:** 🟡 Medio

**Archivo:** `src/features/pacientes/components/PacienteForm.tsx`, `src/features/profesionales/ProfesionalesView.tsx`

**Línea:** Validación del esquema Zod / inputs de teléfono

**Funcionalidad afectada:**
Formularios de alta de pacientes y odontólogos.

**Descripción:**
Los campos de teléfono celular aceptan texto arbitrario o cadenas con menos de 7 dígitos sin validar el código de país ni la estructura numérica estándar internacional requerida para la integración con WhatsApp.

**Cómo reproducirlo:**
1. Ir a `/pacientes/nuevo`.
2. Escribir `"12345"` o `"abc-celular"` en el campo de teléfono.
3. Guardar el formulario.

**Resultado esperado:**
El validador Zod debe rechazar la entrada con el mensaje: *"El teléfono debe contener al menos 10 dígitos numéricos válidos (ej. +57 300 123 4567)"*.

**Resultado actual:**
El formulario permite registrar el dato no estructurado.

**Causa probable:**
El validador Zod solo comprueba `z.string().min(1)` sin aplicar expresión regular de formato telefónico.

**Impacto:**
El Chatbot de WhatsApp de Evolution API no podrá enviar recordatorios automáticos a pacientes con números mal formateados.

**Solución sugerida:**
Agregar validación Regex en Zod: `z.string().regex(/^\+?[0-9]{10,15}$/, "Formato telefónico no válido")`.

---

### QA-FE-005 — Colisión visual menor en tooltip de iniciales en dispositivos ultracompactos

**Severidad:** 🔵 Bajo

**Archivo:** `src/components/layout/UserProfileDropdown.tsx`

**Línea:** `108-112`

**Funcionalidad afectada:**
Barra de navegación superior (Header) en pantallas < 360px.

**Descripción:**
En teléfonos de tamaño reducido (como iPhone SE o Galaxy Fold cerrado a 320px), el contenedor del nombre completo del usuario genera un empuje de 10px sobre el selector de tema oscuro/claro.

**Cómo reproducirlo:**
1. Ajustar el emulador de navegador a 320px de ancho.
2. Iniciar sesión con un usuario con nombre largo (ej. "Dr. Roberto Silva Morales").

**Resultado esperado:**
El nombre debe truncarse automáticamente o mostrar solo las iniciales en el avatar.

**Resultado actual:**
El navbar genera un leve scroll horizontal de 10px.

**Causa probable:**
Falta de clase `truncate` y ancho máximo restringido en el span del nombre.

**Impacto:**
Estético menor en dispositivos móviles muy pequeños.

**Solución sugerida:**
Agregar clases `truncate max-w-[110px]` en el contenedor del nombre.

---

## 3. Mejoras de Frontend

### QA-FE-006 — Adopción de TanStack Query para estado de servidor y caché

**Severidad:** ⚪ Mejora

**Archivo:** Arquitectura de servicios `src/api/*`

**Descripción:**
Centralizar todas las peticiones asíncronas de la API en hooks personalizados con `useQuery` y `useMutation` (TanStack Query), lo que proveerá reintentos automáticos, sincronización en segundo plano, mutaciones optimistas y eliminación de boilerplate de `loading`/`error` en cada componente.

---

## 4. Errores de Integración Relacionados

* **Frontend ↔ Backend (Google OAuth Redirect):** El backend redirige tras el login de Google al puerto `5174`, mientras el frontend corre en `5173`. Documentado detalladamente en `QA_REPORT_back.md` (QA-BE-001).
* **Frontend ↔ Backend (Permisos de Roles en Oracle):** La API devuelve permisos vacíos `[]` para los tokens de Recepcionista y Odontólogo, impidiendo el acceso a catálogos necesarios. Documentado en `QA_REPORT_back.md` (QA-BE-002).

---

## Resumen

| Severidad  | Cantidad |
| ---------- | -------: |
| 🔴 Crítico |        0 |
| 🟠 Alto    |        1 |
| 🟡 Medio   |        3 |
| 🔵 Bajo    |        1 |
| ⚪ Mejora   |        1 |

## Estado

**🟡 Problemas moderados** (El frontend compila con 0 errores de TypeScript y cuenta con build estable; requiere ajustes menores en manejo de zona horaria y validaciones).
