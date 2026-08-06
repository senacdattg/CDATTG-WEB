"""Consulta Inscripciones a Programas de Formación (SofiaPlus, rol Usuario SENA).

Flujo (Scrapling StealthyFetcher):
  login → Usuario SENA → Inscripción → Consultar Programas de Formación
  → Consultar Inscripciones a Programas de Formación
  → tipo + número → Consultar → paginar → filtrar por programa de formación.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, field
from urllib.parse import urljoin

from patchright.sync_api import Page
from scrapling.fetchers import StealthyFetcher

from app.config import require_login_url
from app import scraper as s

ROL_USUARIO_SENA = s.ROL_USUARIO_SENA

ESTADO_ENCONTRADO = "ENCONTRADO"
ESTADO_NO_ENCONTRADO = "NO_ENCONTRADO"
ESTADO_NO_VERIFICADO = "NO_VERIFICADO"

TIPOS_INSCRIPCION = [
    s.TIPO_CC,
    s.TIPO_TI,
    s.TIPO_CE,
    s.TIPO_PEP,
    s.TIPO_PPT,
    s.TIPO_DNI,
    s.TIPO_NCS,
    "Pasaporte",
]

# Estados de fila (orden: más largos primero para emparejar sufijo).
_ESTADOS_FILA = (
    "cancelado academico",
    "no admitido",
    "certificado",
    "matriculado",
    "cancelado",
    "retiro",
    "traslado",
    "aplazado",
)

MAX_PAGINAS = 40


@dataclass
class RegistroInscripcion:
    ficha: str
    programa: str
    estado: str


@dataclass
class ResultadoInscripciones:
    numero_documento: str
    programa_consultado: str
    estado: str
    tipo_encontrado: str = ""
    registros: list[RegistroInscripcion] = field(default_factory=list)
    mensaje: str = ""


@dataclass
class ConsultaLoteItem:
    numero_documento: str
    programa: str
    tipo_documento: str = ""


ROL_ASPIRANTE = "Aspirante"
MENU_INSCRIPCION = s.MSG_INSCRIPCION
MSG_IDENT_FICHA = s.MSG_IDENT_FICHA
MSG_NO_ENCONTR = s.MSG_NO_ENCONTR
SEL_INPUT_TEXT = s.SEL_INPUT_TEXT
MENU_CONSULTAR_PROGRAMAS = "Consultar Programas de Formación"
MENU_CONSULTAR_INSCRIPCIONES = "Consultar Inscripciones a Programas de Formación"
# Usuario SENA usa validarUsuarioConsulta.faces (menId=11).
# Aspirante usa consultarInscripcion.faces (menId=28) — NO mezclar.
HREF_USUARIO_SENA = "validarUsuarioConsulta.faces"
HREF_ASPIRANTE = "consultarInscripcion.faces"
# Sofía Plus en este entorno solo responde por HTTP (no HTTPS en el puerto del portal).
URL_CONSULTAR_INSCRIPCION_USUARIO_SENA = (
    s.SCHEME_HTTP
    + "senasofiaplus.edu.co/sofia/inscripcion/consultarinscripcion/"
    + "validarUsuarioConsulta.faces?menId=11&fwkmenu=si"
)
WAIT_IFRAME_FORM_MS = 12000 if s.SOFIA_RAPIDO else 25000
VALOR_ROL_USUARIO_SENA = "2"


def _url_es_form_inscripcion(url: str) -> bool:
    u = (url or "").lower()
    if "edt" in u:
        return False
    # Rol Usuario SENA (flujo real de las capturas).
    if "validarusuarioconsulta.faces" in u:
        return True
    # Otros roles / paso siguiente del flujo.
    if "consultarinscripcion.faces" in u:
        return True
    return False


def _frame_contenido(page: Page):
    # Preferir el iframe que ya navegó al formulario.
    for frame in page.frames:
        try:
            if _url_es_form_inscripcion(frame.url or ""):
                return frame
        except Exception:
            continue
    try:
        fr = page.frame(name="contenido")
        if fr is not None:
            return fr
    except Exception:
        pass
    for frame in page.frames:
        try:
            if (frame.name or "") == "contenido":
                return frame
        except Exception:
            continue
    return None


def _en_formulario_inscripcion(page: Page) -> bool:
    """Solo True si algún frame navego realmente a consultarInscripcion.faces.

    No usar texto del menú lateral: 'Consultar Inscripciones...' aparece en el shell
    aunque el iframe siga en la bienvenida.
    """
    for frame in page.frames:
        try:
            if _url_es_form_inscripcion(frame.url or ""):
                return True
        except Exception:
            continue
    return False


def _esperar_formulario_inscripcion(page: Page, timeout_ms: int = WAIT_IFRAME_FORM_MS) -> bool:
    poll = s.POLL_MS
    for _ in range(max(1, timeout_ms // poll)):
        if _en_formulario_inscripcion(page):
            # Dar tiempo a que JSF pinte inputs dentro del iframe.
            s._pause(page, 400 if s.SOFIA_RAPIDO else 1000)
            return True
        page.wait_for_timeout(poll)
    return False


def _dump_iframe_contenido(page: Page, paso: str) -> None:
    """Guarda HTML del iframe contenido (el dump normal solo ve el shell principal)."""
    if s.SOFIA_RAPIDO and not paso.startswith("error"):
        return
    fr = _frame_contenido(page)
    if fr is None:
        return
    try:
        import os
        import time

        from app.config import DIAG_DIR

        os.makedirs(DIAG_DIR, exist_ok=True)
        sello = time.strftime("%H%M%S")
        path = os.path.join(DIAG_DIR, f"{sello}_{s._sanitize(paso)}_iframe.html")
        with open(path, "w", encoding="utf-8") as f:
            f.write(fr.content())
    except Exception:
        pass


def _selects_con_opcion(frame, texto: str) -> list:
    """Selects que contienen una opción con el texto dado (ej. Aspirante)."""
    hallados = []
    try:
        selects = frame.locator("select")
        for i in range(selects.count()):
            sel = selects.nth(i)
            labels = s._labels_select(frame, sel)
            if any(s._texto_coincide(lb, texto) for lb in labels):
                hallados.append(sel)
    except Exception:
        pass
    return hallados


def _select_roles_candidato(frame):
    for sel in _selects_con_opcion(frame, ROL_ASPIRANTE):
        labels = s._labels_select(frame, sel)
        if any(s._texto_coincide(lb, ROL_USUARIO_SENA) for lb in labels):
            return sel
        if len(labels) >= 3:
            return sel
    return None


def _encontrar_select_roles_aspirante(page: Page):
    """Busca el combo del sidebar que muestra/contiene Aspirante (no el texto 'Lista de Roles')."""
    for _ in range(max(1, s.WAIT_ROLES_MS // 250)):
        for frame in s._frames(page):
            sel = _select_roles_candidato(frame)
            if sel is not None:
                return sel, frame
        page.wait_for_timeout(250)
    return None, None


def _blockui_visible(page: Page) -> bool:
    try:
        return bool(
            page.evaluate(
                """() => {
                    const nodes = document.querySelectorAll('.blockUI, .blockOverlay, .blockMsg');
                    for (const n of nodes) {
                        const st = window.getComputedStyle(n);
                        if (st && st.display !== 'none' && st.visibility !== 'hidden' && st.opacity !== '0') {
                            return true;
                        }
                    }
                    return false;
                }"""
            )
        )
    except Exception:
        return False


def _esperar_sin_blockui(page: Page, timeout_ms: int = 30000) -> bool:
    """Espera a que desaparezca el overlay blockUI de Sofía (cambio de rol / menú)."""
    to = min(timeout_ms, 10000) if s.SOFIA_RAPIDO else timeout_ms
    poll = s.POLL_MS
    for _ in range(max(1, to // poll)):
        if not _blockui_visible(page):
            return True
        page.wait_for_timeout(poll)
    return not _blockui_visible(page)


def _select_roles_locator(page: Page):
    for frame in s._frames(page):
        try:
            cand = frame.locator(
                'select[id="seleccionRol:roles"], select[name="seleccionRol:roles"]'
            )
            if cand.count() > 0:
                return cand.first, frame
        except Exception:
            continue
    sel, frame = _encontrar_select_roles_aspirante(page)
    return sel, frame


def _rol_label_actual(page: Page) -> str:
    sel, _frame = _select_roles_locator(page)
    if sel is None:
        return ""
    try:
        return (
            sel.evaluate(
                """el => {
                    const o = el.options[el.selectedIndex];
                    return o ? (o.text || '').trim() : '';
                }"""
            )
            or ""
        )
    except Exception:
        return ""


def _rol_actual_parece_usuario_sena(page: Page) -> bool:
    """True solo si el select de roles tiene exactamente Usuario SENA seleccionado."""
    return s._normalizar_texto(_rol_label_actual(page)) == s._normalizar_texto(ROL_USUARIO_SENA)


def _disparar_cambio_rol_a4j(page: Page, valor: str) -> str:
    """Cambia seleccionRol:roles y dispara el A4J.AJAX.Submit del onchange inline."""
    try:
        return str(
            page.evaluate(
                """(valor) => {
                    const el = document.querySelector('select[id="seleccionRol:roles"]')
                        || document.querySelector('select[name="seleccionRol:roles"]');
                    if (!el) return 'no-select';
                    const v = String(valor);
                    let found = false;
                    for (const o of el.options) {
                        if (String(o.value) === v) { found = true; break; }
                    }
                    if (!found) return 'no-option';
                    el.focus();
                    el.value = v;
                    for (const o of el.options) { o.selected = String(o.value) === v; }
                    const attr = el.getAttribute('onchange') || '';
                    // RichFaces: ejecutar el handler inline con un Event real en scope `event`.
                    if (attr && attr.indexOf('A4J.AJAX.Submit') >= 0) {
                        const event = new Event('change', { bubbles: true, cancelable: true });
                        try {
                            // el handler espera `event` como variable libre
                            const fn = new Function('event', attr);
                            fn.call(el, event);
                            return 'a4j-submit';
                        } catch (e) {
                            try { el.dispatchEvent(event); return 'dispatch-after-a4j-error'; }
                            catch (e2) { return 'a4j-error:' + String(e); }
                        }
                    }
                    el.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
                    return 'dispatch';
                }""",
                str(valor),
            )
        )
    except Exception as exc:
        return f"exception:{exc}"


def _intentar_seleccionar_usuario_sena(page: Page) -> bool:
    """Un intento: Playwright select_option y/o A4J submit. Verifica label final."""
    _esperar_sin_blockui(page, 12000)
    sel, _frame = _select_roles_locator(page)
    if sel is None:
        return False
    try:
        sel.scroll_into_view_if_needed(timeout=3000)
    except Exception:
        pass

    # 1) Playwright (onchange nativo del <select>)
    try:
        sel.select_option(value=VALOR_ROL_USUARIO_SENA, timeout=5000)
    except Exception:
        try:
            sel.select_option(label=ROL_USUARIO_SENA, timeout=5000)
        except Exception:
            pass

    _esperar_sin_blockui(page, 20000)
    if _rol_actual_parece_usuario_sena(page):
        return True

    # 2) A4J.AJAX.Submit explícito (como el onchange del HTML de Sofía)
    modo = _disparar_cambio_rol_a4j(page, VALOR_ROL_USUARIO_SENA)
    _esperar_sin_blockui(page, 25000)
    if _rol_actual_parece_usuario_sena(page):
        return True

    # Si A4J dejó spinner eterno, recargar home y reintentar una vez más en el caller.
    if _blockui_visible(page) or modo.startswith("a4j-error"):
        try:
            page.goto(s.SOFIA_HOME_URL, wait_until="domcontentloaded", timeout=25000)
            s._pause(page, 2000)
            _esperar_sin_blockui(page, 15000)
        except Exception:
            pass
    return _rol_actual_parece_usuario_sena(page)


def _confirmar_rol_usuario_sena_estable(page: Page) -> bool:
    ok_estable = 0
    for _ in range(12):
        if _blockui_visible(page):
            ok_estable = 0
        elif _rol_actual_parece_usuario_sena(page):
            ok_estable += 1
            if ok_estable >= 3:
                return True
        else:
            ok_estable = 0
        page.wait_for_timeout(250)
    return False


def _recargar_home_roles(page: Page) -> None:
    try:
        page.goto(s.SOFIA_HOME_URL, wait_until="domcontentloaded", timeout=25000)
        s._pause(page, 2000)
        _esperar_sin_blockui(page, 15000)
    except Exception:
        pass


def _seleccionar_usuario_sena(page: Page) -> str | None:
    """Obligatorio: quedar en Usuario SENA. Sin fallback a Aspirante/Aprendiz."""
    if s._en_pagina_login(page):
        return "El login no se completó antes de elegir el rol"

    _esperar_sin_blockui(page, 15000)
    s._dump(page, "04_rol_antes", solo_error=False)

    if _rol_actual_parece_usuario_sena(page):
        s._dump(page, "04_rol_ya_usuario_sena", solo_error=False)
        return None

    for intento in range(1, 4):
        if _intentar_seleccionar_usuario_sena(page) and _confirmar_rol_usuario_sena_estable(page):
            s._dump(page, "04_rol_despues_usuario_sena", solo_error=False)
            return None
        actual = _rol_label_actual(page) or "?"
        s._dump(page, f"04_rol_intento_{intento}_{s._sanitize(actual)}", solo_error=False)
        _recargar_home_roles(page)

    actual = _rol_label_actual(page) or "desconocido"
    s._dump(page, f"error_rol_actual_{s._sanitize(actual)}")
    return (
        f"No se pudo cambiar de '{actual}' a '{ROL_USUARIO_SENA}'. "
        f"En Sofía hay que elegir {ROL_USUARIO_SENA} en el select del sidebar "
        "(no basta Aspirante/Aprendiz)."
    )


def _href_menu_consultar_inscripcion(page: Page) -> str:
    """Href del menú según el rol actual (Usuario SENA vs Aspirante)."""
    for frame in s._frames(page):
        try:
            href = frame.evaluate(
                """() => {
                    const side = document.querySelector('#side-menu') || document;
                    const prefer = side.querySelector("a[href*='validarUsuarioConsulta.faces']")
                        || side.querySelector("a[href*='consultarInscripcion.faces']");
                    if (!prefer) return '';
                    const h = prefer.getAttribute('href') || '';
                    if (/edt/i.test(h)) return '';
                    return h;
                }"""
            )
            if href:
                return str(href).replace("&amp;", "&")
        except Exception:
            continue
    return ""


def _hay_link_consultar_inscripcion(page: Page) -> bool:
    return bool(_href_menu_consultar_inscripcion(page))


def _abrir_menu_consultar_inscripciones(page: Page) -> bool:
    """Expande menú lateral y abre Consultar Inscripciones (link de Usuario SENA)."""
    js = """() => {
        const norm = (s) => (s || '').toLowerCase().trim()
            .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i')
            .replace(/ó/g,'o').replace(/ú/g,'u').replace(/ñ/g,'n')
            .replace(/\\s+/g, ' ');
        const side = document.querySelector('#side-menu') || document;
        const clickPrimario = (label) => {
            const spans = Array.from(side.querySelectorAll('span.menuPrimario, a'));
            for (const n of spans) {
                const t = norm(n.textContent);
                if (t === norm(label) || t.startsWith(norm(label))) {
                    const a = n.closest('a') || n;
                    a.click();
                    return true;
                }
            }
            return false;
        };
        const clickPorTexto = (label) => {
            const buscar = norm(label);
            const links = Array.from(side.querySelectorAll('a'));
            for (const a of links) {
                const t = norm(a.textContent);
                if (t === buscar || t.startsWith(buscar)) {
                    a.click();
                    return true;
                }
            }
            return false;
        };
        // Usuario SENA: validarUsuarioConsulta.faces — Aspirante: consultarInscripcion.faces
        const dest = side.querySelector("a[href*='validarUsuarioConsulta.faces']")
            || side.querySelector("a[href*='consultarInscripcion.faces']");
        if (!dest) return 'sin_link';
        clickPrimario('Inscripción');
        clickPorTexto('Consultar Programas de Formación');
        dest.click();
        return 'ok';
    }"""
    for frame in s._frames(page):
        try:
            result = frame.evaluate(js)
            if result == "ok":
                return True
        except Exception:
            continue
    if not s._click_texto(page, MENU_INSCRIPCION):
        return False
    s._pause(page, 500)
    s._click_texto(page, MENU_CONSULTAR_PROGRAMAS)
    s._pause(page, 500)
    return s._click_texto(page, MENU_CONSULTAR_INSCRIPCIONES)


def _cargar_iframe_inscripcion_directo(page: Page) -> bool:
    """Navega el iframe #contenido a la URL del menú (Usuario SENA)."""
    abs_url = URL_CONSULTAR_INSCRIPCION_USUARIO_SENA
    href = _href_menu_consultar_inscripcion(page)
    if href:
        try:
            base = page.url.rsplit("/", 1)[0] + "/"
            abs_url = urljoin(base, href)
        except Exception:
            abs_url = URL_CONSULTAR_INSCRIPCION_USUARIO_SENA

    try:
        fr = page.frame(name="contenido")
        if fr is not None:
            fr.goto(abs_url, wait_until="domcontentloaded", timeout=30000)
            s._pause(page, 1200)
            if _en_formulario_inscripcion(page):
                return True
    except Exception:
        pass

    try:
        page.evaluate(
            """(url) => {
                const iframe = document.getElementById('contenido')
                    || document.querySelector('iframe[name="contenido"]');
                if (!iframe) return false;
                iframe.src = url;
                return true;
            }""",
            abs_url,
        )
        s._pause(page, 2000)
        _esperar_sin_blockui(page, 15000)
        return _en_formulario_inscripcion(page)
    except Exception:
        return False


