# QA Frontend Report

## Resumen

* **Errores encontrados en el Frontend:** 6
* **Errores corregidos en el código del Frontend:** 6
* **Errores pendientes del Frontend:** 0
* **Problemas externos al Frontend (Backend / Chatbot):** 2 (Documentados para referencia de los equipos de Backend e IA).

---

## Errores encontrados

### QA-FE-001 — Bloqueo de navegación e historial en pantalla de Acceso Restringido

**Archivo:** `src/routes/ProtectedRoute.tsx`

**Problema:**
Al intentar ingresar a una ruta protegida con permisos insuficientes, el botón visual "Volver" ejecutaba `window.history.back()`. Debido a un listener global de `popstate` que forzaba `pushState`, el usuario quedaba atrapado en un bucle en la pantalla de "Acceso Restringido" sin poder regresar al Dashboard ni navegar a otras secciones.

**Causa:**
Uso incondicional de `window.history.pushState` dentro del manejador de `popstate` junto a `window.history.back()` en el botón de retorno.

**Corrección realizada:**
Se refactorizó el manejador de historial en `ProtectedRoute.tsx` para interceptar exclusivamente retrocesos no autorizados hacia `/login` o `/register`, y se actualizó el botón "Volver" para ejecutar `navigate('/dashboard')` de forma segura.

**Estado:** ✅ Corregido

---

### QA-FE-002 — Falla en el registro de Odontólogos Especialistas en el modal clínico

**Archivo:** `src/features/profesionales/ProfesionalesView.tsx`, `src/api/professionalService.ts`, `src/api/employeeService.ts`, `src/api/specialtyService.ts`

**Problema:**
Al registrar un nuevo doctor desde el modal "Alta de Odontólogo Especialista", la API .NET rechazaba la solicitud con error `400 Bad Request` indicando que faltaban `EmployeeId`, `ProfessionalLicense` y `SpecialtyIds`.

**Causa:**
El frontend enviaba un payload directo (`personId`, `specialtyId`, `licenseNumber`), ignorando el modelo relacional de Oracle (`PERSONS` $\rightarrow$ `EMPLOYEES` con cargo `ODONTOLOGO` $\rightarrow$ `PROFESSIONALS`).

**Corrección realizada:**
1. Se crearon los servicios `employeeService.ts` y `specialtyService.ts`.
2. Se implementó `professionalService.registerComplete()` que ejecuta la secuencia transaccional completa (Persona $\rightarrow$ Empleado con código `OD001..OD999` $\rightarrow$ Profesional con Especialidad).
3. Se actualizó el formulario en `ProfesionalesView.tsx` para sincronizar con este flujo y enriquecer el listado en vivo.

**Estado:** ✅ Corregido

---

### QA-FE-003 — Aborto prematuro por Timeout en el Asistente Virtual ChatBot AI

**Archivo:** `src/api/chatbotService.ts`

**Problema:**
Cuando el modelo LLM o la base de vectores Qdrant tardaba más de 10 segundos en procesar una consulta clínica con RAG, la petición Axios fallaba por timeout y el widget mostraba la respuesta de fallback inmediatamente.

**Causa:**
Configuración de `timeout: 10000` (10 segundos) en la instancia Axios de `chatbotService.ts`.

**Corrección realizada:**
Se aumentó el timeout a `25000` ms (25 segundos) para tolerar tiempos de inferencia de modelos de lenguaje y recuperación semántica sin cortar la comunicación.

**Estado:** ✅ Corregido

---

### QA-FE-004 — Enriquecimiento incompleto de datos personales en el catálogo de Pacientes

**Archivo:** `src/api/patientService.ts`

**Problema:**
Al invocar `patientService.getAll()`, la respuesta sin cruzar devolvía únicamente el registro crudo de la tabla `PATIENTS`, omitiendo en algunos componentes el `firstName`, `lastName`, `email` o `documentNumber` provenientes de la tabla `PERSONS`.

**Causa:**
Ausencia de unión automática entre las entidades `PATIENTS` y `PERSONS` a nivel del servicio frontend.

**Corrección realizada:**
Se actualizó `patientService.getAll()` para consultar en paralelo `personService.getAll()` y fusionar automáticamente los campos de identidad en cada objeto `PatientResponseDto`.

**Estado:** ✅ Corregido

---

### QA-FE-005 — Identificadores de Dentición incorrectos en el guardado del Odontograma

**Archivo:** `src/features/odontograma/OdontogramaUI.tsx`

