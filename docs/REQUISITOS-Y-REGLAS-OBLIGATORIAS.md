# REQUISITOS Y REGLAS OBLIGATORIAS PARA EL DESARROLLO DEL SISTEMA

Texto vigente (incluye lo original y los cambios acordados: documentación en primera persona, autor en cabecera, commits con cuerpo, sin fecha `@created`).

---

## 1. Tamaño y estructura de archivos

Cada archivo debe tener un máximo de **150 líneas** (código + comentarios + líneas en blanco). Si un archivo supera este límite, debe dividirse en módulos más pequeños y especializados. Cada clase, función o módulo debe tener una única responsabilidad, aplicando el principio S de SOLID.

## 2. Reutilización de código (DRY)

Está prohibido duplicar código: toda lógica repetida debe extraerse a funciones, hooks, mixins o clases base reutilizables. Se debe priorizar composición sobre herencia. Se deben crear librerías internas o archivos utils para validaciones, formateo, cálculos y helpers. Antes de escribir código nuevo, se debe buscar si ya existe una solución similar que pueda adaptarse o extenderse.

## 3. Principios SOLID (mínimo la S)

S – Single Responsibility: cada archivo, clase o módulo debe tener UNA y solo UNA razón para cambiar. Aplicar también O, L, I y D cuando aplique.

## 4. Código documentado (versión actual)

Quien abra el archivo debe entenderlo como si lo hubiera escrito el autor. Palabras fáciles, concretas, no técnicas de más.

### Cabecera de archivo (obligatoria)

En **primera persona**. Debe decir:

- qué es este archivo
- por qué lo hice (el problema que había)
- dónde lo uso y con qué se relaciona
- `@author` = `Cristian Deysdayr Jiménez`
- **No** usar `@created` (no poner fecha de creación)

### Funciones

Toda función o método debe tener JSDoc o JavaDoc en primera persona y fácil de leer: qué hace, parámetros con tipos, valor de retorno. Si es compleja, un `@example`.

### Cada bloque de código

Un comentario encima que diga qué hace, por qué está y con qué va. Varias líneas de la misma idea = un comentario. Prohibido el comentario que solo traduce la sintaxis (`i++ // suma 1`).

Cómo escribirlo:

- Primera persona: “Lo hice porque…”, “Lo pongo en…”
- Palabras simples (luna, sol, botón, guardar)
- Concreto: nombres reales (PortalLayout, Iniciar sesión), no frases vacías
- No cambiar lo que ya funciona: al documentar, solo comentarios

Cómo aplicarlo: un archivo a la vez, salvo que se pida más. Ejemplo acordado: `ThemeToggle.tsx`.

Los comentarios cuentan para el límite de 150 líneas. Si se pasa, partir el archivo.

## 5. SonarQube (umbrales mínimos)

- Coverage ≥ 80%
- Duplications ≤ 3%
- Hotspots revisados 100%
- Security: 0 críticos y 0 altos
- Reliability: 0 bugs
- Maintainability: deuda técnica ≤ 5%

No dar por cerrado un cambio con issues de Sonar abiertos.

## 6. Pruebas automatizadas

Cada módulo nuevo o cambiado debe tener pruebas unitarias (Jest, Vitest, testing, PyTest u equivalente). Cubrir caminos felices, bordes y errores. Mocks para APIs, bases de datos, servicios y cualquier I/O externo. Generar las pruebas junto con el código.

## 7. Control de versiones (commits)

### Formato

Estructura: `tipo(ámbito): descripción corta`

Línea en blanco y luego el **cuerpo**: qué se hizo y por qué.

Tipos: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`.

### Reglas del asunto

- Atómico: **una sola cosa** por commit
- No agrupar: un commit es un cambio; si hay rutas, van en ese commit
- Asunto ≤ 50 caracteres
- Imperativo (“agregar”, “corregir”, no “agregué”)
- Sin punto final
- Cuerpo ≤ 72 caracteres por línea
- Issues: `Closes #123` / `Fixes #456` / `Refs #789` cuando aplique