def _navegar_consultar_inscripciones(page: Page) -> str | None:
    if _en_formulario_inscripcion(page):
        return None

    # Si se perdió el rol al navegar, recuperarlo (esencial).
    if not _rol_actual_parece_usuario_sena(page):
        err = _seleccionar_usuario_sena(page)
        if err:
            return err

    _esperar_sin_blockui(page, 20000)
    abierto = _abrir_menu_consultar_inscripciones(page)
    s._pause(page, 1200)
    _esperar_sin_blockui(page, 15000)
    s._dump(page, "05_tras_click_menu_inscripcion", solo_error=False)

    if _esperar_formulario_inscripcion(page, timeout_ms=10000):
        s._dump(page, "05_form_inscripcion_ok", solo_error=False)
        return None

    # El menú a veces no dispara target=contenido: forzar URL correcta de Usuario SENA.
    _cargar_iframe_inscripcion_directo(page)

    if _esperar_formulario_inscripcion(page, timeout_ms=WAIT_IFRAME_FORM_MS):
        s._dump(page, "05_form_inscripcion_ok", solo_error=False)
        return None

    s._dump(page, "error_form_inscripcion")
    _dump_iframe_contenido(page, "error_form_inscripcion")
    if not abierto:
        return "No se encontró el menú Consultar Inscripciones (Usuario SENA)"
    return "No se cargó el formulario Consultar Inscripción (validarUsuarioConsulta)"


