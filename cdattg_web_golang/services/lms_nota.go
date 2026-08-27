package services

import (
	"errors"
	"strconv"
	"strings"
	"time"
)

var errNotaFueraRango = errors.New("la calificación debe estar entre 0 y 100")

// ValidarNotaLMS acepta nil (sin nota) o un valor de 0 a 100.
func ValidarNotaLMS(n *float64) error {
	if n == nil {
		return nil
	}
	if *n < 0 || *n > 100 {
		return errNotaFueraRango
	}
	return nil
}

// PuntosActividadLMS usa 100 si no hay valor y valida el rango 0-100.
func PuntosActividadLMS(n *float64) (*float64, error) {
	if n == nil {
		cien := 100.0
		return &cien, nil
	}
	if err := ValidarNotaLMS(n); err != nil {
		return nil, err
	}
	return n, nil
}

// ParsePuntosLMS lee puntos desde formulario. Vacío = 100.
func ParsePuntosLMS(raw string) (*float64, error) {
	s := strings.TrimSpace(raw)
	if s == "" {
		return PuntosActividadLMS(nil)
	}
	v, err := strconv.ParseFloat(s, 64)
	if err != nil {
		return nil, errNotaFueraRango
	}
	return PuntosActividadLMS(&v)
}

// EntregaEsTardia indica si el envío fue después del plazo.
func EntregaEsTardia(entregado time.Time, plazo *time.Time) bool {
	return plazo != nil && !entregado.IsZero() && entregado.After(*plazo)
}
