"""Verificación de aspirantes en Betowa vía Server Actions de Next.js (rápido ~150ms/doc).

Llama directamente a la Server Action ``validateUserDocument`` de Next.js, que es
el mismo endpoint que usa el frontend de Betowa cuando escribes un documento
y pulsas "Continuar". No requiere navegador, es HTTP directo.

Respuesta de la Server Action (formato RSC línea a línea):
  success=True  → "Documento disponible para registro" → NO_REGISTRADO
  success=False + "ya existe una cuenta"              → REGISTRADO
  success=False + "Ya cuentas con un registro con X"  → REGISTRADO (otro tipo)
  success=False + otros errores                        → NO_VERIFICADO
"""
from __future__ import annotations

import json
import re
from datetime import date
from typing import Any

from scrapling.fetchers import Fetcher

from app.config import BETOWA_ACCION_VALIDAR, BETOWA_REGISTRO_URL
from app.scraper import DocumentoLote, ResultadoVerificacion

VERIFICACION_REGISTRADO = "REGISTRADO"
VERIFICACION_NO_REGISTRADO = "NO_REGISTRADO"
VERIFICACION_NO_VERIFICADO = "NO_VERIFICADO"

TIPOS_BETOWA = ["CC", "TI", "CE", "PPT"]

CODIGO_A_TIPO = {
    "CC": "Cédula de Ciudadanía",
    "TI": "Tarjeta de Identidad",
    "CE": "Cédula de Extranjería",
    "PPT": "Permiso por Protección Temporal",
}

REGEX_OTRO_TIPO = re.compile(
    r"(?:registro con|registraste con)\s+(.+?)(?:\s+para\s+actualizar|\.|$)",
    re.IGNORECASE | re.DOTALL,
)

MAX_TIPOS_A_PROBAR = 4  # CC, TI, CE, PPT


def _fecha_placeholder() -> str:
    return date.today().isoformat()


def _tipo_legible(codigo: str) -> str:
    return CODIGO_A_TIPO.get(codigo.strip(), codigo.strip())


def _no_verificado(numero: str, mensaje: str) -> ResultadoVerificacion:
    return ResultadoVerificacion(
        numero_documento=numero, estado=VERIFICACION_NO_VERIFICADO, mensaje=mensaje,
    )


# ---------------------------------------------------------------------------
# Llamada HTTP directa a la Server Action
# ---------------------------------------------------------------------------

def _llamar_server_action(numero: str, tipo: str) -> dict[str, Any] | None:
    """Ejecuta ``validateUserDocument`` y devuelve el JSON de la línea ``1:`` si existe."""
    payload = json.dumps([tipo, numero, _fecha_placeholder()])

    resp = Fetcher.post(
        BETOWA_REGISTRO_URL,
        data=payload,
        headers={
            "Next-Action": BETOWA_ACCION_VALIDAR,
            "Content-Type": "text/plain;charset=UTF-8",
        },
        impersonate="chrome",
    )
    body = resp.body.decode("utf-8") if resp.body else ""

    # Buscar la línea del RSC payload que contiene 'success' (datos reales)
    for line in body.split("\n"):
        line = line.strip()
        sin_prefijo = re.sub(r"^\d+:", "", line, count=1)
        if sin_prefijo.startswith("{") and '"success"' in sin_prefijo:
            try:
                return json.loads(sin_prefijo)
            except json.JSONDecodeError:
                continue
    return None


