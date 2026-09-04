# QA Report — Auditoría Completa

## 1. Resumen

Se ha llevado a cabo una **auditoría técnica integral y exhaustiva de Aseguramiento de Calidad (QA)** sobre la plataforma clínica **NexusOdonto**, abarcando sus tres subsistemas principales:
1. **Frontend Web:** Aplicación SPA desarrollada en React 19 + TypeScript + Vite + Tailwind CSS (`NexusOdontoFrontend`).
2. **Backend API:** Arquitectura limpia .NET 9 Web API con Entity Framework Core y persistencia en Base de Datos Oracle (`NexusOdontoBackend_Api`).
3. **Chatbot & Inteligencia Artificial:** Microservicio en Python con FastAPI, LangGraph, LangChain y conectores Evolution API / WhatsApp (`NexusOdonto_ChatBot_AI-develop`).

El proceso de auditoría incluyó análisis estático de código fuente, verificación de tipado e interfaces DTO, ejecución de suites de pruebas automáticas (`qa_suite.mjs`), pruebas funcionales de roles y permisos (RBAC), validaciones de seguridad, análisis de rendimiento, responsividad y coherencia en la integración entre los tres subsistemas.

### Métricas Generales de la Auditoría:
* **Total de Hallazgos / Errores Documentados:** 14
* **🔴 Críticos:** 2
* **🟠 Altos:** 4
* **🟡 Medios:** 5
* **🔵 Bajos:** 2
* **⚪ Mejoras:** 1

---

## 2. Resumen de errores

| ID | Severidad | Área | Error | Estado |
|---|---|---|---|---|
| **QA-001** | 🔴 Crítico | Integración (Chatbot ↔ Backend) | Formato inválido del payload de autenticación en `DotNetClient` (`documentNumber`/`login` vs `loginId`) que bloquea el login del Chatbot contra la API .NET | Pendiente |
| **QA-002** | 🔴 Crítico | Backend (Auth / OAuth) | Puerto frontend hardcodeado (`http://localhost:5174` vs `5173`) en fallback de redirección Google OAuth en `AuthController.cs` | Pendiente |
| **QA-003** | 🟠 Alto | Frontend (Navegación / Rutas) | Bucle de bloqueo en `window.history.back()` dentro de `ProtectedRoute.tsx` al denegar acceso por RBAC | Pendiente |
| **QA-004** | 🟠 Alto | Chatbot (Seguridad / Webhook) | Comparación insegura/fallida de `settings.webhook_secret` en middleware de Evolution API | Pendiente |
| **QA-005** | 🟠 Alto | Backend / Base de Datos | Ausencia de permisos RBAC asignados por defecto al rol Recepcionista y Odontólogo en Oracle (`permissions: []`) | Pendiente |
| **QA-006** | 🟠 Alto | Frontend (Agenda / Citas) | Desfase de zona horaria UTC vs Local (UTC-5) en el cálculo de fechas de citas en `AgendaData.tsx` | Pendiente |
| **QA-007** | 🟡 Medio | Frontend (Odontograma) | Mapeo incompleto de dientes temporales (deciduos 51-85) en la carga de hallazgos clínicos de `OdontogramaUI.tsx` | Pendiente |
| **QA-008** | 🟡 Medio | Chatbot (Seguridad / CORS) | Configuración de CORS con `allow_origins=["*"]` junto a `allow_credentials=True` en `main.py` | Pendiente |
| **QA-009** | 🟡 Medio | Frontend (Rendimiento) | Solicitudes redundantes y sin caché de catálogos estáticos (`DocumentTypes`, `Sexes`, `Services`) en cambios de vista | Pendiente |
| **QA-010** | 🟡 Medio | Frontend (Validación de Formularios) | Ausencia de máscara o validación de formato internacional en campo teléfono móvil en modales clínicos | Pendiente |
| **QA-011** | 🟡 Medio | Backend (Validación DTO) | Mensajes de validación en inglés devueltos por FluentValidation en endpoints de empleados y profesionales | Pendiente |
| **QA-012** | 🔵 Bajo | Frontend (UI/UX) | Tooltip de iniciales en `UserProfileDropdown.tsx` muestra contenedor rectangular en pantallas móviles pequeñas (<360px) | Pendiente |
| **QA-013** | 🔵 Bajo | Chatbot (Manejo de Errores) | Timeout estático corto (10s) en peticiones RAG y embeddings cuando la base de vectores Qdrant está fría | Pendiente |
| **QA-014** | ⚪ Mejora | Arquitectura / Frontend | Implementación de React Query / TanStack Query o Zustand para centralizar el caché de entidades Oracle | Pendiente |

---

## 3. Errores del Frontend

### QA-003 — Bucle de retención en botón 'Volver' en pantalla de Acceso Restringido

**Severidad:** 🟠 Alto

**Área:** Frontend

**Archivo:** `src/routes/ProtectedRoute.tsx`

**Línea:** `21-32`, `91-96`