### Ejemplo

```text
feat(scraper): extraer certificados SofíaPlus

Se implementa el fetcher autenticado para JOSSO.
Incluye sesión y screenshots de diagnóstico.

Closes #15
```

### Autor

El autor visible del commit es solo `git config user.name` (**CRANDEYS**).

En la cabecera del **archivo** el `@author` es **Cristian Deysdayr Jiménez**.

No cambiar `git config`. No usar `--author` de agente. No usar `--trailer`.

### Prohibido en el commit

- “autorizado por”, Authorized-by, Co-authored-by, Signed-off-by
- Made-with, Generated-by, Cursor u otra atribución de IA
- “fix: arreglé algo”
- Mezclar feat + fix + docs en el mismo commit
- Commitear si no lo pide el usuario
- Subir código que no compile o no pase pruebas
- Saltar hooks (`--no-verify`)

### Ramas

Ramas feature: `feature/nombre` **desde `develop`**, no desde `main`.

## 8. Seguridad

Nunca hardcodear credenciales, tokens o claves. Solo variables de entorno. Validar y sanitizar toda entrada de usuario (XSS, inyección). HTTPS, JWT con expiración y CORS correcto cuando aplique. Resolver hotspots de seguridad de SonarQube antes de deploy.

## 9. Mantenibilidad

Logs estructurados JSON con niveles info/warn/error. Manejador global de errores. Configuración en `.env`. README vivo. Refactors continuos.

## 10. Uso de IA

No alucinar: revisar, probar y validar contra el código real. No inventar APIs, archivos o comportamiento. IA como asistente. Generar pruebas con el código. Sugerir SOLID, eliminar duplicación y proponer diseño **antes** de codificar.

## 11. Proceso

1. Definir requerimiento y contexto.
2. Proponer diseño SOLID/DRY antes de codificar.
3. Implementar con ≤150 líneas, SRP, DRY, cabecera, JSDoc, comentarios de cada bloque y pruebas.
4. Ejecutar o revisar SonarQube y corregir issues.
5. Probar la funcionalidad.
6. Commit semántico **solo si el usuario lo pide**.
7. Pull request.

## 12. Ejemplo de cabecera y comentarios (estilo actual)

```js
/**
 * Este archivo calcula el IVA de una venta.
 * Lo hice para no repetir la fórmula en cada pantalla de pagos.
 * Lo uso en el módulo de facturación.
 * @author Cristian Deysdayr Jiménez
 */

/**
 * Saco el valor del IVA a partir del monto y el porcentaje.
 * @param {number} monto - Plata sin impuesto
 * @param {number} tasa - Porcentaje (19 es el 19%)
 * @returns {number} Plata del impuesto
 * @example
 * calcularIVA(1000, 19) // 190
 */
function calcularIVA(monto, tasa) {
  // Si me pasan un número negativo, paro: no tiene sentido cobrar IVA así.
  if (monto < 0 || tasa < 0) {
    throw new Error('Monto y tasa deben ser positivos');
  }
  // Fórmula del IVA: monto por porcentaje, dividido en 100.
  return (monto * tasa) / 100;
}

module.exports = { calcularIVA };
```

---

## Cambios respecto al texto original

| Tema | Antes | Ahora |
|------|--------|--------|
| Autor en cabecera | `git config user.name` (CRANDEYS) | `Cristian Deysdayr Jiménez` |
| Fecha | `@created` | No se pone `@created` |
| Comentarios | Solo lo no obvio | Cada bloque: qué, por qué, con qué va |
| Tono | Técnico / tercera persona | Primera persona, palabras fáciles, concreto |
| Cómo documentar | De golpe | Un archivo a la vez, sin romper lo que funciona |
| Commits | Asunto semántico | Asunto + cuerpo (qué y por qué); commitear solo si se pide |
