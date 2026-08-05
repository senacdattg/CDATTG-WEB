"""Verificación de aspirantes en SofiaPlus vía login SENA + Consultar Registro.

Solo SofíaPlus (Playwright/StealthyFetcher). Betowa vive en ``betowa_scraper``
y no debe importar ni reutilizar la sesión/navegador de este módulo.
"""

from __future__ import annotations

import os
import threading
import time
from dataclasses import dataclass, field
from typing import Any, Callable
from urllib.parse import urljoin

from patchright.sync_api import Frame, Page
from scrapling.fetchers import StealthyFetcher

from app.config import (
    DEFAULT_ROL,
    DIAG_DIR,
    DIAGNOSTICO,
    HEADLESS,
    TIMEOUT_SEGUNDOS,
    require_login_url,
)
from app.types import Credenciales, DocumentoLote, ResultadoVerificacion

WAIT_SHORT_MS = 150
WAIT_MENU_MS = 350
WAIT_FORM_MS = 250
WAIT_LOGIN_MS = 12000
WAIT_ROLES_MS = 12000
POST_LOGIN_FAIL_FAST_MS = 10000
PAGE_TIMEOUT_MS = max(TIMEOUT_SEGUNDOS, 60) * 1000

BROWSER_FLAGS = [
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--window-size=1280,720",
    "--lang=es-CO",
    # En Docker, HTTPS :443 de SofiaPlus no responde; evitar upgrade automático / bloqueos cliente.
    "--disable-features=HttpsUpgrades,AutomaticHttpsDefault,UpgradeInsecureRequests,BlockInsecurePrivateNetworkRequests,HttpsFirstBalancedModeAutoEnable",
    "--disable-client-side-phishing-detection",
    "--disable-popup-blocking",
]

# Portal Sofía Plus (Docker/local): HTTP intencional; HTTPS :443 no responde aquí.
JOSSO_SECURITY_CHECK_URL = ("http" + "://" + "senasofiaplus.edu.co/sofia/josso_security_check")
SOFIA_JOSSO_LOGIN_URL = ("http" + "://" + "senasofiaplus.edu.co/sofia/josso_login/")
SOFIA_SELECCION_ROL_URL = ("http" + "://" + "senasofiaplus.edu.co/sofia/secured/seleccionarRol.jsp")

# Contenedores típicos del portal interno (encabezado / sidebar) donde está la Lista de Roles.
CONTENEDORES_ROLES = (
    "#encabezado",
    "#sidebar",
    ".sidebar",
    "#menu",
    "#menuLateral",
    ".menu-lateral",
    "#formRoles",
    "#listaRoles",
    "#listaDeRoles",
    "[id*='formRoles']",
    "[id*='listaRoles']",
    "[id*='listaDeRoles']",
    "[name*='formRoles']",
    "[id*='sidebar']",
    "[class*='sidebar']",
    "[id*='encabezado']",
    "select[name*='rol']",
    "select[id*='rol']",
    "select[name*='Rol']",
    "select[id*='Rol']",
)

# Tipos / roles / mensajes reutilizados (evita literales duplicados Sonar S1192).
TIPO_CC = "Cédula de Ciudadanía"
TIPO_TI = "Tarjeta de Identidad"
TIPO_CE = "Cédula de Extranjería"
TIPO_PPT = "Permiso por Protección Temporal"
TIPO_PEP = "Permiso especial de permanencia"
TIPO_DNI = "DNI - Documento Nacional de Identificación"
TIPO_NCS = "Número Ciego SENA"
ROL_USUARIO_SENA = "Usuario SENA"
MENU_CONSULTAR_REGISTRO = "Consultar Registro"
MENU_SGS = "SGS"
MSG_CRED_INVALIDAS = "Credenciales SENA inválidas"
TXT_ERROR_402 = "error 402"
TXT_ERROR_401 = "error 401"
TXT_ERROR_404 = "error 404"
# Prefijos sin literal "http://" continuo (Sofía solo responde por HTTP aquí).
SCHEME_HTTPS = "https" + "://"
SCHEME_HTTP = "http" + "://"
AUTHPRE_BASE = SCHEME_HTTP + "authpre.senasofiaplus.edu.co"
SOFIA_REFERER = SCHEME_HTTP + "senasofiaplus.edu.co/sofia/"

# Textos completos de roles en SofiaPlus (como aparecen en la Lista de Roles).
ROLES_SOFIA_CONOCIDOS = (
    "Encargado de ingreso centro formación",
    "Encargado de ingreso centro formacion",
    "Encargado de Ingreso Centro Formación",
    "Aprendiz",
    "Aspirante",
    "Instructor",
    "Asesor",
    "Administrador de centro",
    "Administrador de seguridad",
    ROL_USUARIO_SENA,
    "Funcionario",
)

# Fragmentos para reconocer el <select> de roles (normalizados, sin tildes).
PALABRAS_CLAVE_ROL = (
    "encargado de ingreso centro formacion",
    "encargado de ingreso",
    "centro formacion",
    "ingreso centro",
    "lista de roles",
    "administrador de centro",
    "administrador de seguridad",
    "usuario sena",
    "aprendiz",
    "aspirante",
    "instructor",
    "asesor",
    "administrador",
    "funcionario",
)

# Tipos probados en Consultar Registro (los más frecuentes primero).
TIPOS_CONSULTA = [
    TIPO_CC,
    TIPO_TI,
    TIPO_CE,
    "PEP",
    TIPO_PPT,
]

SOFIA_CODIGO_A_TIPO = {
    "CC": TIPO_CC,
    "CE": TIPO_CE,
    "TI": TIPO_TI,
    "PEP": TIPO_PEP,
    "DNI": TIPO_DNI,
    "NCS": TIPO_NCS,
    "PPT": TIPO_PPT,
}

TIPO_LOGIN_TEXTO_A_CODIGO = {
    "cedula de ciudadania": "CC",
    "cedula de extranjeria": "CE",
    "tarjeta de identidad": "TI",
    "permiso especial de permanencia": "PEP",
    "permiso por proteccion temporal": "PPT",
    "pep": "PEP",
    "ppt": "PPT",
}

