package services

import (
	"encoding/json"
	"testing"
	"time"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/dto"
)

func TestVigenciaFechaFormulario(t *testing.T) {
	prev := config.AppConfig
	config.AppConfig = &config.Config{Database: config.DatabaseConfig{TimeZone: "America/Bogota"}}
	t.Cleanup(func() { config.AppConfig = prev })
	var fecha dto.FlexDate
	if err := json.Unmarshal([]byte(`"2026-08-15"`), &fecha); err != nil {
		t.Fatal(err)
	}
	// El driver puede devolver el mismo instante con otro offset.
	utc := fecha.UTC()
	for _, limite := range []time.Time{fecha.Time, utc} {
		for _, caso := range []struct {
			nombre          string
			hoy             time.Time
			vencida, futura bool
		}{
			{"antes de iniciar", time.Date(2026, 8, 14, 23, 59, 59, 0, zonaVigenciaTest), false, true},
			{"inicio inclusivo", time.Date(2026, 8, 15, 0, 0, 0, 0, zonaVigenciaTest), false, false},
			{"fin inclusivo", time.Date(2026, 8, 15, 23, 59, 59, 0, zonaVigenciaTest), false, false},
			{"día siguiente", time.Date(2026, 8, 16, 0, 0, 0, 0, zonaVigenciaTest), true, false},
		} {
			t.Run(limite.Location().String()+"/"+caso.nombre, func(t *testing.T) {
				if got := fechaFinVencida(&limite, caso.hoy); got != caso.vencida {
					t.Fatalf("vencida=%v, esperado=%v", got, caso.vencida)
				}
				if got := fechaInicioFutura(&limite, caso.hoy); got != caso.futura {
					t.Fatalf("futura=%v, esperado=%v", got, caso.futura)
				}
			})
		}
	}
}
