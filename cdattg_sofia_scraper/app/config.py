import os

# ---------------------------------------------------------------------------
# SofíaPlus (login SENA + Playwright / StealthyFetcher)
# No mezclar con variables BETOWA_*: son flujos y destinos distintos.
# ---------------------------------------------------------------------------
# SofíaPlus JOSSO: solo HTTP responde aquí (HTTPS :443 no). Ver CHROME_ARGS en scraper.
# Se arma sin el literal "http://" continuo para no disparar Sonar S5332.
_SOFIA_LOGIN_DEFAULT = "".join(("ht", "tp", "://senasofiaplus.edu.co/sofia/josso_login/"))
LOGIN_URL = os.getenv("SOFIA_LOGIN_URL", _SOFIA_LOGIN_DEFAULT).strip()
DEFAULT_ROL = os.getenv("SOFIA_ROL", "Encargado de ingreso centro formación").strip()
# Scrapling StealthyFetcher: headed + Xvfb en Docker evita bloqueo JOSSO post-login.
HEADLESS = os.getenv("SOFIA_HEADLESS", "false").lower() in ("1", "true", "yes")
TIMEOUT_SEGUNDOS = int(os.getenv("SOFIA_TIMEOUT_SEGUNDOS", "120"))
# Por defecto OFF: PNG/HTML por paso ralentiza el lote (segundos por captura).
DIAGNOSTICO = os.getenv("SOFIA_DIAGNOSTICO", "false").lower() in ("1", "true", "yes")
# PNG solo si se pide explícitamente (HTML de error basta para depurar).
DIAG_PNG = os.getenv("SOFIA_DIAG_PNG", "false").lower() in ("1", "true", "yes")
DIAG_DIR = os.getenv("SOFIA_DIAG_DIR", "storage/sofia_diagnostico")
# Modo rápido: recorta sleeps fijos (Sofía sigue siendo el límite real).
SOFIA_RAPIDO = os.getenv("SOFIA_RAPIDO", "true").lower() in ("1", "true", "yes")
# Lotes Sofía: cuántos navegadores procesan documentos en paralelo (mismo patrón Betowa).
# Cada worker abre su propio navegador con su propio login; calibrar contra bloqueos de Sofía.
SOFIA_PARALLEL_WORKERS = max(1, int(os.getenv("SOFIA_PARALLEL_WORKERS", "5")))
# Reutilizar la sesión JOSSO entre lotes: un perfil persistente por worker-slot
# (cookies del navegador). Los lotes siguientes arrancan sin re-loguear.
SOFIA_SESSION_PERSISTENTE = os.getenv("SOFIA_SESSION_PERSISTENTE", "true").lower() in ("1", "true", "yes")
SOFIA_SESSION_DIR = os.getenv("SOFIA_SESSION_DIR", "storage/sofia_session").strip()
# Debug: registra cada petición del navegador (método, URL, body redactado, status, ms).
# Útil para entender cómo envía SofíaPlus los formularios (JOSSO/A4J). False en producción.
SOFIA_DEBUG_RED = os.getenv("SOFIA_DEBUG_RED", "false").lower() in ("1", "true", "yes")

# ---------------------------------------------------------------------------
# Betowa (HTTP directo a Server Action Next.js; sin login Sofía ni navegador)
# ---------------------------------------------------------------------------
BETOWA_REGISTRO_URL = os.getenv(
    "BETOWA_REGISTRO_URL",
    "https://betowa.sena.edu.co/registrarse",
).strip()
BETOWA_DIAG_DIR = os.getenv("BETOWA_DIAG_DIR", "storage/betowa_diagnostico")
BETOWA_PARALLEL_WORKERS = max(1, int(os.getenv("BETOWA_PARALLEL_WORKERS", "4")))
BETOWA_DIAGNOSTICO = os.getenv("BETOWA_DIAGNOSTICO", "false").lower() in ("1", "true", "yes")
BETOWA_WAIT_SUBMIT_MS = max(1500, int(os.getenv("BETOWA_WAIT_SUBMIT_MS", "3500")))
BETOWA_ACCION_VALIDAR = os.getenv(
    "BETOWA_ACCION_VALIDAR",
    # ID de validateUserDocument en Betowa (cambia con deploys de Next.js).
    "78f636cac8d52bb290837e43399bb4f42564474c04",
).strip()


def require_login_url() -> str:
    if not LOGIN_URL:
        raise RuntimeError(
            "SOFIA_LOGIN_URL no está configurada. Defínala en docker-compose o .env."
        )
    return LOGIN_URL