def _interpretar(data: dict[str, Any] | None, numero: str, tipo: str) -> ResultadoVerificacion:
    """Interpreta el JSON de la Server Action y devuelve un resultado estructurado."""
    if data is None:
        return _no_verificado(numero, "No se obtuvo respuesta de la Server Action de Betowa.")

    success = data.get("success")
    message = data.get("message", "")
    error_msg = data.get("error", "")
    errors = data.get("data", {}).get("errors", [])
    first_error = errors[0].get("message", "") if errors else ""

    texto = f"{message} {error_msg} {first_error}"
    t = texto.lower()

    # -- success=True: documento disponible (NO REGISTRADO) --
    if success is True:
        return ResultadoVerificacion(
            numero_documento=numero,
            estado=VERIFICACION_NO_REGISTRADO,
            detalle=json.dumps(data, ensure_ascii=False)[:500],
            mensaje="Documento disponible en Betowa (no registrado).",
        )

    # -- success=False: errores --

    # 1) Registrado con el mismo tipo
    if "ya existe una cuenta registrada con este documento" in t:
        return ResultadoVerificacion(
            numero_documento=numero,
            estado=VERIFICACION_REGISTRADO,
            tipo_encontrado=_tipo_legible(tipo),
            detalle=first_error or message or "",
            mensaje="Cuenta existente en Betowa con el tipo de documento indicado.",
        )

    # 2) Registrado con otro tipo
    if any(p in t for p in ("ya cuentas con un registro", "detectamos que anteriormente te registraste", "cuentas con un registro")):
        match = REGEX_OTRO_TIPO.search(texto)
        tipo_real = match.group(1).strip() if match else ""
        if not tipo_real:
            for cand in TIPOS_BETOWA:
                etiqueta = CODIGO_A_TIPO.get(cand, cand)
                if etiqueta.lower() in t:
                    tipo_real = etiqueta
                    break
        return ResultadoVerificacion(
            numero_documento=numero,
            estado=VERIFICACION_REGISTRADO,
            tipo_encontrado=tipo_real or _tipo_legible(tipo),
            detalle=first_error or message or "",
            mensaje="Ya registrado en Betowa con otro tipo de documento.",
        )

    # 3) Error de validacion del número (ej. longitud)
    if any(p in t for p in ("debe contener", "inválido", "inválida", "no válido")):
        return _no_verificado(numero, f"Betowa rechazó el número: {first_error or message or error_msg}")

    # 4) Otro error no reconocido
    return _no_verificado(numero, f"Betowa respondió: {(first_error or message or error_msg)[:200]}")


# ---------------------------------------------------------------------------
# API pública
# ---------------------------------------------------------------------------

def verificar_documento(numero: str, tipo_codigo: str = "") -> ResultadoVerificacion:
    """Verifica un documento en Betowa vía Server Action directa.

    Args:
        numero: Número de documento (ej. ``"1120561339"``).
        tipo_codigo: Código opcional (``"CC"``, ``"TI"``, etc.).

    Returns:
        ResultadoVerificacion con estado ``REGISTRADO``, ``NO_REGISTRADO`` o ``NO_VERIFICADO``.

    Note:
        Tiempo típico: **~150 ms** (vs ~8 s con Playwright).
    """
    tipos: list[str] = []
    if tipo_codigo:
        tipos.append(tipo_codigo)
    tipos.extend(t for t in TIPOS_BETOWA if t not in tipos)
    tipos = tipos[:MAX_TIPOS_A_PROBAR]

    ultimo = _no_verificado(numero, "No se pudo verificar en Betowa.")

    for tipo in tipos:
        data = _llamar_server_action(numero, tipo)
        res = _interpretar(data, numero, tipo)
        if res.estado in (VERIFICACION_REGISTRADO, VERIFICACION_NO_REGISTRADO):
            return res
        ultimo = res

    return ultimo


def verificar_lote(docs: list[DocumentoLote]) -> list[ResultadoVerificacion]:
    """Verifica múltiples documentos en Betowa secuencialmente (~150ms c/u).

    20 documentos se completan en ~3 segundos. No requiere paralelismo
    porque cada consulta es HTTP directa (sin navegador).

    Args:
        docs: Lista de documentos a verificar.

    Returns:
        Lista de resultados en el mismo orden de entrada.
    """
    resultados: list[ResultadoVerificacion] = []
    for doc in docs:
        resultados.append(verificar_documento(doc.numero_documento, doc.tipo_documento))
    return resultados
