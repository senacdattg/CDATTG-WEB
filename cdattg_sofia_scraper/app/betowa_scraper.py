"""Verificación de aspirantes en Betowa vía formulario de registro (sin credenciales SENA)."""

from __future__ import annotations

import multiprocessing
import os
import re
import threading
import time
from concurrent.futures import ProcessPoolExecutor, as_completed
from dataclasses import dataclass, field
from typing import Any, Callable

from patchright.sync_api import Page
from scrapling.fetchers import StealthyFetcher

from app.config import (
    BETOWA_DIAG_DIR,
    BETOWA_DIAGNOSTICO,
    BETOWA_PARALLEL_WORKERS,
    BETOWA_REGISTRO_URL,
    BETOWA_WAIT_SUBMIT_MS,
    HEADLESS,
    TIMEOUT_SEGUNDOS,
)
from app.scraper import DocumentoLote, ResultadoVerificacion

WAIT_SHORT_MS = 100
WAIT_FORM_MS = 250
WAIT_SUBMIT_MS = BETOWA_WAIT_SUBMIT_MS
PAGE_TIMEOUT_MS = max(TIMEOUT_SEGUNDOS, 90) * 1000

# Permite varias consultas Betowa en paralelo (lote); Sofia sigue con su propio lock.
_BETOWA_SLOTS = threading.Semaphore(BETOWA_PARALLEL_WORKERS)

BROWSER_FLAGS = [
    "--disable-dev-shm-usage",
    "--no-sandbox",
    "--window-size=1280,900",
    "--lang=es-CO",
]

VERIFICACION_REGISTRADO = "REGISTRADO"
VERIFICACION_NO_REGISTRADO = "NO_REGISTRADO"
VERIFICACION_NO_VERIFICADO = "NO_VERIFICADO"

MSG_YA_EXISTE = "ya existe una cuenta registrada con este documento"
MSG_UPS = "ups, parece que algo salió mal"

TIPOS_BETOWA = [
    "Cédula de Ciudadanía",
    "Tarjeta de Identidad",
    "Cédula de Extranjería",
    "Permiso por Protección Temporal",
]

CODIGO_A_TIPO = {
    "CC": "Cédula de Ciudadanía",
    "TI": "Tarjeta de Identidad",
    "CE": "Cédula de Extranjería",
    "PPT": "Permiso por Protección Temporal",
    "PEP": "PEP",
}

REGISTRO_OTRO_TIPO = re.compile(
    r"(?:registro con|registraste con)\s+(.+?)(?:\s+para\s+actualizar|\.\s|\.|$|\s+Ahora)",
    re.IGNORECASE | re.DOTALL,
)

INDICADORES_PASO_SIGUIENTE = (
    "información básica",
    "informacion basica",
    "primer nombre",
    "primer apellido",
    "segundo apellido",
    "correo electrónico",
    "correo electronico",
    "datos personales",
    "fecha de nacimiento",
)

LUGAR_BUSQUEDA = "Bogota"


@dataclass
class ContextoBetowa:
    docs: list[DocumentoLote]
    resultados: list[ResultadoVerificacion] = field(default_factory=list)


def _normalizar(texto: str) -> str:
    t = texto.lower().strip()
    for orig, repl in (("á", "a"), ("é", "e"), ("í", "i"), ("ó", "o"), ("ú", "u"), ("ñ", "n")):
        t = t.replace(orig, repl)
    return t


def _tipo_desde_codigo(codigo: str) -> str:
    c = codigo.strip()
    if not c:
        return ""
    if c in CODIGO_A_TIPO:
        return CODIGO_A_TIPO[c]
    for tipo in TIPOS_BETOWA:
        if _normalizar(tipo) == _normalizar(c):
            return tipo
    return c


def _tipos_a_probar(tipo_codigo: str) -> list[str]:
    preferido = _tipo_desde_codigo(tipo_codigo)
    if preferido and preferido in TIPOS_BETOWA:
        resto = [t for t in TIPOS_BETOWA if t != preferido]
        return [preferido, *resto]
    return list(TIPOS_BETOWA)


def _no_verificado(numero: str, mensaje: str) -> ResultadoVerificacion:
    return ResultadoVerificacion(
        numero_documento=numero,
        estado=VERIFICACION_NO_VERIFICADO,
        mensaje=mensaje,
    )


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
        "extra_flags": BROWSER_FLAGS,
        "wait": WAIT_FORM_MS,
    }


def _texto_visible(page: Page) -> str:
    try:
        return page.inner_text("body")
    except Exception:
        return ""


