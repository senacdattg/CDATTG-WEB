package services

import (
	"testing"
	"time"
)

func fechaTest(s string) time.Time {
	t, err := time.Parse(time.DateOnly, s)
	if err != nil {
		panic(err)
	}
	return t
}

func TestDetectarRachaConsecutiva_dosFaltasSeguidas(t *testing.T) {
	t.Parallel()
	dias := []diaFormacionEstado{
		{Fecha: fechaTest("2026-08-10"), Falta: true},
		{Fecha: fechaTest("2026-08-11"), Falta: true},
	}
	got := detectarRachaConsecutiva(dias)
	if len(got.Fechas) != 2 || got.Fechas[0] != "2026-08-10" || got.Fechas[1] != "2026-08-11" {
		t.Fatalf("fechas=%v", got.Fechas)
	}
	if !got.Activa {
		t.Fatal("racha activa esperada (últimas 2 fechas son falta)")
	}
}

func TestDetectarRachaConsecutiva_asistenciaEnMedioCorta(t *testing.T) {
	t.Parallel()
	dias := []diaFormacionEstado{
		{Fecha: fechaTest("2026-08-10"), Falta: true},
		{Fecha: fechaTest("2026-08-11"), Falta: false},
		{Fecha: fechaTest("2026-08-12"), Falta: true},
	}
	got := detectarRachaConsecutiva(dias)
	if len(got.Fechas) != 0 {
		t.Fatalf("no debe alertar si la racha se corta, got %v", got.Fechas)
	}
}

func TestDetectarRachaConsecutiva_tresSeguidasYLuegoAsistio(t *testing.T) {
	t.Parallel()
	dias := []diaFormacionEstado{
		{Fecha: fechaTest("2026-08-08"), Falta: true},
		{Fecha: fechaTest("2026-08-09"), Falta: true},
		{Fecha: fechaTest("2026-08-10"), Falta: true},
		{Fecha: fechaTest("2026-08-11"), Falta: false},
	}
	got := detectarRachaConsecutiva(dias)
	if len(got.Fechas) != 3 {
		t.Fatalf("fechas=%v", got.Fechas)
	}
	if got.Activa {
		t.Fatal("no activa: la última fecha de formación no es falta")
	}
}

func TestFechasFormacionUnicas_colapsaInstructoresMismoDia(t *testing.T) {
	t.Parallel()
	slots := []sesionDiaBienestar{
		{Fecha: fechaTest("2026-08-10"), InstructorID: 1, AsistenciaIDs: []uint{10}},
		{Fecha: fechaTest("2026-08-10"), InstructorID: 2, AsistenciaIDs: []uint{11}},
		{Fecha: fechaTest("2026-08-11"), InstructorID: 1, AsistenciaIDs: []uint{12}},
	}
	fechas := fechasFormacionUnicas(slots)
	if len(fechas) != 2 {
		t.Fatalf("want 2 fechas, got %d", len(fechas))
	}
}

func TestAprendizFaltoElDia_asistioUnInstructorNoEsFalta(t *testing.T) {
	t.Parallel()
	slots := []sesionDiaBienestar{
		{Fecha: fechaTest("2026-08-10"), InstructorID: 1, AsistenciaIDs: []uint{10}},
		{Fecha: fechaTest("2026-08-10"), InstructorID: 2, AsistenciaIDs: []uint{11}},
	}
	asistio := map[uint]map[uint]bool{7: {11: true}}
	if aprendizFaltoElDia(7, slots, asistio, nil) {
		t.Fatal("si asistió a un instructor del día no es falta")
	}
}

func TestAprendizFaltoElDia_justificadaCorta(t *testing.T) {
	t.Parallel()
	slots := []sesionDiaBienestar{
		{Fecha: fechaTest("2026-08-10"), InstructorID: 1, AsistenciaIDs: []uint{10}},
	}
	justificada := map[uint]map[uint]bool{7: {10: true}}
	if aprendizFaltoElDia(7, slots, nil, justificada) {
		t.Fatal("justificada no cuenta como falta Acuerdo 009")
	}
}

func TestGetMisAlertasConsecutivas_sinPersonaID(t *testing.T) {
	s := NewAsistenciaService()
	_, err := s.GetMisAlertasConsecutivas(0, 30)
	if err == nil || err.Error() != errMsgAprendizActivoNoEncontrado {
		t.Fatalf("expected %q, got %v", errMsgAprendizActivoNoEncontrado, err)
	}
}

func TestEstadosFormacionAprendiz_casoEjemplo3406451(t *testing.T) {
	t.Parallel()
	const aprendizID uint = 99
	slots := []sesionDiaBienestar{
		{Fecha: fechaTest("2026-08-10"), InstructorID: 1, AsistenciaIDs: []uint{101}},
		{Fecha: fechaTest("2026-08-11"), InstructorID: 1, AsistenciaIDs: []uint{102}},
	}
	dias := estadosFormacionAprendiz(aprendizID, slots, nil, nil)
	racha := detectarRachaConsecutiva(dias)
	if len(racha.Fechas) != 2 || racha.Fechas[0] != "2026-08-10" || racha.Fechas[1] != "2026-08-11" {
		t.Fatalf("caso 1120565372: want 10 y 11 ago, got %v", racha.Fechas)
	}
}
