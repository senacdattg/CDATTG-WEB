# Changelog

Todos los cambios notables de CDATTG Web se documentan en este archivo.

El formato se basa en [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/),
y este proyecto adhiere a [Semantic Versioning](https://semver.org/lang/es/).

Versión única del monorepo (frontend + API).

## Cómo versionar

1. `fix` → subir **parche** (`1.11.0` → `1.11.1`)
2. `feat` → subir **menor** (`1.11.0` → `1.12.0`)
3. Cambio incompatible / `BREAKING CHANGE` → subir **mayor** (`1.11.0` → `2.0.0`)
4. Actualizar en el mismo commit: `VERSION`, `cdattg_web_frontend/package.json`, `cdattg_web_golang/version/version.go` y esta entrada
5. Crear tag anotado `vX.Y.Z`

## [1.11.0] - 2026-07-28

### Added

- Panel analítico de asistencia (API y UI): detalle de cumplimiento, semana anterior, sesiones unificadas, filtros regional/sede, heatmap y columnas alineadas
- Alcance de casos de bienestar para instructor líder sobre sus fichas
- Metadatos SemVer del monorepo: `VERSION`, endpoint `GET /api/version`, versión visible en el sidebar

## [1.10.0] - 2026-07-07

### Added

- Asistencia efectiva, casos de bienestar con histórico e inasistencias justificadas
- Reporte de sesiones sin asistencia tomada (paginado)
- Periodo histórico completo en mis inasistencias (aprendiz)
- Edición de perfil propio para aprendiz (API y formulario)
- Select múltiple de sedes en días sin formación

## [1.9.0] - 2026-06-21

### Added

- Módulo de elecciones de representantes de aprendiz (API, migración, permisos, UI admin y votación)
- Centralización de locale y zona horaria Colombia (`formatFecha`)
- Stack Docker local con proxy `/api` y comandos make

## [1.8.0] - 2026-06-20

### Added

- Configuración global de asistencia administrable y auto-cierre por bloques
- Guard de roles coordinador en días sin formación
- Asignación de regionales a coordinadores
- Dashboard KPI (API resumen por rol + panel con gráficos y filtros)
- Layout AdminLTE: navbar, sidebar reorganizado y menú de usuario

## [1.7.0] - 2026-06-16

### Added

- Festivos Colombia y calendario de formación
- Traslado de instructor por día
- Días sin formación por sede
- Dashboard de asistencia con filtro por jornada, métricas alineadas e historial
- Casos de bienestar con detalle e informe PDF
- Calendario semanal y catálogo de fichas en asistencia

## [1.6.0] - 2026-06-09

### Added

- Plantillas de jornadas multi-bloque, CRUD admin y propagación a fichas
- Dashboard de asistencia: fichas con/sin sesión y KPI por jornada
- Horas programadas semanales y mensuales para instructor

## [1.5.0] - 2026-06-02

### Added

- UX móvil de asistencia, QR continuo, entrada/salida automática e inferida
- Exportación de historial por día, semana, mes y año
- Calendario de programación de instructor, agenda y RBAC
- Módulo SRP de casos de bienestar con filtros estilo fichas
- CRUD de tipos de observación para admin

## [1.4.0] - 2026-04-24

### Added

- Dashboard de asistencia con fichas sin sesión y rango de día local
- Observación por sesión y observaciones post-cierre (ventana de 5 días) desde historial

## [1.3.0] - 2026-03-19

### Added

- Tipos de observación predefinidos y pantalla de gestión
- Búsqueda y columna jornada en historial; navegación de fechas
- Filtros y paginación en dashboard de asistencia
- Modal de detalle de inasistencias por aprendiz en bienestar
- Ampliación de KPIs y segmentación operativa del dashboard

## [1.2.0] - 2026-03-13

### Added

- Infraestructura de sedes, bloques, pisos y ambientes (API y admin UI)
- Vigilancia y control de ambientes
- Branding con logo SENA
- Múltiples tramos entrada-salida por aprendiz en asistencia

## [1.1.0] - 2026-03-02

### Added

- Flujos de sesiones de asistencia y pendientes por revisar
- Dashboard de asistencia en tiempo real (WebSocket) para roles autorizados
- Casos de bienestar (consultas y pantallas iniciales)
- Dashboard general con contadores reales
- Login flexible por correo, documento o celular
- Perfil de usuario

## [1.0.0] - 2026-02-24

### Added

- Baseline del monorepo desde el primer commit: API Go (auth, Casbin, modelos, repositorios, servicios, handlers)
- Frontend React/Vite (Layout, Dashboard, Asistencia, Inventario, Permisos y módulos iniciales)
- Docker Compose, Postgres y configuración de despliegue
