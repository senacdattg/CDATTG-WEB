package services

import (
	"errors"
	"strings"

	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
	"gorm.io/gorm"
)

// complementarios_service.go
// Lógica del módulo Complementarios (FPI):
//  - credenciales SofiaPlus por operador (cifradas)
//  - verificación individual de aspirantes en SofiaPlus

type ComplementariosService struct {
	repo *repositories.SofiaCredencialRepository
}

func NewComplementariosService() *ComplementariosService {
	return &ComplementariosService{repo: repositories.NewSofiaCredencialRepository()}
}

// GuardarCredencial registra o actualiza el usuario SENA del operador (contraseña cifrada).
func (s *ComplementariosService) GuardarCredencial(usuarioID uint, req dto.GuardarCredencialSofiaRequest) error {
	cifrada, err := cifrarSecreto(req.Password)
	if err != nil {
		return err
	}
	cred := &models.SofiaCredencial{
		UsuarioID:       usuarioID,
		TipoDocumento:   strings.TrimSpace(req.TipoDocumento),
		Usuario:         strings.TrimSpace(req.Usuario),
		PasswordCifrada: cifrada,
		Rol:             strings.TrimSpace(req.Rol),
	}
	return s.repo.Upsert(cred)
}

// ObtenerEstado indica si el operador tiene credenciales guardadas (sin exponer la contraseña).
func (s *ComplementariosService) ObtenerEstado(usuarioID uint) dto.CredencialSofiaEstadoResponse {
	cred, err := s.repo.FindByUsuarioID(usuarioID)
	if err != nil || cred == nil {
		return dto.CredencialSofiaEstadoResponse{Tiene: false}
	}
	return dto.CredencialSofiaEstadoResponse{
		Tiene:         true,
		TipoDocumento: cred.TipoDocumento,
		Usuario:       cred.Usuario,
		Rol:           cred.Rol,
		ActualizadaEn: cred.UpdatedAt.Format("2006-01-02 15:04"),
	}
}

// EliminarCredencial borra el usuario SENA del operador.
func (s *ComplementariosService) EliminarCredencial(usuarioID uint) error {
	return s.repo.DeleteByUsuarioID(usuarioID)
}

// credencialesDeUsuario carga y descifra las credenciales del operador.
func (s *ComplementariosService) credencialesDeUsuario(usuarioID uint) (SofiaCredenciales, error) {
	cred, err := s.repo.FindByUsuarioID(usuarioID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return SofiaCredenciales{}, errors.New("no has registrado tu usuario SENA en el módulo")
		}
		return SofiaCredenciales{}, err
	}
	password, err := descifrarSecreto(cred.PasswordCifrada)
	if err != nil {
		return SofiaCredenciales{}, errors.New("no se pudo descifrar la contraseña guardada (¿cambió SOFIA_ENC_KEY?)")
	}
	return SofiaCredenciales{
		Usuario:       cred.Usuario,
		Password:      password,
		TipoDocumento: cred.TipoDocumento,
		Rol:           cred.Rol,
	}, nil
}

// VerificarAspirante consulta un documento en SofiaPlus (login SENA + Consultar Registro).
func (s *ComplementariosService) VerificarAspirante(usuarioID uint, req dto.VerificarAspiranteRequest) dto.VerificarAspiranteResponse {
	numero := strings.TrimSpace(req.NumeroDocumento)
	if numero == "" {
		return dto.VerificarAspiranteResponse{
			NumeroDocumento: numero,
			Estado:          dto.VerificacionNoVerificado,
			Mensaje:         "El número de documento es obligatorio.",
		}
	}

	cred, err := s.credencialesDeUsuario(usuarioID)
	if err != nil {
		return dto.VerificarAspiranteResponse{
			NumeroDocumento: numero,
			Estado:          dto.VerificacionNoVerificado,
			Mensaje:         err.Error(),
		}
	}

	scraper := NewSofiaScraper()
	return scraper.VerificarDocumento(cred, numero, req.TipoDocumento)
}

// VerificarAspiranteBetowa consulta un documento en Betowa (sin credenciales SENA).
func (s *ComplementariosService) VerificarAspiranteBetowa(req dto.VerificarAspiranteRequest) dto.VerificarAspiranteResponse {
	numero := strings.TrimSpace(req.NumeroDocumento)
	if numero == "" {
		return dto.VerificarAspiranteResponse{
			NumeroDocumento: numero,
			Estado:          dto.VerificacionNoVerificado,
			Mensaje:         "El número de documento es obligatorio.",
		}
	}

	scraper := NewBetowaScraper()
	return scraper.VerificarDocumento(numero, req.TipoDocumento)
}

// PlantillaLote devuelve el Excel de ejemplo para la carga masiva.
func (s *ComplementariosService) PlantillaLote() ([]byte, error) {
	return GenerarPlantillaLote()
}

// VerificarLote procesa el Excel de documentos vía login SENA + Consultar Registro.
func (s *ComplementariosService) VerificarLote(usuarioID uint, contenido []byte) (dto.VerificarLoteResponse, error) {
	docs, err := ParsearLoteExcel(contenido)
	if err != nil {
		return dto.VerificarLoteResponse{}, err
	}
	if len(docs) == 0 {
		return dto.VerificarLoteResponse{}, errors.New("el Excel no tiene documentos válidos (revisa la columna numero_documento)")
	}

	cred, err := s.credencialesDeUsuario(usuarioID)
	if err != nil {
		return dto.VerificarLoteResponse{}, err
	}

	scraper := NewSofiaScraper()
	resultados := scraper.VerificarLote(cred, docs)

	out := dto.VerificarLoteResponse{Total: len(resultados), Resultados: resultados}
	for _, r := range resultados {
		switch r.Estado {
		case dto.VerificacionRegistrado:
			out.Registrados++
		case dto.VerificacionNoRegistrado:
			out.NoRegistrados++
		default:
			out.NoVerificados++
		}
	}
	return out, nil
}

// VerificarLoteBetowa procesa el Excel vía formulario de registro Betowa (sin credenciales).
func (s *ComplementariosService) VerificarLoteBetowa(contenido []byte) (dto.VerificarLoteResponse, error) {
	docs, err := ParsearLoteExcel(contenido)
	if err != nil {
		return dto.VerificarLoteResponse{}, err
	}
	if len(docs) == 0 {
		return dto.VerificarLoteResponse{}, errors.New("el Excel no tiene documentos válidos (revisa la columna numero_documento)")
	}

	scraper := NewBetowaScraper()
	resultados := scraper.VerificarLote(docs)

	out := dto.VerificarLoteResponse{Total: len(resultados), Resultados: resultados}
	for _, r := range resultados {
		switch r.Estado {
		case dto.VerificacionRegistrado:
			out.Registrados++
		case dto.VerificacionNoRegistrado:
			out.NoRegistrados++
		default:
			out.NoVerificados++
		}
	}
	return out, nil
}

//