def _sesion_reconocible(page: Page) -> bool:
    return (
        s._sesion_sofia_activa(page)
        or s._texto_visible_en_frames(page, ROL_ASPIRANTE)
        or s._texto_visible_en_frames(page, "Bienvenido a SOFIA")
    )


def _ir_home_sofia(page: Page) -> None:
    try:
        page.goto(s.SOFIA_HOME_URL, wait_until="domcontentloaded", timeout=25000)
        s._pause(page, 1500)
    except Exception:
        pass


def _login_si_necesario(page: Page, cred: s.Credenciales) -> str | None:
    if s._en_pagina_login(page):
        return s._completar_login(page, cred)
    if _sesion_reconocible(page):
        return None

    s._pause(page, 800)
    if s._en_pagina_login(page):
        return s._completar_login(page, cred)
    if s._sesion_sofia_activa(page) or s._texto_visible_en_frames(page, ROL_ASPIRANTE):
        return None

    err = s._detectar_error_pagina(page, ignorar_si_hay_roles=False)
    if err:
        return err
    _ir_home_sofia(page)
    return None


def _asegurar_formulario_inscripciones(page: Page, cred: s.Credenciales) -> str | None:
    err = s._detectar_error_pagina(page, ignorar_si_hay_roles=True)
    if err:
        return err
    if _en_formulario_inscripcion(page):
        return None

    err = _login_si_necesario(page, cred)
    if err:
        return err

    err = _seleccionar_usuario_sena(page)
    if err:
        return err
    return _navegar_consultar_inscripciones(page)


_CODIGO_EXTRA = {
    "PAS": "Pasaporte",
    "PASAPORTE": "Pasaporte",
}


def _tipos_a_probar(tipo_codigo: str) -> list[str]:
    codigo = tipo_codigo.strip().upper()
    if codigo and codigo in s.SOFIA_CODIGO_A_TIPO:
        return [s.SOFIA_CODIGO_A_TIPO[codigo]]
    if codigo and codigo in _CODIGO_EXTRA:
        return [_CODIGO_EXTRA[codigo]]
    texto = tipo_codigo.strip()
    if texto:
        for t in TIPOS_INSCRIPCION:
            if s._texto_coincide(t, texto):
                return [t]
        return [texto]
    return list(TIPOS_INSCRIPCION)


def _frames_formulario(page: Page) -> list:
    """Prioriza el iframe del formulario de inscripción."""
    orden = []
    fr = _frame_contenido(page)
    if fr is not None:
        orden.append(fr)
    for frame in s._frames(page):
        if fr is not None and frame is fr:
            continue
        orden.append(frame)
    return orden


def _inventarizar_inputs_formulario(page: Page) -> str:
    lineas = []
    for idx, frame in enumerate(_frames_formulario(page)):
        try:
            url = getattr(frame, "url", "") or ""
            info = frame.evaluate(
                """() => Array.from(document.querySelectorAll('input, textarea'))
                    .slice(0, 40)
                    .map(el => ({
                        tag: el.tagName,
                        type: el.type || '',
                        name: el.name || '',
                        id: el.id || '',
                        value: (el.value || '').slice(0, 40),
                        display: (el.offsetParent !== null) || (el.type === 'hidden'),
                        cls: (el.className || '').toString().slice(0, 60),
                    }))"""
            )
            lineas.append(f"frame[{idx}] {url}")
            for item in info or []:
                lineas.append(str(item))
        except Exception as exc:
            lineas.append(f"frame[{idx}] error: {exc}")
    return "\n".join(lineas)


def _set_input_value(campo, valor: str) -> bool:
    try:
        campo.click(timeout=2500, force=True)
    except Exception:
        pass
    try:
        campo.fill(valor, force=True, timeout=4000)
        try:
            actual = campo.input_value(timeout=1000)
            if actual == valor or valor in (actual or ""):
                return True
        except Exception:
            return True
    except Exception:
        pass
    try:
        return bool(
            campo.evaluate(
                """(el, v) => {
                    el.removeAttribute('readonly');
                    el.removeAttribute('disabled');
                    el.focus();
                    el.value = v;
                    for (const ev of ['input', 'keyup', 'change', 'blur']) {
                        el.dispatchEvent(new Event(ev, { bubbles: true }));
                    }
                    return (el.value || '') === v;
                }""",
                valor,
            )
        )
    except Exception:
        return False


