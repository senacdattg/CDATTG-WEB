package services

import (
	"strings"
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

type stubAsistenciaRepoFinalizar struct {
	sesion *models.Asistencia
}

func (s *stubAsistenciaRepoFinalizar) Create(*models.Asistencia) error { return nil }
func (s *stubAsistenciaRepoFinalizar) FindByID(id uint) (*models.Asistencia, error) {
	if s.sesion != nil && s.sesion.ID == id {
		return s.sesion, nil
	}
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) FindByInstructorFichaID(uint) ([]models.Asistencia, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) FindActivaByInstructorFichaID(uint) (*models.Asistencia, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) FindByInstructorFichaIDAndFecha(uint, time.Time) (*models.Asistencia, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) FindActivaByFichaID(uint) (*models.Asistencia, error) { return nil, nil }
func (s *stubAsistenciaRepoFinalizar) FindByFichaIDAndFechas(uint, string, string) ([]models.Asistencia, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) FindIDsByFichaIDAndFecha(uint, string) ([]uint, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) Update(a *models.Asistencia) error {
	if s.sesion != nil && s.sesion.ID == a.ID {
		s.sesion = a
	}
	return nil
}
func (s *stubAsistenciaRepoFinalizar) GetDashboardResumen(*uint, string) (int, []repositories.DashboardFichaRow, error) {
	return 0, nil, nil
}
func (s *stubAsistenciaRepoFinalizar) GetFichasSinSesionHoy(*uint, string) ([]repositories.DashboardFichaSinSesionRow, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) CountPendientesRevisionByFecha(*uint, string) (int, error) {
	return 0, nil
}
func (s *stubAsistenciaRepoFinalizar) ListSesionesCasosBienestarEnRango(*uint, string, string) ([]repositories.SesionCasosBienestarRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) ListAprendicesActivosCasosBienestar(*uint) ([]repositories.AprendizCasosBienestarRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) ListAsistenciasEfectivasEnSesiones([]uint) ([]repositories.AsistenciaEfectivaRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) ListInasistenciasJustificadasEnSesiones([]uint) ([]repositories.InasistenciaJustificadaRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) ListDetalleSesionesCasosBienestar(string, uint, string, string, string) ([]repositories.DetalleSesionCasosBienestarRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) ListSesionesSinAsistenciaTomadaEnRango([]uint, string, string) ([]repositories.SesionSinAsistenciaTomadaRow, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) ListAsignacionesInstructorFichaActivas([]uint) ([]repositories.AsignacionInstructorFichaReporteRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) ListClavesSesionInstructorFichaEnRango([]uint, string, string) ([]repositories.ClaveSesionInstructorFichaRaw, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) MinFechaAsistencia(*uint) (time.Time, bool, error) {
	return time.Time{}, false, nil
}
func (s *stubAsistenciaRepoFinalizar) FindSesionesNoFinalizadasDesde(string) ([]models.Asistencia, error) {
	return nil, nil
}
func (s *stubAsistenciaRepoFinalizar) GetPendientesRevisionPorInstructor(*uint, string, string) ([]repositories.PendienteInstructorRow, error) {
	return nil, nil
}

type stubAsistenciaAprendizRepoFinalizar struct{}

func (s *stubAsistenciaAprendizRepoFinalizar) Create(*models.AsistenciaAprendiz) error { return nil }
func (s *stubAsistenciaAprendizRepoFinalizar) CreateIngresoIdempotente(a *models.AsistenciaAprendiz) (*models.AsistenciaAprendiz, bool, error) {
	return a, true, nil
}
func (s *stubAsistenciaAprendizRepoFinalizar) FindByID(uint) (*models.AsistenciaAprendiz, error) {
	return nil, nil
}
func (s *stubAsistenciaAprendizRepoFinalizar) Update(*models.AsistenciaAprendiz) error { return nil }
func (s *stubAsistenciaAprendizRepoFinalizar) FindByAsistenciaID(uint) ([]models.AsistenciaAprendiz, error) {
	return nil, nil
}
func (s *stubAsistenciaAprendizRepoFinalizar) FindByAsistenciaIDAndAprendizID(uint, uint) (*models.AsistenciaAprendiz, error) {
	return nil, nil
}
func (s *stubAsistenciaAprendizRepoFinalizar) FindOpenByAsistenciaIDAndAprendizID(uint, uint) (*models.AsistenciaAprendiz, error) {
	return nil, nil
}
func (s *stubAsistenciaAprendizRepoFinalizar) FindLastByAsistenciaIDAndAprendizID(uint, uint) (*models.AsistenciaAprendiz, error) {
	return nil, nil
}
func (s *stubAsistenciaAprendizRepoFinalizar) FindEntryWithoutExitByAprendizIDAndAsistenciaIDs(uint, []uint) (*models.AsistenciaAprendiz, error) {
	return nil, nil
}
func (s *stubAsistenciaAprendizRepoFinalizar) FindEntryWithExitByAprendizIDAndAsistenciaIDs(uint, []uint) (*models.AsistenciaAprendiz, error) {
	return nil, nil
}
func (s *stubAsistenciaAprendizRepoFinalizar) FindPendientesRevisionByInstructorAndFecha(uint, string) ([]models.AsistenciaAprendiz, error) {
	return nil, nil
}
func (s *stubAsistenciaAprendizRepoFinalizar) ReplaceTiposObservacion(*models.AsistenciaAprendiz, []models.TipoObservacionAsistencia) error {
	return nil
}
func (s *stubAsistenciaAprendizRepoFinalizar) Delete(uint) error { return nil }

func sesionAbiertaTest(id, instructorFichaID uint, aprendices []models.AsistenciaAprendiz) *models.Asistencia {
	now := time.Now()
	fecha := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())
	return &models.Asistencia{
		UserAuditModel:       models.UserAuditModel{BaseModel: models.BaseModel{ID: id}},
		InstructorFichaID:    instructorFichaID,
		Fecha:                fecha,
		IsFinished:           false,
		AsistenciaAprendices: aprendices,
	}
}