def _guardar_diagnostico(page: Page, etiqueta: str) -> None:
    if not BETOWA_DIAGNOSTICO:
        return
    os.makedirs(BETOWA_DIAG_DIR, exist_ok=True)
    ts = int(time.time())
    base = os.path.join(BETOWA_DIAG_DIR, f"{ts}_{etiqueta}")
    try:
        page.screenshot(path=f"{base}.png", full_page=True)
    except Exception:
        pass
    try:
        with open(f"{base}.html", "w", encoding="utf-8") as fh:
            fh.write(page.content())
    except Exception:
        pass
    try:
        with open(f"{base}.txt", "w", encoding="utf-8") as fh:
            fh.write(_texto_visible(page))
    except Exception:
        pass


def _formulario_listo(page: Page) -> bool:
    return page.locator('input[name="documentNumber"]').count() > 0


def _esperar_formulario_registro(page: Page, recargar: bool = True) -> str | None:
    if recargar or not _formulario_listo(page):
        page.goto(BETOWA_REGISTRO_URL, wait_until="domcontentloaded", timeout=PAGE_TIMEOUT_MS)
        page.wait_for_timeout(600)

    for _ in range(16):
        if _formulario_listo(page):
            return None
        page.wait_for_timeout(300)

    _guardar_diagnostico(page, "formulario_no_cargo")
    return "No se cargó el formulario de registro en Betowa."


def _formulario(page: Page):
    return page.locator('input[name="documentNumber"]').locator("xpath=ancestor::form[1]")


def _boton_formulario(page: Page, indice: int):
    return _formulario(page).locator("button").nth(indice)


def _seleccionar_tipo_documento(page: Page, tipo: str) -> None:
    _boton_formulario(page, 0).click(timeout=5000)
    page.wait_for_timeout(WAIT_SHORT_MS)
    page.get_by_text(tipo, exact=True).click(timeout=5000)
    page.wait_for_timeout(WAIT_SHORT_MS)


def _llenar_numero_documento(page: Page, numero: str) -> None:
    campo = page.locator('input[name="documentNumber"]')
    campo.fill("", timeout=3000)
    campo.fill(numero, timeout=5000)


def _cerrar_overlays(page: Page) -> None:
    page.keyboard.press("Escape")
    page.wait_for_timeout(50)
    page.keyboard.press("Escape")


def _llenar_lugar_expedicion(page: Page) -> None:
    lugar_btn = _boton_formulario(page, 1)
    if "seleccionar ubicacion" not in _normalizar(lugar_btn.inner_text(timeout=2000)):
        return
    lugar_btn.click(timeout=5000)
    page.wait_for_timeout(WAIT_SHORT_MS)
    buscar = page.get_by_placeholder(re.compile("Buscar ciudad", re.I))
    buscar.fill(LUGAR_BUSQUEDA, timeout=5000)
    page.wait_for_timeout(500)
    buscar.press("ArrowDown")
    page.wait_for_timeout(50)
    buscar.press("Enter")
    page.wait_for_timeout(WAIT_SHORT_MS)
    _cerrar_overlays(page)
    lugar = _normalizar(_boton_formulario(page, 1).inner_text(timeout=3000))
    if "seleccionar ubicacion" in lugar:
        raise RuntimeError("No se seleccionó el lugar de expedición.")


def _llenar_fecha_expedicion(page: Page) -> None:
    fecha_btn = _boton_formulario(page, 2)
    if "placeholder" not in _normalizar(fecha_btn.inner_text(timeout=2000)):
        return
    _cerrar_overlays(page)
    fecha_btn.click(force=True, timeout=5000)
    page.wait_for_timeout(WAIT_SHORT_MS)
    dias = page.locator("button").filter(has_text=re.compile(r"^\d{1,2}$"))
    if dias.count() > 0:
        dias.first.click(force=True, timeout=4000)
    else:
        page.keyboard.press("Enter")
    _cerrar_overlays(page)


def _modal_terminos_abierto(page: Page) -> bool:
    t = _normalizar(_texto_visible(page))
    return "politica de seguridad y confidencialidad" in t and page.get_by_role(
        "button", name=re.compile(r"Denegar", re.I)
    ).count() > 0


def _aceptar_modal_terminos(page: Page) -> bool:
    if not _modal_terminos_abierto(page):
        return False
    for btn in page.get_by_role("button", name="Aceptar").all():
        try:
            aria = (btn.get_attribute("aria-label") or "").lower()
            if "continuar" in aria:
                continue
            btn.click(timeout=3000)
            page.wait_for_timeout(WAIT_SHORT_MS)
            return True
        except Exception:
            continue
    return False


