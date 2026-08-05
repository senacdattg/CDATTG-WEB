"""API interna del scraper SofiaPlus (login SENA + Consultar Registro)."""

from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from pydantic import BaseModel, Field

from app import betowa_scraper, inscripciones_scraper, scraper
from app.config import BETOWA_REGISTRO_URL, HEADLESS, TIMEOUT_SEGUNDOS, require_login_url
from app.scraper import DocumentoLote


@asynccontextmanager
async def lifespan(_app: FastAPI):
    # Playwright sync no puede iniciarse dentro del loop asyncio de FastAPI.
    yield


app = FastAPI(title="CDATTG Sofia Scraper", version="2.0.0", lifespan=lifespan)


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
        detalle=r.detalle,
        mensaje=r.mensaje,
    )


@app.get("/health")
def health():
    try:
        login_url = require_login_url()
    except RuntimeError as err:
        return {"status": "degraded", "engine": "scrapling", "error": str(err)}
    return {
        "status": "ok",
        "engine": "scrapling",
        "mode": "authenticated",
        "login_url_configured": bool(login_url),
        "betowa_registro_url": BETOWA_REGISTRO_URL,
        "headless": HEADLESS,
        "timeout_segundos": TIMEOUT_SEGUNDOS,
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
# Consultar Inscripción (SofiaPlus) — programas por ficha (Usuario SENA)
# ============================================================================


class ConsultarInscripcionesIn(BaseModel):
    credenciales: CredencialesIn
    numero_documento: str
    ficha: str
    tipo_documento: str = ""


class RegistroInscripcionOut(BaseModel):
    ficha: str
    programa: str
    estado: str


class ConsultarInscripcionesOut(BaseModel):
    numero_documento: str
    ficha_consultada: str
    estado: str
    tipo_encontrado: str = ""
    registros: list[RegistroInscripcionOut] = Field(default_factory=list)
    mensaje: str = ""


def _inscripciones_out(r: inscripciones_scraper.ResultadoInscripciones) -> ConsultarInscripcionesOut:
    return ConsultarInscripcionesOut(
        numero_documento=r.numero_documento,
        ficha_consultada=r.ficha_consultada,
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
        body.ficha.strip(),
        body.tipo_documento.strip(),
    )
    return _inscripciones_out(r)


class ConsultaInscripcionItemIn(BaseModel):
    numero_documento: str
    ficha: str
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
            ficha=c.ficha.strip(),
            tipo_documento=c.tipo_documento.strip(),
        )
        for c in body.consultas
    ]
    resultados = inscripciones_scraper.consultar_inscripciones_lote(_to_cred(body.credenciales), items)
    return ConsultarInscripcionesLoteOut(resultados=[_inscripciones_out(r) for r in resultados])