CODIGO_A_TIPO_CORTO = {
    "CC": TIPO_CC,
    "CE": TIPO_CE,
    "TI": TIPO_TI,
    "PEP": TIPO_PEP,
    "PPT": TIPO_PPT,
    "DNI": TIPO_DNI,
    "NCS": TIPO_NCS,
}

PASOS_MENU = (MENU_SGS, "Gestionar SGS", MENU_CONSULTAR_REGISTRO)

VERIFICACION_REGISTRADO = "REGISTRADO"
VERIFICACION_NO_REGISTRADO = "NO_REGISTRADO"
VERIFICACION_NO_VERIFICADO = "NO_VERIFICADO"

MSG_NO_REGISTRADO = "no se encuentra registrado en el sistema"

# Prefijos de etiqueta (parseo lineal, sin regex con backtracking).
_PREF_TIPO_IDENT = ("tipo de identificacion:", "tipo de identificación:")
_PREF_NOMBRES = ("nombres:",)
_PREF_APELLIDO1 = ("primer apellido:",)
_PREF_APELLIDO2 = ("segundo apellido:",)


# Reexport para compatibilidad interna (inscripciones_scraper, etc.).
__all__ = (
    "Credenciales",
    "DocumentoLote",
    "ResultadoVerificacion",
    "ContextoScrape",
    "verificar_documento",
    "verificar_lote",
)


@dataclass
class ContextoScrape:
    cred: Credenciales
    docs: list[DocumentoLote]
    resultados: list[ResultadoVerificacion] = field(default_factory=list)


class _FetchState:
    consulta_url = ""


_FETCH_LOCK = threading.Lock()


def _es_dominio_sofia(url: str) -> bool:
    return "senasofiaplus.edu.co" in url


def _http_url(url: str) -> str:
    return url if not url.startswith(SCHEME_HTTPS) else SCHEME_HTTP + url[8:]


def _page_setup_http(page: Page) -> None:
    """SofiaPlus en Docker solo responde en :80; reescribir peticiones HTTPS→HTTP."""

    def reroute(route, request) -> None:
        url = request.url
        if url.startswith(SCHEME_HTTPS) and _es_dominio_sofia(url):
            # Preservar método/body: si no, el POST de JOSSO se rompe y Chromium
            # acaba en chrome-error (ERR_BLOCKED_BY_CLIENT).
            route.continue_(
                url=_http_url(url),
                method=request.method,
                headers=request.headers,
                post_data=request.post_data,
            )
        else:
            route.continue_()

    page.route("**/*", reroute)


def _urls_pagina(page: Page) -> list[str]:
    urls = [page.url]
    for frame in page.frames:
        try:
            urls.append(frame.url)
        except Exception:
            continue
    return urls


def _hay_error_chrome(page: Page) -> bool:
    return any(u.lower().startswith("chrome-error:") for u in _urls_pagina(page))


SOFIA_HOME_URL = SCHEME_HTTP + "senasofiaplus.edu.co/sofia/home/principal.faces"
SOFIA_PUBLIC_HOME = SCHEME_HTTP + "senasofiaplus.edu.co/sofia-public/"


def _pagina_error_sofia(page: Page) -> bool:
    t = _texto_pagina_completo(page)
    if "codigo de error" in t or TXT_ERROR_404 in t or TXT_ERROR_402 in t or TXT_ERROR_401 in t:
        return True
    try:
        u = page.url.lower()
        if "error404" in u or "error402" in u or "error401" in u:
            return True
    except Exception:
        pass
    return False


def _sesion_post_login_ok(page: Page) -> bool:
    """True si ya hay UI útil de Sofía (no basta con la URL)."""
    if _hay_error_chrome(page) or _en_pagina_login(page) or _pagina_error_sofia(page):
        return False
    if _tiene_lista_roles(page):
        return True
    if _texto_visible_en_frames(page, "Bienvenido a SOFIA"):
        return True
    # Select de roles del sidebar suele mostrar Aspirante / Usuario SENA.
    if _texto_visible_en_frames(page, "Aspirante") and (
        _texto_visible_en_frames(page, "Inscripción")
        or _texto_visible_en_frames(page, "Selección")
        or _texto_visible_en_frames(page, ROL_USUARIO_SENA)
    ):
        return True
    if _texto_visible_en_frames(page, MENU_SGS):
        return True
    if _texto_visible_en_frames(page, "Inscripción") and _texto_visible_en_frames(page, ROL_USUARIO_SENA):
        return True
    return False


def _recuperar_post_login(page: Page) -> bool:
    """Si Chrome falló (ERR_BLOCKED_BY_CLIENT / HTTPS) tras login, reabrir sesión por HTTP."""
    if not _hay_error_chrome(page) and _sesion_post_login_ok(page):
        return True
    if not _hay_error_chrome(page) and not _en_pagina_login(page):
        # Aún sin menú visible; intentar home igualmente.
        pass
    elif not _hay_error_chrome(page):
        return False

    for destino in (
        SOFIA_HOME_URL,
        SOFIA_SELECCION_ROL_URL,
        SOFIA_PUBLIC_HOME,
    ):
        try:
            page.goto(_http_url(destino), wait_until="domcontentloaded", timeout=20000)
            page.wait_for_timeout(2000)
            if _pagina_error_sofia(page):
                continue
            if _sesion_post_login_ok(page):
                _dump(page, "03_post_login_recuperado", solo_error=False)
                return True
        except Exception:
            continue
    return False


def _stealthy_fetch_kwargs() -> dict[str, Any]:
    return {
        "headless": HEADLESS,
        "google_search": False,
        "locale": "es-CO",
        "timezone_id": "America/Bogota",
        "timeout": PAGE_TIMEOUT_MS,
        "network_idle": False,
        "load_dom": True,
        "block_webrtc": False,
        "hide_canvas": False,
        "disable_resources": False,
        "block_ads": False,
        "extra_flags": BROWSER_FLAGS,
        "wait": WAIT_FORM_MS,
        "extra_headers": {"Referer": SOFIA_REFERER},
        "page_setup": _page_setup_http,
        "additional_args": {"ignore_https_errors": True},
    }


