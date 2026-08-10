package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/models"
)

func TestGetMisInasistencias_sinPersonaID(t *testing.T) {
	s := NewAsistenciaService()
	_, err := s.GetMisInasistencias(0, 30, nil, "activas", "")
	if err == nil {
		t.Fatal("expected error for personaID 0")
	}
	if err.Error() != errMsgAprendizActivoNoEncontrado {
		t.Fatalf("expected %q, got %q", errMsgAprendizActivoNoEncontrado, err.Error())
	}
}

func TestFiltrarMatriculasMisInasistencias(t *testing.T) {
	fichaActiva := &models.FichaCaracterizacion{Status: true, TipoFormacion: models.TipoFormacionRegular}
	fichaInactiva := &models.FichaCaracterizacion{Status: false, TipoFormacion: models.TipoFormacionComplementaria}
	list := []models.Aprendiz{
		{Estado: true, FichaCaracterizacion: fichaActiva},
		{Estado: false, FichaCaracterizacion: fichaActiva},
		{Estado: true, FichaCaracterizacion: fichaInactiva},
	}

	activas := filtrarMatriculasMisInasistencias(list, "activas", "")
	if len(activas) != 1 {
		t.Fatalf("activas: want 1, got %d", len(activas))
	}
	inactivas := filtrarMatriculasMisInasistencias(list, "inactivas", "")
	if len(inactivas) != 2 {
		t.Fatalf("inactivas: want 2, got %d", len(inactivas))
	}
	todas := filtrarMatriculasMisInasistencias(list, "todas", "")
	if len(todas) != 3 {
		t.Fatalf("todas: want 3, got %d", len(todas))
	}
	soloComplementaria := filtrarMatriculasMisInasistencias(list, "todas", models.TipoFormacionComplementaria)
	if len(soloComplementaria) != 1 {
		t.Fatalf("complementaria: want 1, got %d", len(soloComplementaria))
	}
}
