# QA Report — Chatbot / AI Microservice (`NexusOdonto_ChatBot_AI-develop`)

## 1. Resumen

Este informe contiene exclusivamente los errores, problemas de integración, manejo de sesiones, prompts, webhooks de WhatsApp (Evolution API) y configuración detectados en el **Microservicio de Chatbot e Inteligencia Artificial de NexusOdonto** (`NexusOdonto_ChatBot_AI-develop`), desarrollado en Python con FastAPI, LangGraph, LangChain y Qdrant.

---

## 2. Errores Encontrados

### QA-BOT-001 — Formato de payload incompatible en autenticación con la API .NET

**Severidad:** 🔴 Crítico

**Archivo:** `app/clients/dotnet_client.py`

**Línea:** `54-60`

**Funcionalidad afectada:**
Autenticación JWT automática del Chatbot para consultar citas, odontólogos y servicios en la base de datos Oracle.

**Descripción:**
En `dotnet_client.py`, el método `_get_valid_token` intenta autenticarse contra el endpoint `/api/auth/login` de la API .NET enviando las siguientes opciones en `login_candidates`:
```python
login_candidates = [
    {"documentNumber": self.auth_login, "password": self.auth_password},
    {"login": self.auth_login, "password": self.auth_password},
    {"email": self.auth_login, "password": self.auth_password},
    {"documentNumber": "1234567890", "password": self.auth_password},
    {"documentNumber": "BOT-SERVICE-01", "password": self.auth_password},
]
```
Sin embargo, el validador y controlador de C# deserializa la clase `LoginRequestDto`, la cual exige la propiedad `LoginId`:
```csharp
public sealed class LoginRequestDto
{
    public string LoginId { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}
```
Dado que ninguna de las opciones incluye la clave `"loginId"`, la API .NET rechaza todas las solicitudes del Chatbot con código `400 Bad Request` o `401 Unauthorized`, impidiendo que el agente obtenga un token JWT dinámico para consultar datos en tiempo real.

**Cómo reproducirlo:**
1. Configurar credenciales en `.env` del Chatbot: `DOTNET_AUTH_LOGIN=1234567890`, `DOTNET_AUTH_PASSWORD=Admin123!`.
2. Ejecutar una consulta desde el cliente `DotNetClient`.
3. Revisar los logs del Chatbot: se observa `"[.NET Client] No se pudo autenticar con ningún candidato en http://localhost:5170/api/auth/login"`.

**Resultado esperado:**
El Chatbot debe autenticarse exitosamente y almacenar el token JWT emitido por .NET.

**Resultado actual:**
El Chatbot falla en todos los intentos de inicio de sesión y no puede sincronizar datos en vivo.

**Causa probable:**
Discrepancia de nombres entre el modelo C# (`loginId`) y los payloads enviados por el script en Python (`documentNumber`, `login`, `email`).

**Impacto:**
El Chatbot no puede agendar citas reales ni consultar la disponibilidad de los odontólogos en la base de datos Oracle.

**Solución sugerida:**
Agregar como primer elemento prioritario en `login_candidates`:
```python
{"loginId": self.auth_login, "password": self.auth_password}
```

---

### QA-BOT-002 — Validación vulnerable de Webhooks en middleware de FastAPI

**Severidad:** 🟠 Alto

**Archivo:** `app/main.py`

**Línea:** `42-60`

**Funcionalidad afectada:**
Recepción de mensajes y eventos de WhatsApp desde Evolution API (`POST /webhook/whatsapp`).

**Descripción:**
En `main.py`, el middleware `validate_evolution_webhook` valida la autenticidad del webhook mediante:
```python
if settings.webhook_secret not in auth_header and settings.webhook_secret != apikey_header:
    return JSONResponse(status_code=403, content={"status": "forbidden", "message": "Token de webhook inválido."})
```
Si la variable `WEBHOOK_SECRET` no está configurada o se encuentra vacía (`""`) en el archivo `.env`, la condición `"" in auth_header` siempre se evaluará como verdadera (`True`). Esto permite que cualquier atacante externo envíe peticiones no autorizadas al webhook de WhatsApp sin ninguna credencial.

**Cómo reproducirlo:**
1. Dejar `WEBHOOK_SECRET=""` en `.env`.
2. Enviar una petición `POST` a `http://localhost:8000/webhook/whatsapp` sin encabezados de autenticación.
3. El servidor acepta la petición y la envía al procesamiento de LangGraph.

**Resultado esperado:**
Si el secreto está vacío o no coincide, el middleware debe rechazar de forma estricta la solicitud con `403 Forbidden`.

**Resultado actual:**
Se permite el paso de solicitudes anónimas cuando la variable de entorno está vacía.

**Causa probable:**
Uso del operador `in` de Python sin verificar previamente que `settings.webhook_secret` sea una cadena no vacía.