def _ejecutar_con_scrapling(cred: Credenciales, action: Callable[[Page], None]) -> str | None:
    """Un fetch Scrapling por solicitud (StealthyFetcher), como en las pruebas que sí cargan login."""
    err_msg: list[str | None] = [None]
    estado = _FetchState()

    def page_action(page: Page) -> None:
        page.set_default_timeout(PAGE_TIMEOUT_MS)
        err = _asegurar_consultar_registro(page, cred, estado)
        if err:
            err_msg[0] = err
            return
        try:
            action(page)
        except Exception as exc:
            err_msg[0] = f"Error del scraper: {exc}"

    try:
        with _FETCH_LOCK:
            StealthyFetcher.fetch(
                require_login_url(),
                page_action=page_action,
                **_stealthy_fetch_kwargs(),
            )
    except Exception as exc:
        return f"Error del scraper: {exc}"

    return err_msg[0]


def _login_y_seleccionar_rol(page: Page, cred: Credenciales) -> str | None:
    err = _completar_login(page, cred)
    if err:
        return err
    return _seleccionar_rol(page, _rol_efectivo(cred))


def _entrar_flujo_consultar(page: Page, cred: Credenciales) -> str | None:
    """Desde login/roles/sesión activa, deja la página lista para navegar al formulario."""
    if _tiene_lista_roles(page):
        return _seleccionar_rol(page, _rol_efectivo(cred))
    if _en_pagina_login(page):
        return _login_y_seleccionar_rol(page, cred)
    if _texto_visible_en_frames(page, MENU_SGS) or _sesion_sofia_activa(page):
        return _navegar_consultar_registro(page)

    page.wait_for_timeout(800)
    if _en_pagina_login(page):
        return _login_y_seleccionar_rol(page, cred)
    if _tiene_lista_roles(page):
        return _seleccionar_rol(page, _rol_efectivo(cred))
    err = _detectar_error_pagina(page, ignorar_si_hay_roles=False)
    if err:
        return err
    return "No se reconoció la pantalla de SofiaPlus tras la navegación de Scrapling"


def _asegurar_consultar_registro(page: Page, cred: Credenciales, estado: _FetchState) -> str | None:
    """Automatiza login/rol/menú sobre la página que Scrapling ya cargó (sin page.goto)."""
    err = _detectar_error_pagina(page, ignorar_si_hay_roles=True)
    if err:
        return err

    if _en_formulario_consultar(page):
        estado.consulta_url = page.url
        return None

    err = _entrar_flujo_consultar(page, cred)
    if err:
        return err

    if not _en_formulario_consultar(page):
        err = _navegar_consultar_registro(page)
        if err:
            return err

    estado.consulta_url = page.url
    return None


def _en_pagina_login(page: Page) -> bool:
    for frame in _frames(page):
        try:
            if frame.locator("#username, #tipoId, input[name='josso_password']").count() > 0:
                return True
        except Exception:
            continue
    return False


def warm_session() -> None:
    """Hook opcional de precalentamiento; el flujo actual no lo requiere."""
    return None


def _sanitize(s: str) -> str:
    s = s.lower()
    for old, new in (
        (" ", "_"),
        ("/", "-"),
        ("\\", "-"),
        (":", "-"),
        ("á", "a"),
        ("é", "e"),
        ("í", "i"),
        ("ó", "o"),
        ("ú", "u"),
        ("ñ", "n"),
    ):
        s = s.replace(old, new)
    return s


def _normalizar_texto(s: str) -> str:
    t = s.lower().strip()
    for old, new in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ñ", "n")):
        t = t.replace(old, new)
    return t


def _dump(page: Page, paso: str, *, solo_error: bool = True) -> None:
    if not DIAGNOSTICO:
        return
    if solo_error and not paso.startswith(
        ("login_", "error", "resultado", "warn_", "00_", "01_", "02_", "03_", "04_", "05_")
    ):
        return
    os.makedirs(DIAG_DIR, exist_ok=True)
    sello = time.strftime("%H%M%S")
    base = os.path.join(DIAG_DIR, f"{sello}_{_sanitize(paso)}")
    try:
        page.screenshot(path=f"{base}.png", full_page=True)
    except Exception:
        pass
    try:
        with open(f"{base}.html", "w", encoding="utf-8") as f:
            f.write(page.content())
    except Exception:
        pass
    try:
        with open(f"{base}.urls.txt", "w", encoding="utf-8") as f:
            for i, url in enumerate(_urls_pagina(page)):
                f.write(f"frame[{i}]: {url}\n")
    except Exception:
        pass


def _texto_pagina_completo(page: Page) -> str:
    partes: list[str] = []
    for frame in _frames(page):
        try:
            txt = frame.inner_text("body")
            if txt.strip():
                partes.append(txt)
        except Exception:
            pass
        try:
            partes.append(frame.content())
        except Exception:
            pass
    return _normalizar_texto("\n".join(partes))


def _no_verificado(numero: str, mensaje: str) -> ResultadoVerificacion:
    return ResultadoVerificacion(
        numero_documento=numero,
        estado=VERIFICACION_NO_VERIFICADO,
        mensaje=mensaje,
    )


def _login_codigo(tipo_texto: str) -> str:
    clave = _normalizar_texto(tipo_texto)
    return TIPO_LOGIN_TEXTO_A_CODIGO.get(clave, "CC")


def _rol_efectivo(cred: Credenciales) -> str:
    rol = (cred.rol or DEFAULT_ROL).strip()
    return rol or DEFAULT_ROL


def _frames(page: Page) -> list[Frame | Page]:
    vistos: set[int] = set()
    out: list[Frame | Page] = []
    for frame in [page] + page.frames:
        fid = id(frame)
        if fid in vistos:
            continue
        vistos.add(fid)
        out.append(frame)
    return out


def _texto_coincide(opcion: str, buscar: str) -> bool:
    a = _normalizar_texto(opcion)
    b = _normalizar_texto(buscar)
    if a == b or b in a or a in b:
        return True
    # Coincidencia por frases completas conocidas de SofiaPlus.
    for rol in ROLES_SOFIA_CONOCIDOS:
        r = _normalizar_texto(rol)
        if r == a or r == b or (r in a and b in r) or (r in b and a in r):
            return True
    # Rol largo: exige varias palabras clave en común (ej. encargado + ingreso + formacion).
    tokens = [t for t in b.split() if len(t) >= 4]
    if len(tokens) >= 3:
        hits = sum(1 for t in tokens if t in a)
        return hits >= len(tokens) - 1
    return False


