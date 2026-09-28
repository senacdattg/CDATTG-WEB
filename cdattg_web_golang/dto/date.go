package dto

import (
	"encoding/json"
	"time"

	"github.com/sena/cdattg-web-golang/utils"
)

// FlexDate acepta en JSON fechas "2006-01-02", RFC3339 o null para binding con el frontend.
type FlexDate struct{ time.Time }

// UnmarshalJSON acepta "2006-01-02", "2006-01-02T15:04:05Z07:00", "" o null.
func (t *FlexDate) UnmarshalJSON(b []byte) error {
	if len(b) == 0 || string(b) == "null" {
		t.Time = time.Time{}
		return nil
	}
	var s string
	if err := json.Unmarshal(b, &s); err != nil {
		return err
	}
	if s == "" {
		t.Time = time.Time{}
		return nil
	}
	// Una fecha sin hora pertenece al calendario de la aplicación. Interpretarla
	// como UTC adelanta su inicio y vencimiento un día al convertirla a Bogotá.
	parsed, err := time.ParseInLocation(time.DateOnly, s, utils.AppLocation())
	if err != nil {
		parsed, err = time.Parse(time.RFC3339, s)
		if err != nil {
			return err
		}
	}
	t.Time = parsed
	return nil
}

// MarshalJSON escribe la fecha como "2006-01-02".
func (t FlexDate) MarshalJSON() ([]byte, error) {
	if t.Time.IsZero() {
		return []byte("null"), nil
	}
	return json.Marshal(t.Time.Format("2006-01-02"))
}

// ToTime devuelve *time.Time para usar en modelos (nil si la fecha es cero).
func (t *FlexDate) ToTime() *time.Time {
	if t == nil || t.Time.IsZero() {
		return nil
	}
	tt := t.Time
	return &tt
}

// FromTime crea *FlexDate desde *time.Time.
func FromTime(t *time.Time) *FlexDate {
	if t == nil || t.IsZero() {
		return nil
	}
	return &FlexDate{Time: *t}
}

// FlexDateToTime convierte *FlexDate a *time.Time (nil si f es nil o cero). Útil en servicios.
func FlexDateToTime(f *FlexDate) *time.Time {
	if f == nil {
		return nil
	}
	return f.ToTime()
}