**Descripción:**
En `ProtectedRoute.tsx`, se implementó un manejador para interceptar el evento `popstate` del navegador e invocar `window.history.pushState(null, '', window.location.href)` para evitar que el usuario vuelva a páginas de login tras autenticarse. Sin embargo, en la pantalla de "Acceso Restringido" (cuando un usuario con rol insuficiente intenta entrar a una ruta no autorizada), el botón visual "Volver" ejecuta `window.history.back()`. Al ejecutarse, el listener `popstate` se dispara inmediatamente y empuja de nuevo la URL actual al historial, provocando que el usuario quede atrapado en la pantalla de bloqueo sin poder retroceder con el botón provisto.

**Cómo reproducirlo:**
1. Iniciar sesión con un usuario de rol `PACIENTE` o `RECEPCIONISTA`.
2. Escribir manualmente en la barra del navegador una URL restringida (ejemplo: `/roles-permisos` o `/usuarios`).
3. Se renderiza la tarjeta de "Acceso Restringido".
4. Hacer clic en el botón "Volver".

**Resultado esperado:**
La aplicación debe retornar a la ruta anterior permitida o al `/dashboard`.

**Resultado actual:**
La pantalla parpadea y permanece en "Acceso Restringido" debido a la auto-inserción en el historial de navegación.

**Causa probable:**
El listener global `popstate` no distingue entre una navegación estándar del navegador y el clic intencional en el botón "Volver".

**Impacto:**
Afecta la navegación y experiencia de usuario (UX) en el control de acceso por roles.

**Solución recomendada:**
En lugar de invocar `window.history.back()` en el botón, utilizar `navigate(-1)` controlando si la ruta anterior era válida o redirigir directamente a `/dashboard` mediante `navigate('/dashboard')`.

---

### QA-006 — Desfase horario UTC en renderizado de citas y calendario

**Severidad:** 🟠 Alto

**Área:** Frontend

**Archivo:** `src/features/agenda/AgendaData.tsx` y `src/features/citas/CitasView.tsx`

**Línea:** `120-145`

**Descripción:**
Al recibir fechas en formato ISO UTC del backend (ej: `"2026-09-04T00:00:00Z"`), la conversión mediante `new Date(fechaStr).getDay()` o `getDate()` en navegadores con zona horaria Colombia/Ecuador/Perú (`UTC-5`) retrocede 5 horas, ubicando la cita a las 7:00 PM del día anterior, desplazando visualmente la cita al día incorrecto del calendario.

**Cómo reproducirlo:**
1. Registrar una cita para el día 5 de Septiembre a las 08:00 AM desde la base de datos o API.
2. Abrir la vista `/agenda` en modo Semana o Mes.
3. Observar la columna en la que se posiciona la cita.

**Resultado esperado:**
La cita debe posicionarse en el casillero correspondiente al día 5 de Septiembre.

**Resultado actual:**
En navegadores bajo zona horaria UTC-5, la cita se muestra en el día 4 de Septiembre en horas de la noche.

**Causa probable:**
Uso directo del constructor `new Date()` sin normalizar o interpretar las cadenas ISO separando componentes de año, mes y día de forma local.

**Impacto:**
Pérdida de sincronía visual en la agenda médica y riesgo de confusión en los horarios de atención clínica.

**Solución recomendada:**
Utilizar un formateador de fecha que parseé los componentes año, mes y día (`dateStr.split('T')[0]`) o emplear `date-fns`/`dayjs` con soporte de zona horaria local.

---

### QA-007 — Mapeo incompleto de odontograma en dentición temporal/decidua

**Severidad:** 🟡 Medio

**Área:** Frontend

**Archivo:** `src/features/odontograma/OdontogramaUI.tsx`

**Línea:** `210-245`

**Descripción:**
El componente visual del odontograma renderiza perfectamente los 32 dientes de la dentición permanente adulta (cuadrantes 1 al 4, piezas 11 a 48). No obstante, en pacientes pediátricos con dentición decidua (piezas 51 a 85), los hallazgos recibidos desde la API .NET no encuentran coincidencia en el array de piezas activas y se omiten visualmente sin alertar al facultativo.

**Cómo reproducirlo:**
1. Abrir la vista `/odontograma`.
2. Cargar la ficha de un paciente menor de edad con registro de hallazgos en piezas 54 o 61.
3. Visualizar el mapa dental.

**Resultado esperado:**
Debe existir un selector de tipo de dentición (Adulto / Pediátrico / Mixto) que renderice los cuadrantes temporales 5, 6, 7 y 8.

**Resultado actual:**
Solo se visualizan los dientes permanentes 11 a 48, ocultando los hallazgos pediátricos.

**Causa probable:**
El array de dientes inicializado en el estado local solo contiene las constantes de dentición definitiva.

**Impacto:**
Inconsistencia en la visualización de historias clínicas odontopediátricas.

**Solución recomendada:**
Añadir una pestaña o toggle de alternancia "Dentición Permanente / Dentición Temporal / Mixta" que conmute el set de dientes renderizados en el SVG interactivo.

---

### QA-009 — Solicitudes redundantes y ausencia de caché en catálogos estáticos

