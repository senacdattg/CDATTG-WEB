package dto

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/config"
)

func TestFlexDateCalendarioAplicacion(t *testing.T) {
	prev := config.AppConfig
	t.Cleanup(func() { config.AppConfig = prev })
	for _, zona := range []string{"America/Bogota", "UTC", "Asia/Tokyo"} {
		t.Run(zona, func(t *testing.T) {
			config.AppConfig = &config.Config{Database: config.DatabaseConfig{TimeZone: zona}}
			loc, err := time.LoadLocation(zona)
			if err != nil {
				t.Fatal(err)
			}
			var fecha FlexDate
			if err := json.Unmarshal([]byte(`"2026-08-15"`), &fecha); err != nil {
				t.Fatal(err)
			}
			want := time.Date(2026, 8, 15, 0, 0, 0, 0, loc)
			if !fecha.Equal(want) {
				t.Fatalf("fecha=%v, esperada=%v", fecha.Time, want)
			}
			if got := fecha.ToTime().In(loc).Format(time.DateOnly); got != "2026-08-15" {
				t.Fatalf("cambió el día: %s", got)
			}
		})
	}
}

func TestFlexDateCompatibilidad(t *testing.T) {
	for _, input := range []string{`null`, `""`, `"2026-08-15T00:00:00Z"`, `"2026-08-15T00:00:00-05:00"`} {
		t.Run(input, func(t *testing.T) {
			var fecha FlexDate
			if err := json.Unmarshal([]byte(input), &fecha); err != nil {
				t.Fatal(err)
			}
			if input == `null` || input == `""` {
				if fecha.ToTime() != nil {
					t.Fatal("se esperaba fecha nula")
				}
				return
			}
			var valor string
			if err := json.Unmarshal([]byte(input), &valor); err != nil {
				t.Fatal(err)
			}
			want, err := time.Parse(time.RFC3339, valor)
			if err != nil {
				t.Fatal(err)
			}
			if !fecha.Equal(want) {
				t.Fatalf("se alteró el instante: %v", fecha.Time)
			}
		})
	}
	var fecha FlexDate
	if err := json.Unmarshal([]byte(`"2026-02-30"`), &fecha); err == nil {
		t.Fatal("se aceptó una fecha inválida")
	}
}
