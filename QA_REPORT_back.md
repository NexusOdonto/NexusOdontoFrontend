# QA Report — Backend (`NexusOdontoBackend_Api`)

## 1. Resumen

Este informe contiene exclusivamente los errores, problemas de seguridad, validaciones, base de datos Oracle, controladores, servicios y DTOs detectados en la **API .NET 9 de NexusOdonto** (`NexusOdontoBackend_Api`).

---

## 2. Errores Encontrados

### QA-BE-001 — Fallback de puerto Frontend hardcodeado en redirección de Google OAuth

**Severidad:** 🔴 Crítico

**Archivo:** `Api/Controllers/Auth/AuthController.cs`

**Línea:** `44`, `55`, `76`

**Funcionalidad afectada:**
Inicio de sesión con Google OAuth (`/api/auth/google/login`, `/api/auth/google/finish`).

**Descripción:**
En `AuthController.cs`, el controlador fija de manera estática el puerto `5174` como fallback para redirigir al navegador una vez completada la autenticación con Google:
```csharp
var frontendOrigin = "http://localhost:5174";
```
Dado que el servidor de desarrollo Vite levanta por defecto en el puerto `5173`, cuando el navegador es redirigido por el callback OAuth a `http://localhost:5174/auth/callback`, el usuario recibe un error de conexión no disponible (`ERR_CONNECTION_REFUSED`), bloqueando el flujo completo de autenticación de Google.

**Cómo reproducirlo:**
1. Levantar el frontend en `http://localhost:5173`.
2. Acceder a `/login` y hacer clic en "Continuar con Google".
3. Completar el inicio de sesión en Google.
4. El backend finaliza el flujo y envía una redirección HTTP 302 a `http://localhost:5174/auth/callback?token=...`.

**Resultado esperado:**
La redirección debe enviarse al origen real que inició la solicitud (`http://localhost:5173`) o leerse de la configuración `appsettings.json`.

**Resultado actual:**
El navegador intenta cargar `http://localhost:5174` y se rompe la conexión.

**Causa probable:**
Uso de URLs hardcodeadas de pruebas locales en lugar de inyectar la configuración `Frontend:Url` mediante `IConfiguration`.

**Impacto:**
Imposibilidad de iniciar sesión con Google en cualquier entorno donde el frontend no esté forzado al puerto 5174.

**Solución sugerida:**
Inyectar `IConfiguration` en `AuthController` y leer la propiedad `configuration["Frontend:BaseUrl"] ?? "http://localhost:5173"`.

---

### QA-BE-002 — Permisos RBAC vacíos en tokens de Recepcionista y Odontólogo en Oracle

**Severidad:** 🟠 Alto

**Archivo:** `odontologia.sql` / `Application/Services/AuthService.cs`

**Línea:** Mapeo de `ROLE_PERMISSIONS` en Base de Datos

**Funcionalidad afectada:**
Control de acceso por roles (RBAC) para el personal de clínica.

**Descripción:**
Al realizar login con un usuario de rol Recepcionista (`1087654321`) u Odontólogo (`1098765432`), el endpoint `/api/auth/login` devuelve el array de permisos completamente vacío (`"permissions": []`).
En la base de datos Oracle, la tabla intermedia `ROLE_PERMISSIONS` solo cuenta con asignaciones para el rol Administrador (`13000000-0000-0000-0000-000000000001`). Como resultado, cuando una recepcionista intenta consultar catálogos clínicos o la lista de especialidades para agendar citas, la API devuelve `403 Forbidden`.

**Cómo reproducirlo:**
1. Ejecutar `POST /api/auth/login` con credenciales de Recepcionista (`1087654321` / `Recepcion123!`).
2. Utilizar el Bearer token obtenido para consultar `GET /api/v1/Specialties` o `GET /api/v1/DocumentTypes`.
3. El backend responde con `403 Forbidden`.

**Resultado esperado:**
El token debe contener los permisos necesarios de consulta y gestión operativa (`CATALOGS:VIEW`, `APPOINTMENTS:VIEW`, `APPOINTMENTS:CREATE`, `PATIENTS:VIEW`, `PATIENTS:CREATE`).

**Resultado actual:**
La API rechaza la petición por falta de claims de permisos en el token.

**Causa probable:**
El script de inicialización de datos de prueba (`odontologia.sql`) omitió poblar las filas de `ROLE_PERMISSIONS` para los roles `13000000-0000-0000-0000-000000000002` (Odontólogo) y `13000000-0000-0000-0000-000000000003` (Recepcionista).

**Impacto:**
Los roles operativos no pueden consultar catálogos básicos en la API protegida.

**Solución sugerida:**
Ejecutar un script de migración SQL en Oracle que asocie los permisos de lectura y creación de catálogos y citas a los roles de Recepción y Odontología.

---

### QA-BE-003 — Inconsistencia de idioma en validadores FluentValidation

**Severidad:** 🟡 Medio

**Archivo:** `Application/Validators/Employees/CreateEmployeeDtoValidator.cs`, `CreateProfessionalDtoValidator.cs`

**Línea:** `15-30`

**Funcionalidad afectada:**
Respuestas de error 400 Bad Request / ProblemDetails de la API.

