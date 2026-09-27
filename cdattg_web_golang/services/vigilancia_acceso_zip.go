/**
 * Meto el Excel de portería en un ZIP para descargarlo antes de borrar.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"archive/zip"
	"bytes"
)

func zipConExcel(nombreArchivo string, xlsx []byte) ([]byte, error) {
	buf := new(bytes.Buffer)
	w := zip.NewWriter(buf)
	f, err := w.Create(nombreArchivo)
	if err != nil {
		return nil, err
	}
	if _, err := f.Write(xlsx); err != nil {
		return nil, err
	}
	if err := w.Close(); err != nil {
		return nil, err
	}
	return buf.Bytes(), nil
}
