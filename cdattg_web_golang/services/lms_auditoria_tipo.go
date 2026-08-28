// Este archivo lista las fichas de un tipo y lo que el aprendiz subió.
// Lo hice para revisar entregas dentro de regular, media técnica o complementaria.
// Lo usa el GET de tipo de auditoría.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"errors"
	"time"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func (s *lmsAuditoriaService) Tipo(userID, personaID uint, tipo string) (*dto.LmsAuditoriaTipoDetalle, error) {
	if !lmsTipoAuditoriaValido(tipo) {
		return nil, errors.New("tipo de formación inválido")
	}
	alcance, err := s.exigirAuditoria(userID)
	if err != nil {
		return nil, err
	}
	todas, err := s.carpetas.ListFichasByPersona(personaID)
	if err != nil {
		return nil, err
	}
	fichas := fichasDeTipo(todas, tipo, alcance.fichaIDs)
	items := make([]dto.LmsAuditoriaFichaItem, 0, len(fichas))
	for i := range fichas {
		items = append(items, s.itemFichaAuditoria(personaID, fichas[i]))
	}
	return &dto.LmsAuditoriaTipoDetalle{
		Tipo: tipo, NombreCarpeta: NombreCarpetaTipo(tipo), Fichas: items,
	}, nil
}

func fichasDeTipo(todas []models.LmsCarpetaFicha, tipo string, solo []uint) []models.LmsCarpetaFicha {
	ok := map[uint]struct{}{}
	for _, id := range solo {
		ok[id] = struct{}{}
	}
	out := make([]models.LmsCarpetaFicha, 0)
	for i := range todas {
		if todas[i].TipoFormacion != tipo {
			continue
		}
		if solo != nil {
			if _, hay := ok[todas[i].FichaID]; !hay {
				continue
			}
		}
		out = append(out, todas[i])
	}
	return out
}

func (s *lmsAuditoriaService) itemFichaAuditoria(personaID uint, carp models.LmsCarpetaFicha) dto.LmsAuditoriaFichaItem {
	item := dto.LmsAuditoriaFichaItem{
		FichaID: carp.FichaID, NumeroFicha: carp.NumeroFicha,
		NombrePrograma: carp.NombrePrograma, NombreCarpeta: carp.NombreCarpeta,
		Actividades: []dto.LmsAuditoriaActividadItem{},
	}
	ap, err := s.aprendices.FindByPersonaIDAndFichaID(personaID, carp.FichaID)
	if err != nil {
		return item
	}
	acts, err := s.actividades.FindByFichaID(carp.FichaID)
	if err != nil || len(acts) == 0 {
		return item
	}
	ids := make([]uint, len(acts))
	titulos := map[uint]string{}
	for i := range acts {
		ids[i] = acts[i].ID
		titulos[acts[i].ID] = acts[i].Titulo
	}
	ents, err := s.entregas.FindByAprendizYActividades(ap.ID, ids)
	if err != nil {
		return item
	}
	item.Actividades = mapEntregasAuditoria(carp.FichaID, ents, titulos)
	return item
}

func mapEntregasAuditoria(fichaID uint, ents []models.LmsEntrega, titulos map[uint]string) []dto.LmsAuditoriaActividadItem {
	out := make([]dto.LmsAuditoriaActividadItem, 0, len(ents))
	for i := range ents {
		if ents[i].EntregadoEn.IsZero() {
			continue
		}
		cuando := ents[i].EntregadoEn.UTC().Format(time.RFC3339)
		out = append(out, dto.LmsAuditoriaActividadItem{
			ActividadID: ents[i].ActividadID, FichaID: fichaID, EntregaID: ents[i].ID,
			Titulo: titulos[ents[i].ActividadID], EntregadoEn: cuando,
			Calificacion: ents[i].Calificacion, ComentarioInstructor: ents[i].ComentarioInstructor,
			Archivos: mapArchivosEntrega(ents[i]),
		})
	}
	return out
}
