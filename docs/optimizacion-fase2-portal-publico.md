# Propuesta: Fase 2 (inscripciones) por el portal público de SofíaPlus

> **Estado: PROPUESTA — no implementada.** Validada con datos reales el
> 2026-08-06. Fase 1 NO es candidata (ver "Limitaciones").

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

## Limitaciones

- **Fase 1 no es candidata**: la tabla de resultados necesita Tipo/Nombres/
  Apellidos, que solo entrega el "Consultar Registro" del operador (con login).
  El portal público responde "está inscrito", no "está registrado" (una persona
  podría estar registrada sin inscripciones activas).
- Semántica de estado: en el flujo público "sin inscripciones" ≈ NO_ENCONTRADO;
  hay que validar la regla de negocio antes de adoptarlo.
- Ritmo razonable: es un servicio público del SENA; no martillar.

## Plan de implementación (cuando se apruebe)

1. Nuevo módulo en el scraper (p. ej. `app/publico_scraper.py`): GET de la
   página pública → llenar tipo+número → submit → parsear lista de inscripciones
   (reutilizar el parseo/`RegistroInscripcionFicha`).
2. `consultar_inscripciones_lote`: probar el flujo público primero; si falla o
   devuelve error, **fallback automático** al flujo actual del operador (ya
   paralelo).
3. Paralelismo agresivo para el público (headless + sin sesión): 8-10 workers.
4. Sin cambios en Fase 1 ni en el frontend (el DTO y la tabla ya cubren los
   campos del portal).

## Verificación pendiente

- Respuesta del portal con persona sin inscripciones: confirmar el mensaje
  exacto para clasificar NO_ENCONTRADO.
- Estabilidad bajo carga (lote de 20 real).
