/**
 * Compruebo que borrar visitas no va en el paquete del vigilante.
 *
 * @author Cristian Deysdayr Jiménez
 */
package authz

import "testing"

func TestPermisosVigilanciaSinBorrar(t *testing.T) {
	for _, p := range PermisosVigilancia {
		if p == ActBorrarAccesoSede {
			t.Fatal("PermisosVigilancia no debe incluir borrar")
		}
	}
}

func TestBorrarAccesoEsPermisoValido(t *testing.T) {
	if !IsValidPermiso(ObjVigilancia, ActBorrarAccesoSede) {
		t.Fatal("falta BORRAR ACCESO SEDE en el catálogo")
	}
}

func TestRolSupervigilanteEnLista(t *testing.T) {
	for _, r := range RoleNames {
		if r == RolSupervigilante {
			return
		}
	}
	t.Fatal("falta SUPER VIGILANTE en RoleNames")
}