**Severidad:** 🟡 Medio

**Área:** Frontend

**Archivo:** `src/features/pacientes/PacientesView.tsx`, `src/features/servicios/ServiciosView.tsx`

**Línea:** `useEffect` de montaje

**Descripción:**
Cada vez que el usuario navega entre diferentes módulos (Pacientes $\rightarrow$ Citas $\rightarrow$ Servicios $\rightarrow$ Agenda), cada componente vuelve a disparar llamadas HTTP independientes a endpoints estáticos como `/api/v1/DocumentTypes`, `/api/v1/Sexes`, `/api/v1/Specialties` y `/api/v1/AppointmentStatuses`, generando tráfico innecesario y latencia de red.

**Cómo reproducirlo:**
1. Abrir las herramientas de desarrollador (F12) en la pestaña Network.
2. Alternar entre las pestañas "Pacientes", "Agenda", "Servicios" y "Citas".
3. Observar la duplicación continua de peticiones GET a `/v1/DocumentTypes` y catálogos.

**Resultado esperado:**
Los catálogos que rara vez cambian deberían solicitarse una sola vez por sesión y mantenerse en caché en memoria o contexto global.

**Resultado actual:**
Se ejecutan entre 4 y 6 peticiones HTTP idénticas en cada cambio de vista.

**Causa probable:**
Ausencia de una capa de caché de datos (como React Query o un almacén Zustand/Context centralizado para catálogos).

**Impacto:**
Consumo innecesario de recursos del servidor Oracle y aumento del tiempo de renderizado percibido por el usuario.

**Solución recomendada:**
Crear un `CatalogContext` o hook `useCatalogs` que guarde en memoria los catálogos tras la primera consulta durante la sesión activa.

---

### QA-010 — Falta de validación y formateo estricto en campos telefónicos

**Severidad:** 🟡 Medio

**Área:** Frontend

**Archivo:** `src/features/pacientes/PacienteRegistroView.tsx`, `src/features/profesionales/ProfesionalesView.tsx`

**Línea:** Inputs de teléfono móvil

**Descripción:**
Los campos de teléfono aceptan cualquier cadena de texto arbitraria sin validar código de país, cantidad mínima de dígitos numéricos ni longitud estándar internacional (E.164), lo cual genera discrepancias cuando el Chatbot WhatsApp intenta enviar recordatorios automáticos de citas.

**Cómo reproducirlo:**
1. Ingresar al formulario de registro de paciente o nuevo odontólogo.
2. Escribir en el teléfono texto como `"telefono123"` o `"123"`.
3. Enviar el formulario.

**Resultado esperado:**
El formulario debe validar que el número contenga al menos 10 dígitos numéricos válidos (ej: `+57 300 123 4567`).

**Resultado actual:**
El formulario se envía y almacena un número que el motor de mensajería WhatsApp de Evolution API no podrá procesar.

**Causa probable:**
El input `type="text"` no cuenta con expresión regular de validación (`pattern`) ni máscara de entrada.

**Impacto:**
Falla en la entrega de recordatorios automáticos por WhatsApp por números telefónicos mal formateados.

**Solución recomendada:**
Implementar validación con Regex `^\+?[0-9]{10,15}$` y formateador visual automático de número telefónico.

---

### QA-012 — Desborde visual menor en iniciales de usuario en pantallas ultracompactas

**Severidad:** 🔵 Bajo

**Área:** Frontend

**Archivo:** `src/components/layout/UserProfileDropdown.tsx`

**Línea:** `45-55`

**Descripción:**
En dispositivos móviles con pantallas de ancho inferior a 360px (ej: iPhone SE o Galaxy Fold cerrado), el contenedor del nombre de usuario y rol colisiona levemente con el botón de alternancia de tema oscuro/claro en la barra superior.

**Cómo reproducirlo:**
1. Abrir la consola de desarrollador y activar la vista adaptable a 320px de ancho.
2. Observar el header superior.

**Resultado esperado:**
El nombre del usuario debe ocultarse con clase `hidden sm:block` o truncarse con elipsis `truncate max-w-[100px]`.

**Resultado actual:**
El texto genera un ligero desplazamiento horizontal de 12px en el navbar.

**Causa probable:**
Falta de clase `truncate` y `max-w` en el contenedor del nombre.

**Impacto:**
Estético menor en dispositivos de pantalla muy reducida.

**Solución recomendada:**
Aplicar `hidden md:inline-block` o `max-w-[110px] truncate` en la etiqueta de texto del usuario.

---

## 4. Errores del Backend

### QA-002 — Puerto de origen Frontend hardcodeado en redirección Google OAuth

**Severidad:** 🔴 Crítico

**Área:** Backend (Auth Controller)

**Archivo:** `NexusOdontoBackend_Api/Api/Controllers/Auth/AuthController.cs`

**Línea:** `44`, `55`, `76`

