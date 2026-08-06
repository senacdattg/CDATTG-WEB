"""API interna del microservicio scraper CDATTG.

Dos submódulos independientes que comparten solo el proceso/contenedor:

- SofíaPlus (``scraper``, ``inscripciones_scraper``): login SENA + Playwright.
  Rutas: ``/verificar*``, ``/consultar-inscripciones*``.
- Betowa (``betowa_scraper``): HTTP a Server Action Next.js, sin credenciales Sofía.
  Rutas: ``/betowa/*``.

No comparten sesión de navegador, cookies ni lógica. Un fallo o cambio de ID
en Betowa no debe alterar Sofía, y viceversa.
"""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from pydantic import BaseModel, Field

from app import betowa_scraper, inscripciones_scraper, scraper
from app.config import BETOWA_REGISTRO_URL, HEADLESS, TIMEOUT_SEGUNDOS, require_login_url
from app.types import DocumentoLote


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Playwright sync no puede iniciarse dentro del loop asyncio de FastAPI.
    yield


app = FastAPI(
    title="CDATTG Scraper (SofíaPlus + Betowa)",
    version="2.1.0",
    lifespan=lifespan,
    description=(
        "SofíaPlus y Betowa son submódulos independientes. "
        "Comparten contenedor Scrapling; no comparten sesión ni destino."
    ),
)


class CredencialesIn(BaseModel):
    usuario: str
    password: str
    tipo_documento: str = "Cédula de Ciudadanía"
    rol: str = ""


class DocumentoIn(BaseModel):
    numero_documento: str
    tipo_documento: str = ""


class VerificarIn(BaseModel):
    credenciales: CredencialesIn
    numero_documento: str
    tipo_documento: str = ""


class VerificarLoteIn(BaseModel):
    credenciales: CredencialesIn
    documentos: list[DocumentoIn] = Field(min_length=1)


class ResultadoOut(BaseModel):
    numero_documento: str
    estado: str
    tipo_encontrado: str = ""
    nombre: str = ""
    nombres: str = ""
    primer_apellido: str = ""
    segundo_apellido: str = ""
    detalle: str = ""
    mensaje: str = ""


class VerificarLoteOut(BaseModel):
    resultados: list[ResultadoOut]


def _to_cred(c: CredencialesIn) -> scraper.Credenciales:
    return scraper.Credenciales(
        usuario=c.usuario.strip(),
        password=c.password,
        tipo_documento=c.tipo_documento.strip() or "Cédula de Ciudadanía",
        rol=c.rol.strip(),
    )


def _to_out(r: scraper.ResultadoVerificacion) -> ResultadoOut:
    return ResultadoOut(
        numero_documento=r.numero_documento,
        estado=r.estado,
        tipo_encontrado=r.tipo_encontrado,
        nombre=r.nombre,
        nombres=getattr(r, "nombres", "") or "",
        primer_apellido=getattr(r, "primer_apellido", "") or "",
        segundo_apellido=getattr(r, "segundo_apellido", "") or "",
        detalle=r.detalle,
        mensaje=r.mensaje,
    )


@app.get("/health")
def health():
    try:
        login_url = require_login_url()
        sofia_ok = True
        sofia_error = ""
    except RuntimeError as err:
        login_url = ""
        sofia_ok = False
        sofia_error = str(err)
    return {
        "status": "ok" if sofia_ok else "degraded",
        "engine": "scrapling",
        "modulos": {
            "sofia": {
                "activo": sofia_ok,
                "motor": "StealthyFetcher/Playwright",
                "destino": "senasofiaplus.edu.co",
                "login_url_configured": bool(login_url),
                "headless": HEADLESS,
                "timeout_segundos": TIMEOUT_SEGUNDOS,
                "error": sofia_error or None,
            },
            "betowa": {
                "activo": True,
                "motor": "Fetcher/HTTP Server Action",
                "destino": BETOWA_REGISTRO_URL,
                "requiere_credenciales_sofia": False,
            },
        },
    }


@app.post("/verificar", response_model=ResultadoOut)
def verificar(body: VerificarIn):
    r = scraper.verificar_documento(
        body.numero_documento.strip(),
        _to_cred(body.credenciales),
        body.tipo_documento.strip(),
    )
    return _to_out(r)


