"""Pruebo que el lote no espera el cierre eterno del navegador.

@author Cristian Deysdayr Jiménez
"""

from __future__ import annotations

import os
import sys
import threading
import time
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.sofia_fetch_lote import correr_fetch_hasta_trabajo, envolver_page_action


class _PaginaFalsa:
    def __init__(self) -> None:
        self.cerrada = False

    def close(self) -> None:
        self.cerrada = True


class TestSofiaFetchLote(unittest.TestCase):
    def test_trabajo_listo_no_espera_cierre_lento(self) -> None:
        listo = threading.Event()
        cierre_entro = threading.Event()

        def fetch() -> None:
            listo.set()
            cierre_entro.wait(timeout=5)
            time.sleep(0.05)

        t0 = time.time()
        ok = correr_fetch_hasta_trabajo(fetch, listo, timeout_s=2)
        self.assertTrue(ok)
        self.assertLess(time.time() - t0, 1.5)
        cierre_entro.set()

    def test_timeout_si_nunca_avisa(self) -> None:
        listo = threading.Event()

        def fetch() -> None:
            time.sleep(10)

        self.assertFalse(correr_fetch_hasta_trabajo(fetch, listo, timeout_s=0.2))

    def test_envolver_senala_y_cierra(self) -> None:
        listo = threading.Event()
        pagina = _PaginaFalsa()

        def accion(_page: _PaginaFalsa) -> None:
            return

        envolver_page_action(accion, listo)(pagina)
        self.assertTrue(listo.is_set())
        self.assertTrue(pagina.cerrada)


if __name__ == "__main__":
    unittest.main()