**Descripción:**
En `AuthController.cs`, los métodos `GoogleLogin` y `GoogleCallback` definen como fallback estático el origen frontend `http://localhost:5174`:
```csharp
var frontendOrigin = "http://localhost:5174";
```
Dado que Vite levanta por defecto en el puerto estándar `5173`, cuando el usuario completa el flujo de inicio de sesión con Google y la cookie intermedia no transfiere el origen dinámico, el backend redirige al usuario a `http://localhost:5174/auth/callback`, resultando en un error de "Conexión rechazada" (ERR_CONNECTION_REFUSED) en el navegador del usuario final.

**Cómo reproducirlo:**
1. Ejecutar el frontend en el puerto por defecto `http://localhost:5173`.
2. Hacer clic en el botón "Continuar con Google" en `/login`.
3. Completar la autenticación en la ventana de Google.
4. El backend procesa el callback y redirige a `http://localhost:5174/auth/callback`.

**Resultado esperado:**
El backend debe redirigir al puerto exacto desde el cual se originó la petición (`http://localhost:5173`).

**Resultado actual:**
El navegador es enviado a `http://localhost:5174`, donde no hay ningún servidor escuchando.

**Causa probable:**
Fallback estático configurado manualmente para un entorno de pruebas previo sin leer la configuración de `appsettings.json` ni el header `Referer` / `Origin`.

**Impacto:**
Imposibilidad total de iniciar sesión mediante Google OAuth a menos que el frontend corra forzosamente en el puerto 5174.

**Solución recomendada:**
Inyectar `IConfiguration` para leer `Frontend:BaseUrl` o usar `http://localhost:5173` como fallback predeterminado.

---

### QA-005 — Ausencia de permisos funcionales en tokens JWT de Recepción y Odontología

**Severidad:** 🟠 Alto

**Área:** Backend (Auth / RBAC)

**Archivo:** `NexusOdontoBackend_Api/Application/Services/AuthService.cs` y migración Oracle

**Línea:** `130-160`

**Descripción:**
Al autenticarse con el usuario Recepcionista (`1087654321`) u Odontólogo (`1098765432`), la respuesta del endpoint `/api/auth/login` y `/api/auth/me` devuelve el array de permisos completamente vacío: `"permissions": []`.
Esto ocurre porque en la base de datos Oracle las tuplas de `ROLE_PERMISSIONS` solo fueron asignadas exhaustivamente al rol Administrador (`13000000-0000-0000-0000-000000000001`). En consecuencia, cuando una recepcionista intenta consultar `/api/v1/Specialties` o `/api/v1/DocumentTypes` necesarios para crear citas, la API devuelve `403 Forbidden`.

**Cómo reproducirlo:**
1. Ejecutar `POST /api/auth/login` con credenciales de Recepcionista (`1087654321` / `Recepcion123!`).
2. Inspeccionar el payload devuelto: `permissions` es `[]`.
3. Enviar una petición a `/api/v1/Specialties` con el Bearer Token obtenido.

**Resultado esperado:**
El token debe contener permisos como `CATALOGS:VIEW`, `APPOINTMENTS:VIEW`, `APPOINTMENTS:CREATE`, `PATIENTS:VIEW`, `PATIENTS:CREATE`.

**Resultado actual:**
El backend devuelve `403 Forbidden` bloqueando la operación clínica.

**Causa probable:**
Falta de inserción de las relaciones `ROLE_PERMISSIONS` para los roles `13000000-0000-0000-0000-000000000002` (Odontólogo) y `13000000-0000-0000-0000-000000000003` (Recepcionista) en el script `odontologia.sql`.

**Impacto:**
Los roles de Recepción y Odontólogo sufren bloqueos intermitentes en la API en operaciones cotidianas de agenda y catálogo.

**Solución recomendada:**
Poblar en la base de datos Oracle las asignaciones de permisos de lectura y creación de catálogos y citas para los roles operativos.

---

### QA-011 — Mensajes de validación en idioma inglés en validadores FluentValidation

**Severidad:** 🟡 Medio

**Área:** Backend (Validaciones)

**Archivo:** `NexusOdontoBackend_Api/Application/Validators/Employees/CreateEmployeeDtoValidator.cs`, `CreateProfessionalDtoValidator.cs`

**Línea:** `15-30`

**Descripción:**
Varios validadores de entidades clínicas emiten mensajes en inglés como `"Employee code must match format: 2-3 letters followed by 3 digits (e.g. OD001)"` o `"At least one specialty is required"`, mientras que el resto de la aplicación utiliza español clínico neutro.

**Cómo reproducirlo:**
1. Enviar una petición POST a `/api/v1/Employees` con código de empleado inválido.
2. Analizar el objeto `ProblemDetails` devuelto en el error 400.

**Resultado esperado:**
Los mensajes de error del sistema deben ser homogéneos y presentarse en español: `"El código de empleado debe tener el formato: 2-3 letras seguidas de 3 dígitos (ej. OD001)"`.

**Resultado actual:**
Se mezclan mensajes en inglés y español en la misma respuesta de error.

**Causa probable:**
Textos literales configurados con mensajes por defecto en inglés en las reglas de FluentValidation.

**Impacto:**
Inconsistencia en la retroalimentación al usuario cuando el frontend propaga los mensajes de la API.

