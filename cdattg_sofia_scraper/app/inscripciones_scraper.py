"""Consulta Inscripciones a Programas de Formación (SofiaPlus, rol Usuario SENA).

Flujo (Scrapling StealthyFetcher):
  login → Usuario SENA → Inscripción → Consultar Programas de Formación
  → Consultar Inscripciones a Programas de Formación
  → tipo + número → Consultar → paginar → filtrar por ficha.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from urllib.parse import urljoin

from patchright.sync_api import Page
from scrapling.fetchers import StealthyFetcher

from app.config import require_login_url
from app import scraper as s

ROL_USUARIO_SENA = "Usuario SENA"

ESTADO_ENCONTRADO = "ENCONTRADO"
ESTADO_NO_ENCONTRADO = "NO_ENCONTRADO"
ESTADO_NO_VERIFICADO = "NO_VERIFICADO"

TIPOS_INSCRIPCION = [
    "Cédula de Ciudadanía",
    "Tarjeta de Identidad",
    "Cédula de Extranjería",
    "Permiso especial de permanencia",
    "Permiso por Protección Temporal",
    "DNI - Documento Nacional de Identificación",
    "Número Ciego SENA",
    "Pasaporte",
]

MAX_PAGINAS = 40


@dataclass
class RegistroInscripcion:
    ficha: str
    programa: str
    estado: str


@dataclass
class ResultadoInscripciones:
    numero_documento: str
    ficha_consultada: str
    estado: str
    tipo_encontrado: str = ""
    registros: list[RegistroInscripcion] = field(default_factory=list)
    mensaje: str = ""


@dataclass
class ConsultaLoteItem:
    numero_documento: str
    ficha: str
    tipo_documento: str = ""


ROL_ASPIRANTE = "Aspirante"
MENU_INSCRIPCION = "Inscripción"
MENU_CONSULTAR_PROGRAMAS = "Consultar Programas de Formación"
MENU_CONSULTAR_INSCRIPCIONES = "Consultar Inscripciones a Programas de Formación"
# Usuario SENA usa validarUsuarioConsulta.faces (menId=11).
# Aspirante usa consultarInscripcion.faces (menId=28) — NO mezclar.
HREF_USUARIO_SENA = "validarUsuarioConsulta.faces"
HREF_ASPIRANTE = "consultarInscripcion.faces"
# Sofía Plus en este entorno solo responde por HTTP (no HTTPS en el puerto del portal).
URL_CONSULTAR_INSCRIPCION_USUARIO_SENA = (  # NOSONAR python:S5332
    "http://senasofiaplus.edu.co/sofia/inscripcion/consultarinscripcion/"
    "validarUsuarioConsulta.faces?menId=11&fwkmenu=si"
)
WAIT_IFRAME_FORM_MS = 25000
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
    for _ in range(max(1, timeout_ms // 250)):
        if _en_formulario_inscripcion(page):
            # Dar tiempo a que JSF pinte inputs dentro del iframe.
            page.wait_for_timeout(1000)
            return True
        page.wait_for_timeout(250)
    return False


def _dump_iframe_contenido(page: Page, paso: str) -> None:
    """Guarda HTML del iframe contenido (el dump normal solo ve el shell principal)."""
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


def _encontrar_select_roles_aspirante(page: Page):
    """Busca el combo del sidebar que muestra/contiene Aspirante (no el texto 'Lista de Roles')."""
    for _ in range(max(1, s.WAIT_ROLES_MS // 250)):
        for frame in s._frames(page):
            for sel in _selects_con_opcion(frame, ROL_ASPIRANTE):
                labels = s._labels_select(frame, sel)
                # Debe poder elegir Usuario SENA en el mismo combo.
                if any(s._texto_coincide(lb, ROL_USUARIO_SENA) for lb in labels):
                    return sel, frame
                # Aunque no liste aún Usuario SENA en labels cacheadas, si tiene Aspirante + varios roles.
                if len(labels) >= 3:
                    return sel, frame
        if s._texto_visible_en_frames(page, "Bienvenido a SOFIA") or s._texto_visible_en_frames(
            page, ROL_ASPIRANTE
        ):
            page.wait_for_timeout(250)
            continue
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
    for _ in range(max(1, timeout_ms // 250)):
        if not _blockui_visible(page):
            return True
        page.wait_for_timeout(250)
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
            page.wait_for_timeout(2000)
            _esperar_sin_blockui(page, 15000)
        except Exception:
            pass
    return _rol_actual_parece_usuario_sena(page)


def _seleccionar_usuario_sena(page: Page) -> str | None:
    """Obligatorio: quedar en Usuario SENA. Sin fallback a Aspirante/Aprendiz."""
    if s._en_pagina_login(page):
        return "El login no se completó antes de elegir el rol"

    _esperar_sin_blockui(page, 15000)
    s._dump(page, "04_rol_antes", solo_error=False)

    if _rol_actual_parece_usuario_sena(page):
        s._dump(page, "04_rol_ya_usuario_sena", solo_error=False)
        return None

    # Hasta 3 intentos: Sofía a veces deja Aprendiz o se queda en blockUI.
    for intento in range(1, 4):
        if _intentar_seleccionar_usuario_sena(page):
            # Confirmar estable (no un flash del value).
            ok_estable = 0
            for _ in range(12):
                if _blockui_visible(page):
                    ok_estable = 0
                elif _rol_actual_parece_usuario_sena(page):
                    ok_estable += 1
                    if ok_estable >= 3:
                        s._dump(page, "04_rol_despues_usuario_sena", solo_error=False)
                        return None
                else:
                    ok_estable = 0
                page.wait_for_timeout(250)
        actual = _rol_label_actual(page) or "?"
        s._dump(page, f"04_rol_intento_{intento}_{s._sanitize(actual)}", solo_error=False)
        try:
            page.goto(s.SOFIA_HOME_URL, wait_until="domcontentloaded", timeout=25000)
            page.wait_for_timeout(2000)
            _esperar_sin_blockui(page, 15000)
        except Exception:
            pass

    actual = _rol_label_actual(page) or "desconocido"
    s._dump(page, f"error_rol_actual_{s._sanitize(actual)}")
    return (
        f"No se pudo cambiar de '{actual}' a 'Usuario SENA'. "
        "En Sofía hay que elegir Usuario SENA en el select del sidebar (no basta Aspirante/Aprendiz)."
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
    page.wait_for_timeout(500)
    s._click_texto(page, MENU_CONSULTAR_PROGRAMAS)
    page.wait_for_timeout(500)
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
            page.wait_for_timeout(1200)
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
        page.wait_for_timeout(2000)
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
    page.wait_for_timeout(1200)
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


def _asegurar_formulario_inscripciones(page: Page, cred: s.Credenciales) -> str | None:
    err = s._detectar_error_pagina(page, ignorar_si_hay_roles=True)
    if err:
        return err

    if _en_formulario_inscripcion(page):
        return None

    if s._en_pagina_login(page):
        err = s._completar_login(page, cred)
        if err:
            return err
    elif not (
        s._sesion_sofia_activa(page)
        or s._texto_visible_en_frames(page, ROL_ASPIRANTE)
        or s._texto_visible_en_frames(page, "Bienvenido a SOFIA")
    ):
        page.wait_for_timeout(800)
        if s._en_pagina_login(page):
            err = s._completar_login(page, cred)
            if err:
                return err
        elif not s._sesion_sofia_activa(page) and not s._texto_visible_en_frames(page, ROL_ASPIRANTE):
            err = s._detectar_error_pagina(page, ignorar_si_hay_roles=False)
            if err:
                return err
            # Intentar home y continuar.
            try:
                page.goto(s.SOFIA_HOME_URL, wait_until="domcontentloaded", timeout=25000)
                page.wait_for_timeout(1500)
            except Exception:
                pass

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


def _escribir_numero_en_formulario(page: Page, numero: str) -> bool:
    """Escribe el documento en el iframe de Consultar Inscripción."""
    selectores = [
        'input[type="text"]',
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
    etiquetas = [
        "Número de Identificación",
        "Numero de Identificacion",
        "Número de identificación",
        "Identificación",
    ]

    for frame in _frames_formulario(page):
        # Solo intentar a fondo en el frame del formulario / contenido.
        url = ""
        try:
            url = (getattr(frame, "url", "") or "").lower()
        except Exception:
            pass
        es_form = _url_es_form_inscripcion(url) or "contenido" in (
            getattr(frame, "name", "") or ""
        ).lower() or not url.startswith("http")

        for etiqueta in etiquetas:
            try:
                loc = frame.get_by_label(etiqueta, exact=False)
                if loc.count() > 0 and _set_input_value(loc.first, numero):
                    return True
            except Exception:
                pass

        # Buscar input cerca del texto de la etiqueta (JSF a veces no asocia label).
        try:
            ok = frame.evaluate(
                """(numero) => {
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
                }""",
                numero,
            )
            if ok:
                return True
        except Exception:
            pass

        candidatos = []
        for sel in selectores:
            try:
                loc = frame.locator(sel)
                for i in range(loc.count()):
                    candidatos.append(loc.nth(i))
            except Exception:
                continue

        # Preferir el último input de texto del formulario (patrón Sofia / registro).
        for campo in reversed(candidatos):
            try:
                tipo = (campo.get_attribute("type") or "text").lower()
                if tipo in {"hidden", "submit", "button", "checkbox", "radio", "password", "image"}:
                    continue
                name = (campo.get_attribute("name") or "").lower()
                cid = (campo.get_attribute("id") or "").lower()
                if "rol" in name or "rol" in cid or "josso" in name:
                    continue
                if _set_input_value(campo, numero):
                    return True
            except Exception:
                continue

        if es_form:
            # Último recurso: primer input editable del documento del iframe.
            try:
                ok = frame.evaluate(
                    """(numero) => {
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
                    }""",
                    numero,
                )
                if ok:
                    return True
            except Exception:
                continue
    return False


def _llenar_consulta(page: Page, tipo: str, numero: str) -> str | None:
    _esperar_sin_blockui(page, 20000)
    if not _rol_actual_parece_usuario_sena(page):
        err = _seleccionar_usuario_sena(page)
        if err:
            return err
    if not _en_formulario_inscripcion(page):
        # Reintento corto de carga del iframe antes de fallar con mensaje confuso.
        _cargar_iframe_inscripcion_directo(page)
        if not _esperar_formulario_inscripcion(page, timeout_ms=12000):
            s._dump(page, "error_form_antes_llenar")
            _dump_iframe_contenido(page, "error_form_antes_llenar")
            return "No se cargó el formulario Consultar Inscripción (validarUsuarioConsulta)"

    ok = False
    for frame in _frames_formulario(page):
        try:
            selects = frame.locator("select")
            for i in range(selects.count()):
                sel = selects.nth(i)
                labels = s._labels_select(frame, sel)
                if s._es_select_roles(labels):
                    continue
                if not any(s._texto_coincide(lb, tipo) for lb in labels):
                    continue
                for j in range(sel.locator("option").count()):
                    opt = sel.locator("option").nth(j)
                    label = opt.inner_text().strip()
                    if s._texto_coincide(label, tipo):
                        value = opt.get_attribute("value") or label
                        sel.select_option(value=value, timeout=5000)
                        ok = True
                        break
                if ok:
                    break
            if ok:
                break
        except Exception:
            continue
    if not ok and not s._seleccionar_por_texto(page, "select", tipo):
        return f"No se pudo seleccionar tipo de identificación '{tipo}'"

    # Tras elegir tipo, JSF/A4J a veces re-renderiza el campo número.
    page.wait_for_timeout(1000)

    if not _escribir_numero_en_formulario(page, numero):
        s._dump(page, "error_sin_input_documento")
        _dump_iframe_contenido(page, "error_sin_input_documento")
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
        return "No se pudo escribir el número de identificación"

    # Clic Consultar dentro del iframe del formulario (no en otros menús).
    click_ok = False
    for frame in _frames_formulario(page):
        try:
            btn = frame.locator(
                "input[type='submit'], button, a, span, input[type='button'], input[type='image']"
            ).filter(has_text=re.compile(r"Consultar", re.I))
            if btn.count() > 0:
                btn.first.click(timeout=5000, force=True)
                click_ok = True
                break
        except Exception:
            continue
    if not click_ok:
        for frame in _frames_formulario(page):
            try:
                ok_js = frame.evaluate(
                    """() => {
                        const norm = (s) => (s || '').toLowerCase().trim();
                        const nodes = Array.from(document.querySelectorAll(
                            'a, button, input, span, td'
                        ));
                        for (const n of nodes) {
                            const t = norm(n.value || n.innerText || n.textContent || '');
                            if (t === 'consultar' || t.startsWith('consultar')) {
                                n.click();
                                return true;
                            }
                        }
                        return false;
                    }"""
                )
                if ok_js:
                    click_ok = True
                    break
            except Exception:
                continue
    if not click_ok and not s._click_texto(page, "Consultar"):
        return "No se pudo hacer clic en Consultar"

    if not _esperar_resultado_consulta(page, timeout_ms=20000):
        # Reintento: a veces el primer clic no dispara el A4J del formulario.
        for frame in _frames_formulario(page):
            try:
                ok_js = frame.evaluate(
                    """() => {
                        const forms = Array.from(document.querySelectorAll('form'));
                        for (const f of forms) {
                            const btn = f.querySelector(
                                "input[type='submit'], input[type='button'], button, a"
                            );
                            if (!btn) continue;
                            const t = ((btn.value || btn.innerText || '') + '').toLowerCase();
                            if (t.includes('consultar')) { btn.click(); return true; }
                        }
                        return false;
                    }"""
                )
                if ok_js:
                    break
            except Exception:
                continue
        _esperar_resultado_consulta(page, timeout_ms=20000)
    return None


def _hay_tabla_o_vacio_inscripciones(page: Page) -> bool:
    for frame in _frames_formulario(page):
        try:
            cuerpo = s._normalizar_texto(frame.inner_text("body"))
        except Exception:
            continue
        if "identificador ficha" in cuerpo and "programa" in cuerpo:
            return True
        if "pagina" in cuerpo and " de " in cuerpo and any(ch.isdigit() for ch in cuerpo):
            return True
        if "no se encontr" in cuerpo or "sin resultados" in cuerpo or "no hay registros" in cuerpo:
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


def _parse_pagina_indicator(texto: str) -> tuple[int, int] | None:
    m = re.search(r"P[aá]gina\s+(\d+)\s+de\s+(\d+)", texto, re.IGNORECASE)
    if not m:
        return None
    return int(m.group(1)), int(m.group(2))


def _extraer_filas_tabla(page: Page) -> list[RegistroInscripcion]:
    """Lee filas con ficha / programa / estado desde tablas visibles."""
    registros: list[RegistroInscripcion] = []
    for frame in s._frames(page):
        try:
            tables = frame.locator("table")
            for ti in range(tables.count()):
                table = tables.nth(ti)
                header = ""
                try:
                    header = s._normalizar_texto(table.locator("tr").first.inner_text())
                except Exception:
                    continue
                if "identificador ficha" not in header and "programa de formacion" not in header:
                    continue
                rows = table.locator("tr")
                for ri in range(1, rows.count()):
                    cells = rows.nth(ri).locator("td")
                    n = cells.count()
                    if n < 8:
                        continue
                    ficha = cells.nth(0).inner_text().strip()
                    programa = cells.nth(1).inner_text().strip()
                    estado = cells.nth(7).inner_text().strip()
                    if not ficha or not ficha[0].isdigit():
                        continue
                    registros.append(
                        RegistroInscripcion(ficha=ficha, programa=programa, estado=estado)
                    )
                if registros:
                    return registros
        except Exception:
            continue

    # Fallback: parsear texto plano si la tabla no es estándar
    cuerpo = ""
    for frame in s._frames(page):
        try:
            cuerpo = frame.inner_text("body")
            if "Identificador Ficha" in cuerpo or "Programa de Formación" in cuerpo:
                break
        except Exception:
            continue
    for line in cuerpo.splitlines():
        m = re.match(
            r"^\s*(\d{5,})\s+(.+?)\s+(Certificado|Matriculado|Cancelado(?:\s+Acad[eé]mico)?|No Admitido|Retiro|Traslado|Aplazado)\s*$",
            line,
            re.IGNORECASE,
        )
        if m:
            registros.append(
                RegistroInscripcion(
                    ficha=m.group(1),
                    programa=m.group(2).strip(),
                    estado=m.group(3).strip(),
                )
            )
    return registros


def _ir_siguiente_pagina(page: Page) -> bool:
    # Preferir botón "Siguiente >"
    if s._click_texto(page, "Siguiente >"):
        page.wait_for_timeout(s.WAIT_FORM_MS)
        return True
    if s._click_texto(page, "Siguiente"):
        page.wait_for_timeout(s.WAIT_FORM_MS)
        return True
    for frame in s._frames(page):
        try:
            loc = frame.locator("a, button, span, td").filter(has_text=re.compile(r"Siguiente", re.I))
            if loc.count() > 0:
                loc.first.click(timeout=4000)
                page.wait_for_timeout(s.WAIT_FORM_MS)
                return True
        except Exception:
            continue
    return False


def _recolectar_todas_paginas(page: Page) -> list[RegistroInscripcion]:
    todos: list[RegistroInscripcion] = []
    vistos: set[tuple[str, str, str]] = set()

    for _ in range(MAX_PAGINAS):
        filas = _extraer_filas_tabla(page)
        for r in filas:
            key = (r.ficha, r.programa, r.estado)
            if key not in vistos:
                vistos.add(key)
                todos.append(r)

        texto = s._texto_pagina_completo(page)
        ind = _parse_pagina_indicator(texto)
        if ind:
            actual, total = ind
            if actual >= total:
                break
        else:
            # Sin paginación explícita: una sola página
            if "siguiente" not in texto:
                break

        if not _ir_siguiente_pagina(page):
            break

    return todos


def _filtrar_por_ficha(registros: list[RegistroInscripcion], ficha: str) -> list[RegistroInscripcion]:
    objetivo = re.sub(r"\D", "", ficha.strip())
    if not objetivo:
        return registros
    return [r for r in registros if re.sub(r"\D", "", r.ficha) == objetivo]


def _consultar_un_tipo(
    page: Page, tipo: str, numero: str, ficha: str
) -> ResultadoInscripciones:
    err = _llenar_consulta(page, tipo, numero)
    if err:
        return ResultadoInscripciones(
            numero_documento=numero,
            ficha_consultada=ficha,
            estado=ESTADO_NO_VERIFICADO,
            mensaje=err,
        )

    s._dump(page, f"inscripcion_resultado_{s._sanitize(tipo)}", solo_error=False)
    _dump_iframe_contenido(page, f"inscripcion_resultado_{s._sanitize(tipo)}")
    todos = _recolectar_todas_paginas(page)
    filtrados = _filtrar_por_ficha(todos, ficha)

    if filtrados:
        return ResultadoInscripciones(
            numero_documento=numero,
            ficha_consultada=ficha,
            estado=ESTADO_ENCONTRADO,
            tipo_encontrado=tipo,
            registros=filtrados,
            mensaje=f"Se encontraron {len(filtrados)} registro(s) para la ficha {ficha}.",
        )

    if todos:
        return ResultadoInscripciones(
            numero_documento=numero,
            ficha_consultada=ficha,
            estado=ESTADO_NO_ENCONTRADO,
            tipo_encontrado=tipo,
            registros=[],
            mensaje=(
                f"El aprendiz tiene {len(todos)} inscripción(es), "
                f"pero ninguna con ficha {ficha}."
            ),
        )

    # Sin filas: puede ser tipo incorrecto o sin historial
    cuerpo = s._texto_pagina_completo(page)
    if "no se encontr" in cuerpo or "sin resultados" in cuerpo or "no hay registros" in cuerpo:
        return ResultadoInscripciones(
            numero_documento=numero,
            ficha_consultada=ficha,
            estado=ESTADO_NO_ENCONTRADO,
            mensaje="SofiaPlus no devolvió inscripciones para ese documento.",
        )

    # Tabla vacía sin mensaje claro → probar otro tipo
    return ResultadoInscripciones(
        numero_documento=numero,
        ficha_consultada=ficha,
        estado=ESTADO_NO_ENCONTRADO,
        tipo_encontrado=tipo,
        mensaje="Sin filas en la tabla de inscripciones para este tipo de documento.",
    )


def _volver_formulario(page: Page) -> None:
    """Tras una consulta, volver al formulario si el menú lo permite."""
    if _en_formulario_inscripcion(page) and s._texto_visible_en_frames(page, "Tipo de Identificación"):
        # Si hay tabla y formulario juntos, ok
        return
    if s._click_texto(page, MENU_CONSULTAR_INSCRIPCIONES):
        page.wait_for_timeout(s.WAIT_FORM_MS)


def _cred_usuario_sena(cred: s.Credenciales) -> s.Credenciales:
    return s.Credenciales(
        usuario=cred.usuario.strip(),
        password=cred.password,
        tipo_documento=cred.tipo_documento or "Cédula de Ciudadanía",
        rol=ROL_USUARIO_SENA,
    )


def _resultado_consulta_en_pagina(
    page: Page, numero: str, ficha_n: str, tipo_documento: str
) -> ResultadoInscripciones:
    tipos = _tipos_a_probar(tipo_documento)
    ultimo = ResultadoInscripciones(
        numero_documento=numero,
        ficha_consultada=ficha_n,
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
                        ficha_consultada=ficha_n,
                        estado=ESTADO_NO_VERIFICADO,
                        mensaje=err_nav,
                    )
        res = _consultar_un_tipo(page, tipo, numero, ficha_n)
        ultimo = res
        if res.estado in (ESTADO_ENCONTRADO, ESTADO_NO_VERIFICADO):
            return res
        if "ninguna con ficha" in (res.mensaje or "").lower():
            return res
    return ultimo


def consultar_inscripciones(
    cred: s.Credenciales,
    numero_documento: str,
    ficha: str,
    tipo_documento: str = "",
) -> ResultadoInscripciones:
    numero = numero_documento.strip()
    ficha_n = ficha.strip()
    if not numero:
        return ResultadoInscripciones(
            numero_documento=numero,
            ficha_consultada=ficha_n,
            estado=ESTADO_NO_VERIFICADO,
            mensaje="El número de documento es obligatorio.",
        )
    if not ficha_n:
        return ResultadoInscripciones(
            numero_documento=numero,
            ficha_consultada=ficha_n,
            estado=ESTADO_NO_VERIFICADO,
            mensaje="El identificador de ficha es obligatorio.",
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
            _resultado_consulta_en_pagina(page, numero, ficha_n, tipo_documento)
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
            ficha_consultada=ficha_n,
            estado=ESTADO_NO_VERIFICADO,
            mensaje=f"Error del scraper: {exc}",
        )

    if err_msg[0] and not resultado_holder:
        return ResultadoInscripciones(
            numero_documento=numero,
            ficha_consultada=ficha_n,
            estado=ESTADO_NO_VERIFICADO,
            mensaje=err_msg[0],
        )
    if resultado_holder:
        return resultado_holder[0]
    return ResultadoInscripciones(
        numero_documento=numero,
        ficha_consultada=ficha_n,
        estado=ESTADO_NO_VERIFICADO,
        mensaje="No se obtuvo respuesta del scraper",
    )


def consultar_inscripciones_lote(
    cred: s.Credenciales,
    items: list[ConsultaLoteItem],
) -> list[ResultadoInscripciones]:
    """Un solo login Scrapling; consulta cada fila (documento + ficha) en secuencia."""
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
            numero = item.numero_documento.strip()
            ficha_n = item.ficha.strip()
            if not numero or not ficha_n:
                resultados.append(
                    ResultadoInscripciones(
                        numero_documento=numero,
                        ficha_consultada=ficha_n,
                        estado=ESTADO_NO_VERIFICADO,
                        mensaje="Fila incompleta: faltan documento o ficha.",
                    )
                )
                continue
            if idx > 0:
                _volver_formulario(page)
                if not _en_formulario_inscripcion(page):
                    err_nav = _navegar_consultar_inscripciones(page)
                    if err_nav:
                        resultados.append(
                            ResultadoInscripciones(
                                numero_documento=numero,
                                ficha_consultada=ficha_n,
                                estado=ESTADO_NO_VERIFICADO,
                                mensaje=err_nav,
                            )
                        )
                        continue
            resultados.append(
                _resultado_consulta_en_pagina(page, numero, ficha_n, item.tipo_documento)
            )

    try:
        with s._FETCH_LOCK:
            StealthyFetcher.fetch(
                require_login_url(),
                page_action=page_action,
                **s._stealthy_fetch_kwargs(),
            )
    except Exception as exc:
        msg = f"Error del scraper: {exc}"
        return [
            ResultadoInscripciones(
                numero_documento=i.numero_documento.strip(),
                ficha_consultada=i.ficha.strip(),
                estado=ESTADO_NO_VERIFICADO,
                mensaje=msg,
            )
            for i in items
        ]

    if err_global[0] and not resultados:
        return [
            ResultadoInscripciones(
                numero_documento=i.numero_documento.strip(),
                ficha_consultada=i.ficha.strip(),
                estado=ESTADO_NO_VERIFICADO,
                mensaje=err_global[0] or "Error de login",
            )
            for i in items
        ]
    return resultados