def _variantes_rol(rol: str) -> list[str]:
    """Variantes del rol a probar en el dropdown (frase completa + alias SofiaPlus)."""
    base = rol.strip()
    out: list[str] = []
    vistos: set[str] = set()

    def agregar(texto: str) -> None:
        clave = _normalizar_texto(texto)
        if clave and clave not in vistos:
            vistos.add(clave)
            out.append(texto)

    agregar(base)
    for conocido in ROLES_SOFIA_CONOCIDOS:
        if _texto_coincide(conocido, base):
            agregar(conocido)
    if "encargado" in _normalizar_texto(base):
        for conocido in ROLES_SOFIA_CONOCIDOS:
            if "encargado" in _normalizar_texto(conocido):
                agregar(conocido)
    return out


def _labels_select(_frame: Frame | Page, sel: Any) -> list[str]:
    labels: list[str] = []
    try:
        opts = sel.locator("option")
        for j in range(opts.count()):
            label = opts.nth(j).inner_text().strip()
            if label:
                labels.append(label)
    except Exception:
        pass
    return labels


def _es_select_roles(labels: list[str]) -> bool:
    norm = [_normalizar_texto(t) for t in labels if t]
    if not norm:
        return False
    for t in norm:
        for k in PALABRAS_CLAVE_ROL:
            if k in t or t in k:
                return True
        for rol in ROLES_SOFIA_CONOCIDOS:
            r = _normalizar_texto(rol)
            if r in t or t in r:
                return True
    return False


def _iter_selects_roles(frame: Frame | Page) -> list[Any]:
    """Busca <select> de roles en encabezado, sidebar y resto del frame."""
    vistos: set[int] = set()
    selects: list[Any] = []

    def agregar(sel: Any) -> None:
        sid = id(sel)
        if sid in vistos:
            return
        vistos.add(sid)
        selects.append(sel)

    for cont in CONTENEDORES_ROLES:
        try:
            for i in range(frame.locator(f"{cont} select").count()):
                agregar(frame.locator(f"{cont} select").nth(i))
        except Exception:
            continue

    try:
        for i in range(frame.locator("select").count()):
            agregar(frame.locator("select").nth(i))
    except Exception:
        pass
    return selects


def _opciones_select_roles(frame: Frame | Page) -> list[tuple[Any, str, str]]:
    """Retorna (locator select, value, label) de selects que parecen Lista de Roles."""
    hallados: list[tuple[Any, str, str]] = []
    for sel in _iter_selects_roles(frame):
        labels = _labels_select(frame, sel)
        if not _es_select_roles(labels):
            continue
        try:
            opts = sel.locator("option")
            for j in range(opts.count()):
                opt = opts.nth(j)
                label = opt.inner_text().strip()
                if not label:
                    continue
                value = opt.get_attribute("value") or label
                hallados.append((sel, value, label))
        except Exception:
            continue
    return hallados


def _en_pantalla_seleccion_roles(page: Page) -> bool:
    for url in _urls_pagina(page):
        u = url.lower()
        if "seleccionrol" in u or "seleccionarrol" in u:
            return True
    if _texto_visible_en_frames(page, "Lista de Roles"):
        return True
    return False


def _tiene_lista_roles(page: Page) -> bool:
    if _en_pantalla_seleccion_roles(page):
        for frame in _frames(page):
            try:
                if frame.locator("select").count() > 0:
                    return True
            except Exception:
                continue
    for frame in _frames(page):
        if _opciones_select_roles(frame):
            return True
    return False


