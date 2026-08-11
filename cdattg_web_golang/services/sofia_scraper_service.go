package services

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/dto"
)

// SofiaCredenciales credenciales de un operador para iniciar sesión en SofiaPlus.
type SofiaCredenciales struct {
	Usuario       string
	Password      string
	TipoDocumento string
	Rol           string
}

// SofiaScraper delega la verificación al microservicio Python (login + Consultar Registro).
type SofiaScraper struct {
	baseURL string
	client  *http.Client
}

// NewSofiaScraper crea el cliente del scraper remoto.
func NewSofiaScraper() *SofiaScraper {
	timeout := time.Duration(config.AppConfig.Sofia.TimeoutSegundos) * time.Second
	if timeout <= 0 {
		timeout = 10 * time.Minute
	}
	// Individual: login + rol + 1 consulta. Antes 150+90s cortaba a 4 min
	// mientras el scraper seguía ocupado (lote o Sofía lento).
	if timeout < 10*time.Minute {
		timeout = 10 * time.Minute
	}
	return &SofiaScraper{
		baseURL: strings.TrimRight(config.AppConfig.Sofia.ScraperURL, "/"),
		client:  &http.Client{Timeout: timeout},
	}
}

type scraperCredencialesPayload struct {
	Usuario       string `json:"usuario"`
	Password      string `json:"password"`
	TipoDocumento string `json:"tipo_documento"`
	Rol           string `json:"rol"`
}

type scraperDocumentoPayload struct {
	NumeroDocumento string `json:"numero_documento"`
	TipoDocumento   string `json:"tipo_documento"`
}

type scraperVerificarPayload struct {
	Credenciales    scraperCredencialesPayload `json:"credenciales"`
	NumeroDocumento string                     `json:"numero_documento"`
	TipoDocumento   string                     `json:"tipo_documento"`
}

type scraperVerificarLotePayload struct {
	Credenciales scraperCredencialesPayload `json:"credenciales"`
	Documentos   []scraperDocumentoPayload  `json:"documentos"`
	LoteID       string                     `json:"lote_id"`
}

type scraperResultadoPayload struct {
	NumeroDocumento string `json:"numero_documento"`
	Estado          string `json:"estado"`
	TipoEncontrado  string `json:"tipo_encontrado"`
	Nombre          string `json:"nombre"`
	Nombres         string `json:"nombres"`
	PrimerApellido  string `json:"primer_apellido"`
	SegundoApellido string `json:"segundo_apellido"`
	Detalle         string `json:"detalle"`
	Mensaje         string `json:"mensaje"`
}

type scraperVerificarLoteResponse struct {
	Resultados []scraperResultadoPayload `json:"resultados"`
}

