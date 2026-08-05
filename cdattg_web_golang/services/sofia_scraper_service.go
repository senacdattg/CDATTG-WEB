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
		timeout = 120 * time.Second
	}
	return &SofiaScraper{
		baseURL: strings.TrimRight(config.AppConfig.Sofia.ScraperURL, "/"),
		client:  &http.Client{Timeout: timeout + 90*time.Second},
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
}

type scraperResultadoPayload struct {
	NumeroDocumento string `json:"numero_documento"`
	Estado          string `json:"estado"`
	TipoEncontrado  string `json:"tipo_encontrado"`
	Nombre          string `json:"nombre"`
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
func (s *SofiaScraper) VerificarLote(cred SofiaCredenciales, docs []dto.LoteDocumento) []dto.VerificarAspiranteResponse {
	payloadDocs := make([]scraperDocumentoPayload, len(docs))
	for i, d := range docs {
		payloadDocs[i] = scraperDocumentoPayload{
			NumeroDocumento: d.NumeroDocumento,
			TipoDocumento:   d.TipoDocumento,
		}
	}

	var res scraperVerificarLoteResponse
	err := s.postJSON("/verificar-lote", scraperVerificarLotePayload{
		Credenciales: mapCredenciales(cred),
		Documentos:   payloadDocs,
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

type scraperConsultarInscripcionesPayload struct {
	Credenciales    scraperCredencialesPayload `json:"credenciales"`
	NumeroDocumento string                     `json:"numero_documento"`
	Ficha           string                     `json:"ficha"`
	TipoDocumento   string                     `json:"tipo_documento"`
}

type scraperRegistroInscripcion struct {
	Ficha    string `json:"ficha"`
	Programa string `json:"programa"`
	Estado   string `json:"estado"`
}

type scraperConsultarInscripcionesResponse struct {
	NumeroDocumento string                       `json:"numero_documento"`
	FichaConsultada string                       `json:"ficha_consultada"`
	Estado          string                       `json:"estado"`
	TipoEncontrado  string                       `json:"tipo_encontrado"`
	Registros       []scraperRegistroInscripcion `json:"registros"`
	Mensaje         string                       `json:"mensaje"`
}

func noVerificadoInscripcion(numero, ficha, mensaje string) dto.ConsultarInscripcionesResponse {
	return dto.ConsultarInscripcionesResponse{
		NumeroDocumento: numero,
		FichaConsultada: ficha,
		Estado:          dto.InscripcionNoVerificado,
		Registros:       []dto.RegistroInscripcionFicha{},
		Mensaje:         mensaje,
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
		NumeroDocumento: res.NumeroDocumento,
		FichaConsultada: res.FichaConsultada,
		Estado:          res.Estado,
		TipoEncontrado:  res.TipoEncontrado,
		Registros:       regs,
		Mensaje:         res.Mensaje,
	}
}

// ConsultarInscripciones login SENA + Usuario SENA + Consultar Inscripciones (filtra por ficha).
func (s *SofiaScraper) ConsultarInscripciones(cred SofiaCredenciales, numero, ficha, tipoCodigo string) dto.ConsultarInscripcionesResponse {
	var res scraperConsultarInscripcionesResponse
	err := s.postJSON("/consultar-inscripciones", scraperConsultarInscripcionesPayload{
		Credenciales:    mapCredenciales(cred),
		NumeroDocumento: numero,
		Ficha:           ficha,
		TipoDocumento:   tipoCodigo,
	}, &res)
	if err != nil {
		return noVerificadoInscripcion(numero, ficha, err.Error())
	}
	return mapInscripcionResultado(res)
}

type scraperConsultaInscripcionItem struct {
	NumeroDocumento string `json:"numero_documento"`
	Ficha           string `json:"ficha"`
	TipoDocumento   string `json:"tipo_documento"`
}

type scraperConsultarInscripcionesLotePayload struct {
	Credenciales scraperCredencialesPayload     `json:"credenciales"`
	Consultas    []scraperConsultaInscripcionItem `json:"consultas"`
}

type scraperConsultarInscripcionesLoteResponse struct {
	Resultados []scraperConsultarInscripcionesResponse `json:"resultados"`
}

// ConsultarInscripcionesLote un login + varias consultas documento/ficha.
func (s *SofiaScraper) ConsultarInscripcionesLote(cred SofiaCredenciales, filas []dto.LoteInscripcionFila) []dto.ConsultarInscripcionesResponse {
	consultas := make([]scraperConsultaInscripcionItem, len(filas))
	for i, f := range filas {
		consultas[i] = scraperConsultaInscripcionItem{
			NumeroDocumento: f.NumeroDocumento,
			Ficha:           f.Ficha,
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
	}, &res)
	if err != nil {
		out := make([]dto.ConsultarInscripcionesResponse, len(filas))
		for i, f := range filas {
			out[i] = noVerificadoInscripcion(f.NumeroDocumento, f.Ficha, err.Error())
		}
		return out
	}
	out := make([]dto.ConsultarInscripcionesResponse, len(res.Resultados))
	for i, r := range res.Resultados {
		out[i] = mapInscripcionResultado(r)
	}
	return out
}