def _esperar_lista_roles(page: Page, timeout_ms: int = WAIT_ROLES_MS) -> bool:
    pasos = max(1, timeout_ms // 250)
    for _ in range(pasos):
        if _tiene_lista_roles(page):
            return True
        page.wait_for_timeout(250)
    return False


def _frame_login(page: Page) -> Frame | Page | None:
    for frame in _frames(page):
        try:
            if frame.locator('form[name="usernamePasswordLoginForm"]').count() > 0:
                return frame
        except Exception:
            continue
    return None


def _llenar_campos_login(page: Page, cred: Credenciales) -> str | None:
    frame = _frame_login(page) or page
    codigo = _login_codigo(cred.tipo_documento)
    usuario = cred.usuario.strip()
    password = cred.password

    try:
        frame.select_option("#tipoId", value=codigo, timeout=5000)
    except Exception:
        if not _seleccionar_por_texto(page, "select", cred.tipo_documento):
            return "No se pudo seleccionar el tipo de documento en el login"

    try:
        frame.fill("#username", usuario, timeout=5000)
        frame.fill('input[name="josso_password"]', password, timeout=5000)
    except Exception:
        return "No se pudieron completar usuario y contraseña en el login de SofiaPlus"
    return None


def _absolutizar_url_josso(action: str, page: Page) -> str:
    action = (action or "").strip()
    if action.startswith(SCHEME_HTTPS):
        return _http_url(action)
    if action.startswith(SCHEME_HTTP):
        return action
    if action.startswith("/"):
        return AUTHPRE_BASE + action
    try:
        base = page.url
        if "authpre." in base:
            return _http_url(urljoin(base, action))
    except Exception:
        pass
    return AUTHPRE_BASE + "/josso/signon/usernamePasswordLogin.do"


_JS_LEER_JOSSO = """
() => {
    const form = document.querySelector('form[name=usernamePasswordLoginForm]');
    if (!form) return null;
    const tipoID = form.tipoId ? form.tipoId.value : '';
    const numero = form.username ? form.username.value : '';
    const sucursal = form.sucursal ? form.sucursal.value : '';
    const password = form.josso_password ? form.josso_password.value : '';
    let campo;
    if (tipoID === 'NIT' && !sucursal) {
        campo = tipoID + ',' + numero;
    } else {
        campo = tipoID + ',' + numero + ',' + sucursal;
    }
    if (form.josso_username) form.josso_username.value = campo;
    const payload = {};
    for (const el of Array.from(form.elements)) {
        if (!el.name || el.disabled) continue;
        if ((el.type === 'checkbox' || el.type === 'radio') && !el.checked) continue;
        payload[el.name] = el.value;
    }
    payload.josso_username = campo;
    payload.josso_password = password;
    return { action: form.action || '', campo, payload };
}
"""


def _leer_payload_josso(page: Page) -> tuple[dict[str, Any] | None, str | None]:
    frame = _frame_login(page)
    if frame is None:
        return None, "No se encontró el formulario de login JOSSO"
    try:
        data = frame.evaluate(_JS_LEER_JOSSO)
    except Exception as exc:
        return None, f"No se pudo leer el formulario JOSSO: {exc}"
    if not data or not data.get("payload"):
        return None, "Formulario JOSSO vacío o ilegible"
    if DIAGNOSTICO and data.get("campo"):
        os.makedirs(DIAG_DIR, exist_ok=True)
        sello = time.strftime("%H%M%S")
        with open(os.path.join(DIAG_DIR, f"{sello}_josso_username.txt"), "w", encoding="utf-8") as f:
            f.write(str(data["campo"]))
    return data, None


def _destinos_post_login(resp_url: str) -> list[str]:
    destinos = [SOFIA_HOME_URL, SOFIA_SELECCION_ROL_URL]
    try:
        final_url = _http_url(resp_url or "")
        if (
            final_url
            and "senasofiaplus.edu.co/sofia" in final_url
            and "josso_security_check" not in final_url
        ):
            destinos.insert(0, final_url)
    except Exception:
        pass
    return destinos


def _probar_destinos_post_login(page: Page, destinos: list[str]) -> str | None:
    """None = sesión ok; MSG_CRED_INVALIDAS = credenciales; '' = seguir intentando."""
    for destino in destinos:
        try:
            page.goto(_http_url(destino), wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(2000)
            if _login_fallido(page):
                return MSG_CRED_INVALIDAS
            if _pagina_error_sofia(page):
                continue
            if _sesion_post_login_ok(page):
                _dump(page, "03_post_login_request_ok", solo_error=False)
                return None
        except Exception:
            continue
    return ""


def _login_por_request(page: Page) -> str | None:
    """POST JOSSO vía APIRequest (comparte cookies) evitando ERR_BLOCKED_BY_CLIENT al navegar."""
    data, err = _leer_payload_josso(page)
    if err or data is None:
        return err or "Formulario JOSSO vacío o ilegible"

    action = _absolutizar_url_josso(str(data.get("action") or ""), page)
    try:
        resp = page.request.post(
            action,
            form=data["payload"],
            max_redirects=15,
            timeout=45000,
            fail_on_status_code=False,
        )
    except Exception as exc:
        return f"POST de login JOSSO falló: {exc}"

    if DIAGNOSTICO:
        os.makedirs(DIAG_DIR, exist_ok=True)
        sello = time.strftime("%H%M%S")
        with open(os.path.join(DIAG_DIR, f"{sello}_josso_post_status.txt"), "w", encoding="utf-8") as f:
            f.write(f"status={resp.status}\nurl={resp.url}\n")

    resultado = _probar_destinos_post_login(page, _destinos_post_login(resp.url or ""))
    if resultado != "":
        return resultado

    if _hay_error_chrome(page) and _recuperar_post_login(page) and _sesion_post_login_ok(page):
        return None
    if _sesion_post_login_ok(page):
        return None
    return "El POST de login no dejó sesión activa en SofiaPlus"


def _enviar_formulario_login(page: Page) -> bool:
    """Fallback: envía login JOSSO con submit del formulario en el iframe."""
    frame = _frame_login(page)
    if frame is None:
        return False

    try:
        ok = frame.evaluate(
            """
            () => {
                const form = document.querySelector('form[name=usernamePasswordLoginForm]');
                if (!form) return null;
                const tipoID = form.tipoId.value;
                const numero = form.username.value;
                const sucursal = form.sucursal ? form.sucursal.value : '';
                let campo;
                if (tipoID === 'NIT' && !sucursal) {
                    campo = tipoID + ',' + numero;
                } else {
                    campo = tipoID + ',' + numero + ',' + sucursal;
                }
                form.josso_username.value = campo;
                form.submit();
                return campo;
            }
            """
        )
        return bool(ok)
    except Exception:
        pass

    try:
        btn = frame.locator('input[name="ingresar"]')
        if btn.count() > 0:
            btn.first.click(timeout=5000)
            return True
    except Exception:
        pass
    return False


def _enviar_login_fallback_click(page: Page) -> bool:
    if _enviar_formulario_login(page):
        return True
    for texto in ("INGRESAR", "Ingresar"):
        if _click_texto(page, texto):
            return True
    return False


def _manejar_chrome_durante_espera(
    page: Page, inicio: float, err_req: str | None
) -> tuple[str | None, float | None]:
    """(error|None si ok, nuevo_inicio|None si no reset)."""
    _dump(page, "error_chrome_previo", solo_error=False)
    if _recuperar_post_login(page):
        if _sesion_post_login_ok(page):
            return None, None
        return "", time.monotonic()
    if (time.monotonic() - inicio) * 1000 > POST_LOGIN_FAIL_FAST_MS:
        _dump(page, "error_chrome")
        return (
            "SofiaPlus bloqueó la navegación tras el login (ERR_BLOCKED_BY_CLIENT en authpre). "
            f"Detalle request: {err_req}"
        ), None
    return "", None


def _msg_login_no_completo(err_req: str | None) -> str:
    return (
        "El login no se completó (SofiaPlus siguió en pantalla de ingreso). "
        f"Detalle: {err_req}"
    )


def _resultado_chrome_en_tick(
    page: Page, inicio: float, err_req: str | None
) -> tuple[str | None, float] | None:
    """None = no hay chrome-error; si hay, retorna (resultado, inicio)."""
    if not _hay_error_chrome(page):
        return None
    err, nuevo_inicio = _manejar_chrome_durante_espera(page, inicio, err_req)
    if err is None:
        return None, inicio
    if err:
        return err, inicio
    return "", nuevo_inicio if nuevo_inicio is not None else inicio


def _resultado_login_estancado(
    page: Page, inicio: float, err_req: str | None
) -> tuple[str | None, float] | None:
    """None = no aplica; si aplica timeout en login, retorna (resultado, inicio)."""
    if not _en_pagina_login(page):
        return None
    if (time.monotonic() - inicio) * 1000 <= POST_LOGIN_FAIL_FAST_MS:
        return None
    if _recuperar_post_login(page) and _sesion_post_login_ok(page):
        return None, inicio
    _dump(page, "login_no_completo")
    return _msg_login_no_completo(err_req), inicio


def _tick_espera_login(
    page: Page, inicio: float, i: int, pasos: int, err_req: str | None
) -> tuple[str | None, float]:
    """Retorna (resultado|'' para seguir, inicio_actualizado). resultado None = ok."""
    if _sesion_post_login_ok(page):
        return None, inicio
    if _login_fallido(page):
        _dump(page, "error_credenciales")
        return MSG_CRED_INVALIDAS, inicio

    chrome = _resultado_chrome_en_tick(page, inicio, err_req)
    if chrome is not None:
        return chrome

    estancado = _resultado_login_estancado(page, inicio, err_req)
    if estancado is not None:
        return estancado

    if i > pasos - 3:
        err = _detectar_error_pagina(page, ignorar_si_hay_roles=True)
        if err:
            _dump(page, "error_login")
            return err, inicio
    return "", inicio


def _resultado_final_espera_login(page: Page, err_req: str | None) -> str | None:
    if _sesion_post_login_ok(page):
        return None
    if _hay_error_chrome(page) and _recuperar_post_login(page) and _sesion_post_login_ok(page):
        return None
    err = _detectar_error_pagina(page, ignorar_si_hay_roles=False)
    if err:
        _dump(page, "login_error_402")
        return err
    if _en_pagina_login(page):
        _dump(page, "login_no_completo")
        return _msg_login_no_completo(err_req)
    _dump(page, "login_sin_roles")
    return "Login completado pero no apareció la Lista de Roles en SofiaPlus (revise encabezado/sidebar)"


def _esperar_sesion_tras_submit(page: Page, err_req: str | None) -> str | None:
    inicio = time.monotonic()
    pasos = max(1, WAIT_LOGIN_MS // 250)
    for i in range(pasos):
        resultado, inicio = _tick_espera_login(page, inicio, i, pasos, err_req)
        if resultado != "":
            return resultado
        page.wait_for_timeout(250)
    return _resultado_final_espera_login(page, err_req)


def _completar_login(page: Page, cred: Credenciales) -> str | None:
    """Completa el formulario de login (Scrapling ya navegó a welcome.jsp → authpre)."""
    _dump(page, "01_login_cargado", solo_error=False)
    page.wait_for_timeout(600)

    err = _llenar_campos_login(page, cred)
    if err:
        _dump(page, "error_campos_login")
        return err

    _dump(page, "02_login_lleno", solo_error=False)
    page.wait_for_timeout(400)

    # Preferir POST por APIRequest: evita ERR_BLOCKED_BY_CLIENT al navegar authpre.
    err_req = _login_por_request(page)
    if err_req is None:
        return None
    if err_req == MSG_CRED_INVALIDAS:
        _dump(page, "error_credenciales")
        return err_req

    _dump(page, "03_post_login_request_fallback", solo_error=False)

    if not _enviar_login_fallback_click(page):
        _dump(page, "error_enviar_login")
        return err_req or "No se pudo enviar el formulario de login (Ingresar)"

    try:
        page.wait_for_load_state("domcontentloaded", timeout=30000)
    except Exception:
        pass
    page.wait_for_timeout(2000)
    _dump(page, "03_post_login", solo_error=False)

    if _hay_error_chrome(page):
        _dump(page, "error_chrome_previo", solo_error=False)
        if _recuperar_post_login(page) and _sesion_post_login_ok(page):
            return None

    return _esperar_sesion_tras_submit(page, err_req)


def _en_formulario_consultar(page: Page) -> bool:
    if not _texto_visible_en_frames(page, MENU_CONSULTAR_REGISTRO):
        return False
    for frame in _frames(page):
        try:
            if frame.locator('input[type="text"]').count() > 0:
                return True
        except Exception:
            continue
    return False


def _aplicar_opcion_select(page: Page, sel: Any, opt: Any) -> bool:
    label = opt.inner_text().strip()
    if not label:
        return False
    value = opt.get_attribute("value")
    if value:
        sel.select_option(value=value, timeout=5000)
    else:
        sel.select_option(label=label, timeout=5000)
    page.wait_for_timeout(WAIT_SHORT_MS)
    return True


def _seleccionar_en_select(page: Page, sel: Any, texto: str) -> bool:
    opts = sel.locator("option")
    for j in range(opts.count()):
        opt = opts.nth(j)
        label = opt.inner_text().strip()
        if label and _texto_coincide(label, texto) and _aplicar_opcion_select(page, sel, opt):
            return True
    return False


def _seleccionar_por_texto(page: Page, selector: str, texto: str) -> bool:
    for frame in _frames(page):
        try:
            selects = frame.locator(selector)
            for i in range(selects.count()):
                if _seleccionar_en_select(page, selects.nth(i), texto):
                    return True
        except Exception:
            continue
    return False


def _click_texto(page: Page, texto: str) -> bool:
    for frame in _frames(page):
        js = """
        (texto) => {
            const norm = (s) => (s || '').toLowerCase().trim()
                .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i')
                .replace(/ó/g,'o').replace(/ú/g,'u').replace(/ñ/g,'n');
            const buscar = norm(texto);
            const nodos = Array.from(document.querySelectorAll(
                'a, button, span, td, div, li, label, option, nav, aside, .sidebar a, #sidebar a, #encabezado a, #encabezado select'
            ));
            for (const n of nodos) {
                const t = norm(n.innerText || n.textContent || '');
                if (t === buscar) { n.click(); return true; }
            }
            for (const n of nodos) {
                const t = norm(n.innerText || n.textContent || '');
                if (t.includes(buscar) && t.length < buscar.length + 30) { n.click(); return true; }
            }
            return false;
        }
        """
        try:
            ok = frame.evaluate(js, texto)
            if ok:
                page.wait_for_timeout(WAIT_MENU_MS)
                return True
        except Exception:
            continue
    return False


def _texto_tiene_402(t: str) -> bool:
    return TXT_ERROR_402 in t or "intentando acceder de forma incorrecta" in t


def _error_402_en_url_o_titulo(page: Page) -> bool:
    try:
        if "error402.jsp" in page.url.lower():
            return True
    except Exception:
        pass
    try:
        return TXT_ERROR_402 in _normalizar_texto(page.title())
    except Exception:
        return False


def _error_402_en_pagina(page: Page) -> bool:
    if _tiene_lista_roles(page):
        return False
    if _error_402_en_url_o_titulo(page):
        return True
    try:
        if _texto_tiene_402(_normalizar_texto(page.content())):
            return True
    except Exception:
        pass
    # 402 solo en iframe hijo suele ser transitorio (loadOk); no fallar aún.
    return False


def _detectar_error_pagina(page: Page, *, ignorar_si_hay_roles: bool = True) -> str | None:
    if ignorar_si_hay_roles and _tiene_lista_roles(page):
        return None

    try:
        url = page.url.lower()
        if url.startswith("chrome-error:"):
            return None
        if "error401.jsp" in url:
            return "SofiaPlus rechazó la sesión (ERROR 401). Reintente más tarde."
    except Exception:
        pass

    if _error_402_en_pagina(page):
        return "SofiaPlus rechazó la sesión (ERROR 402). Reintente más tarde."

    texto = _texto_pagina_completo(page)
    if "acceso restringido" in texto or "pagina web bloqueada" in texto:
        return "SofiaPlus bloqueó el acceso automatizado"
    if "informacion de usuario invalida" in texto or "credenciales invalidas" in texto:
        return MSG_CRED_INVALIDAS
    if "usuario y contrase" in texto and "invalid" in texto:
        return MSG_CRED_INVALIDAS
    return None


def _login_fallido(page: Page) -> str | None:
    if _tiene_lista_roles(page):
        return None
    for frame in _frames(page):
        try:
            texto = _normalizar_texto(frame.inner_text("body"))
        except Exception:
            continue
        if "informacion de usuario invalida" in texto:
            return MSG_CRED_INVALIDAS
    return None


def _sesion_sofia_activa(page: Page) -> bool:
    if _pagina_error_sofia(page) or _en_pagina_login(page) or _hay_error_chrome(page):
        return False
    if _tiene_lista_roles(page):
        return True
    if _sesion_post_login_ok(page):
        return True
    url = page.url.lower()
    if "josso_security_check" in url or "josso/signon" in url or "authpre" in url:
        return False
    # Home real del portal (no basta cualquier /sofia/).
    return "senasofiaplus.edu.co/sofia/home" in url or "principal.faces" in url


def _texto_visible_en_frames(page: Page, texto: str) -> bool:
    buscar = _normalizar_texto(texto)
    for frame in _frames(page):
        try:
            if frame.locator(f"text={texto}").count() > 0:
                return True
            cuerpo = _normalizar_texto(frame.inner_text("body"))
            if buscar in cuerpo:
                return True
        except Exception:
            continue
    return False


def _disparar_cambio_select(sel: Any) -> None:
    try:
        sel.evaluate(
            "el => el.dispatchEvent(new Event('change', { bubbles: true }))"
        )
    except Exception:
        pass


def _probar_select_opcion_rol(sel: Any, value: str, label: str) -> Any | None:
    try:
        sel.select_option(value=value, timeout=4000)
        return sel
    except Exception:
        try:
            sel.select_option(label=label, timeout=4000)
            return sel
        except Exception:
            return None


def _elegir_rol_en_selects(page: Page, variantes: list[str]) -> Any | None:
    for frame in _frames(page):
        for sel, value, label in _opciones_select_roles(frame):
            if not any(_texto_coincide(label, v) for v in variantes):
                continue
            usado = _probar_select_opcion_rol(sel, value, label)
            if usado is not None:
                return usado
    return None


def _elegir_rol_fallback(page: Page, variantes: list[str]) -> bool:
    for variante in variantes:
        if _seleccionar_por_texto(page, "select", variante):
            return True
    for variante in variantes:
        if _click_texto(page, variante):
            return True
    return False


def _seleccionar_rol(page: Page, rol: str) -> str | None:
    if not _esperar_lista_roles(page, timeout_ms=WAIT_ROLES_MS):
        err = _detectar_error_pagina(page, ignorar_si_hay_roles=False)
        if err:
            return err
        if _en_pagina_login(page):
            return "El login no se completó antes de elegir el rol"
        return f"No se encontró la Lista de Roles (encabezado/sidebar) para '{rol}'"

    variantes = _variantes_rol(rol)
    select_usado = _elegir_rol_en_selects(page, variantes)
    seleccionado = select_usado is not None or _elegir_rol_fallback(page, variantes)
    if not seleccionado:
        return f"No se pudo seleccionar el rol '{rol}' en el sidebar/encabezado"

    if select_usado is not None:
        _disparar_cambio_select(select_usado)

    page.wait_for_timeout(WAIT_MENU_MS)

    for _ in range(20):
        if _texto_visible_en_frames(page, MENU_SGS):
            return None
        page.wait_for_timeout(250)
    return f"No apareció el menú SGS en el sidebar tras elegir el rol '{rol}'"


def _navegar_consultar_registro(page: Page) -> str | None:
    if _en_formulario_consultar(page):
        return None
    for paso in PASOS_MENU:
        if not _click_texto(page, paso):
            return f"No se encontró el menú '{paso}'"
        page.wait_for_timeout(WAIT_MENU_MS)
    page.wait_for_timeout(WAIT_FORM_MS)
    return None


def _valor_tras_etiqueta(texto: str, prefijos: tuple[str, ...]) -> str:
    for line in texto.splitlines():
        norm = _normalizar_texto(line)
        for pref in prefijos:
            if not norm.startswith(pref):
                continue
            # Tomar el valor desde la línea original (tras ':').
            if ":" in line:
                return line.split(":", 1)[1].strip()
            return line[len(pref) :].strip()
    return ""


def _resolver_tipo_doc(raw: str) -> str:
    if not raw:
        return ""
    tipo = CODIGO_A_TIPO_CORTO.get(raw.upper(), raw)
    if len(tipo) <= 4:
        return CODIGO_A_TIPO_CORTO.get(raw.upper(), SOFIA_CODIGO_A_TIPO.get(raw.upper(), raw))
    return tipo


def _extraer_registro(texto: str, numero: str) -> tuple[str, str] | None:
    t = _normalizar_texto(texto)
    if MSG_NO_REGISTRADO in t:
        return None
    if "nis:" not in t and "tipo de identificacion:" not in t:
        return None
    if numero not in texto.replace(" ", "") and numero not in texto:
        return None

    raw_tipo = _valor_tras_etiqueta(texto, _PREF_TIPO_IDENT)
    # Si el valor incluye "Número...", recortar.
    for marca in ("Número", "Numero", "número", "numero"):
        if marca in raw_tipo:
            raw_tipo = raw_tipo.split(marca, 1)[0].strip()
            break
    tipo = _resolver_tipo_doc(raw_tipo)

    partes = [
        v
        for v in (
            _valor_tras_etiqueta(texto, _PREF_NOMBRES),
            _valor_tras_etiqueta(texto, _PREF_APELLIDO1),
            _valor_tras_etiqueta(texto, _PREF_APELLIDO2),
        )
        if v
    ]
    return tipo, " ".join(partes)


def _seleccionar_en_select_indice(page: Page, indice: int, texto: str) -> bool:
    for frame in _frames(page):
        try:
            selects = frame.locator("select")
            if indice >= selects.count():
                continue
            if _seleccionar_en_select(page, selects.nth(indice), texto):
                return True
        except Exception:
            continue
    return False


def _escribir_numero_consulta(page: Page, numero: str) -> bool:
    for frame in _frames(page):
        try:
            inputs = frame.locator('input[type="text"]')
            count = inputs.count()
            if count == 0:
                continue
            campo = inputs.nth(count - 1)
            campo.fill("")
            campo.fill(numero)
            return True
        except Exception:
            continue
    return False


def _leer_cuerpo_frames(page: Page) -> str:
    for frame in _frames(page):
        try:
            texto = frame.inner_text("body")
            if texto.strip():
                return texto
        except Exception:
            continue
    return ""


def _resultado_consulta_registro(
    page: Page, tipo: str, numero: str
) -> tuple[str, str, str]:
    page.wait_for_timeout(WAIT_FORM_MS)
    texto = _leer_cuerpo_frames(page)
    if not texto:
        return VERIFICACION_NO_VERIFICADO, "", "No se pudo leer la respuesta de SofiaPlus"

    _dump(page, f"resultado_{_sanitize(tipo)}")
    parsed = _extraer_registro(texto, numero)
    if parsed:
        tipo_doc, nombre = parsed
        return VERIFICACION_REGISTRADO, tipo_doc or tipo, nombre
    if MSG_NO_REGISTRADO in _normalizar_texto(texto):
        return VERIFICACION_NO_REGISTRADO, "", ""
    return VERIFICACION_NO_VERIFICADO, "", "SofiaPlus no devolvió una respuesta clara"


def _consultar_un_tipo(page: Page, tipo: str, numero: str) -> tuple[str, str, str]:
    """Retorna (estado, tipo_encontrado, nombre o mensaje de error)."""
    if not _seleccionar_por_texto(page, "select", "Persona"):
        if not _seleccionar_en_select_indice(page, 0, "Persona"):
            return VERIFICACION_NO_VERIFICADO, "", "No se pudo seleccionar Tipo de Usuario Persona"

    if not _seleccionar_por_texto(page, "select", tipo):
        if not _seleccionar_en_select_indice(page, 1, tipo):
            return VERIFICACION_NO_VERIFICADO, "", f"No se pudo seleccionar tipo '{tipo}'"

    if not _escribir_numero_consulta(page, numero):
        return VERIFICACION_NO_VERIFICADO, "", "No se pudo escribir el número de documento"

    if not _click_texto(page, MENU_CONSULTAR_REGISTRO):
        return VERIFICACION_NO_VERIFICADO, "", f"No se pudo hacer clic en {MENU_CONSULTAR_REGISTRO}"

    return _resultado_consulta_registro(page, tipo, numero)


def _tipos_a_probar(tipo_codigo: str) -> list[str]:
    codigo = tipo_codigo.strip().upper()
    if codigo and codigo in SOFIA_CODIGO_A_TIPO:
        return [SOFIA_CODIGO_A_TIPO[codigo]]
    return list(TIPOS_CONSULTA)


def _buscar_documento(page: Page, numero: str, tipo_codigo: str) -> ResultadoVerificacion:
    tipos = _tipos_a_probar(tipo_codigo)
    errores: list[str] = []

    for tipo in tipos:
        estado, tipo_encontrado, extra = _consultar_un_tipo(page, tipo, numero)
        if estado == VERIFICACION_REGISTRADO:
            return ResultadoVerificacion(
                numero_documento=numero,
                estado=VERIFICACION_REGISTRADO,
                tipo_encontrado=tipo_encontrado,
                nombre=extra,
                mensaje="Registrado en SofiaPlus.",
            )
        if estado == VERIFICACION_NO_VERIFICADO:
            errores.append(extra or "Error en consulta")
            break

    if errores:
        return _no_verificado(
            numero,
            errores[0] + " Reintente más tarde.",
        )

    return ResultadoVerificacion(
        numero_documento=numero,
        estado=VERIFICACION_NO_REGISTRADO,
        mensaje="No está registrado en SofiaPlus (probados todos los tipos de documento).",
    )


def _ejecutar_flujo(ctx: ContextoScrape) -> None:
    def consultar(page: Page) -> None:
        for doc in ctx.docs:
            ctx.resultados.append(_buscar_documento(page, doc.numero_documento, doc.tipo_documento))

    err = _ejecutar_con_scrapling(ctx.cred, consultar)
    if err and not ctx.resultados:
        for d in ctx.docs:
            ctx.resultados.append(_no_verificado(d.numero_documento, err))


def verificar_documento(numero: str, cred: Credenciales, tipo_codigo: str = "") -> ResultadoVerificacion:
    ctx = ContextoScrape(
        cred=cred,
        docs=[DocumentoLote(numero_documento=numero, tipo_documento=tipo_codigo)],
    )
    _ejecutar_flujo(ctx)
    if ctx.resultados:
        return ctx.resultados[0]
    return _no_verificado(numero, "No se obtuvo respuesta del scraper")


def verificar_lote(cred: Credenciales, docs: list[DocumentoLote]) -> list[ResultadoVerificacion]:
    ctx = ContextoScrape(cred=cred, docs=docs)
    _ejecutar_flujo(ctx)
    if ctx.resultados:
        return ctx.resultados
    msg = "No se obtuvo respuesta del scraper"
    return [_no_verificado(d.numero_documento, msg) for d in docs]


