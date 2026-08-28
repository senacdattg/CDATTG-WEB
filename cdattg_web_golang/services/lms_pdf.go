// Este archivo comprueba que la entrega sea un PDF de verdad (nombre y cabecera).
// Lo hice porque el aprendiz debe subir solo PDF y no un zip disfrazado.
// Lo usa guardarUnArchivoEntrega y servirArchivoLMS.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"bytes"
	"fmt"
	"io"
	"path/filepath"
	"strings"
)

var errSoloPdf = fmt.Errorf("la entrega solo admite PDF")
var errPdfInvalido = fmt.Errorf("el archivo no es un PDF válido")

// EsNombrePdfLMS indica si el nombre termina en .pdf (sin importar mayúsculas).
func EsNombrePdfLMS(nombre string) bool {
	return strings.ToLower(filepath.Ext(nombre)) == ".pdf"
}

// LectorPdfEntregaLMS exige extensión .pdf y la cabecera %PDF del archivo.
// Lo hice para que un .pdf falso (zip u office) no pase como entrega.
func LectorPdfEntregaLMS(nombre string, src io.Reader) (io.Reader, error) {
	if !EsNombrePdfLMS(nombre) {
		return nil, errSoloPdf
	}
	buf := make([]byte, 4)
	if _, err := io.ReadFull(src, buf); err != nil {
		return nil, errPdfInvalido
	}
	if !bytes.Equal(buf, []byte("%PDF")) {
		return nil, errPdfInvalido
	}
	return io.MultiReader(bytes.NewReader(buf), src), nil
}
