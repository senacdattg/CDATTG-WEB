"""Tipos compartidos del microservicio scraper.

Neutrales: no pertenecen a Sofía ni a Betowa. Cada submódulo
(``scraper`` / ``inscripciones_scraper`` / ``betowa_scraper``) los usa
como contrato de datos, sin compartir sesión, navegador ni lógica.
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class Credenciales:
    """Credenciales SENA (solo flujos SofíaPlus). Betowa no las usa."""

    usuario: str
    password: str
    tipo_documento: str = "Cédula de Ciudadanía"
    rol: str = ""


@dataclass
class DocumentoLote:
    numero_documento: str
    tipo_documento: str = ""


@dataclass
class ResultadoVerificacion:
    numero_documento: str
    estado: str
    tipo_encontrado: str = ""
    nombre: str = ""
    detalle: str = ""
    mensaje: str = ""
