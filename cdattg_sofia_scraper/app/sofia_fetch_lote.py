"""Suelto el lote cuando ya consulté; no espero a que Chromium se cierre.

En Sofía (Fase 1 y 2) el navegador a veces se queda colgado al apagarse.
Betowa no usa Chromium, por eso ahí no pasa. El hilo demonio cierra el
navegador en segundo plano.

@author Cristian Deysdayr Jiménez
"""

from __future__ import annotations

import threading
from typing import Any, Callable


def cerrar_pagina_con_tope(page: Any, segundos: float = 3.0) -> None:
    """Cierro la pestaña con un tope corto para no bloquear el lote."""

    def _cierre() -> None:
        try:
            page.close()
        except Exception:
            return

    hilo = threading.Thread(target=_cierre, daemon=True)
    hilo.start()
    hilo.join(timeout=max(0.5, segundos))


def envolver_page_action(
    page_action: Callable[[Any], None],
    trabajo_listo: threading.Event,
) -> Callable[[Any], None]:
    """Al terminar las consultas aviso y suelto la pestaña."""

    def wrapped(page: Any) -> None:
        try:
            page_action(page)
        finally:
            trabajo_listo.set()
            cerrar_pagina_con_tope(page)

    return wrapped


def correr_fetch_hasta_trabajo(
    fetch_fn: Callable[[], None],
    trabajo_listo: threading.Event,
    timeout_s: float,
) -> bool:
    """Arranco el fetch en hilo. True si las consultas avisaron a tiempo."""

    def _run() -> None:
        try:
            fetch_fn()
        finally:
            trabajo_listo.set()

    hilo = threading.Thread(target=_run, daemon=True)
    hilo.start()
    return trabajo_listo.wait(timeout=max(1.0, timeout_s))