**Descripción:**
Varios validadores de entidades de empleados y profesionales emiten mensajes de error en idioma inglés (ej. `"Employee code must match format: 2-3 letters followed by 3 digits (e.g. OD001)"` o `"At least one specialty is required"`), mientras que otros validadores del sistema emiten mensajes en español.

**Cómo reproducirlo:**
1. Enviar una solicitud `POST /api/v1/Employees` con un código de empleado no correlativo.
2. Analizar el cuerpo JSON del error devuelto por la API.

**Resultado esperado:**
Los mensajes de validación deben estar estandarizados en español en toda la API.

**Resultado actual:**
Se mezclan mensajes en inglés y español en las respuestas de validación.

**Causa probable:**
Mensajes por defecto o literales en inglés configurados en las reglas `.WithMessage(...)` de FluentValidation.

**Impacto:**
Inconsistencia en los mensajes de error mostrados al usuario final cuando el frontend propaga los detalles del servidor.

**Solución sugerida:**
Traducir todas las cadenas literales en los validadores de la capa `Application` al español.

---

### QA-BE-004 — Envolturas de respuesta heterogéneas entre controladores

**Severidad:** 🟡 Medio

**Archivo:** `Api/Controllers/Appointments/AppointmentsController.cs`, `Patients/PatientsController.cs`

**Línea:** Métodos `GetAll`

**Funcionalidad afectada:**
Serialización y consumo de endpoints de colecciones de datos.

**Descripción:**
Algunos controladores devuelven arreglos JSON planos directos `[...]`, mientras que otros devuelven objetos paginados `{ items: [...], totalCount: 15, pageNumber: 1 }`. Esta falta de homogeneidad obliga a los clientes (Frontend y Chatbot) a implementar lógica defensiva para determinar si la respuesta es un array o un objeto.

**Cómo reproducirlo:**
1. Consultar `GET /api/v1/Services` (devuelve array directo `[...]`).
2. Consultar `GET /api/v1/AuditEvents` o endpoints paginados (devuelve `{ items: [...] }`).

**Resultado esperado:**
Un estándar unificado para todas las respuestas de listado en la API (ej: `ApiResponse<T>` o lista paginada estándar).

**Resultado actual:**
Formatos dispares entre distintos módulos de la API.

**Causa probable:**
Diferentes patrones de diseño implementados por distintos desarrolladores en cada controlador.

**Impacto:**
Mayor complejidad en los clientes consumidores y riesgo de errores de deserialización.

**Solución sugerida:**
Implementar un `Result<T>` o `PagedResult<T>` genérico uniforme en la capa `Application.Common`.

---

### QA-BE-005 — Excepción no controlada en consultas de antecedentes clínicos vacíos

**Severidad:** 🔵 Bajo

**Archivo:** `Infrastructure/Repositories/ClinicalHistoriesRepository.cs`

**Línea:** `65-80`

**Funcionalidad afectada:**
Consulta de historia clínica para pacientes recién registrados.

**Descripción:**
Cuando un paciente recién creado no cuenta con antecedentes registrados en la tabla `PATIENT_ANTECEDENTS`, el join relacional en Entity Framework puede generar un valor nulo que dispara un log de advertencia en el servidor si no se utiliza `DefaultIfEmpty()`.

**Cómo reproducirlo:**
1. Crear un paciente nuevo sin antecedentes.
2. Consultar `GET /api/v1/ClinicalHistories/{patientId}`.

**Resultado esperado:**
Retornar un objeto de historia clínica con la colección de antecedentes vacía `[]` y código 200 OK.

**Resultado actual:**
El servidor registra warnings en consola por navegación en relaciones nulas.

**Causa probable:**
Falta de inicialización por defecto de colecciones en la entidad de dominio.

**Impacto:**
Advertencias en los logs del servidor .NET.

**Solución sugerida:**
Asegurar que la propiedad de navegación `Antecedents = new List<PatientAntecedent>()` esté siempre inicializada en la entidad.

---

## 3. Mejoras de Backend

### QA-BE-006 — Generación automática de especificación OpenAPI / TypeScript Contracts

**Severidad:** ⚪ Mejora

**Archivo:** Configuración de Swagger / Build Pipeline

**Descripción:**
Integrar una herramienta en el ciclo de integración continua (como `NSwag` o `openapi-typescript`) que genere automáticamente las interfaces y clientes TypeScript para el Frontend cada vez que se modifique un DTO en C#.

---

## 4. Errores de Integración Relacionados

* **Backend ↔ Chatbot (Nombre de propiedad en Login):** El Chatbot en Python envía `{"login": "...", "password": "..."}` mientras que `LoginRequestDto` espera `LoginId`. Documentado en `QA_REPORT_bot.md` (QA-BOT-001).
* **Backend ↔ Frontend (Google OAuth Callback):** El frontend corre en el puerto 5173 mientras el callback de .NET redirige a 5174 (QA-BE-001).

---

## Resumen

| Severidad  | Cantidad |
| ---------- | -------: |
| 🔴 Crítico |        1 |
| 🟠 Alto    |        1 |
| 🟡 Medio   |        2 |
| 🔵 Bajo    |        1 |
| ⚪ Mejora   |        1 |

## Estado

**🟠 Problemas importantes** (La API .NET es robusta y compila correctamente, pero requiere corregir el puerto de redirección de Google OAuth y asignar los permisos a los roles de Recepción y Odontología en Oracle).