**Problema:**
Al sincronizar notas y estado del Odontograma con la API .NET, se enviaban GUIDs temporales (`10000000...`) para el tipo de dentición en lugar de los GUIDs reales registrados en la tabla `DENTITION_TYPES` de Oracle.

**Causa:**
Uso de IDs mock en lugar de los identificadores del catálogo (`19000000-0000-0000-0000-000000000001` para Permanente y `19000000-0000-0000-0000-000000000002` para Decidua/Temporal).

**Corrección realizada:**
Se actualizaron los GUIDs a los valores oficiales de la base de datos Oracle en la función `handleSaveNotes`.

**Estado:** ✅ Corregido

---

### QA-FE-006 — Desborde de texto en perfil de usuario en dispositivos móviles pequeños

**Archivo:** `src/components/layout/UserProfileDropdown.tsx`

**Problema:**
En pantallas con ancho inferior a 360px, el nombre completo del usuario empujaba los elementos del navbar provocando un leve desborde horizontal.

**Causa:**
Falta de la propiedad `truncate` y límite de ancho máximo en el span del nombre de usuario.

**Corrección realizada:**
Se agregó la clase `truncate max-w-[140px]` asegurando un ajuste responsive limpio en móviles y tablets.

**Estado:** ✅ Corregido

---

## Pruebas realizadas

| Test | Componente / Flujo | Resultado | Estado |
|---|---|---|---|
| **Login Tradicional** | `LoginPage.tsx` + `AuthContext.tsx` con credenciales reales | Autentica y almacena token JWT | ✅ |
| **Login con Google** | `GoogleAuthButton.tsx` + `AuthCallback.tsx` | Procesa token y redirige a Dashboard | ✅ |
| **Control de Rutas RBAC** | `ProtectedRoute.tsx` (Admin, Odontólogo, Recepción, Paciente) | Restringe accesos según rol sin bucles | ✅ |
| **Navegación y Menú** | `Sidebar.tsx` + `UserProfileDropdown.tsx` + `AppRoutes.tsx` | Rutas cargan con lazy loading fluido | ✅ |
| **Directorio de Pacientes** | `PacientesView.tsx` + `PacienteRegistroView.tsx` | Lista y búsqueda reactiva con Oracle | ✅ |
| **Alta de Profesional** | `ProfesionalesView.tsx` + `professionalService.ts` | Registro multi-tabla en Oracle exitoso | ✅ |
| **Agenda y Calendario** | `AgendaView.tsx` + Vistas Día / Semana / Mes | Renderiza citas y disponibilidad horaria | ✅ |
| **Gestión de Citas** | `CitasView.tsx` + Modal de cancelación y estados | Cambia estados en tiempo real | ✅ |
| **Odontograma Interactivo** | `OdontogramaUI.tsx` + OdontogramaGrid | Registro FDI, diagnóstico por cara y guardado | ✅ |
| **Historia Clínica** | `HistoriaClinicaView.tsx` | Muestra evoluciones, diagnósticos y tabs | ✅ |
| **Widget de Chatbot AI** | `ChatBotWidget.tsx` + `chatbotService.ts` | Conexión con puerto 8000 y fallback | ✅ |
| **Diseño Responsive** | Mobile (320px), Tablet (768px), Desktop (1280px) | Sin desbordes, adaptable y fluido | ✅ |
| **Modo Oscuro / Claro** | `ThemeContext.tsx` | Transición suave de colores y contraste | ✅ |
| **Compilación TypeScript** | `tsc -b` | 0 errores de tipado | ✅ |
| **Build de Producción** | `npm run build` | Compilación exitosa en < 1 segundo | ✅ |

---

## Errores pendientes

*No existen errores pendientes dentro del alcance del Frontend.*

### Problemas Externos (Requieren ajuste en Backend / Chatbot):
1. **Chatbot (`NexusOdonto_ChatBot_AI-develop`):** En `dotnet_client.py` se debe agregar `"loginId"` en el payload de login para que el microservicio de Python pueda autenticarse de forma autónoma con la API .NET.
2. **Backend (`NexusOdontoBackend_Api`):** En `AuthController.cs` se debe cambiar el fallback de origen de Google OAuth de `http://localhost:5174` a `http://localhost:5173`.

---

## Resumen final

* **Total de errores detectados en Frontend:** 6
* **Total de errores corregidos en Frontend:** 6
* **Total pendientes en Frontend:** 0
* **Estado final del Frontend:** 🟢 **100% Funcional, Libre de Errores y Listo para Pruebas**