**Solución recomendada:**
Estandarizar todos los mensajes `.WithMessage("...")` al idioma español en los validadores de la capa `Application`.

---

## 5. Errores del Chatbot

### QA-001 — Payload de autenticación incompatible en `DotNetClient` del Chatbot

**Severidad:** 🔴 Crítico

**Área:** Integración (Chatbot ↔ Backend)

**Archivo:** `NexusOdonto_ChatBot_AI-develop/app/clients/dotnet_client.py`

**Línea:** `54-60`

**Descripción:**
En `dotnet_client.py`, el método `_get_valid_token` intenta autenticarse contra la API .NET enviando las siguientes opciones de payload en `login_candidates`:
```python
login_candidates = [
    {"documentNumber": self.auth_login, "password": self.auth_password},
    {"login": self.auth_login, "password": self.auth_password},
    {"email": self.auth_login, "password": self.auth_password},
    {"documentNumber": "1234567890", "password": self.auth_password},
    {"documentNumber": "BOT-SERVICE-01", "password": self.auth_password},
]
```
Sin embargo, el endpoint `/api/auth/login` de .NET deserializa la clase `LoginRequestDto`, la cual requiere estrictamente la propiedad `LoginId`:
```csharp
public sealed class LoginRequestDto
{
    public string LoginId { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
```
Debido a que ninguna de las opciones incluye la clave `"loginId"`, el backend .NET rechaza todas las solicitudes del Chatbot con código `400 Bad Request` o `401 Unauthorized` ("Invalid login ID or password"), impidiendo que el Chatbot obtenga un token JWT dinámico para consultar citas, odontólogos y servicios en la base de datos Oracle.

**Cómo reproducirlo:**
1. Configurar credenciales en `.env` del Chatbot: `DOTNET_AUTH_LOGIN=1234567890`, `DOTNET_AUTH_PASSWORD=Admin123!`.
2. Invocar `DotNetClient._get_valid_token()`.
3. Revisar los logs del Chatbot: se observa `"[.NET Client] No se pudo autenticar con ningún candidato en http://localhost:5170/api/auth/login"`.

**Resultado esperado:**
El Chatbot debe autenticarse exitosamente y almacenar el token JWT emitido por .NET.

**Resultado actual:**
El Chatbot falla en todos los intentos y tiene que recurrir a un token secreto estático o fallar en las consultas de API.

**Causa probable:**
Desajuste entre el nombre del campo esperado por C# (`loginId`) y los nombres enviados por el script de Python (`login`, `documentNumber`, `email`).

**Impacto:**
El Chatbot queda ciego respecto a los datos reales de la base de datos Oracle (citas, disponibilidad de doctores y pacientes).

**Solución recomendada:**
Agregar `{"loginId": self.auth_login, "password": self.auth_password}` como el primer candidato prioritario en `login_candidates` dentro de `dotnet_client.py`.

---

### QA-004 — Validación vulnerable de Webhook en middleware de FastAPI

**Severidad:** 🟠 Alto

**Área:** Chatbot (Seguridad)

**Archivo:** `NexusOdonto_ChatBot_AI-develop/app/main.py`

**Línea:** `41-60`

**Descripción:**
En `main.py`, el middleware `validate_evolution_webhook` valida la autenticidad del webhook de WhatsApp mediante:
```python
if settings.webhook_secret not in auth_header and settings.webhook_secret != apikey_header:
    return JSONResponse(status_code=403, content={"status": "forbidden", "message": "Token de webhook inválido."})
```
Si `settings.webhook_secret` no se encuentra configurado en `.env` (valor vacío `""`), la condición `"" in auth_header` siempre se evaluará como verdadera (`True`), permitiendo que cualquier atacante externo envíe peticiones POST no autorizadas a `/webhook/whatsapp` sin autenticación. Por el contrario, si tiene un valor pero el header de Evolution API envía el token en minúsculas (`authorization`), la búsqueda exacta falla.

**Cómo reproducirlo:**
1. Dejar la variable `WEBHOOK_SECRET` vacía en el archivo `.env`.
2. Enviar una petición POST a `http://localhost:8000/webhook/whatsapp` sin headers de autenticación.
3. El middleware permite el paso de la petición sin validar la firma.

**Resultado esperado:**
Si el secreto no está configurado o es inválido, el sistema debe rechazar la solicitud con `403 Forbidden` de manera estricta y segura.

**Resultado actual:**
Peticiones no autenticadas logran pasar si el secreto está vacío en el entorno.

**Causa probable:**
Uso del operador `in` de Python sin verificar previamente que `settings.webhook_secret` sea una cadena no vacía con longitud mínima.

**Impacto:**
Riesgo de inyección de mensajes falsos de WhatsApp o saturación de recursos en el grafo de LangGraph.

**Solución recomendada:**
Validar que `settings.webhook_secret` no esté vacío (`if not settings.webhook_secret: return 403`) y usar comparación de tiempo constante `secrets.compare_digest`.

---

### QA-008 — Configuración insegura de CORS en el servidor FastAPI

