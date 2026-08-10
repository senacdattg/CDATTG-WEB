"""Registro de progreso en memoria de los lotes Sofía/Betowa.

La API interna del scraper es stateless salvo esto: mientras un lote corre, cada
documento reporta su avance y la UI lo consulta vía ``GET /progreso/{lote_id}``.
Las entradas se limpian por TTL (30 min) de forma perezosa, así el proceso no
crece sin límite entre corridas.
"""

from __future__ import annotations

import threading
import time

_TTL_SEGUNDOS = 30 * 60
_LOCK = threading.Lock()
_PROGRESOS: dict[str, dict] = {}


def iniciar(lote_id: str, total: int, fase: str = "") -> None:
    if not lote_id:
        return
    with _LOCK:
        _limpiar()
        _PROGRESOS[lote_id] = {
            "lote_id": lote_id,
            "fase": fase,
            "total": max(0, total),
            "procesados": 0,
            "actual_doc": "",
            "estado_actual": "",
            "terminado": False,
            "error": None,
            "inicio": time.time(),
            "fin": None,
        }


def reportar(lote_id: str, actual_doc: str = "", estado: str = "") -> None:
    """Incrementa en 1 el contador global del lote y actualiza doc/estado actuales.

    Se usa un incremento (no un valor absoluto) porque los workers del lote
    reportan en paralelo y cada uno solo conoce su propio subconjunto.
    """
    if not lote_id:
        return
    with _LOCK:
        p = _PROGRESOS.get(lote_id)
        if p is None:
            return
        p["procesados"] = p.get("procesados", 0) + 1
        if actual_doc:
            p["actual_doc"] = actual_doc
        if estado:
            p["estado_actual"] = estado


def terminar(lote_id: str, error: str | None = None) -> None:
    if not lote_id:
        return
    with _LOCK:
        p = _PROGRESOS.get(lote_id)
        if p is None:
            return
        p["terminado"] = True
        p["error"] = error
        p["fin"] = time.time()


def obtener(lote_id: str) -> dict | None:
    with _LOCK:
        _limpiar()
        p = _PROGRESOS.get(lote_id)
        return dict(p) if p is not None else None


def _limpiar() -> None:
    ahora = time.time()
    viejos = [
        k
        for k, v in _PROGRESOS.items()
        if ahora - (v.get("fin") or v.get("inicio") or ahora) > _TTL_SEGUNDOS
    ]
    for k in viejos:
        del _PROGRESOS[k]