func (s *SofiaScraper) postJSON(path string, payload any, out any) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequest(http.MethodPost, s.baseURL+path, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	resp, err := s.client.Do(req)
	if err != nil {
		msg := err.Error()
		if strings.Contains(msg, "deadline exceeded") || strings.Contains(msg, "Timeout") {
			return fmt.Errorf(
				"el scraper Sofía no respondió a tiempo (%s). "+
					"Si hay un lote en curso, espere a que termine e intente de nuevo. Detalle: %w",
				s.baseURL, err,
			)
		}
		return fmt.Errorf("no se pudo contactar el servicio de scraping (%s): %w", s.baseURL, err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("scraper respondió %d: %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}
	if out == nil {
		return nil
	}
	return json.Unmarshal(raw, out)
}

// getJSON hace una petición GET y decodifica la respuesta JSON (p. ej. /progreso/:id).
func (s *SofiaScraper) getJSON(path string, out any) error {
	req, err := http.NewRequest(http.MethodGet, s.baseURL+path, nil)
	if err != nil {
		return err
	}
	resp, err := s.client.Do(req)
	if err != nil {
		return fmt.Errorf("no se pudo contactar el servicio de scraping (%s): %w", s.baseURL, err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("scraper respondió %d: %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}
	if out == nil {
		return nil
	}
	return json.Unmarshal(raw, out)
}

func mapCredenciales(c SofiaCredenciales) scraperCredencialesPayload {
	rol := strings.TrimSpace(c.Rol)
	if rol == "" {
		rol = strings.TrimSpace(config.AppConfig.Sofia.Rol)
	}
	return scraperCredencialesPayload{
		Usuario:       strings.TrimSpace(c.Usuario),
		Password:      c.Password,
		TipoDocumento: strings.TrimSpace(c.TipoDocumento),
		Rol:           rol,
	}
}

func mapResultado(r scraperResultadoPayload) dto.VerificarAspiranteResponse {
	return dto.VerificarAspiranteResponse{
		NumeroDocumento: r.NumeroDocumento,
		Estado:          r.Estado,
		TipoEncontrado:  r.TipoEncontrado,
		Nombre:          r.Nombre,
		Nombres:         r.Nombres,
		PrimerApellido:  r.PrimerApellido,
		SegundoApellido: r.SegundoApellido,
		Detalle:         r.Detalle,
		Mensaje:         r.Mensaje,
	}
}

func noVerificadoScraper(numero, mensaje string) dto.VerificarAspiranteResponse {
	return dto.VerificarAspiranteResponse{
		NumeroDocumento: numero,
		Estado:          dto.VerificacionNoVerificado,
		Mensaje:         mensaje,
	}
}

// VerificarDocumento consulta un documento vía login SENA + Consultar Registro.
func (s *SofiaScraper) VerificarDocumento(cred SofiaCredenciales, numero, tipoCodigo string) dto.VerificarAspiranteResponse {
	var res scraperResultadoPayload
	err := s.postJSON("/verificar", scraperVerificarPayload{
		Credenciales:    mapCredenciales(cred),
		NumeroDocumento: numero,
		TipoDocumento:   tipoCodigo,
	}, &res)
	if err != nil {
		return noVerificadoScraper(numero, err.Error())
	}
	return mapResultado(res)
}

// VerificarLote consulta varios documentos reutilizando la sesión SENA.
func (s *SofiaScraper) VerificarLote(cred SofiaCredenciales, docs []dto.LoteDocumento, loteID string) []dto.VerificarAspiranteResponse {
	payloadDocs := make([]scraperDocumentoPayload, len(docs))
	for i, d := range docs {
		payloadDocs[i] = scraperDocumentoPayload{
			NumeroDocumento: d.NumeroDocumento,
			TipoDocumento:   d.TipoDocumento,
		}
	}

	// Lote: login + cambio de rol + N consultas (mín. 10 min, +45s por doc).
	timeout := time.Duration(600+len(docs)*45) * time.Second
	if timeout > 45*time.Minute {
		timeout = 45 * time.Minute
	}
	loteClient := &SofiaScraper{baseURL: s.baseURL, client: &http.Client{Timeout: timeout}}

	var res scraperVerificarLoteResponse
	err := loteClient.postJSON("/verificar-lote", scraperVerificarLotePayload{
		Credenciales: mapCredenciales(cred),
		Documentos:   payloadDocs,
		LoteID:       loteID,
	}, &res)
	if err != nil {
		out := make([]dto.VerificarAspiranteResponse, len(docs))
		for i, d := range docs {
			out[i] = noVerificadoScraper(d.NumeroDocumento, err.Error())
		}
		return out
	}

	out := make([]dto.VerificarAspiranteResponse, len(res.Resultados))
	for i, r := range res.Resultados {
		out[i] = mapResultado(r)
	}
	return out
}

// ProgresoLote consulta al scraper el avance en vivo de un lote por su lote_id.
func (s *SofiaScraper) ProgresoLote(loteID string) (dto.ProgresoLoteResponse, error) {
	var prog dto.ProgresoLoteResponse
	err := s.getJSON("/progreso/"+loteID, &prog)
	return prog, err
}

type scraperConsultarInscripcionesPayload struct {
	Credenciales    scraperCredencialesPayload `json:"credenciales"`
	NumeroDocumento string                     `json:"numero_documento"`
	Programa        string                     `json:"programa"`
	TipoDocumento   string                     `json:"tipo_documento"`
}

type scraperRegistroInscripcion struct {
	Ficha    string `json:"ficha"`
	Programa string `json:"programa"`
	Estado   string `json:"estado"`
}

type scraperConsultarInscripcionesResponse struct {
	NumeroDocumento    string                       `json:"numero_documento"`
	ProgramaConsultado string                       `json:"programa_consultado"`
	Estado             string                       `json:"estado"`
	TipoEncontrado     string                       `json:"tipo_encontrado"`
	Registros          []scraperRegistroInscripcion `json:"registros"`
	Mensaje            string                       `json:"mensaje"`
}

func noVerificadoInscripcion(numero, programa, mensaje string) dto.ConsultarInscripcionesResponse {
	return dto.ConsultarInscripcionesResponse{
		NumeroDocumento:    numero,
		ProgramaConsultado: programa,
		Estado:             dto.InscripcionNoVerificado,
		Registros:          []dto.RegistroInscripcionFicha{},
		Mensaje:            mensaje,
	}
}

func mapInscripcionResultado(res scraperConsultarInscripcionesResponse) dto.ConsultarInscripcionesResponse {
	regs := make([]dto.RegistroInscripcionFicha, len(res.Registros))
	for i, r := range res.Registros {
		regs[i] = dto.RegistroInscripcionFicha{
			Ficha:    r.Ficha,
			Programa: r.Programa,
			Estado:   r.Estado,
		}
	}
	return dto.ConsultarInscripcionesResponse{
		NumeroDocumento:    res.NumeroDocumento,
		ProgramaConsultado: res.ProgramaConsultado,
		Estado:             res.Estado,
		TipoEncontrado:     res.TipoEncontrado,
		Registros:          regs,
		Mensaje:            res.Mensaje,
	}
}

// ConsultarInscripciones login SENA + Usuario SENA + Consultar Inscripciones (filtra por programa).
func (s *SofiaScraper) ConsultarInscripciones(cred SofiaCredenciales, numero, programa, tipoCodigo string) dto.ConsultarInscripcionesResponse {
	var res scraperConsultarInscripcionesResponse
	err := s.postJSON("/consultar-inscripciones", scraperConsultarInscripcionesPayload{
		Credenciales:    mapCredenciales(cred),
		NumeroDocumento: numero,
		Programa:        programa,
		TipoDocumento:   tipoCodigo,
	}, &res)
	if err != nil {
		return noVerificadoInscripcion(numero, programa, err.Error())
	}
	return mapInscripcionResultado(res)
}

type scraperConsultaInscripcionItem struct {
	NumeroDocumento string `json:"numero_documento"`
	Programa        string `json:"programa"`
	TipoDocumento   string `json:"tipo_documento"`
}

type scraperConsultarInscripcionesLotePayload struct {
	Credenciales scraperCredencialesPayload       `json:"credenciales"`
	Consultas    []scraperConsultaInscripcionItem `json:"consultas"`
	LoteID       string                           `json:"lote_id"`
}

type scraperConsultarInscripcionesLoteResponse struct {
	Resultados []scraperConsultarInscripcionesResponse `json:"resultados"`
}

// ConsultarInscripcionesLote un login + varias consultas documento/programa.
func (s *SofiaScraper) ConsultarInscripcionesLote(cred SofiaCredenciales, filas []dto.LoteInscripcionFila, loteID string) []dto.ConsultarInscripcionesResponse {
	consultas := make([]scraperConsultaInscripcionItem, len(filas))
	for i, f := range filas {
		consultas[i] = scraperConsultaInscripcionItem{
			NumeroDocumento: f.NumeroDocumento,
			Programa:        f.Programa,
			TipoDocumento:   f.TipoDocumento,
		}
	}
	// Lote: login + N consultas; ampliar timeout (mín. 10 min, +90s por fila).
	timeout := time.Duration(600+len(filas)*90) * time.Second
	if timeout > 45*time.Minute {
		timeout = 45 * time.Minute
	}
	loteClient := &SofiaScraper{baseURL: s.baseURL, client: &http.Client{Timeout: timeout}}

	var res scraperConsultarInscripcionesLoteResponse
	err := loteClient.postJSON("/consultar-inscripciones-lote", scraperConsultarInscripcionesLotePayload{
		Credenciales: mapCredenciales(cred),
		Consultas:    consultas,
		LoteID:       loteID,
	}, &res)
	if err != nil {
		out := make([]dto.ConsultarInscripcionesResponse, len(filas))
		for i, f := range filas {
			out[i] = noVerificadoInscripcion(f.NumeroDocumento, f.Programa, err.Error())
		}
		return out
	}
	out := make([]dto.ConsultarInscripcionesResponse, len(res.Resultados))
	for i, r := range res.Resultados {
		out[i] = mapInscripcionResultado(r)
	}
	return out
}