def _aceptar_terminos(page: Page) -> None:
    checkbox = page.locator("#acceptTerms, input[name='acceptTerms']")
    if checkbox.count() > 0 and checkbox.first.is_checked():
        return

    marcado = page.evaluate(
        """() => {
            const el = document.querySelector('#acceptTerms')
                || document.querySelector('input[name="acceptTerms"]');
            if (!el) return false;
            if (!el.checked) el.click();
            return el.checked;
        }"""
    )
    if marcado:
        return

    if _modal_terminos_abierto(page) and _aceptar_modal_terminos(page):
        return

    try:
        _formulario(page).locator("button").filter(
            has_text=re.compile(r"T[eé]rminos de uso", re.I)
        ).click(timeout=3000)
        page.wait_for_timeout(WAIT_SHORT_MS)
        if _aceptar_modal_terminos(page):
            return
    except Exception:
        pass

    if checkbox.count() > 0 and checkbox.first.is_checked():
        return
    raise RuntimeError("No se pudo marcar la casilla de términos y condiciones.")


def _click_continuar(page: Page) -> None:
    _cerrar_overlays(page)
    _formulario(page).get_by_role("button", name=re.compile(r"Continuar", re.I)).click(timeout=5000)


def _texto_modal(page: Page) -> str:
    for sel in ("[role='dialog']", "[role='alertdialog']"):
        try:
            loc = page.locator(sel)
            if loc.count() > 0:
                txt = loc.first.inner_text(timeout=1000)
                if txt.strip():
                    return txt
        except Exception:
            continue
    try:
        ups = page.locator("div").filter(has_text=re.compile(r"Ups, parece que algo sali[oó] mal", re.I))
        if ups.count() > 0:
            return ups.first.inner_text(timeout=1000)
    except Exception:
        pass
    return ""


def _cerrar_modal_si_hay(page: Page) -> None:
    for loc in (
        page.get_by_role("button", name=re.compile(r"Cerrar", re.I)),
        page.get_by_role("button", name=re.compile(r"Aceptar", re.I)),
    ):
        try:
            if loc.count() > 0:
                loc.first.click(timeout=2000)
                page.wait_for_timeout(WAIT_SHORT_MS)
                return
        except Exception:
            continue


def _interpretar_desde_texto(
    page: Page, numero: str, tipo_intentado: str, modal: str, body: str
) -> ResultadoVerificacion | None:
    texto = f"{modal}\n{body}"
    t = _normalizar(texto)

    if MSG_YA_EXISTE in t:
        return ResultadoVerificacion(
            numero_documento=numero,
            estado=VERIFICACION_REGISTRADO,
            tipo_encontrado=tipo_intentado,
            detalle=modal.strip() or MSG_YA_EXISTE,
            mensaje="Cuenta existente en Betowa con el tipo de documento indicado.",
        )

    if MSG_UPS in t or "cuentas con un registro" in t or "detectamos que anteriormente te registraste" in t:
        match = REGISTRO_OTRO_TIPO.search(texto)
        tipo_real = match.group(1).strip() if match else ""
        if not tipo_real:
            for candidato in TIPOS_BETOWA:
                if _normalizar(candidato) in t:
                    tipo_real = candidato
                    break
        if tipo_real:
            return ResultadoVerificacion(
                numero_documento=numero,
                estado=VERIFICACION_REGISTRADO,
                tipo_encontrado=tipo_real,
                detalle=(modal or body).strip()[:500],
                mensaje="Ya registrado en Betowa con otro tipo de documento.",
            )

    if any(ind in t for ind in INDICADORES_PASO_SIGUIENTE) and MSG_UPS not in t:
        return ResultadoVerificacion(
            numero_documento=numero,
            estado=VERIFICACION_NO_REGISTRADO,
            mensaje="Betowa permitió continuar al siguiente paso: no hay cuenta con ese documento.",
        )

    if "te faltaron algunos datos" in t:
        return _no_verificado(numero, "Betowa rechazó el formulario (campos incompletos).")

    if modal.strip() and MSG_UPS in t:
        return _no_verificado(numero, f"Respuesta inesperada de Betowa: {modal.strip()[:300]}")

    return None


