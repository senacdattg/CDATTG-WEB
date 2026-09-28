/**
 * Pruebo quién es stub de portería (solo documento).
 *
 * @author Cristian Deysdayr Jiménez
 */
package services

import (
	"testing"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
)

func TestPersonaEsStubPorteriaSoloDocumento(t *testing.T) {
	p := &models.Persona{NumeroDocumento: "6"}
	if PersonaEsStubPorteria(p) {
		return
	}
	t.Fatal("un 6 sin nombre es stub")
}

func TestPersonaEsStubPorteriaConNombreNo(t *testing.T) {
	p := &models.Persona{NumeroDocumento: "6", PrimerNombre: "Ana"}
	if PersonaEsStubPorteria(p) {
		t.Fatal("con nombre no es stub")
	}
}

func TestPersonaEsStubPorteriaNil(t *testing.T) {
	if PersonaEsStubPorteria(nil) {
		t.Fatal("nil no es stub")
	}
}

func TestBorrarPersonasSinNombreSinConfirmacion(t *testing.T) {
	s := &vigilanciaAccesoService{}
	_, err := s.BorrarPersonasSinNombre(dto.AccesoBorrarStubsRequest{IDs: []uint{1}, Confirmado: false})
	if err == nil {
		t.Fatal("debe pedir confirmación")
	}
}

func TestBorrarPersonasSinNombreSinIDs(t *testing.T) {
	s := &vigilanciaAccesoService{}
	_, err := s.BorrarPersonasSinNombre(dto.AccesoBorrarStubsRequest{Confirmado: true})
	if err == nil {
		t.Fatal("debe pedir ids")
	}
}
