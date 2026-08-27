/**
 * services: pruebas del slug de semillero.
 * @author CRANDEYS
 * @created 2026-08-26
 */
package services

import "testing"

func TestSlugDesdeNombre(t *testing.T) {
	if got := SlugDesdeNombre("  Semillero BIOGJGAS  "); got != "semillero-biogjgas" {
		t.Fatalf("got %q", got)
	}
	if got := SlugDesdeNombre(""); got != "" {
		t.Fatalf("vacío: %q", got)
	}
	if got := SlugDesdeNombre("A---B!!C"); got != "a-bc" {
		t.Fatalf("símbolos: %q", got)
	}
}