def _interpretar_respuesta(page: Page, numero: str, tipo_intentado: str) -> ResultadoVerificacion:
    intervalo_ms = 350
    intentos = max(1, WAIT_SUBMIT_MS // intervalo_ms)
    ultimo_modal = ""
    ultimo_body = ""

    for _ in range(intentos):
        page.wait_for_timeout(intervalo_ms)
        ultimo_modal = _texto_modal(page)
        ultimo_body = _texto_visible(page)
        res = _interpretar_desde_texto(page, numero, tipo_intentado, ultimo_modal, ultimo_body)
        if res:
            if res.estado != VERIFICACION_NO_VERIFICADO:
                _guardar_diagnostico(page, f"{res.estado.lower()}_{numero}")
            return res

    res = _interpretar_desde_texto(page, numero, tipo_intentado, ultimo_modal, ultimo_body)
    if res:
        return res

    _guardar_diagnostico(page, f"sin_respuesta_clara_{numero}")
    return _no_verificado(
        numero,
        "No se pudo determinar el estado (sin modal ni avance al siguiente paso).",
    )


def _preparar_formulario(page: Page) -> None:
    if _modal_terminos_abierto(page):
        page.get_by_role("button", name="Denegar").click(timeout=2000)
        page.wait_for_timeout(WAIT_SHORT_MS)
    _cerrar_modal_si_hay(page)
    _cerrar_overlays(page)


def _llenar_paso_documento(page: Page, numero: str, tipo: str) -> None:
    err = _esperar_formulario_registro(page)
    if err:
        raise RuntimeError(err)
    _preparar_formulario(page)
    _seleccionar_tipo_documento(page, tipo)
    _llenar_numero_documento(page, numero)
    _llenar_lugar_expedicion(page)
    _llenar_fecha_expedicion(page)
    _aceptar_terminos(page)
    _click_continuar(page)


def _intento_con_tipo(page: Page, numero: str, tipo: str) -> ResultadoVerificacion:
    try:
        _llenar_paso_documento(page, numero, tipo)
        return _interpretar_respuesta(page, numero, tipo)
    except Exception as exc:
        _guardar_diagnostico(page, f"error_{numero}")
        return _no_verificado(numero, f"Error al consultar Betowa: {exc}")


def _verificar_en_pagina(page: Page, numero: str, tipo_codigo: str) -> ResultadoVerificacion:
    ultimo = _no_verificado(numero, "No se pudo verificar en Betowa.")
    for tipo in _tipos_a_probar(tipo_codigo):
        res = _intento_con_tipo(page, numero, tipo)
        ultimo = res
        if res.estado == VERIFICACION_REGISTRADO:
            return res
        if res.estado == VERIFICACION_NO_REGISTRADO:
            return res
        _cerrar_modal_si_hay(page)
    return ultimo


def _ejecutar_con_scrapling(action: Callable[[Page], None]) -> str | None:
    err_msg: list[str | None] = [None]

    def page_action(page: Page) -> None:
        page.set_default_timeout(PAGE_TIMEOUT_MS)
        try:
            action(page)
        except Exception as exc:
            err_msg[0] = f"Error del scraper Betowa: {exc}"

    try:
        with _BETOWA_SLOTS:
            StealthyFetcher.fetch(
                BETOWA_REGISTRO_URL,
                page_action=page_action,
                **_stealthy_fetch_kwargs(),
            )
    except Exception as exc:
        return f"Error del scraper Betowa: {exc}"

    return err_msg[0]


def _ejecutar_flujo(ctx: ContextoBetowa) -> None:
    def consultar(page: Page) -> None:
        for doc in ctx.docs:
            ctx.resultados.append(_verificar_en_pagina(page, doc.numero_documento, doc.tipo_documento))

    err = _ejecutar_con_scrapling(consultar)
    if err and not ctx.resultados:
        for d in ctx.docs:
            ctx.resultados.append(_no_verificado(d.numero_documento, err))


def _verificar_documento_aislado(doc: DocumentoLote) -> ResultadoVerificacion:
    ctx = ContextoBetowa(docs=[doc])
    _ejecutar_flujo(ctx)
    if ctx.resultados:
        return ctx.resultados[0]
    return _no_verificado(doc.numero_documento, "No se obtuvo respuesta del scraper Betowa.")


def verificar_documento(numero: str, tipo_codigo: str = "") -> ResultadoVerificacion:
    return _verificar_documento_aislado(
        DocumentoLote(numero_documento=numero, tipo_documento=tipo_codigo)
    )


def _proceso_verificar_doc(numero: str, tipo_codigo: str) -> ResultadoVerificacion:
    """Worker en proceso hijo (Playwright no admite paralelismo por hilos)."""
    return _verificar_documento_aislado(
        DocumentoLote(numero_documento=numero, tipo_documento=tipo_codigo)
    )


def verificar_lote(docs: list[DocumentoLote]) -> list[ResultadoVerificacion]:
    if not docs:
        return []
    if len(docs) == 1:
        return [verificar_documento(docs[0].numero_documento, docs[0].tipo_documento)]

    workers = min(BETOWA_PARALLEL_WORKERS, len(docs))
    resultados: list[ResultadoVerificacion | None] = [None] * len(docs)
    ctx = multiprocessing.get_context("spawn")

    with ProcessPoolExecutor(max_workers=workers, mp_context=ctx) as pool:
        futuros = {
            pool.submit(_proceso_verificar_doc, doc.numero_documento, doc.tipo_documento): idx
            for idx, doc in enumerate(docs)
        }
        for futuro in as_completed(futuros):
            idx = futuros[futuro]
            try:
                resultados[idx] = futuro.result()
            except Exception as exc:
                resultados[idx] = _no_verificado(
                    docs[idx].numero_documento,
                    f"Error al consultar Betowa: {exc}",
                )

    return [r if r is not None else _no_verificado(d.numero_documento, "Sin respuesta") for r, d in zip(resultados, docs)]
