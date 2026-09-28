/**
 * Permisos de alta de personas y personal para el super vigilante.
 *
 * @author Cristian Deysdayr Jiménez
 */
package authz

// PermisosAltaPersonaSupervigilante: crear y listar personas, sin borrar.
var PermisosAltaPersonaSupervigilante = []string{"CREAR PERSONA", "VER PERSONAS"}

// VerYCrearDe deja solo ver y crear de una lista de personal (sin editar ni eliminar).
func VerYCrearDe(perms []string) []string {
	if len(perms) < 2 {
		out := make([]string, len(perms))
		copy(out, perms)
		return out
	}
	return []string{perms[0], perms[1]}
}
