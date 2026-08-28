package services

import "testing"

func TestBorrarCarpetasActividadSinCarpeta(t *testing.T) {
	borrarCarpetasActividad(999999, 999999)
}
