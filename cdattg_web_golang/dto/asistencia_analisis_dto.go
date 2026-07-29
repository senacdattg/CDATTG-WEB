package dto

// AsistenciaAnalisisResponse panel analítico de asistencia (bloques A, B y C).
type AsistenciaAnalisisResponse struct {
	FechaDesde string                    `json:"fecha_desde"`
	FechaHasta string                    `json:"fecha_hasta"`
	HoraToma   AnalisisHoraTomaSection   `json:"hora_toma"`
	Cumplimiento AnalisisCumplimientoSection `json:"cumplimiento"`
	DiaSemana  AnalisisDiaSemanaSection  `json:"dia_semana"`
}

// AnalisisHoraTomaSection bloque A: hora promedio de ingreso (primer registro) y salida (último registro) por sesión.
type AnalisisHoraTomaSection struct {
	PromedioHora           string                     `json:"promedio_hora"`
	PromedioMinutosDia     int                        `json:"promedio_minutos_dia"`
	PromedioHoraSalida     string                     `json:"promedio_hora_salida"`
	PromedioMinutosSalida  int                        `json:"promedio_minutos_salida"`
	TotalSesiones          int                        `json:"total_sesiones"`
	TotalDiasConSesion     int                        `json:"total_dias_con_sesion"`
	DetallePorFicha        []AnalisisHoraTomaPorFicha `json:"detalle_por_ficha"`
}

type AnalisisHoraTomaPorFicha struct {
	FichaID              uint   `json:"ficha_id"`
	FichaNumero          string `json:"ficha_numero"`
	ProgramaNombre       string `json:"programa_nombre"`
	JornadaNombre        string `json:"jornada_nombre"`
	FichaActiva          bool   `json:"ficha_activa"`
	PromedioHora         string `json:"promedio_hora"`
	PromedioHoraSalida   string `json:"promedio_hora_salida"`
	TotalSesiones        int    `json:"total_sesiones"`
	DiasConSesion        int    `json:"dias_con_sesion"`
}

// AnalisisRegistrosAprendizResponse historial de ingresos/salidas de aprendices en una ficha.
type AnalisisRegistrosAprendizResponse struct {
	FichaID        uint                           `json:"ficha_id"`
	FichaNumero    string                         `json:"ficha_numero"`
	ProgramaNombre string                         `json:"programa_nombre"`
	Aprendices     []AnalisisAprendizConRegistros `json:"aprendices"`
}

type AnalisisAprendizConRegistros struct {
	AprendizID      uint                       `json:"aprendiz_id"`
	NumeroDocumento string                     `json:"numero_documento"`
	NombreCompleto  string                     `json:"nombre_completo"`
	Registros       []AnalisisRegistroIngresoSalida `json:"registros"`
}

type AnalisisRegistroIngresoSalida struct {
	AsistenciaID uint    `json:"asistencia_id"`
	Fecha        string  `json:"fecha"`
	HoraIngreso  *string `json:"hora_ingreso"`
	HoraSalida   *string `json:"hora_salida"`
}

// AnalisisExplorarFichasResponse resultado de buscar fichas por número, programa o aprendiz.
type AnalisisExplorarFichasResponse struct {
	Query  string                      `json:"query"`
	Fichas []AnalisisFichaExplorarItem `json:"fichas"`
}

type AnalisisFichaExplorarItem struct {
	FichaID               uint   `json:"ficha_id"`
	FichaNumero           string `json:"ficha_numero"`
	ProgramaNombre        string `json:"programa_nombre"`
	SedeNombre            string `json:"sede_nombre"`
	JornadaNombre         string `json:"jornada_nombre"`
	ModalidadNombre       string `json:"modalidad_nombre"`
	InstructorNombre      string `json:"instructor_nombre"`
	AmbienteNombre        string `json:"ambiente_nombre"`
	CantidadAprendices    int    `json:"cantidad_aprendices"`
	Status                bool   `json:"status"`
	CoincidenciasAprendiz int    `json:"coincidencias_aprendiz"`
}

// AnalisisAprendicesFichaResponse listado de aprendices de una ficha para el panel.
type AnalisisAprendicesFichaResponse struct {
	FichaID        uint                        `json:"ficha_id"`
	FichaNumero    string                      `json:"ficha_numero"`
	ProgramaNombre string                      `json:"programa_nombre"`
	Aprendices     []AnalisisAprendizResumen   `json:"aprendices"`
}

type AnalisisAprendizResumen struct {
	AprendizID      uint   `json:"aprendiz_id"`
	NumeroDocumento string `json:"numero_documento"`
	NombreCompleto  string `json:"nombre_completo"`
	TotalRegistros  int    `json:"total_registros"`
}

// AnalisisCumplimientoSection bloque B: % días con sesión vs días programados por ficha.
type AnalisisCumplimientoSection struct {
	Items []AnalisisCumplimientoFicha `json:"items"`
}

type AnalisisCumplimientoFicha struct {
	FichaID          uint                        `json:"ficha_id"`
	FichaNumero      string                      `json:"ficha_numero"`
	ProgramaNombre   string                      `json:"programa_nombre"`
	JornadaNombre    string                      `json:"jornada_nombre"`
	SedeNombre       string                      `json:"sede_nombre"`
	DiasProgramados  int                         `json:"dias_programados"`
	DiasConSesion    int                         `json:"dias_con_sesion"`
	TotalSesiones    int                         `json:"total_sesiones"`
	PctCumplimiento  float64                     `json:"pct_cumplimiento"`
	ResumenDetalle   AnalisisCumplimientoResumen `json:"resumen_detalle"`
	DetalleDias      []AnalisisCumplimientoDia   `json:"detalle_dias"`
}

// AnalisisCumplimientoResumen contadores del detalle día a día (bloque B).
type AnalisisCumplimientoResumen struct {
	DiasCumplidos             int `json:"dias_cumplidos"`
	DiasSinToma               int `json:"dias_sin_toma"`
	SesionesFueraProgramacion int `json:"sesiones_fuera_programacion"`
}

// AnalisisCumplimientoDia detalle día a día para una ficha (bloque B).
type AnalisisCumplimientoDia struct {
	Fecha        string `json:"fecha"`
	DiaSemana    string `json:"dia_semana"`
	Programado   bool   `json:"programado"`
	TieneSesion  bool   `json:"tiene_sesion"`
}

// AnalisisDiaSemanaSection bloque C: asistencia de la semana anterior completa (lun–dom).
type AnalisisDiaSemanaSection struct {
	SemanaDesde       string                    `json:"semana_desde"`
	SemanaHasta       string                    `json:"semana_hasta"`
	PorDia            []AnalisisDiaSemanaFila   `json:"por_dia"`
	DiasMasAsistencia []AnalisisDiaRanking      `json:"dias_mas_asistencia"`
}

// AnalisisDiaSemanaFila una fila por fecha concreta y jornada dentro de la semana analizada.
type AnalisisDiaSemanaFila struct {
	Fecha         string  `json:"fecha"`
	DiaSemanaID   int     `json:"dia_semana_id"`
	DiaSemana     string  `json:"dia_semana"`
	JornadaNombre string  `json:"jornada_nombre"`
	Esperados     int     `json:"esperados"`
	Vinieron      int     `json:"vinieron"`
	Pct           float64 `json:"pct"`
}

type AnalisisDiaRanking struct {
	Fecha       string  `json:"fecha,omitempty"`
	DiaSemanaID int     `json:"dia_semana_id"`
	DiaSemana   string  `json:"dia_semana"`
	Vinieron    int     `json:"vinieron"`
	Pct         float64 `json:"pct"`
}
