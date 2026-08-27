package services

import (
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func mapFichaAAulaItem(f models.FichaCaracterizacion, cantidad int, puedePublicar bool) dto.LmsAulaListItem {
	tipo := f.TipoFormacion
	if tipo == "" {
		tipo = models.TipoFormacionRegular
	}
	return dto.LmsAulaListItem{
		FichaID:                  f.ID,
		NumeroFicha:              f.Ficha,
		NombrePrograma:           models.NombreProgramaDisplay(&f),
		TipoFormacion:            tipo,
		PuedePublicar:            puedePublicar,
		CantidadAprendices:       cantidad,
		InstructorNombre:         lmsNombreInstructor(f),
		SedeNombre:               nombreSedeFicha(f),
		AmbienteNombre:           lmsNombreAmbiente(f),
		JornadaNombre:            nombreJornadaFicha(f),
		ModalidadFormacionNombre: lmsNombreModalidad(f),
		Status:                   f.Status,
	}
}

func lmsNombreInstructor(f models.FichaCaracterizacion) string {
	if f.Instructor == nil {
		return ""
	}
	if f.Instructor.Persona != nil {
		return f.Instructor.Persona.GetFullName()
	}
	return f.Instructor.NombreCompletoCache
}

func lmsNombreAmbiente(f models.FichaCaracterizacion) string {
	if f.Ambiente == nil {
		return ""
	}
	return f.Ambiente.Nombre
}

func lmsNombreModalidad(f models.FichaCaracterizacion) string {
	if f.ModalidadFormacion == nil {
		return ""
	}
	return f.ModalidadFormacion.Nombre
}

func mapAprendicesAula(list []models.Aprendiz) []dto.LmsAulaAprendiz {
	out := make([]dto.LmsAulaAprendiz, 0, len(list))
	for i := range list {
		nombre, doc := "", ""
		if list[i].Persona != nil {
			nombre = list[i].Persona.GetFullName()
			doc = list[i].Persona.NumeroDocumento
		}
		out = append(out, dto.LmsAulaAprendiz{
			ID:                 list[i].ID,
			PersonaID:          list[i].PersonaID,
			Nombre:             nombre,
			Documento:          doc,
			Estado:             list[i].Estado,
			OcultoEnAsistencia: list[i].OcultoEnAsistencia,
		})
	}
	return out
}

func mapActividadesAula(list []models.LmsActividad, nombres map[uint]string) []dto.LmsActividadItem {
	out := make([]dto.LmsActividadItem, 0, len(list))
	for i := range list {
		out = append(out, mapActividadAula(list[i], nombres))
	}
	return out
}

func mapActividadAula(a models.LmsActividad, nombres map[uint]string) dto.LmsActividadItem {
	archivos := make([]dto.LmsArchivoItem, 0, len(a.Archivos))
	for i := range a.Archivos {
		archivos = append(archivos, dto.LmsArchivoItem{
			ID:     a.Archivos[i].ID,
			Nombre: a.Archivos[i].NombreOriginal,
			Tamano: a.Archivos[i].Tamano,
		})
	}
	creador := ""
	if a.UserCreateID != nil {
		creador = nombres[*a.UserCreateID]
	}
	return dto.LmsActividadItem{
		ID:               a.ID,
		Tipo:             a.Tipo,
		Titulo:           a.Titulo,
		Cuerpo:           a.Cuerpo,
		HabilitaCarga:    a.HabilitaCarga,
		CalificacionMax:  a.CalificacionMax,
		PlazoEntrega:     a.PlazoEntrega,
		CreadoEn:         a.CreatedAt.UTC().Format(time.RFC3339),
		InstructorNombre: creador,
		Archivos:         archivos,
	}
}
