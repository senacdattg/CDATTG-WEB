/**
 * Borro solo visitas de portería. Lo hice para limpiar el historial
 * sin quitar a la persona del sistema.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
)

const fraseBorrarAcceso = "ELIMINAR"

func validarBorrarAcceso(req dto.AccesoBorrarRequest) error {
	if !req.DescargaOk {
		return errors.New("debe descargar el respaldo ZIP antes de eliminar")
	}
	if req.Confirmacion1 != fraseBorrarAcceso || req.Confirmacion2 != fraseBorrarAcceso {
		return errors.New("escriba ELIMINAR en las dos confirmaciones")
	}
	if strings.TrimSpace(req.FechaDesde) == "" && strings.TrimSpace(req.FechaHasta) == "" {
		return errors.New("indique al menos una fecha")
	}
	return nil
}

// ZipExcelAccesos arma el ZIP con un Excel de las visitas del filtro.
func (s *vigilanciaAccesoService) ZipExcelAccesos(f dto.AccesoHistorialFiltros) ([]byte, error) {
	q, err := s.toRepoQuery(f)
	if err != nil {
		return nil, err
	}
	rows, err := s.accesoRepo.ListTodosHistorial(q)
	if err != nil {
		return nil, err
	}
	xlsx, err := excelDeVisitasAcceso(rows)
	if err != nil {
		return nil, err
	}
	return zipConExcel("registros-acceso.xlsx", xlsx)
}

// BorrarAccesos quita visitas del rango. No toca la tabla de personas.
func (s *vigilanciaAccesoService) BorrarAccesos(req dto.AccesoBorrarRequest) (*dto.AccesoBorrarResponse, error) {
	if err := validarBorrarAcceso(req); err != nil {
		return nil, err
	}
	q, err := s.toRepoQuery(req.AFiltros())
	if err != nil {
		return nil, err
	}
	n, err := s.accesoRepo.DeleteByQuery(q)
	if err != nil {
		return nil, err
	}
	return &dto.AccesoBorrarResponse{Eliminados: n}, nil
}