**Severidad:** 🟡 Medio

**Área:** Chatbot (Seguridad / CORS)

**Archivo:** `NexusOdonto_ChatBot_AI-develop/app/main.py`

**Línea:** `64-70`

**Descripción:**
En `main.py`, el middleware de CORS está configurado con:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Según el estándar W3C/Fetch, la combinación de `allow_origins=["*"]` con `allow_credentials=True` es inválida y rechazada por navegadores modernos cuando las solicitudes frontend incluyen credenciales (cookies o Authorization headers), generando bloqueos por política de origen cruzado en el navegador.

**Cómo reproducirlo:**
1. Realizar una petición `fetch` desde el navegador en `http://localhost:5173` hacia `http://localhost:8000/chat` con `credentials: 'include'`.
2. El navegador bloquea la respuesta en la consola con error de CORS.

**Resultado esperado:**
La API debe especificar los orígenes explícitos permitidos (`http://localhost:5173`, `http://localhost:5174`) si `allow_credentials=True` está activo.

**Resultado actual:**
Posible bloqueo en navegadores estrictos.

**Causa probable:**
Configuración genérica permisiva de desarrollo.

**Impacto:**
Falla en la comunicación del widget de chat en navegadores con políticas de seguridad estrictas.

**Solución recomendada:**
Reemplazar `allow_origins=["*"]` por una lista explícita de orígenes autorizados leídos desde `.env`.

---

### QA-013 — Timeout rígido de 10s en consultas de embeddings/RAG con base de datos fría

**Severidad:** 🔵 Bajo

**Área:** Chatbot (Rendimiento)

**Archivo:** `NexusOdonto_ChatBot_AI-develop/app/rag/retriever.py` y `src/api/chatbotService.ts`

**Línea:** `15-25`

**Descripción:**
El cliente de chat en el frontend fija un timeout estricto de 10.000 ms (10 segundos). Cuando el contenedor de Qdrant o el modelo de embeddings realiza una búsqueda vectorial inicial o experimenta latencia de red, la respuesta tarda entre 11 y 13 segundos, causando que el frontend aborte la petición y muestre el mensaje de fallback anticipadamente.

**Cómo reproducirlo:**
1. Reiniciar el servicio de Qdrant.
2. Enviar una pregunta clínica compleja al Chatbot (ej: `"¿Cuál es el protocolo de bioseguridad para implantes dentales?"`).
3. El frontend agota el tiempo a los 10s y muestra la respuesta de fallback local antes de recibir la respuesta enriquecida de LangGraph.

**Resultado esperado:**
El frontend debe tolerar hasta 20-25 segundos para consultas clínicas que involucren recuperación semántica (RAG) con LLM.

**Resultado actual:**
Se corta la respuesta a los 10 segundos.

**Causa probable:**
Timeout configurado demasiado agresivo en `chatbotClient = axios.create({ timeout: 10000 })`.

**Impacto:**
Degradación de la experiencia del usuario al recibir respuestas de fallback en lugar de respuestas enriquecidas con base de conocimiento clínica.

**Solución recomendada:**
Incrementar el timeout en `src/api/chatbotService.ts` a `25000` ms (25 segundos).

---

## 6. Errores de Integración

### Frontend ↔ Backend
1. **Paginación y Envoltura de Respuestas:**
   * La API .NET devuelve en algunos endpoints listas directas `[...]` y en otros objetos paginados `{ items: [...], totalCount: X }`.
   * El frontend maneja esto de forma defensiva con `Array.isArray(data) ? data : data?.items || []`, lo cual previene fallos pero demuestra falta de estandarización en los contratos de la API.
2. **Campos de Identidad Relacional en Oracle:**
   * En Oracle, un profesional se vincula a `PERSONS` a través de la tabla intermedia `EMPLOYEES`. Si el frontend intenta registrar un profesional enviando solo `personId`, la API .NET rechaza la solicitud exigiendo `employeeId` y `specialtyIds`.

### Chatbot ↔ Backend
1. **Nombres de Campos en Login:**
   * El Chatbot enviaba `documentNumber` en vez de `loginId`, impidiendo la autenticación JWT automática documentada en el hallazgo **QA-001**.
2. **Mapeo de Estados de Citas:**
   * El Chatbot espera estados con códigos textuales (`CONFIRMADA`, `CANCELADA`), mientras que Oracle utiliza identificadores UUID en la tabla `APPOINTMENT_STATUSES`. El método `obtener_catalogo("AppointmentStatuses")` resuelve esto en tiempo de ejecución mapeando los GUIDs a nombres legibles.

### Frontend ↔ Chatbot
1. **Estructura del Payload de Chat:**
   * El frontend envía `{ message, userId, role, context, conversationId }` al endpoint `POST /chat` en el puerto 8000. El endpoint en `app/api/routes/chat.py` procesa correctamente la solicitud y devuelve `{ reply, status, conversationId }`, validado con respuesta `200 OK` en las pruebas de integración.

---

## 7. Errores de UI/UX

