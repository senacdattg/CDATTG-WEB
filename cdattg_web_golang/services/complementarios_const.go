/**
 * Textos fijos de Complementarios (FPI): roles Sofía y avisos al operador.
 *
 * Los saqué de complementarios_service.go porque Sonar marcaba el mismo
 * texto varias veces (roles Encargado / Usuario SENA y errores de lote/Excel).
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

const (
	msgDocumentoObligatorio     = "El número de documento es obligatorio."
	rolSofiaEncargadoIngreso    = "Encargado de ingreso centro formación"
	rolSofiaUsuarioSENA         = "Usuario SENA"
	msgLoteNoEncontrado         = "lote no encontrado o expirado"
	msgExcelSinDocumentos       = "el Excel no tiene documentos válidos (revisa la columna numero_documento)"
	msgExcelSinFilasInscripcion = "el Excel no tiene filas válidas (numero_documento y programa de formación)"
)
