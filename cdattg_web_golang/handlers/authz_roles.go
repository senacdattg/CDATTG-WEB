/**
 * Ayuda a saber si el usuario autenticado tiene el rol VISITANTE.
 * Lo hice para reutilizar esa consulta en el bloqueo de edición de perfil
 * y en la subida de foto, sin duplicar la lógica de roles.
 *
 * @author Cristian Deysdayr Jiménez
 */
package handlers

import (
	"github.com/gin-gonic/gin"
)

// esVisitante consulta los roles reales del usuario y devuelve true si tiene
// el rol VISITANTE. Los roles se ven del contexto o se obtienen del enforcer.
func esVisitante(c *gin.Context) bool {
	for _, r := range rolesFromContext(c) {
		if r == "VISITANTE" {
			return true
		}
	}
	return false
}
