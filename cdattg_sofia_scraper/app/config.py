import os

# ---------------------------------------------------------------------------
# SofíaPlus (login SENA + Playwright / StealthyFetcher)
# No mezclar con variables BETOWA_*: son flujos y destinos distintos.
# ---------------------------------------------------------------------------
LOGIN_URL = os.getenv(
    "SOFIA_LOGIN_URL",
    "http://senasofiaplus.edu.co/sofia/josso_login/",
).strip()
DEFAULT_ROL = os.getenv("SOFIA_ROL", "Encargado de ingreso centro formación").strip()
# Scrapling StealthyFetcher: headed + Xvfb en Docker evita bloqueo JOSSO post-login.
HEADLESS = os.getenv("SOFIA_HEADLESS", "false").lower() in ("1", "true", "yes")
TIMEOUT_SEGUNDOS = int(os.getenv("SOFIA_TIMEOUT_SEGUNDOS", "120"))
DIAGNOSTICO = os.getenv("SOFIA_DIAGNOSTICO", "true").lower() in ("1", "true", "yes")
DIAG_DIR = os.getenv("SOFIA_DIAG_DIR", "storage/sofia_diagnostico")

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