@app.post("/verificar-lote", response_model=VerificarLoteOut)
def verificar_lote(body: VerificarLoteIn):
    cred = _to_cred(body.credenciales)
    docs = [
        scraper.DocumentoLote(
            numero_documento=d.numero_documento.strip(),
            tipo_documento=d.tipo_documento.strip(),
        )
        for d in body.documentos
    ]
    resultados = scraper.verificar_lote(cred, docs)
    return VerificarLoteOut(resultados=[_to_out(r) for r in resultados])


class BetowaVerificarIn(BaseModel):
    numero_documento: str
    tipo_documento: str = ""


class BetowaVerificarLoteIn(BaseModel):
    documentos: list[DocumentoIn] = Field(min_length=1)


@app.post("/betowa/verificar", response_model=ResultadoOut)
def betowa_verificar(body: BetowaVerificarIn):
    r = betowa_scraper.verificar_documento(
        body.numero_documento.strip(),
        body.tipo_documento.strip(),
    )
    return _to_out(r)


@app.post("/betowa/verificar-lote", response_model=VerificarLoteOut)
def betowa_verificar_lote(body: BetowaVerificarLoteIn):
    docs = [
        DocumentoLote(
            numero_documento=d.numero_documento.strip(),
            tipo_documento=d.tipo_documento.strip(),
        )
        for d in body.documentos
    ]
    resultados = betowa_scraper.verificar_lote(docs)
    return VerificarLoteOut(resultados=[_to_out(r) for r in resultados])


# ============================================================================
# Consultar Inscripción (SofiaPlus) — filtro por programa de formación (Usuario SENA)
# ============================================================================


class ConsultarInscripcionesIn(BaseModel):
    credenciales: CredencialesIn
    numero_documento: str
    programa: str
    tipo_documento: str = ""


class RegistroInscripcionOut(BaseModel):
    ficha: str
    programa: str
    estado: str


class ConsultarInscripcionesOut(BaseModel):
    numero_documento: str
    programa_consultado: str
    estado: str
    tipo_encontrado: str = ""
    registros: list[RegistroInscripcionOut] = Field(default_factory=list)
    mensaje: str = ""


def _inscripciones_out(r: inscripciones_scraper.ResultadoInscripciones) -> ConsultarInscripcionesOut:
    return ConsultarInscripcionesOut(
        numero_documento=r.numero_documento,
        programa_consultado=r.programa_consultado,
        estado=r.estado,
        tipo_encontrado=r.tipo_encontrado,
        registros=[
            RegistroInscripcionOut(ficha=x.ficha, programa=x.programa, estado=x.estado)
            for x in r.registros
        ],
        mensaje=r.mensaje,
    )


@app.post("/consultar-inscripciones", response_model=ConsultarInscripcionesOut)
def consultar_inscripciones(body: ConsultarInscripcionesIn):
    r = inscripciones_scraper.consultar_inscripciones(
        _to_cred(body.credenciales),
        body.numero_documento.strip(),
        body.programa.strip(),
        body.tipo_documento.strip(),
    )
    return _inscripciones_out(r)


class ConsultaInscripcionItemIn(BaseModel):
    numero_documento: str
    programa: str
    tipo_documento: str = ""


class ConsultarInscripcionesLoteIn(BaseModel):
    credenciales: CredencialesIn
    consultas: list[ConsultaInscripcionItemIn] = Field(min_length=1)


class ConsultarInscripcionesLoteOut(BaseModel):
    resultados: list[ConsultarInscripcionesOut]


@app.post("/consultar-inscripciones-lote", response_model=ConsultarInscripcionesLoteOut)
def consultar_inscripciones_lote(body: ConsultarInscripcionesLoteIn):
    items = [
        inscripciones_scraper.ConsultaLoteItem(
            numero_documento=c.numero_documento.strip(),
            programa=c.programa.strip(),
            tipo_documento=c.tipo_documento.strip(),
        )
        for c in body.consultas
    ]
    resultados = inscripciones_scraper.consultar_inscripciones_lote(_to_cred(body.credenciales), items)
    return ConsultarInscripcionesLoteOut(resultados=[_inscripciones_out(r) for r in resultados])

