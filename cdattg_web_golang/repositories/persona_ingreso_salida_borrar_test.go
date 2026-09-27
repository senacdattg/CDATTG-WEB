/**
 * Compruebo que no repito IDs al borrar visitas.
 *
 * @author Cristian Deysdayr Jiménez
 */
package repositories

import "testing"

func TestIdsUnicosAcceso(t *testing.T) {
	t.Parallel()
	got := idsUnicosAcceso([]uint{3, 3, 0, 5, 3})
	if len(got) != 2 || got[0] != 3 || got[1] != 5 {
		t.Fatalf("%v", got)
	}
	if len(idsUnicosAcceso(nil)) != 0 {
		t.Fatal("vacio")
	}
}