func TestFinalizarSesionManual_RechazaSinIngresos(t *testing.T) {
	repo := &stubAsistenciaRepoFinalizar{
		sesion: sesionAbiertaTest(1, 10, nil),
	}
	svc := &asistenciaService{repo: repo, repoAA: &stubAsistenciaAprendizRepoFinalizar{}}
	ifcID := uint(10)

	_, err := svc.FinalizarSesionManual(1, &ifcID)
	if err == nil {
		t.Fatal("esperaba error sin ingresos")
	}
	if !strings.Contains(err.Error(), errMsgSinIngresoParaFinalizar) {
		t.Fatalf("error inesperado: %v", err)
	}
}

func TestFinalizarSesionManual_RechazaOtroInstructor(t *testing.T) {
	now := time.Now()
	repo := &stubAsistenciaRepoFinalizar{
		sesion: sesionAbiertaTest(1, 10, []models.AsistenciaAprendiz{
			{HoraIngreso: &now},
		}),
	}
	svc := &asistenciaService{repo: repo, repoAA: &stubAsistenciaAprendizRepoFinalizar{}}
	otro := uint(99)

	_, err := svc.FinalizarSesionManual(1, &otro)
	if err == nil {
		t.Fatal("esperaba error de instructor ajeno")
	}
}

func TestFinalizarSesionManual_FinalizaConIngreso(t *testing.T) {
	now := time.Now()
	repo := &stubAsistenciaRepoFinalizar{
		sesion: sesionAbiertaTest(1, 10, []models.AsistenciaAprendiz{
			{HoraIngreso: &now},
		}),
	}
	svc := &asistenciaService{repo: repo, repoAA: &stubAsistenciaAprendizRepoFinalizar{}}
	ifcID := uint(10)

	resp, err := svc.FinalizarSesionManual(1, &ifcID)
	if err != nil {
		t.Fatalf("no esperaba error: %v", err)
	}
	if resp == nil || !resp.IsFinished {
		t.Fatalf("sesión debería quedar finalizada: %+v", resp)
	}
}