_SELECTORES_INPUT_DOC = [
    SEL_INPUT_TEXT,
    "input:not([type])",
    'input[type="number"]',
    'input[type="tel"]',
    'input[name*="identific" i]',
    'input[id*="identific" i]',
    'input[name*="documento" i]',
    'input[id*="documento" i]',
    'input[name*="numero" i]',
    'input[id*="numero" i]',
    "textarea",
]
_ETIQUETAS_INPUT_DOC = (
    "Número de Identificación",
    "Numero de Identificacion",
    "Número de identificación",
    "Identificación",
)
_JS_ESCRIBIR_CERCA_ETIQUETA = """(numero) => {
    const norm = (s) => (s || '').toLowerCase()
        .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i')
        .replace(/ó/g,'o').replace(/ú/g,'u').replace(/ñ/g,'n');
    const nodes = Array.from(document.querySelectorAll('label, td, span, div'));
    let host = null;
    for (const n of nodes) {
        const t = norm(n.textContent || '');
        if (t.includes('numero de identific')) {
            host = n;
            break;
        }
    }
    if (!host) return false;
    let input = host.querySelector('input, textarea');
    if (!input && host.getAttribute('for')) {
        input = document.getElementById(host.getAttribute('for'));
    }
    if (!input) {
        let el = host.parentElement;
        for (let i = 0; i < 4 && el && !input; i++, el = el.parentElement) {
            input = el.querySelector('input:not([type=hidden]):not([type=submit]):not([type=button]), textarea');
        }
    }
    if (!input) {
        const tr = host.closest('tr');
        if (tr) input = tr.querySelector('input:not([type=hidden]), textarea');
    }
    if (!input) return false;
    input.removeAttribute('readonly');
    input.removeAttribute('disabled');
    input.focus();
    input.value = numero;
    for (const ev of ['input', 'keyup', 'change', 'blur']) {
        input.dispatchEvent(new Event(ev, { bubbles: true }));
    }
    return (input.value || '') === numero;
}"""
_JS_PRIMER_EDITABLE = """(numero) => {
    const inputs = Array.from(document.querySelectorAll('input, textarea'));
    for (const el of inputs) {
        const t = (el.type || 'text').toLowerCase();
        if (['hidden','submit','button','checkbox','radio','password','image'].includes(t)) continue;
        if ((el.name || '').toLowerCase().includes('rol')) continue;
        el.removeAttribute('readonly');
        el.removeAttribute('disabled');
        el.focus();
        el.value = numero;
        for (const ev of ['input', 'keyup', 'change', 'blur']) {
            el.dispatchEvent(new Event(ev, { bubbles: true }));
        }
        if ((el.value || '') === numero) return true;
    }
    return false;
}"""


def _frame_es_form_inscripcion(frame) -> bool:
    try:
        url = (getattr(frame, "url", "") or "").lower()
    except Exception:
        url = ""
    nombre = (getattr(frame, "name", "") or "").lower()
    return _url_es_form_inscripcion(url) or "contenido" in nombre or not url.startswith("http")


def _escribir_por_etiqueta(frame, numero: str) -> bool:
    for etiqueta in _ETIQUETAS_INPUT_DOC:
        try:
            loc = frame.get_by_label(etiqueta, exact=False)
            if loc.count() > 0 and _set_input_value(loc.first, numero):
                return True
        except Exception:
            continue
    return False


def _escribir_cerca_etiqueta_js(frame, numero: str) -> bool:
    try:
        return bool(frame.evaluate(_JS_ESCRIBIR_CERCA_ETIQUETA, numero))
    except Exception:
        return False


def _candidatos_input_numero(frame) -> list:
    candidatos = []
    for sel in _SELECTORES_INPUT_DOC:
        try:
            loc = frame.locator(sel)
            for i in range(loc.count()):
                candidatos.append(loc.nth(i))
        except Exception:
            continue
    return candidatos


def _escribir_en_candidatos(candidatos: list, numero: str) -> bool:
    tipos_ignorar = {"hidden", "submit", "button", "checkbox", "radio", "password", "image"}
    for campo in reversed(candidatos):
        try:
            tipo = (campo.get_attribute("type") or "text").lower()
            if tipo in tipos_ignorar:
                continue
            name = (campo.get_attribute("name") or "").lower()
            cid = (campo.get_attribute("id") or "").lower()
            if "rol" in name or "rol" in cid or "josso" in name:
                continue
            if _set_input_value(campo, numero):
                return True
        except Exception:
            continue
    return False


def _escribir_primer_editable(frame, numero: str) -> bool:
    try:
        return bool(frame.evaluate(_JS_PRIMER_EDITABLE, numero))
    except Exception:
        return False


def _escribir_numero_en_frame(frame, numero: str) -> bool:
    if _escribir_por_etiqueta(frame, numero):
        return True
    if _escribir_cerca_etiqueta_js(frame, numero):
        return True
    if _escribir_en_candidatos(_candidatos_input_numero(frame), numero):
        return True
    return _frame_es_form_inscripcion(frame) and _escribir_primer_editable(frame, numero)


def _escribir_numero_en_formulario(page: Page, numero: str) -> bool:
    """Escribe el documento en el iframe de Consultar Inscripción."""
    for frame in _frames_formulario(page):
        if _escribir_numero_en_frame(frame, numero):
            return True
    return False


