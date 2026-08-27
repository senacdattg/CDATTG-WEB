package services

import (
	"errors"
	"log"
	"os"
	"strings"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"gorm.io/gorm"
)

var tiposFormacionLms = []string{
	models.TipoFormacionRegular,
	models.TipoFormacionMediaTecnica,
	models.TipoFormacionComplementaria,
}

type lmsCarpetaService struct {
	carpetas repositories.LmsCarpetaRepository
	personas repositories.PersonaRepository
	fichas   repositories.FichaRepository
}

func newLmsCarpetaService() *lmsCarpetaService {
	return &lmsCarpetaService{
		carpetas: repositories.NewLmsCarpetaRepository(),
		personas: repositories.NewPersonaRepository(),
		fichas:   repositories.NewFichaRepository(),
	}
}

// EnsurePersonaLmsCarpetas crea raíz + 3 tipos. Idempotente. No falla el alta de persona.
func EnsurePersonaLmsCarpetas(personaID uint) {
	if err := newLmsCarpetaService().ensurePersona(personaID); err != nil {
		log.Printf("lms: no se pudo crear carpeta de persona %d: %v", personaID, err)
	}
}

// EnsureCarpetaFichaLms crea la carpeta de ficha en el tipo correcto. No borra nunca.
func EnsureCarpetaFichaLms(personaID, fichaID uint) {
	if err := newLmsCarpetaService().ensureFicha(personaID, fichaID); err != nil {
		log.Printf("lms: no se pudo crear carpeta ficha persona=%d ficha=%d: %v", personaID, fichaID, err)
	}
}

func (s *lmsCarpetaService) ensurePersona(personaID uint) error {
	if _, err := s.carpetas.FindPersonaByPersonaID(personaID); err == nil {
		return s.mkdirTiposIfNeeded(personaID)
	}
	persona, err := s.personas.FindByID(personaID)
	if err != nil {
		return err
	}
	nombre := NombreCarpetaPersona(persona.NumeroDocumento, persona.GetFullName())
	row := &models.LmsCarpetaPersona{
		PersonaID:     personaID,
		NombreCarpeta: nombre,
		RutaRelativa:  RutaCarpetaPersona(nombre),
	}
	if err := s.carpetas.CreatePersona(row); err != nil {
		return err
	}
	return s.mkdirTiposIfNeeded(personaID)
}

func (s *lmsCarpetaService) mkdirTiposIfNeeded(personaID uint) error {
	row, err := s.carpetas.FindPersonaByPersonaID(personaID)
	if err != nil {
		return err
	}
	for _, tipo := range tiposFormacionLms {
		if err := os.MkdirAll(RutaCarpetaTipo(row.NombreCarpeta, tipo), 0o750); err != nil {
			return err
		}
	}
	return nil
}

func (s *lmsCarpetaService) ensureFicha(personaID, fichaID uint) error {
	if err := s.ensurePersona(personaID); err != nil {
		return err
	}
	if _, err := s.carpetas.FindFicha(personaID, fichaID); err == nil {
		return nil
	} else if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	return s.createCarpetaFicha(personaID, fichaID)
}

func (s *lmsCarpetaService) createCarpetaFicha(personaID, fichaID uint) error {
	raiz, err := s.carpetas.FindPersonaByPersonaID(personaID)
	if err != nil {
		return err
	}
	ficha, err := s.fichas.FindByID(fichaID)
	if err != nil {
		return err
	}
	programa := strings.TrimSpace(ficha.Nombre)
	if programa == "" && ficha.ProgramaFormacion != nil {
		programa = ficha.ProgramaFormacion.Nombre
	}
	tipo := ficha.TipoFormacion
	if tipo == "" {
		tipo = models.TipoFormacionRegular
	}
	nombre := NombreCarpetaFicha(ficha.Ficha, programa)
	ruta := RutaCarpetaFicha(raiz.NombreCarpeta, tipo, nombre)
	if err := os.MkdirAll(ruta, 0o750); err != nil {
		return err
	}
	return s.carpetas.CreateFicha(&models.LmsCarpetaFicha{
		PersonaID:      personaID,
		FichaID:        fichaID,
		TipoFormacion:  tipo,
		NumeroFicha:    ficha.Ficha,
		NombrePrograma: programa,
		NombreCarpeta:  nombre,
		RutaRelativa:   ruta,
	})
}
