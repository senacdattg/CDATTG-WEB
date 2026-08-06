# Propuesta: Fase 2 (inscripciones) por el portal público de SofíaPlus

> **Estado: DESCARTADA (2026-08-06).** Validada y rechazada: el portal público
> solo muestra inscripciones ACTIVAS (Matriculado) y oculta las terminadas
> (Certificado), que son las que la regla de negocio necesita (no repetir un
> complementario ya cursado). Ver "Conclusión" al final. Se deja el documento
> como registro de la investigación.
>
> **Betowa también descartado para Fase 2 (misma limitación):** el público
> `betowa.sena.edu.co/consultar-inscripciones` (Server Action
> `getEnrollmentsByDocument`) devuelve solo las inscripciones activas de Betowa;
> con 1120561339 (6 registros en el operador de SofíaPlus) devuelve vacío.
> Ver sección "Betowa" abajo.


## Hallazgo

SofíaPlus tiene un buscador **público (sin login)** de inscripciones:

```
http://senasofiaplus.edu.co/sofia-public/inscripcion/consultarinscripciones/buscadorInscripcionesUsuario.faces
```

(La URL ya existía en `.env.example` como `SOFIA_PUBLIC_URL`, nunca se usó.)

## Pruebas reales (navegador del scraper, sin credenciales, headless)

| Consulta | Tiempo | Resultado |
|---|---|---|
| TI 1120571336 | 2.0 s | Programa ORGANIZACION DE ARCHIVOS DE GESTION., ficha 3586901, CDATTG/GUAVIARE, jornada MIXTA |
| CC 1133929271 | 2.9 s | Ídem |
| CC 9999999999 | 2.0 s | Sin inscripciones |

Formulario: `existencia:tipoDocumentoIT` (select CC/CE/TI/PEP/DNI) +
`numeroDocumentoIdentidadIT` + botón `existencia:botonInscripcionesCM`.
Sin CAPTCHA ni honeypot. No requiere sesión (el POST con cookies + ViewState
funciona; el flujo con navegador es el recomendado).

## Por qué importa

- **Cero login**: sin JOSSO, sin rol, sin menú SGS → elimina el setup de ~19 s
  por lote del flujo del operador.
- **Headless funciona** (el bloqueo headless solo afecta al login).
- **Sin límite de sesiones** → paralelizable con 8-10 workers sin temor a
  throttling por logins simultáneos.
- Proyección 20 personas: **~15-20 s** (vs ~17 min reportados en el flujo
  actual de Fase 2).

## Qué devuelve (y qué NO)

Solo la lista de inscripciones: programa, ficha, nivel, lugar de realización,
jornada. **NO devuelve** nombres/apellidos, ni tipo de documento (es entrada,
no salida), ni NIS.

Los campos mapean 1:1 al DTO actual `dto.RegistroInscripcionFicha`
(ficha/lugar/jornada/nivel), que es lo que muestra la tabla de la UI de Fase 2.

## Conclusión (actualizada 2026-08-06, tras validación con 1120561339)

**El portal público queda DESCARTADO también para Fase 2.** Motivo (regla de
negocio): un aprendiz no debe inscribirse en un complementario en el que ya
estuvo. El flujo del operador (Usuario SENA -> Consultar Inscripciones) muestra
el HISTORIAL COMPLETO con estado por registro:

```
1120561339 | ENCONTRADO
  - SISTEMAS. | ficha 2074355 | Certificado
  - INGLES BASICO - NIVEL 1 | ficha 3273435 | Certificado
  - ANALISIS Y DESARROLLO DE SOFTWARE. | ficha 2923560 | Matriculado
  - ... (6 registros: Certificado / Matriculado / Cancelado Academico)
```

El portal público solo muestra las inscripciones ACTIVAS (Matriculado) y oculta
las terminadas (Certificado): con él, alguien que ya completó el complementario
aparecería como "libre" y la regla se rompería.

La UI de Fase 2 ya muestra y exporta el estado por registro, y el DTO
`RegistroInscripcionFicha.Estado` lo transporta.

## Hallazgo (sin cambios de código)

Portal público devuelve solo la lista de inscripciones activas:
programa, ficha, nivel, lugar, jornada. **NO devuelve** nombres/apellidos,
tipo (es entrada), NIS, ni el historial de estados.

## Plan de implementación (cuando se apruebe — ya sin el público)

1. Definir la regla de negocio exacta: ¿bloquea solo `Matriculado`, o también
   `Certificado` (ya completado)? (Pregunta para el negocio.)
2. Si se automatiza: clasificar NO_ENCONTRADO/ENCONTRADO considerando el
   `estado` de los registros según la regla (hoy devuelve todos los que
   coinciden con el programa y el operador decide visualmente).
3. Sin cambios de flujo: el operador (Usuario SENA) es la fuente correcta.

## Verificación pendiente

- Respuesta del portal con persona sin inscripciones: confirmar el mensaje
  exacto para clasificar NO_ENCONTRADO (ya no aplica: el público está
  descartado).


## Betowa (betowa.sena.edu.co) — probado 2026-08-06

`/consultar-inscripciones` es público (sin login) y usa la Server Action de
Next.js `getEnrollmentsByDocument` (HTTP directo, rápido, sin navegador).

Respuesta por documento:
```
1120571336 (TI) -> 1 enrollment: ORGANIZACION DE ARCHIVOS DE GESTION. ficha 3586901,
                   estadoInscripcion=PREINSCRITO, nivel CURSO ESPECIAL, jornada MIXTA
1120561339 (CC) -> enrollments=[] ("No se encontraron inscripciones")
```

**Limitación:** solo devuelve las inscripciones ACTIVAS de Betowa. Para
1120561339 (que en el operador de SofíaPlus tiene 6 registros, incl. varios
Certificado) Betowa responde vacío → **no sirve para la regla de negocio**
(no repetir complementarios ya cursados). Misma limitación que el portal
público de SofíaPlus.

**Útil para:** la validación de Fase 1 tipo Betowa (`validateUserDocument`,
ya implementada ~150 ms/doc: "¿existe cuenta?"), no para el historial.