**Impacto:**
Riesgo de inyección de mensajes falsos de WhatsApp o saturación de costos en llamadas al modelo LLM de OpenAI.

**Solución sugerida:**
Validar explícitamente:
```python
if not settings.webhook_secret or (settings.webhook_secret not in auth_header and settings.webhook_secret != apikey_header):
    return JSONResponse(status_code=403, content={"status": "forbidden", "message": "Token de webhook inválido o no configurado."})
```

---

### QA-BOT-003 — Configuración de CORS inválida según el estándar W3C

**Severidad:** 🟡 Medio

**Archivo:** `app/main.py`

**Línea:** `64-70`

**Funcionalidad afectada:**
Comunicación HTTP entre el widget web de React y el servidor FastAPI.

**Descripción:**
El middleware de CORS está configurado con:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```
Según la especificación W3C/Fetch, la combinación de `allow_origins=["*"]` junto a `allow_credentials=True` es inválida y rechazada por navegadores modernos cuando las solicitudes frontend incluyen cabeceras de autorización o cookies.

**Cómo reproducirlo:**
1. Realizar una petición `fetch` desde el navegador en `http://localhost:5173` hacia `http://localhost:8000/chat` con `credentials: 'include'`.
2. El navegador bloquea la respuesta en la consola con error de política CORS.

**Resultado esperado:**
La API debe especificar orígenes explícitos permitidos (`http://localhost:5173`, `http://localhost:5174`).

**Resultado actual:**
Riesgo de bloqueo de peticiones de chat en navegadores estrictos.

**Causa probable:**
Configuración genérica permisiva de desarrollo.

**Impacto:**
Falla en la comunicación del widget de chat desde el frontend en entornos de producción.

**Solución sugerida:**
Reemplazar `allow_origins=["*"]` por una lista explícita leída desde la configuración de entorno (`settings.allowed_origins`).

---

### QA-BOT-004 — Ausencia de reintento con backoff exponencial en el Checkpointer de PostgreSQL

**Severidad:** 🔵 Bajo

**Archivo:** `app/session/postgres_checkpointer.py`

**Línea:** `45-60`

**Funcionalidad afectada:**
Persistencia de memoria de conversaciones en LangGraph.

**Descripción:**
Si la conexión a la base de datos de checkpoints de PostgreSQL sufre una micro-desconexión durante la ejecución de un grafo conversacional, el saver lanza una excepción directa que interrumpe la respuesta del bot sin intentar reconectar automáticamente.

**Cómo reproducirlo:**
1. Pausar momentáneamente el servicio PostgreSQL durante una conversación.
2. Enviar un mensaje al Chatbot.

**Resultado esperado:**
El checkpointer debe reintentar la escritura hasta 3 veces con backoff exponencial antes de fallar.

**Resultado actual:**
El flujo de LangGraph se aborta y se dispara la respuesta de fallback genérica.

**Causa probable:**
Falta de envoltura con política de reintentos (`tenacity` o bloque `try-except` con reintento) en las operaciones de commit del saver.

**Impacto:**
Pérdida ocasional de contexto en conversaciones largas durante fluctuaciones de red.

**Solución sugerida:**
Integrar la librería `tenacity` para envolver los métodos de guardado de estado en PostgreSQL.

---

## 3. Mejoras de Chatbot

### QA-BOT-005 — Limitación de tasa (Rate Limiting) y control de concurrencia en `/chat`

**Severidad:** ⚪ Mejora

**Archivo:** `app/api/routes/chat.py`

**Descripción:**
Implementar un semáforo de concurrencia (`asyncio.Semaphore(20)`) o middleware de rate limiting (como `slowapi`) para evitar que múltiples solicitudes concurrentes agoten el pool de conexiones o generen sobrecostos en la API de OpenAI.

---

## 4. Errores de Integración Relacionados

* **Bot ↔ Backend (Payload de Login):** El Bot no puede obtener tokens JWT debido a la discrepancia de campos en `LoginRequestDto` documentada en QA-BOT-001.
* **Bot ↔ Frontend (Formato de Respuesta de Chat):** El endpoint `/chat` y `/api/v1/chat` en `app/api/routes/chat.py` entrega `{ reply, status, conversationId }`, validado con respuesta `200 OK` por el widget web de React.

---

## Resumen

| Severidad  | Cantidad |
| ---------- | -------: |
| 🔴 Crítico |        1 |
| 🟠 Alto    |        1 |
| 🟡 Medio   |        1 |
| 🔵 Bajo    |        1 |
| ⚪ Mejora   |        1 |

## Estado

**🟠 Problemas importantes** (El microservicio de ChatBot AI responde correctamente en el endpoint `/chat`, pero requiere corregir el payload de autenticación en `dotnet_client.py` y la validación de webhooks en `main.py`).
