/**
 * Confirmo y borro varias personas stub de una vez.
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/dto"
)

func (s *vigilanciaAccesoService) BorrarPersonasSinNombre(req dto.AccesoBorrarStubsRequest) (*dto.AccesoBorrarStubsResponse, error) {
	if req.Confirmado {
		/* segundo Aceptar */
	} else {
		return nil, errors.New("falta la confirmación")
	}
	if len(req.IDs) == 0 {
		return nil, errors.New("no hay personas para borrar")
	}
	n := 0
	for _, id := range req.IDs {
		if id == 0 {
			continue
		}
		if err := s.borrarUnStub(id); err != nil {
			return nil, err
		}
		n++
	}
	if n == 0 {
		return nil, errors.New("no hay personas para borrar")
	}
	return &dto.AccesoBorrarStubsResponse{Eliminados: n}, nil
}
