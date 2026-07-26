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

const (
	betowaWorkersDefault     = 4
	betowaSegundosPorDoc     = 45
	betowaSegundosBaseLote   = 90
	betowaTimeoutMaxSegundos = 1800
)

// BetowaScraper delega la verificación al microservicio Python (formulario Betowa, sin credenciales).
type BetowaScraper struct {
	baseURL string
	client  *http.Client
}

// NewBetowaScraper crea el cliente del scraper Betowa (misma URL base que Sofia).
func NewBetowaScraper() *BetowaScraper {
	return &BetowaScraper{
		baseURL: strings.TrimRight(config.AppConfig.Sofia.ScraperURL, "/"),
		client:  &http.Client{Timeout: timeoutBetowaIndividual()},
	}
}

func timeoutBaseSegundos() time.Duration {
	seg := config.AppConfig.Sofia.TimeoutSegundos
	if seg <= 0 {
		seg = 120
	}
	return time.Duration(seg) * time.Second
}

func timeoutBetowaIndividual() time.Duration {
	return timeoutBaseSegundos() + 90*time.Second
}

func timeoutBetowaLote(cantidad int) time.Duration {
	if cantidad <= 0 {
		return timeoutBetowaIndividual()
	}
	workers := betowaWorkersDefault
	lotes := (cantidad + workers - 1) / workers
	seg := betowaSegundosBaseLote + lotes*betowaSegundosPorDoc
	if seg < int(timeoutBetowaIndividual()/time.Second) {
		seg = int(timeoutBetowaIndividual() / time.Second)
	}
	if seg > betowaTimeoutMaxSegundos {
		seg = betowaTimeoutMaxSegundos
	}
	return time.Duration(seg) * time.Second
}

type betowaVerificarPayload struct {
	NumeroDocumento string `json:"numero_documento"`
	TipoDocumento   string `json:"tipo_documento"`
}

type betowaDocumentoPayload struct {
	NumeroDocumento string `json:"numero_documento"`
	TipoDocumento   string `json:"tipo_documento"`
}

type betowaVerificarLotePayload struct {
	Documentos []betowaDocumentoPayload `json:"documentos"`
}

func (b *BetowaScraper) postJSON(path string, payload any, out any, timeout time.Duration) error {
	body, err := json.Marshal(payload)
	if err != nil {
		return err
	}
	req, err := http.NewRequest(http.MethodPost, b.baseURL+path, bytes.NewReader(body))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")

	client := b.client
	if timeout > 0 {
		client = &http.Client{Timeout: timeout}
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("no se pudo contactar el servicio Betowa (%s): %w", b.baseURL, err)
	}
	defer resp.Body.Close()

	raw, err := io.ReadAll(resp.Body)
	if err != nil {
		return err
	}
	if resp.StatusCode >= 400 {
		return fmt.Errorf("scraper Betowa respondió %d: %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}
	if out == nil {
		return nil
	}
	return json.Unmarshal(raw, out)
}

func noVerificadoBetowa(numero, mensaje string) dto.VerificarAspiranteResponse {
	return dto.VerificarAspiranteResponse{
		NumeroDocumento: numero,
		Estado:          dto.VerificacionNoVerificado,
		Mensaje:         mensaje,
	}
}

// VerificarDocumento consulta un documento vía formulario de registro Betowa.
func (b *BetowaScraper) VerificarDocumento(numero, tipoCodigo string) dto.VerificarAspiranteResponse {
	var res scraperResultadoPayload
	err := b.postJSON("/betowa/verificar", betowaVerificarPayload{
		NumeroDocumento: numero,
		TipoDocumento:   tipoCodigo,
	}, &res, timeoutBetowaIndividual())
	if err != nil {
		return noVerificadoBetowa(numero, err.Error())
	}
	return mapResultado(res)
}

// VerificarLote consulta varios documentos en Betowa (paralelo en el scraper Python).
func (b *BetowaScraper) VerificarLote(docs []dto.LoteDocumento) []dto.VerificarAspiranteResponse {
	payloadDocs := make([]betowaDocumentoPayload, len(docs))
	for i, d := range docs {
		payloadDocs[i] = betowaDocumentoPayload{
			NumeroDocumento: d.NumeroDocumento,
			TipoDocumento:   d.TipoDocumento,
		}
	}

	var res scraperVerificarLoteResponse
	err := b.postJSON("/betowa/verificar-lote", betowaVerificarLotePayload{
		Documentos: payloadDocs,
	}, &res, timeoutBetowaLote(len(docs)))
	if err != nil {
		out := make([]dto.VerificarAspiranteResponse, len(docs))
		for i, d := range docs {
			out[i] = noVerificadoBetowa(d.NumeroDocumento, err.Error())
		}
		return out
	}

	out := make([]dto.VerificarAspiranteResponse, len(res.Resultados))
	for i, r := range res.Resultados {
		out[i] = mapResultado(r)
	}
	return out
}