def _esperar_select_tipo_documento(page: Page, timeout_ms: int = 12000) -> bool:
    for _ in range(max(1, timeout_ms // 250)):
        if _hay_select_tipo_documento(page):
            return True
        page.wait_for_timeout(250)
    return _hay_select_tipo_documento(page)


def _asegurar_form_antes_llenar(page: Page) -> str | None:
    _esperar_sin_blockui(page, 20000)
    if not _rol_actual_parece_usuario_sena(page):
        err = _seleccionar_usuario_sena(page)
        if err:
            return err
    # Tras un resultado, la URL puede seguir “de inscripción” pero sin el <select> de tipo.
    if _en_formulario_inscripcion(page) and _hay_select_tipo_documento(page):
        return None
    if not _en_formulario_inscripcion(page) or not _hay_select_tipo_documento(page):
        _volver_formulario(page)
    if _esperar_formulario_inscripcion(page, timeout_ms=8000) and _esperar_select_tipo_documento(page, 8000):
        return None
    _cargar_iframe_inscripcion_directo(page)
    if _esperar_formulario_inscripcion(page, timeout_ms=12000) and _esperar_select_tipo_documento(
        page, 12000
    ):
        return None
    s._dump(page, "error_form_antes_llenar")
    _dump_iframe_contenido(page, "error_form_antes_llenar")
    return "No se cargó el formulario Consultar Inscripción (validarUsuarioConsulta)"


def _codigo_tipo_doc(tipo: str) -> str:
    """Normaliza etiqueta o código a CC/TI/CE/…"""
    raw = (tipo or "").strip()
    if not raw:
        return ""
    up = raw.upper()
    if up in s.SOFIA_CODIGO_A_TIPO or up in _CODIGO_EXTRA:
        return up
    for codigo, etiqueta in s.SOFIA_CODIGO_A_TIPO.items():
        if s._texto_coincide(etiqueta, raw):
            return codigo
    for codigo, etiqueta in _CODIGO_EXTRA.items():
        if s._texto_coincide(etiqueta, raw):
            return codigo
    return up


def _select_es_tipo_documento(frame, sel) -> bool:
    """Select del form de inscripción (valores CC/TI/CE…), no el de roles."""
    labels = s._labels_select(frame, sel)
    if s._es_select_roles(labels):
        return False
    try:
        vals = [
            (sel.locator("option").nth(j).get_attribute("value") or "").strip().upper()
            for j in range(sel.locator("option").count())
        ]
    except Exception:
        vals = []
    codigos = {"CC", "TI", "CE", "PEP", "PPT", "DNI", "NCS", "PAS"}
    if sum(1 for v in vals if v in codigos) >= 2:
        return True
    return any(
        s._texto_coincide(lb, t)
        for lb in labels
        for t in (s.TIPO_CC, s.TIPO_TI, s.TIPO_CE)
    )


def _select_tiene_tipo(frame, sel, tipo: str) -> bool:
    if not _select_es_tipo_documento(frame, sel):
        return False
    codigo = _codigo_tipo_doc(tipo)
    labels = s._labels_select(frame, sel)
    if any(s._texto_coincide(lb, tipo) for lb in labels):
        return True
    if codigo:
        try:
            for j in range(sel.locator("option").count()):
                val = (sel.locator("option").nth(j).get_attribute("value") or "").strip().upper()
                if val == codigo:
                    return True
        except Exception:
            pass
    return False


def _forzar_value_tipo_doc(sel, codigo: str) -> bool:
    try:
        return bool(
            sel.evaluate(
                """(el, codigo) => {
                    const v = String(codigo).toUpperCase();
                    let found = null;
                    for (const o of el.options) {
                        if (String(o.value || '').toUpperCase() === v) { found = o.value; break; }
                    }
                    if (found == null) return false;
                    el.value = found;
                    for (const o of el.options) o.selected = o.value === found;
                    el.dispatchEvent(new Event('change', { bubbles: true }));
                    el.dispatchEvent(new Event('input', { bubbles: true }));
                    return String(el.value || '').toUpperCase() === v;
                }""",
                codigo,
            )
        )
    except Exception:
        return False


def _try_select_option(sel, *, value: str = "", label: str = "") -> bool:
    try:
        if value:
            sel.select_option(value=value, timeout=5000)
            return True
        if label:
            sel.select_option(label=label, timeout=5000)
            return True
    except Exception:
        pass
    return False


def _aplicar_opcion_por_label(sel, tipo: str, label: str, value: str) -> bool:
    if not s._texto_coincide(label, tipo):
        return False
    if _try_select_option(sel, value=value or label):
        return True
    return _try_select_option(sel, label=label)


def _aplicar_tipo_en_select(sel, tipo: str) -> bool:
    codigo = _codigo_tipo_doc(tipo)
    if codigo and _try_select_option(sel, value=codigo):
        return True
    for j in range(sel.locator("option").count()):
        opt = sel.locator("option").nth(j)
        label = opt.inner_text().strip()
        value = (opt.get_attribute("value") or "").strip()
        if codigo and value.upper() == codigo and _try_select_option(sel, value=value):
            return True
        if _aplicar_opcion_por_label(sel, tipo, label, value):
            return True
    return bool(codigo and _forzar_value_tipo_doc(sel, codigo))


def _hay_select_tipo_documento(page: Page) -> bool:
    for frame in _frames_formulario(page):
        try:
            selects = frame.locator("select")
            for i in range(selects.count()):
                if _select_es_tipo_documento(frame, selects.nth(i)):
                    return True
        except Exception:
            continue
    return False


def _seleccionar_tipo_en_formulario(page: Page, tipo: str) -> bool:
    for frame in _frames_formulario(page):
        try:
            selects = frame.locator("select")
            for i in range(selects.count()):
                sel = selects.nth(i)
                if _select_tiene_tipo(frame, sel, tipo) and _aplicar_tipo_en_select(sel, tipo):
                    return True
        except Exception:
            continue
    # Fallback: por código en cualquier select del form.
    codigo = _codigo_tipo_doc(tipo)
    if codigo and codigo in s.SOFIA_CODIGO_A_TIPO:
        etiqueta = s.SOFIA_CODIGO_A_TIPO[codigo]
        if s._seleccionar_por_texto(page, "select", etiqueta):
            return True
    return s._seleccionar_por_texto(page, "select", tipo)


def _dump_inputs_inscripcion(page: Page) -> None:
    try:
        import os
        import time
        from app.config import DIAG_DIR

        os.makedirs(DIAG_DIR, exist_ok=True)
        sello = time.strftime("%H%M%S")
        with open(
            os.path.join(DIAG_DIR, f"{sello}_inputs_inscripcion.txt"),
            "w",
            encoding="utf-8",
        ) as f:
            f.write(_inventarizar_inputs_formulario(page))
    except Exception:
        pass


_JS_CLICK_CONSULTAR = """() => {
    const norm = (s) => (s || '').toLowerCase().trim();
    const nodes = Array.from(document.querySelectorAll('a, button, input, span, td'));
    for (const n of nodes) {
        const t = norm(n.value || n.innerText || n.textContent || '');
        if (t === 'consultar' || t.startsWith('consultar')) {
            n.click();
            return true;
        }
    }
    return false;
}"""
_JS_REINTENTO_CONSULTAR = """() => {
    const forms = Array.from(document.querySelectorAll('form'));
    for (const f of forms) {
        const btn = f.querySelector("input[type='submit'], input[type='button'], button, a");
        if (!btn) continue;
        const t = ((btn.value || btn.innerText || '') + '').toLowerCase();
        if (t.includes('consultar')) { btn.click(); return true; }
    }
    return false;
}"""
_RE_CONSULTAR = re.compile(r"Consultar", re.I)


def _click_consultar_locator(page: Page) -> bool:
    for frame in _frames_formulario(page):
        try:
            btn = frame.locator(
                "input[type='submit'], button, a, span, input[type='button'], input[type='image']"
            ).filter(has_text=_RE_CONSULTAR)
            if btn.count() > 0:
                btn.first.click(timeout=5000, force=True)
                return True
        except Exception:
            continue
    return False


def _click_consultar_js(page: Page, script: str) -> bool:
    for frame in _frames_formulario(page):
        try:
            if frame.evaluate(script):
                return True
        except Exception:
            continue
    return False


def _click_consultar_en_formulario(page: Page) -> bool:
    if _click_consultar_locator(page):
        return True
    if _click_consultar_js(page, _JS_CLICK_CONSULTAR):
        return True
    return s._click_texto(page, "Consultar")


def _llenar_consulta(page: Page, tipo: str, numero: str) -> str | None:
    err = _asegurar_form_antes_llenar(page)
    if err:
        return err

    if not _seleccionar_tipo_en_formulario(page, tipo):
        return f"No se pudo seleccionar tipo de identificación '{tipo}'"

    # Tras elegir tipo, JSF/A4J a veces re-renderiza el campo número.
    s._pause(page, 1000)

    if not _escribir_numero_en_formulario(page, numero):
        s._dump(page, "error_sin_input_documento")
        _dump_iframe_contenido(page, "error_sin_input_documento")
        _dump_inputs_inscripcion(page)
        return "No se pudo escribir el número de identificación"

    if not _click_consultar_en_formulario(page):
        return "No se pudo hacer clic en Consultar"

    wait_res = 8000 if s.SOFIA_RAPIDO else 20000
    if not _esperar_resultado_consulta(page, timeout_ms=wait_res):
        _click_consultar_js(page, _JS_REINTENTO_CONSULTAR)
        _esperar_resultado_consulta(page, timeout_ms=wait_res)
    return None


def _hay_tabla_o_vacio_inscripciones(page: Page) -> bool:
    for frame in _frames_formulario(page):
        try:
            cuerpo = s._normalizar_texto(frame.inner_text("body"))
        except Exception:
            continue
        if MSG_IDENT_FICHA in cuerpo and "programa" in cuerpo:
            return True
        if "pagina" in cuerpo and " de " in cuerpo and any(ch.isdigit() for ch in cuerpo):
            return True
        if MSG_NO_ENCONTR in cuerpo or "sin resultados" in cuerpo or "no hay registros" in cuerpo:
            return True
    return False


def _esperar_resultado_consulta(page: Page, timeout_ms: int = 20000) -> bool:
    """Espera tabla de resultados o mensaje vacío tras clic Consultar."""
    _esperar_sin_blockui(page, min(15000, timeout_ms))
    for _ in range(max(1, timeout_ms // 250)):
        if _hay_tabla_o_vacio_inscripciones(page):
            page.wait_for_timeout(400)
            return True
        page.wait_for_timeout(250)
    return _hay_tabla_o_vacio_inscripciones(page)


_RE_PAGINA = re.compile(r"Pagina\s+(\d+)\s+de\s+(\d+)", re.IGNORECASE)
_RE_SIGUIENTE = re.compile(r"Siguiente", re.I)
_JS_CLICK_SIGUIENTE = """() => {
    const norm = (s) => (s || '').toLowerCase().replace(/\\s+/g, ' ').trim()
        .replace(/á/g,'a').replace(/é/g,'e').replace(/í/g,'i')
        .replace(/ó/g,'o').replace(/ú/g,'u').replace(/ñ/g,'n');
    const disabled = (el) => {
        if (!el) return true;
        const cls = (el.className || '').toString().toLowerCase();
        if (cls.includes('disabled') || cls.includes('rich-datascr-button-dsbld')) return true;
        if (el.getAttribute('disabled') != null) return true;
        if ((el.getAttribute('aria-disabled') || '') === 'true') return true;
        return false;
    };
    const candidatos = Array.from(document.querySelectorAll(
        'a, button, span, td, div, input'
    ));
    // Preferir texto corto tipo pager: "Siguiente >" / "Siguiente"
    const exactos = [];
    const parciales = [];
    for (const n of candidatos) {
        const t = norm(n.innerText || n.textContent || n.value || '');
        if (!t.includes('siguiente')) continue;
        if (t.length > 40) continue;
        if (disabled(n) || disabled(n.closest('a,td,span,div,button'))) continue;
        if (t === 'siguiente >' || t === 'siguiente>' || t === 'siguiente') exactos.push(n);
        else parciales.push(n);
    }
    const orden = exactos.concat(parciales);
    for (const n of orden) {
        const target = n.closest('a') || n;
        try { target.scrollIntoView({ block: 'nearest' }); } catch (e) {}
        target.click();
        return true;
    }
    return false;
}"""


TXT_IDENT_FICHA = "Identificador Ficha"
TXT_PROGRAMA_FORM = "Programa de Formación"
TXT_PAGINA = "Página"
TXT_PAGINA_SIN_TILDE = "Pagina"


def _texto_parece_resultados(t: str) -> bool:
    return TXT_IDENT_FICHA in t or TXT_PROGRAMA_FORM in t or TXT_PAGINA in t or TXT_PAGINA_SIN_TILDE in t


def _texto_iframe_consulta(page: Page) -> str:
    """Texto del iframe de resultados (evita ruido del menú lateral)."""
    fr = _frame_contenido(page)
    if fr is not None:
        try:
            return fr.inner_text("body") or ""
        except Exception:
            pass
    for frame in _frames_formulario(page):
        try:
            t = frame.inner_text("body") or ""
            if _texto_parece_resultados(t):
                return t
        except Exception:
            continue
    return s._texto_pagina_completo(page)


def _parse_pagina_indicator(texto: str) -> tuple[int, int] | None:
    m = _RE_PAGINA.search(s._normalizar_texto(texto))
    if not m:
        return None
    return int(m.group(1)), int(m.group(2))


def _indicador_pagina_actual(page: Page) -> tuple[int, int] | None:
    return _parse_pagina_indicator(_texto_iframe_consulta(page))


def _parse_linea_inscripcion(line: str) -> RegistroInscripcion | None:
    """Parseo lineal sin regex con backtracking (evita ReDoS S5852)."""
    raw = line.strip()
    if not raw:
        return None
    partes = raw.split()
    if len(partes) < 3 or not partes[0].isdigit() or len(partes[0]) < 5:
        return None
    lower = s._normalizar_texto(raw)
    for est in _ESTADOS_FILA:
        if not lower.endswith(est):
            continue
        # Recortar el sufijo de estado del texto original (misma cantidad de tokens).
        n_tok = len(est.split())
        if len(partes) <= n_tok:
            return None
        programa = " ".join(partes[1:-n_tok]).strip()
        estado = " ".join(partes[-n_tok:]).strip()
        if not programa:
            return None
        return RegistroInscripcion(ficha=partes[0], programa=programa, estado=estado)
    return None


def _header_es_tabla_inscripcion(header: str) -> bool:
    return MSG_IDENT_FICHA in header or "programa de formacion" in header


def _registro_desde_cells(cells) -> RegistroInscripcion | None:
    if cells.count() < 8:
        return None
    ficha = cells.nth(0).inner_text().strip()
    if not ficha or not ficha[0].isdigit():
        return None
    return RegistroInscripcion(
        ficha=ficha,
        programa=cells.nth(1).inner_text().strip(),
        estado=cells.nth(7).inner_text().strip(),
    )


def _filas_de_una_tabla(table) -> list[RegistroInscripcion]:
    try:
        header = s._normalizar_texto(table.locator("tr").first.inner_text())
    except Exception:
        return []
    if not _header_es_tabla_inscripcion(header):
        return []
    registros: list[RegistroInscripcion] = []
    rows = table.locator("tr")
    for ri in range(1, rows.count()):
        reg = _registro_desde_cells(rows.nth(ri).locator("td"))
        if reg:
            registros.append(reg)
    return registros


def _filas_desde_tabla(frame) -> list[RegistroInscripcion]:
    try:
        tables = frame.locator("table")
        for ti in range(tables.count()):
            registros = _filas_de_una_tabla(tables.nth(ti))
            if registros:
                return registros
    except Exception:
        return []
    return []


def _cuerpo_con_tabla_inscripcion(page: Page) -> str:
    cuerpo = _texto_iframe_consulta(page)
    if TXT_IDENT_FICHA in cuerpo or TXT_PROGRAMA_FORM in cuerpo:
        return cuerpo
    for frame in s._frames(page):
        try:
            cuerpo = frame.inner_text("body")
            if TXT_IDENT_FICHA in cuerpo or TXT_PROGRAMA_FORM in cuerpo:
                return cuerpo
        except Exception:
            continue
    return ""


def _frames_prioridad_tabla(page: Page) -> list:
    preferidos = []
    vistos: set[int] = set()

    def agregar(frame) -> None:
        fid = id(frame)
        if fid in vistos:
            return
        vistos.add(fid)
        preferidos.append(frame)

    fr = _frame_contenido(page)
    if fr is not None:
        agregar(fr)
    for frame in _frames_formulario(page):
        agregar(frame)
    for frame in s._frames(page):
        agregar(frame)
    return preferidos


def _filas_desde_texto_plano(page: Page) -> list[RegistroInscripcion]:
    registros: list[RegistroInscripcion] = []
    for line in _cuerpo_con_tabla_inscripcion(page).splitlines():
        fila = _parse_linea_inscripcion(line)
        if fila:
            registros.append(fila)
    return registros


def _extraer_filas_tabla(page: Page) -> list[RegistroInscripcion]:
    """Lee filas con ficha / programa / estado desde tablas visibles."""
    for frame in _frames_prioridad_tabla(page):
        registros = _filas_desde_tabla(frame)
        if registros:
            return registros
    return _filas_desde_texto_plano(page)


def _item_siguiente_valido(item) -> bool:
    try:
        txt = s._normalizar_texto(item.inner_text() or "")
    except Exception:
        return False
    if "siguiente" not in txt or len(txt) > 40:
        return False
    try:
        cls = (item.get_attribute("class") or "").lower()
        if "dsbld" in cls or "disabled" in cls:
            return False
        if item.get_attribute("aria-disabled") == "true":
            return False
    except Exception:
        pass
    return True


def _loc_siguiente_habilitado(frame):
    selectores = (
        "a.rich-datascr-button:not(.rich-datascr-button-dsbld)",
        "td.rich-datascr-button:not(.rich-datascr-button-dsbld)",
        "[class*='datascr'] a",
        "[class*='datascroller'] a",
        "a, button, span, td",
    )
    for sel in selectores:
        try:
            loc = frame.locator(sel).filter(has_text=_RE_SIGUIENTE)
            for i in range(loc.count()):
                item = loc.nth(i)
                if _item_siguiente_valido(item):
                    return item
        except Exception:
            continue
    return None


def _click_locator_siguiente(btn) -> bool:
    try:
        btn.scroll_into_view_if_needed(timeout=2000)
    except Exception:
        pass
    try:
        btn.click(timeout=5000, force=True)
        return True
    except Exception:
        try:
            btn.evaluate("el => el.click()")
            return True
        except Exception:
            return False


def _frames_pager(page: Page) -> list:
    frames = []
    vistos: set[int] = set()

    def agregar(frame) -> None:
        fid = id(frame)
        if fid in vistos:
            return
        vistos.add(fid)
        frames.append(frame)

    fr = _frame_contenido(page)
    if fr is not None:
        agregar(fr)
    for f in _frames_formulario(page):
        agregar(f)
    return frames


def _click_siguiente_en_frames(page: Page) -> bool:
    """Clic en Siguiente solo dentro del iframe de resultados."""
    for frame in _frames_pager(page):
        btn = _loc_siguiente_habilitado(frame)
        if btn is not None and _click_locator_siguiente(btn):
            return True
        try:
            if frame.evaluate(_JS_CLICK_SIGUIENTE):
                return True
        except Exception:
            continue
    return False


def _esperar_avance_pagina(page: Page, pagina_antes: int | None, timeout_ms: int = 20000) -> bool:
    """Espera A4J/blockUI y que el indicador pase de pagina_antes."""
    _esperar_sin_blockui(page, min(15000, timeout_ms))
    if pagina_antes is None:
        s._pause(page, 800)
        return True
    for _ in range(max(1, timeout_ms // 250)):
        ind = _indicador_pagina_actual(page)
        if ind and ind[0] != pagina_antes:
            page.wait_for_timeout(300)
            return True
        page.wait_for_timeout(250)
    return False


def _ir_siguiente_pagina(page: Page, pagina_antes: int | None) -> bool:
    """Avanza una página y confirma que el indicador cambió."""
    if not _click_siguiente_en_frames(page):
        return False
    return _esperar_avance_pagina(page, pagina_antes)


def _agregar_filas_unicas(
    todos: list[RegistroInscripcion],
    vistos: set[tuple[str, str, str]],
    filas: list[RegistroInscripcion],
) -> int:
    nuevos = 0
    for r in filas:
        key = (r.ficha, r.programa, r.estado)
        if key in vistos:
            continue
        vistos.add(key)
        todos.append(r)
        nuevos += 1
    return nuevos


def _avanzar_con_indicador(page: Page, actual: int, total: int) -> bool:
    """True si hay que seguir; False si terminó o no pudo avanzar."""
    s._dump(page, f"inscripcion_pagina_{actual}_de_{total}", solo_error=False)
    if actual >= total:
        return False
    if _ir_siguiente_pagina(page, actual):
        return True
    s._pause(page, 500)
    return _ir_siguiente_pagina(page, actual)


def _avanzar_sin_indicador(
    page: Page,
    todos: list[RegistroInscripcion],
    vistos: set[tuple[str, str, str]],
) -> bool:
    """True si avanzó con filas nuevas; False si hay que parar."""
    antes = len(vistos)
    if not _ir_siguiente_pagina(page, None):
        return False
    _esperar_sin_blockui(page, 10000)
    nuevos = _agregar_filas_unicas(todos, vistos, _extraer_filas_tabla(page))
    return not (nuevos == 0 and len(vistos) == antes)


def _recolectar_todas_paginas(page: Page) -> tuple[list[RegistroInscripcion], int]:
    """Recorre Página 1..N (cualquier total: 2, 5, 10…) con el scroller RichFaces.

    Retorna (registros, páginas_leídas).
    """
    todos: list[RegistroInscripcion] = []
    vistos: set[tuple[str, str, str]] = set()
    paginas_leidas = 0

    _esperar_sin_blockui(page, 15000)
    for _ in range(MAX_PAGINAS):
        _agregar_filas_unicas(todos, vistos, _extraer_filas_tabla(page))
        paginas_leidas += 1

        ind = _indicador_pagina_actual(page)
        if ind:
            if not _avanzar_con_indicador(page, ind[0], ind[1]):
                break
            continue

        if not _avanzar_sin_indicador(page, todos, vistos):
            break

    return todos, paginas_leidas


def _normalizar_programa(texto: str) -> str:
    """Minúsculas, sin acentos y espacios colapsados para comparar nombres."""
    t = unicodedata.normalize("NFD", (texto or "").strip().lower())
    t = "".join(c for c in t if unicodedata.category(c) != "Mn")
    return re.sub(r"\s+", " ", t).strip()


def _filtrar_por_programa(
    registros: list[RegistroInscripcion], programa: str
) -> list[RegistroInscripcion]:
    """Filtra por nombre de programa (coincidencia exacta normalizada o contención)."""
    objetivo = _normalizar_programa(programa)
    if not objetivo:
        return registros
    exactos = [r for r in registros if _normalizar_programa(r.programa) == objetivo]
    if exactos:
        return exactos
    return [
        r
        for r in registros
        if objetivo in _normalizar_programa(r.programa)
        or _normalizar_programa(r.programa) in objetivo
    ]


def _consultar_un_tipo(
    page: Page, tipo: str, numero: str, programa: str
) -> ResultadoInscripciones:
    err = _llenar_consulta(page, tipo, numero)
    if err:
        return ResultadoInscripciones(
            numero_documento=numero,
            programa_consultado=programa,
            estado=ESTADO_NO_VERIFICADO,
            mensaje=err,
        )

    s._dump(page, f"inscripcion_resultado_{s._sanitize(tipo)}", solo_error=True)
    if not s.SOFIA_RAPIDO:
        _dump_iframe_contenido(page, f"inscripcion_resultado_{s._sanitize(tipo)}")
    ind0 = _indicador_pagina_actual(page)
    todos, paginas_leidas = _recolectar_todas_paginas(page)
    filtrados = _filtrar_por_programa(todos, programa)
    if ind0:
        detalle_pag = f" (Sofía: {ind0[1]} pág.; leídas: {paginas_leidas})"
    else:
        detalle_pag = f" (páginas leídas: {paginas_leidas})"

    if filtrados:
        return ResultadoInscripciones(
            numero_documento=numero,
            programa_consultado=programa,
            estado=ESTADO_ENCONTRADO,
            tipo_encontrado=tipo,
            registros=filtrados,
            mensaje=(
                f"Se encontraron {len(filtrados)} registro(s) para el programa "
                f"«{programa}»{detalle_pag}."
            ),
        )

    if todos:
        return ResultadoInscripciones(
            numero_documento=numero,
            programa_consultado=programa,
            estado=ESTADO_NO_ENCONTRADO,
            tipo_encontrado=tipo,
            registros=[],
            mensaje=(
                f"El aprendiz tiene {len(todos)} inscripción(es){detalle_pag}, "
                f"pero ninguna del programa «{programa}»."
            ),
        )

    # Sin filas: puede ser tipo incorrecto o sin historial
    cuerpo = s._texto_pagina_completo(page)
    if MSG_NO_ENCONTR in cuerpo or "sin resultados" in cuerpo or "no hay registros" in cuerpo:
        return ResultadoInscripciones(
            numero_documento=numero,
            programa_consultado=programa,
            estado=ESTADO_NO_ENCONTRADO,
            mensaje="SofiaPlus no devolvió inscripciones para ese documento.",
        )

    # Tabla vacía sin mensaje claro → probar otro tipo
    return ResultadoInscripciones(
        numero_documento=numero,
        programa_consultado=programa,
        estado=ESTADO_NO_ENCONTRADO,
        tipo_encontrado=tipo,
        mensaje="Sin filas en la tabla de inscripciones para este tipo de documento.",
    )


def _en_resultados_inscripcion(page: Page) -> bool:
    """True si el iframe muestra tabla/mensaje de resultado (sin select de tipo)."""
    if _hay_select_tipo_documento(page):
        return False
    for frame in _frames_formulario(page):
        try:
            url = (getattr(frame, "url", "") or "").lower()
            if "buscadorinscripciones" in url.replace("_", ""):
                return True
            cuerpo = s._normalizar_texto(frame.inner_text("body"))
            if MSG_IDENT_FICHA in cuerpo and "programa" in cuerpo:
                return True
            if "pagina anterior" in cuerpo or MSG_NO_ENCONTR in cuerpo:
                return True
        except Exception:
            continue
    return False


def _click_pagina_anterior_inscripcion(page: Page) -> bool:
    """Vuelve del resultado al formulario (enlace salirCM / Página Anterior)."""
    for frame in _frames_formulario(page):
        try:
            for sel in (
                'a[id*="salirCM"]',
                'a[id$="salirCM"]',
                'a:has-text("Página Anterior")',
                'a:has-text("Pagina Anterior")',
            ):
                loc = frame.locator(sel)
                if loc.count() == 0:
                    continue
                loc.first.click(timeout=5000, force=True)
                s._pause(page, 800)
                _esperar_sin_blockui(page, 10000)
                return True
        except Exception:
            continue
    if s._click_texto(page, "Página Anterior") or s._click_texto(page, "Pagina Anterior"):
        s._pause(page, 800)
        _esperar_sin_blockui(page, 10000)
        return True
    return False


def _volver_formulario(page: Page) -> None:
    """Tras una consulta, volver al formulario con select de tipo listo."""
    if _hay_select_tipo_documento(page) and _en_formulario_inscripcion(page):
        return
    if _en_resultados_inscripcion(page) or not _hay_select_tipo_documento(page):
        _click_pagina_anterior_inscripcion(page)
        if _esperar_select_tipo_documento(page, 8000):
            return
    if s._click_texto(page, MENU_CONSULTAR_INSCRIPCIONES):
        page.wait_for_timeout(s.WAIT_FORM_MS)
        _esperar_sin_blockui(page, 10000)
        if _esperar_select_tipo_documento(page, 8000):
            return
    _cargar_iframe_inscripcion_directo(page)
    _esperar_formulario_inscripcion(page, timeout_ms=12000)
    _esperar_select_tipo_documento(page, 12000)


def _cred_usuario_sena(cred: s.Credenciales) -> s.Credenciales:
    return s.Credenciales(
        usuario=cred.usuario.strip(),
        password=cred.password,
        tipo_documento=cred.tipo_documento or s.TIPO_CC,
        rol=ROL_USUARIO_SENA,
    )


def _resultado_consulta_en_pagina(
    page: Page, numero: str, programa_n: str, tipo_documento: str
) -> ResultadoInscripciones:
    tipos = _tipos_a_probar(tipo_documento)
    ultimo = ResultadoInscripciones(
        numero_documento=numero,
        programa_consultado=programa_n,
        estado=ESTADO_NO_ENCONTRADO,
        mensaje="Sin resultados.",
    )
    for i, tipo in enumerate(tipos):
        if i > 0:
            _volver_formulario(page)
            if not _en_formulario_inscripcion(page):
                err_nav = _navegar_consultar_inscripciones(page)
                if err_nav:
                    return ResultadoInscripciones(
                        numero_documento=numero,
                        programa_consultado=programa_n,
                        estado=ESTADO_NO_VERIFICADO,
                        mensaje=err_nav,
                    )
        res = _consultar_un_tipo(page, tipo, numero, programa_n)
        ultimo = res
        if res.estado in (ESTADO_ENCONTRADO, ESTADO_NO_VERIFICADO):
            return res
        if "ninguna del programa" in (res.mensaje or "").lower():
            return res
    return ultimo


def consultar_inscripciones(
    cred: s.Credenciales,
    numero_documento: str,
    programa: str,
    tipo_documento: str = "",
) -> ResultadoInscripciones:
    numero = numero_documento.strip()
    programa_n = programa.strip()
    if not numero:
        return ResultadoInscripciones(
            numero_documento=numero,
            programa_consultado=programa_n,
            estado=ESTADO_NO_VERIFICADO,
            mensaje="El número de documento es obligatorio.",
        )
    if not programa_n:
        return ResultadoInscripciones(
            numero_documento=numero,
            programa_consultado=programa_n,
            estado=ESTADO_NO_VERIFICADO,
            mensaje="El nombre del programa de formación es obligatorio.",
        )

    cred_uso = _cred_usuario_sena(cred)
    resultado_holder: list[ResultadoInscripciones] = []
    err_msg: list[str | None] = [None]

    def page_action(page: Page) -> None:
        page.set_default_timeout(s.PAGE_TIMEOUT_MS)
        err = _asegurar_formulario_inscripciones(page, cred_uso)
        if err:
            err_msg[0] = err
            return
        resultado_holder.append(
            _resultado_consulta_en_pagina(page, numero, programa_n, tipo_documento)
        )

    try:
        with s._FETCH_LOCK:
            StealthyFetcher.fetch(
                require_login_url(),
                page_action=page_action,
                **s._stealthy_fetch_kwargs(),
            )
    except Exception as exc:
        return ResultadoInscripciones(
            numero_documento=numero,
            programa_consultado=programa_n,
            estado=ESTADO_NO_VERIFICADO,
            mensaje=f"Error del scraper: {exc}",
        )

    if err_msg[0] and not resultado_holder:
        return ResultadoInscripciones(
            numero_documento=numero,
            programa_consultado=programa_n,
            estado=ESTADO_NO_VERIFICADO,
            mensaje=err_msg[0],
        )
    if resultado_holder:
        return resultado_holder[0]
    return ResultadoInscripciones(
        numero_documento=numero,
        programa_consultado=programa_n,
        estado=ESTADO_NO_VERIFICADO,
        mensaje="No se obtuvo respuesta del scraper",
    )


def _consulta_item_lote(
    page: Page, item: ConsultaLoteItem, idx: int
) -> ResultadoInscripciones:
    numero = item.numero_documento.strip()
    programa_n = item.programa.strip()
    if not numero or not programa_n:
        return ResultadoInscripciones(
            numero_documento=numero,
            programa_consultado=programa_n,
            estado=ESTADO_NO_VERIFICADO,
            mensaje="Fila incompleta: faltan documento o programa de formación.",
        )
    if idx > 0:
        _volver_formulario(page)
        if not _en_formulario_inscripcion(page):
            err_nav = _navegar_consultar_inscripciones(page)
            if err_nav:
                return ResultadoInscripciones(
                    numero_documento=numero,
                    programa_consultado=programa_n,
                    estado=ESTADO_NO_VERIFICADO,
                    mensaje=err_nav,
                )
    return _resultado_consulta_en_pagina(page, numero, programa_n, item.tipo_documento)


def _resultados_error_lote(
    items: list[ConsultaLoteItem], mensaje: str
) -> list[ResultadoInscripciones]:
    return [
        ResultadoInscripciones(
            numero_documento=i.numero_documento.strip(),
            programa_consultado=i.programa.strip(),
            estado=ESTADO_NO_VERIFICADO,
            mensaje=mensaje,
        )
        for i in items
    ]


def consultar_inscripciones_lote(
    cred: s.Credenciales,
    items: list[ConsultaLoteItem],
) -> list[ResultadoInscripciones]:
    """Un solo login Scrapling; consulta cada fila (documento + programa) en secuencia."""
    if not items:
        return []

    cred_uso = _cred_usuario_sena(cred)
    resultados: list[ResultadoInscripciones] = []
    err_global: list[str | None] = [None]

    def page_action(page: Page) -> None:
        page.set_default_timeout(s.PAGE_TIMEOUT_MS)
        err = _asegurar_formulario_inscripciones(page, cred_uso)
        if err:
            err_global[0] = err
            return
        for idx, item in enumerate(items):
            resultados.append(_consulta_item_lote(page, item, idx))

    try:
        with s._FETCH_LOCK:
            StealthyFetcher.fetch(
                require_login_url(),
                page_action=page_action,
                **s._stealthy_fetch_kwargs(),
            )
    except Exception as exc:
        return _resultados_error_lote(items, f"Error del scraper: {exc}")

    if err_global[0] and not resultados:
        return _resultados_error_lote(items, err_global[0] or "Error de login")
    return resultados