1. **Responsividad en Tablas Clínicas:**
   * En pantallas móviles (<640px), las tablas de `HistoriaClinicaView.tsx` y `UsuariosView.tsx` requieren scroll horizontal. Se recomienda añadir vista de tarjetas adaptables (`Card View`) en móvil como se implementó en `ProfesionalesView.tsx`.
2. **Feedback Visual en Cargas Prolongadas:**
   * Al guardar citas o registrar historias clínicas con adjuntos, algunos botones no deshabilitan su estado inmediatamente (`disabled={isSubmitting}`), permitiendo potencialmente doble clic accidental.
3. **Manejo de Estados Vacíos:**
   * En `CitasView.tsx` y `PacientesView.tsx`, cuando una búsqueda no arroja resultados, se muestra una ilustración y mensaje claro con botón para restablecer filtros, lo cual cumple satisfactoriamente con las buenas prácticas de diseño.

---

## 8. Problemas de Seguridad

1. **Almacenamiento de Tokens JWT en `localStorage`:**
   * **Descripción:** Los tokens de acceso se almacenan en el `localStorage` del navegador (`auth_token`). Aunque es común en SPAs, esto expone los tokens a ataques de tipo XSS si se inyecta código malicioso de terceros.
   * **Recomendación:** Migrar a cookies `HttpOnly; SameSite=Strict; Secure` gestionadas directamente por el backend.
2. **CORS Permisivo en Chatbot:**
   * Documentado en **QA-008**: Se debe restringir `allow_origins` únicamente al dominio o puertos del frontend.
3. **Control de Acceso Basado en Roles (RBAC):**
   * Las rutas del frontend están protegidas por `ProtectedRoute.tsx` y el backend valida roles mediante claims `[Authorize(Roles = "...")]`. Las pruebas con tokens de recepción intentando acceder a `/api/v1/Users` confirmaron que el backend rechaza la petición con `403 Forbidden` de manera segura.

---

## 9. Problemas de Rendimiento

1. **Bundle Size del Frontend:**
   * El build de producción genera un bundle optimizado de `203 kB` de CSS y `281 kB` de React runtime (gzipped ~91 kB). Todos los módulos pesados (`OdontogramaUI`, `HistoriaClinicaView`, `ProfesionalesView`, `CitasView`) utilizan `React.lazy` y code-splitting dinámico con chunks individuales de 20-50 kB.
2. **Optimización de Imágenes y Assets:**
   * Los fondos y logos principales (`fondo-darck.webp`, `fondoLogin-CCfHQazc.webp`, `nexus-odonto-logo.webp`) están en formato WebP comprimido (<200 kB), lo que garantiza un tiempo de carga inicial veloz (`First Contentful Paint < 1.2s`).
3. **Re-renderizados en Agenda:**
   * En `AgendaView.tsx`, el uso de `useMemo` y `useCallback` en el filtrado de odontólogos y cálculo de semanas previene re-renderizados innecesarios del DOM.

---

## 10. Warnings y problemas menores

1. **TypeScript Warnings:**
   * El proyecto compila con **0 errores de TypeScript (`tsc -b`)** y el build de Vite finaliza exitosamente en `~1.0s`.
2. **Variables de Entorno:**
   * Se identificó que si la variable `VITE_API_URL` no está definida en `.env`, el cliente Axios utiliza el fallback `http://localhost:5170/api`, lo cual es correcto para desarrollo local pero debe especificarse en variables de producción.
3. **Código Huérfano / Inconsistencias Menores:**
   * En `AgendaView.tsx` existían referencias de prueba comentadas que ya fueron depuradas en la última integración.

---

## 11. Casos de prueba realizados

