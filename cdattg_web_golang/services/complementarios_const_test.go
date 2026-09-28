/**
 * Compruebo que los avisos y roles de FPI están definidos una sola vez.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import "testing"

func TestComplementariosConstantesNoVacias(t *testing.T) {
	t.Parallel()
	if rolSofiaEncargadoIngreso == "" || rolSofiaUsuarioSENA == "" {
		t.Fatal("roles Sofía vacíos")
	}
	if msgLoteNoEncontrado == "" || msgExcelSinDocumentos == "" || msgExcelSinFilasInscripcion == "" {
		t.Fatal("mensajes de lote/Excel vacíos")
	}
}
