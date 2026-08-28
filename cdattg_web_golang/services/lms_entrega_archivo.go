package services

import (
	"fmt"
	"mime/multipart"
	"os"
	"path"
	"time"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

var errEntregaSinArchivo = fmt.Errorf("adjunte al menos un archivo")

func guardarArchivosEntrega(
	repo repositories.LmsEntregaRepository,
	userID, fichaID, actividadID, aprendizID, entregaID uint,
	files []*multipart.FileHeader,
) error {
	if len(files) == 0 {
		return errEntregaSinArchivo
	}
	if len(files) > lmsMaxArchivos {
		return fmt.Errorf("máximo %d archivos por entrega", lmsMaxArchivos)
	}
	dir := RutaEntregaLMS(fichaID, actividadID, aprendizID)
	if err := os.MkdirAll(dir, 0o750); err != nil {
		return err
	}
	for i, header := range files {
		if err := guardarUnArchivoEntrega(repo, userID, entregaID, dir, i, header); err != nil {
			return err
		}
	}
	return nil
}

func guardarUnArchivoEntrega(
	repo repositories.LmsEntregaRepository,
	userID, entregaID uint,
	dir string,
	indice int,
	header *multipart.FileHeader,
) error {
	if header.Size > lmsMaxBytesArchivo {
		return fmt.Errorf("el archivo %s supera 10 MB", header.Filename)
	}
	src, err := header.Open()
	if err != nil {
		return err
	}
	defer src.Close()
	lector, errPdf := LectorPdfEntregaLMS(header.Filename, src)
	if errPdf != nil {
		return errPdf
	}
	nombre := fmt.Sprintf("%d_%d_%s", time.Now().UnixNano(), indice, SanitizarNombreCarpeta(header.Filename))
	ruta := path.Join(dir, nombre)
	if err := escribirArchivoLMS(ruta, lector); err != nil {
		return err
	}
	uid := userID
	row := &models.LmsEntregaArchivo{
		EntregaID:      entregaID,
		NombreOriginal: header.Filename,
		RutaRelativa:   ruta,
		Mime:           "application/pdf",
		Tamano:         header.Size,
	}
	row.UserCreateID = &uid
	return repo.CreateArchivo(row)
}
