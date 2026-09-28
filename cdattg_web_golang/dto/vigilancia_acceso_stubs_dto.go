/**
 * Personas de portería que solo tienen documento, sin nombre.
 *
 * @author Cristian Deysdayr Jiménez
 */
package dto

type AccesoStubItem struct {
	ID               uint   `json:"id"`
	NumeroDocumento  string `json:"numero_documento"`
}

type AccesoStubsListaResponse struct {
	Items    []AccesoStubItem `json:"items"`
	Total    int64            `json:"total"`
	Page     int              `json:"page"`
	PageSize int              `json:"page_size"`
}

type AccesoBorrarStubsRequest struct {
	IDs        []uint `json:"ids"`
	Confirmado bool   `json:"confirmado"`
}

type AccesoBorrarStubsResponse struct {
	Eliminados int `json:"eliminados"`
}
