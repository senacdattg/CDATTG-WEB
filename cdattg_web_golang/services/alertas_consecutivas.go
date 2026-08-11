package services

import (
	"sort"
	"time"

	"github.com/sena/cdattg-web-golang/repositories"
)

const minRachaInasistenciasConsecutivas = 2

// diaFormacionEstado una fecha de formación de la ficha (instructores del mismo día colapsados).
type diaFormacionEstado struct {
	Fecha time.Time
	Falta bool
}

// rachaConsecutivaResult racha más reciente de inasistencias sin justificar.
type rachaConsecutivaResult struct {
	Fechas []string
	Activa bool
}

func fechasFormacionUnicas(slots []sesionDiaBienestar) []time.Time {
	seen := make(map[string]time.Time, len(slots))
	for _, slot := range slots {
		k := slot.Fecha.Format(time.DateOnly)
		if _, ok := seen[k]; !ok {
			seen[k] = slot.Fecha
		}
	}
	out := make([]time.Time, 0, len(seen))
	for _, t := range seen {
		out = append(out, t)
	}
	sort.Slice(out, func(i, j int) bool {
		return out[i].Before(out[j])
	})
	return out
}

func slotsDelDia(slots []sesionDiaBienestar, fecha time.Time) []sesionDiaBienestar {
	key := fecha.Format(time.DateOnly)
	var out []sesionDiaBienestar
	for _, slot := range slots {
		if slot.Fecha.Format(time.DateOnly) == key {
			out = append(out, slot)
		}
	}
	return out
}

// aprendizFaltoElDia: no hubo asistencia efectiva en ninguna sesión del día
// y ninguna sesión está justificada.
func aprendizFaltoElDia(
	aprendizID uint,
	slotsDia []sesionDiaBienestar,
	asistio map[uint]map[uint]bool,
	justificada map[uint]map[uint]bool,
) bool {
	for _, slot := range slotsDia {
		if aprendizAsistioEnSlot(aprendizID, slot, asistio) {
			return false
		}
		if aprendizJustificadoEnSlot(aprendizID, slot, justificada) {
			return false
		}
	}
	return len(slotsDia) > 0
}

func estadosFormacionAprendiz(
	aprendizID uint,
	slots []sesionDiaBienestar,
	asistio map[uint]map[uint]bool,
	justificada map[uint]map[uint]bool,
) []diaFormacionEstado {
	fechas := fechasFormacionUnicas(slots)
	out := make([]diaFormacionEstado, 0, len(fechas))
	for _, fecha := range fechas {
		out = append(out, diaFormacionEstado{
			Fecha: fecha,
			Falta: aprendizFaltoElDia(aprendizID, slotsDelDia(slots, fecha), asistio, justificada),
		})
	}
	return out
}

func detectarRachaConsecutiva(dias []diaFormacionEstado) rachaConsecutivaResult {
	bestStart, bestEnd := -1, -1
	i := 0
	for i < len(dias) {
		if !dias[i].Falta {
			i++
			continue
		}
		j := i
		for j < len(dias) && dias[j].Falta {
			j++
		}
		if j-i >= minRachaInasistenciasConsecutivas {
			bestStart, bestEnd = i, j
		}
		i = j
	}
	if bestStart < 0 {
		return rachaConsecutivaResult{}
	}
	fechas := make([]string, 0, bestEnd-bestStart)
	for k := bestStart; k < bestEnd; k++ {
		fechas = append(fechas, dias[k].Fecha.Format(time.DateOnly))
	}
	activa := len(dias) >= minRachaInasistenciasConsecutivas &&
		dias[len(dias)-1].Falta &&
		dias[len(dias)-2].Falta
	return rachaConsecutivaResult{Fechas: fechas, Activa: activa}
}

// AlertaConsecutivaRow aprendiz con 2+ inasistencias seguidas (Acuerdo 009).
type AlertaConsecutivaRow struct {
	AprendizID       uint
	PersonaNombre    string
	NumeroDocumento  string
	FichaNumero      string
	ProgramaNombre   string
	SedeNombre       string
	JornadaNombre    string
	TipoFormacion    string
	InstructorNombre string
	AmbienteNombre   string
	ModalidadNombre  string
	FechasRacha      []string
	RachaActiva      bool
}

func alertaDesdeRacha(ap repositories.AprendizCasosBienestarRaw, racha rachaConsecutivaResult) AlertaConsecutivaRow {
	return AlertaConsecutivaRow{
		AprendizID:       ap.AprendizID,
		PersonaNombre:    ap.PersonaNombre,
		NumeroDocumento:  ap.NumeroDocumento,
		FichaNumero:      ap.FichaNumero,
		ProgramaNombre:   ap.ProgramaNombre,
		SedeNombre:       ap.SedeNombre,
		JornadaNombre:    ap.JornadaNombre,
		TipoFormacion:    ap.TipoFormacion,
		InstructorNombre: ap.InstructorNombre,
		AmbienteNombre:   ap.AmbienteNombre,
		ModalidadNombre:  ap.ModalidadNombre,
		FechasRacha:      racha.Fechas,
		RachaActiva:      racha.Activa,
	}
}

func (c *CasosBienestarCalculator) CalcularAlertasConsecutivas(
	sedeID *uint,
	instructorLiderID *uint,
	fechaInicio, fechaFin string,
	soloAprendizIDs map[uint]struct{},
) ([]AlertaConsecutivaRow, error) {
	prep, err := c.prepararRango(sedeID, instructorLiderID, fechaInicio, fechaFin)
	if err != nil {
		return nil, err
	}
	aprendices, err := c.repo.ListAprendicesActivosCasosBienestar(sedeID, instructorLiderID)
	if err != nil {
		return nil, err
	}
	var out []AlertaConsecutivaRow
	for _, ap := range aprendices {
		if soloAprendizIDs != nil {
			if _, ok := soloAprendizIDs[ap.AprendizID]; !ok {
				continue
			}
		}
		dias := estadosFormacionAprendiz(ap.AprendizID, prep.slotsPorFicha[ap.FichaID], prep.asistio, prep.justificada)
		racha := detectarRachaConsecutiva(dias)
		if len(racha.Fechas) < minRachaInasistenciasConsecutivas {
			continue
		}
		out = append(out, alertaDesdeRacha(ap, racha))
	}
	sort.Slice(out, func(i, j int) bool {
		if out[i].FichaNumero != out[j].FichaNumero {
			return out[i].FichaNumero < out[j].FichaNumero
		}
		return out[i].PersonaNombre < out[j].PersonaNombre
	})
	return out, nil
}
