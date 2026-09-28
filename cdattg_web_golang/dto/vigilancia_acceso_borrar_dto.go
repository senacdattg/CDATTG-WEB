/**
 * Petición para borrar visitas de portería, no personas.
 *
 * @author Cristian Deysdayr Jiménez
 */
package dto

// AccesoBorrarRequest borra visitas del rango. Las dos frases deben coincidir.
type AccesoBorrarRequest struct {
	RegionalID     *uint  `json:"regional_id"`
	SedeID         *uint  `json:"sede_id"`
	FechaDesde     string `json:"fecha_desde"`
	FechaHasta     string `json:"fecha_hasta"`
	DescargaOk     bool   `json:"descarga_ok"`
	Confirmacion1  string `json:"confirmacion_1"`
	Confirmacion2  string `json:"confirmacion_2"`
}

// AccesoBorrarResponse dice cuántas visitas se quitaron.
type AccesoBorrarResponse struct {
	Eliminados int64 `json:"eliminados"`
}

func (r AccesoBorrarRequest) AFiltros() AccesoHistorialFiltros {
	return AccesoHistorialFiltros{
		RegionalID: r.RegionalID,
		SedeID:     r.SedeID,
		FechaDesde: r.FechaDesde,
		FechaHasta: r.FechaHasta,
	}
}