| ID | Caso de Prueba | Entrada / Acción | Resultado Esperado | Resultado Actual | Estado |
|---|---|---|---|---|---|
| **TC-001** | Autenticación Admin válida | LoginId: `1234567890`, Pass: `Admin123!` | Código 200 OK + Token JWT emitido | Código 200 OK + Token emitido | ✅ Exitoso |
| **TC-002** | Login con contraseña errónea | LoginId: `1234567890`, Pass: `Errada999!` | Código 401 Unauthorized | Código 401 Unauthorized | ✅ Exitoso |
| **TC-003** | Login con campos vacíos | LoginId: `""`, Pass: `""` | Código 400 Bad Request | Código 400 Bad Request | ✅ Exitoso |
| **TC-004** | Autenticación Recepcionista | LoginId: `1087654321`, Pass: `Recepcion123!` | Código 200 OK + Rol Recepción | Código 200 OK + Rol Recepción | ✅ Exitoso |
| **TC-005** | Autenticación Odontólogo | LoginId: `1098765432`, Pass: `Doctor123!` | Código 200 OK + Rol Odontólogo | Código 200 OK + Rol Odontólogo | ✅ Exitoso |
| **TC-006** | Petición sin token a ruta segura | GET `/api/v1/Users` sin Authorization | Código 401 Unauthorized | Código 401 Unauthorized | ✅ Exitoso |
| **TC-007** | Validación RBAC rol insuficiente | GET `/api/v1/Users` con token Recepción | Código 403 Forbidden | Código 403 Forbidden | ✅ Exitoso |
| **TC-008** | Consulta de usuarios por Admin | GET `/api/v1/Users` con token Admin | Código 200 OK + Lista de usuarios | Código 200 OK (7 usuarios) | ✅ Exitoso |
| **TC-009** | Consulta de Catálogos base | GET `/DocumentTypes`, `/Sexes`, `/Statuses` | Código 200 OK en los 3 catálogos | Código 200 OK en los 3 | ✅ Exitoso |
| **TC-010** | Catálogo de Servicios odontológicos | GET `/api/v1/Services` | Código 200 OK + Lista de servicios | Código 200 OK (4 servicios) | ✅ Exitoso |
| **TC-011** | Consulta de Pacientes y Personas | GET `/api/v1/Patients` y `/Persons` | Código 200 OK en ambos | Código 200 OK (15 personas) | ✅ Exitoso |
| **TC-012** | Consulta de Citas agendadas | GET `/api/v1/Appointments` | Código 200 OK | Código 200 OK | ✅ Exitoso |
| **TC-013** | Consulta de Odontólogos | GET `/api/v1/Professionals` | Código 200 OK + Lista profesionales | Código 200 OK (4 doctores) | ✅ Exitoso |
| **TC-014** | Búsqueda de GUID inexistente | GET `/api/v1/Patients/0000...` | Código 404 Not Found | Código 404 Not Found | ✅ Exitoso |
| **TC-015** | Disponibilidad ChatBot AI | GET `http://localhost:8000/health` | Código 200 OK {"status": "healthy"} | Código 200 OK | ✅ Exitoso |
| **TC-016** | Interacción Chatbot normal | POST `/chat` con consulta odontológica | Código 200 OK con respuesta empática | Código 200 OK | ✅ Exitoso |
| **TC-017** | Chatbot con mensaje en blanco | POST `/chat` con mensaje `""` | Código 400 Bad Request | Código 400 Bad Request | ✅ Exitoso |
| **TC-018** | Webhook WhatsApp sin firma | POST `/webhook/whatsapp` sin headers | Código 403 Forbidden | Código 403 Forbidden | ✅ Exitoso |
| **TC-019** | Build y Compilación Frontend | `npm run build` (tsc + vite) | Código salida 0, sin errores | Código salida 0 (1.09s) | ✅ Exitoso |

---

## 12. Recomendaciones

1. **Calidad y Mantenibilidad:**
   * Implementar **TanStack Query (React Query)** en el frontend para gestionar automáticamente la sincronización, mutaciones y caché de catálogos clínicos.
   * Centralizar los contratos de interfaz compartidos entre C# y TypeScript mediante generación automática de tipos desde Swagger (ej: `openapi-typescript`).
2. **Seguridad:**
   * Corregir el fallback de origen de Google OAuth en `AuthController.cs` leyendo la URL de la configuración del entorno.
   * Restringir los orígenes de CORS en `main.py` de FastAPI para evitar advertencias de seguridad en navegadores.
   * Implementar almacenamiento de sesión en cookies `HttpOnly` para mayor protección contra vectores XSS.
3. **Integración con Chatbot:**
   * Actualizar el diccionario de login en `dotnet_client.py` agregando la clave `"loginId"` para habilitar el inicio de sesión automático del agente inteligente contra la API .NET.
4. **Experiencia de Usuario (UX):**
   * Eliminar la trampa de historial en `ProtectedRoute.tsx` permitiendo que el botón "Volver" navegue fluidamente hacia la ruta anterior o al Dashboard.
   * Agregar validación de expresiones regulares en campos de teléfono para garantizar que los números registrados sean compatibles con WhatsApp.

---

## 13. Conclusión

### Estado del Proyecto:
**🟡 Requiere correcciones antes de producción**

### Justificación:
La plataforma **NexusOdonto** presenta una base arquitectónica sólida y moderna:
* La base de datos Oracle y la API .NET gestionan con éxito el modelo relacional clínico (Personas, Empleados, Especialistas, Pacientes, Servicios y Citas).
* El Frontend cuenta con una interfaz visual de alto nivel, profesional, con soporte de modo oscuro/claro, code-splitting eficiente y cero errores de compilación TypeScript.
* El microservicio de ChatBot AI responde de forma estable y cuenta con endpoints funcionales para el widget web.

Sin embargo, antes de realizar el despliegue a un entorno de producción, es imperativo corregir los **2 errores críticos** y los **hallazgos altos** identificados:
1. Ajustar el payload de login de `dotnet_client.py` (`loginId`) para que el Chatbot pueda sincronizar en vivo con la base de datos Oracle.
2. Corregir el puerto de redirección de Google OAuth en `AuthController.cs`.
3. Asignar los permisos correspondientes a los roles de Recepción y Odontología en la base de datos.
4. Resolver la retención del historial en la pantalla de acceso restringido en `ProtectedRoute.tsx`.

Una vez subsanados estos puntos, el sistema estará en condiciones óptimas para su puesta en marcha operativa.
