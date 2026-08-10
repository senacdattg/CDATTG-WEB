package repositories

// SQL expression: título de ficha (programa de catálogo o nombre libre MT/FC).
// Requiere alias fc = fichas_caracterizacion y pf = programas_formacion (LEFT JOIN).
const sqlProgramaNombreFicha = `COALESCE(NULLIF(BTRIM(pf.nombre), ''), NULLIF(BTRIM(fc.nombre), ''), '')`
