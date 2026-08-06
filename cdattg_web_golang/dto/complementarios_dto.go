package dto

// Módulo Complementarios (FPI): verificación de aspirantes en SofiaPlus.
// Primera versión: consulta individual de un documento.

// VerificarAspiranteRequest consulta individual: solo el número de documento.
// El tipo es opcional; si viene, se prueba primero ese y luego los demás.
type VerificarAspiranteRequest struct {
	NumeroDocumento string `json:"numero_documento" binding:"required"`
	TipoDocumento   string `json:"tipo_documento"` // opcional: código corto (CC, TI, CE, ...)
}

// Estados posibles del resultado de verificación.
const (
	VerificacionRegistrado   = "REGISTRADO"    // SofiaPlus lo encontró
	VerificacionNoRegistrado = "NO_REGISTRADO" // SofiaPlus respondió y no existe con ningún tipo
	VerificacionNoVerificado = "NO_VERIFICADO" // SofiaPlus falló / se cayó: hay que reintentar
)

// LoteDocumento una fila del Excel de carga masiva.
type LoteDocumento struct {
	NumeroDocumento string
	TipoDocumento   string // código corto opcional (CC, TI, ...)
}

// VerificarLoteResponse resultado de una verificación por Excel, con resumen.
type VerificarLoteResponse struct {
	Total         int                          `json:"total"`
	Registrados   int                          `json:"registrados"`
	NoRegistrados int                          `json:"no_registrados"`
	NoVerificados int                          `json:"no_verificados"`
	Resultados    []VerificarAspiranteResponse `json:"resultados"`
}

// GuardarCredencialSofiaRequest datos para registrar/actualizar el usuario SENA del operador.
type GuardarCredencialSofiaRequest struct {
	TipoDocumento string `json:"tipo_documento" binding:"required"`
	Usuario       string `json:"usuario" binding:"required"`
	Password      string `json:"password" binding:"required"`
	Rol           string `json:"rol"`
}

// CredencialSofiaEstadoResponse estado de la credencial del operador (nunca incluye la contraseña).
type CredencialSofiaEstadoResponse struct {
	Tiene         bool   `json:"tiene"`
	TipoDocumento string `json:"tipo_documento,omitempty"`
	Usuario       string `json:"usuario,omitempty"`
	Rol           string `json:"rol,omitempty"`
	ActualizadaEn string `json:"actualizada_en,omitempty"`
}

// VerificarAspiranteResponse resultado de la verificación de un aspirante.
type VerificarAspiranteResponse struct {
	NumeroDocumento string `json:"numero_documento"`
	Estado          string `json:"estado"`                    // REGISTRADO | NO_REGISTRADO | NO_VERIFICADO
	TipoEncontrado  string `json:"tipo_encontrado,omitempty"` // tipo de identificación con el que apareció
	Nombre          string `json:"nombre,omitempty"`          // nombre completo
	Nombres         string `json:"nombres,omitempty"`
	PrimerApellido  string `json:"primer_apellido,omitempty"`
	SegundoApellido string `json:"segundo_apellido,omitempty"`
	Detalle         string `json:"detalle,omitempty"` // texto adicional leído de la pantalla
	Mensaje         string `json:"mensaje,omitempty"` // mensaje para el usuario (ej. causa del NO_VERIFICADO)
}

// ConsultarInscripcionesRequest consulta por documento + nombre de programa (Usuario SENA).
type ConsultarInscripcionesRequest struct {
	NumeroDocumento string `json:"numero_documento" binding:"required"`
	Programa        string `json:"programa" binding:"required"`
	TipoDocumento   string `json:"tipo_documento"` // opcional: CC, TI, CE, ... o texto Sofia
}

// Estados del submódulo Consultar Inscripciones.
const (
	InscripcionEncontrado   = "ENCONTRADO"
	InscripcionNoEncontrado = "NO_ENCONTRADO"
	InscripcionNoVerificado = "NO_VERIFICADO"
)

// RegistroInscripcionFicha fila filtrada (ficha / programa / estado) desde Sofía.
type RegistroInscripcionFicha struct {
	Ficha    string `json:"ficha"`
	Programa string `json:"programa"`
	Estado   string `json:"estado"`
}

// ConsultarInscripcionesResponse resultado filtrado por programa en SofiaPlus.
type ConsultarInscripcionesResponse struct {
	NumeroDocumento    string                     `json:"numero_documento"`
	ProgramaConsultado string                     `json:"programa_consultado"`
	Estado             string                     `json:"estado"` // ENCONTRADO | NO_ENCONTRADO | NO_VERIFICADO
	TipoEncontrado     string                     `json:"tipo_encontrado,omitempty"`
	Registros          []RegistroInscripcionFicha `json:"registros"`
	Mensaje            string                     `json:"mensaje,omitempty"`
}

// LoteInscripcionFila fila del Excel de carga masiva (documento + programa).
type LoteInscripcionFila struct {
	NumeroDocumento string
	Programa        string
	TipoDocumento   string
}

// ConsultarInscripcionesLoteResponse resumen de carga masiva por programa.
type ConsultarInscripcionesLoteResponse struct {
	Total         int                              `json:"total"`
	Encontrados   int                              `json:"encontrados"`
	NoEncontrados int                              `json:"no_encontrados"`
	NoVerificados int                              `json:"no_verificados"`
	Resultados    []ConsultarInscripcionesResponse `json:"resultados"`
}
