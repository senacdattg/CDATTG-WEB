package services

import (
	"fmt"
	"io"
	"mime/multipart"
	"os"
	"path"
	"path/filepath"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

const (
	lmsMaxArchivos     = 8
	lmsMaxBytesArchivo = 10 << 20
)

var lmsExtensionesOK = map[string]bool{
	".pdf": true, ".doc": true, ".docx": true, ".xls": true, ".xlsx": true,
	".ppt": true, ".pptx": true, ".odt": true, ".txt": true, ".zip": true,
	".png": true, ".jpg": true, ".jpeg": true, ".gif": true, ".webp": true,
}

// LmsExtensionPermitida indica si el adjunto es un documento o imagen seguro.
func LmsExtensionPermitida(nombre string) bool {
	ext := strings.ToLower(filepath.Ext(nombre))
	return lmsExtensionesOK[ext]
}

// errTopeArchivosLMS valida existentes + nuevos contra el máximo de la publicación.
func errTopeArchivosLMS(existentes, nuevos int) error {
	if nuevos == 0 {
		return nil
	}
	if existentes+nuevos > lmsMaxArchivos {
		return fmt.Errorf("máximo %d archivos por publicación", lmsMaxArchivos)
	}
	return nil
}

func guardarArchivosActividad(
	repo repositories.LmsActividadRepository,
	userID, fichaID, actividadID uint,
	files []*multipart.FileHeader,
) error {
	if len(files) == 0 {
		return nil
	}
	if len(files) > lmsMaxArchivos {
		return fmt.Errorf("máximo %d archivos por publicación", lmsMaxArchivos)
	}
	dir := RutaPublicacionLMS(fichaID, actividadID)
	if err := os.MkdirAll(dir, 0o750); err != nil {
		return err
	}
	for i, header := range files {
		if err := guardarUnArchivo(repo, userID, actividadID, dir, i, header); err != nil {
			return err
		}
	}
	return nil
}

func guardarUnArchivo(
	repo repositories.LmsActividadRepository,
	userID, actividadID uint,
	dir string,
	indice int,
	header *multipart.FileHeader,
) error {
	if header.Size > lmsMaxBytesArchivo {
		return fmt.Errorf("el archivo %s supera 10 MB", header.Filename)
	}
	if !LmsExtensionPermitida(header.Filename) {
		return fmt.Errorf("tipo de archivo no permitido: %s", header.Filename)
	}
	src, err := header.Open()
	if err != nil {
		return err
	}
	defer src.Close()
	nombre := fmt.Sprintf("%d_%d_%s", time.Now().UnixNano(), indice, SanitizarNombreCarpeta(header.Filename))
	ruta := path.Join(dir, nombre)
	if err := escribirArchivoLMS(ruta, src); err != nil {
		return err
	}
	uid := userID
	row := &models.LmsActividadArchivo{
		ActividadID:    actividadID,
		NombreOriginal: header.Filename,
		RutaRelativa:   ruta,
		Mime:           header.Header.Get("Content-Type"),
		Tamano:         header.Size,
	}
	row.UserCreateID = &uid
	return repo.CreateArchivo(row)
}

func escribirArchivoLMS(ruta string, src io.Reader) error {
	dst, err := os.OpenFile(ruta, os.O_CREATE|os.O_WRONLY|os.O_TRUNC, 0o640)
	if err != nil {
		return err
	}
	defer dst.Close()
	_, err = io.Copy(dst, io.LimitReader(src, lmsMaxBytesArchivo+1))
	return err
}
