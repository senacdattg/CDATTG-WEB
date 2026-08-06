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

const msgDocumentoObligatorio = "El número de documento es obligatorio."

type ComplementariosService struct {
	repo *repositories.SofiaCredencialRepository
}

func NewComplementariosService() *ComplementariosService {
	return &ComplementariosService{repo: repositories.NewSofiaCredencialRepository()}
}

// GuardarCredencial registra o actualiza el usuario SENA del operador (contraseña cifrada).
// No confundir con el login de CDATTG: aquí va el documento SENA Sofía Plus.
func (s *ComplementariosService) GuardarCredencial(usuarioID uint, req dto.GuardarCredencialSofiaRequest) error {
	usuario := strings.TrimSpace(req.Usuario)
	if !esUsuarioSofiaValido(usuario) {
		return errors.New("el usuario Sofía debe ser el número de documento (solo dígitos), no el correo de CDATTG")
	}
	cifrada, err := cifrarSecreto(req.Password)
	if err != nil {
		return err
	}
	cred := &models.SofiaCredencial{
		UsuarioID:       usuarioID,
		TipoDocumento:   strings.TrimSpace(req.TipoDocumento),
		Usuario:         usuario,
		PasswordCifrada: cifrada,
		Rol:             strings.TrimSpace(req.Rol),
	}
	return s.repo.Upsert(cred)
}

func esUsuarioSofiaValido(usuario string) bool {
	u := strings.TrimSpace(usuario)
	if u == "" || strings.Contains(u, "@") {
		return false
	}
	for _, r := range u {
		if r < '0' || r > '9' {
			return false
		}
	}
	return true
}

// ObtenerEstado indica si el operador tiene credenciales Sofía válidas (documento numérico).
// Si quedó guardado un correo del sistema por error, se elimina y se reporta sin credencial.
func (s *ComplementariosService) ObtenerEstado(usuarioID uint) dto.CredencialSofiaEstadoResponse {
	cred, err := s.repo.FindByUsuarioID(usuarioID)
	if err != nil || cred == nil {
		return dto.CredencialSofiaEstadoResponse{Tiene: false}
	}
	if !esUsuarioSofiaValido(cred.Usuario) {
		_ = s.repo.DeleteByUsuarioID(usuarioID)
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
			Mensaje:         msgDocumentoObligatorio,
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
	// Fase 1: siempre Encargado de ingreso (Consultar Registro / SGS).
	cred.Rol = "Encargado de ingreso centro formación"

	scraper := NewSofiaScraper()
	return scraper.VerificarDocumento(cred, numero, req.TipoDocumento)
}

// ConsultarInscripciones consulta inscripciones en SofiaPlus filtrando por programa (Usuario SENA).
func (s *ComplementariosService) ConsultarInscripciones(usuarioID uint, req dto.ConsultarInscripcionesRequest) dto.ConsultarInscripcionesResponse {
	numero := strings.TrimSpace(req.NumeroDocumento)
	programa := strings.TrimSpace(req.Programa)
	if numero == "" {
		return dto.ConsultarInscripcionesResponse{
			NumeroDocumento:    numero,
			ProgramaConsultado: programa,
			Estado:             dto.InscripcionNoVerificado,
			Registros:          []dto.RegistroInscripcionFicha{},
			Mensaje:            msgDocumentoObligatorio,
		}
	}
	if programa == "" {
		return dto.ConsultarInscripcionesResponse{
			NumeroDocumento:    numero,
			ProgramaConsultado: programa,
			Estado:             dto.InscripcionNoVerificado,
			Registros:          []dto.RegistroInscripcionFicha{},
			Mensaje:            "El nombre del programa de formación es obligatorio.",
		}
	}

	cred, err := s.credencialesDeUsuario(usuarioID)
	if err != nil {
		return dto.ConsultarInscripcionesResponse{
			NumeroDocumento:    numero,
			ProgramaConsultado: programa,
			Estado:             dto.InscripcionNoVerificado,
			Registros:          []dto.RegistroInscripcionFicha{},
			Mensaje:            err.Error(),
		}
	}
	// Este flujo siempre usa Usuario SENA (no el rol de Consultar Registro).
	cred.Rol = "Usuario SENA"

	scraper := NewSofiaScraper()
	return scraper.ConsultarInscripciones(cred, numero, programa, req.TipoDocumento)
}

// PlantillaInscripciones Excel para carga masiva documento+programa.
func (s *ComplementariosService) PlantillaInscripciones() ([]byte, error) {
	return GenerarPlantillaInscripciones()
}

// ConsultarInscripcionesLote procesa Excel (numero_documento, programa) con un solo login SENA.
func (s *ComplementariosService) ConsultarInscripcionesLote(usuarioID uint, contenido []byte) (dto.ConsultarInscripcionesLoteResponse, error) {
	filas, err := ParsearLoteInscripcionesExcel(contenido)
	if err != nil {
		return dto.ConsultarInscripcionesLoteResponse{}, err
	}
	if len(filas) == 0 {
		return dto.ConsultarInscripcionesLoteResponse{}, errors.New("el Excel no tiene filas válidas (numero_documento y programa de formación)")
	}

	cred, err := s.credencialesDeUsuario(usuarioID)
	if err != nil {
		return dto.ConsultarInscripcionesLoteResponse{}, err
	}
	cred.Rol = "Usuario SENA"

	scraper := NewSofiaScraper()
	resultados := scraper.ConsultarInscripcionesLote(cred, filas)

	out := dto.ConsultarInscripcionesLoteResponse{Total: len(resultados), Resultados: resultados}
	for _, r := range resultados {
		switch r.Estado {
		case dto.InscripcionEncontrado:
			out.Encontrados++
		case dto.InscripcionNoEncontrado:
			out.NoEncontrados++
		default:
			out.NoVerificados++
		}
	}
	return out, nil
}

// VerificarAspiranteBetowa consulta un documento en Betowa (sin credenciales SENA).
func (s *ComplementariosService) VerificarAspiranteBetowa(req dto.VerificarAspiranteRequest) dto.VerificarAspiranteResponse {
	numero := strings.TrimSpace(req.NumeroDocumento)
	if numero == "" {
		return dto.VerificarAspiranteResponse{
			NumeroDocumento: numero,
			Estado:          dto.VerificacionNoVerificado,
			Mensaje:         msgDocumentoObligatorio,
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
	// Fase 1: siempre Encargado de ingreso (Consultar Registro / SGS).
	cred.Rol = "Encargado de ingreso centro formación"

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
