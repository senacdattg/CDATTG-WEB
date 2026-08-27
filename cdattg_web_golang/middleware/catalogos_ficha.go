/**
 * middleware: catálogos de ficha (permisos ficha, asistencia o vigilancia).
 * @author Cristian Deysdayr Jiménez
 */
package middleware

import (
	"github.com/casbin/casbin/v3"
	"github.com/sena/cdattg-web-golang/authz"
)

// catalogosFichaPermitidos permite GET de catálogos de ficha a quien edita fichas, toma asistencia o vigila.
func catalogosFichaPermitidos(e *casbin.Enforcer, sub string) bool {
	for _, act := range authz.PermisosFicha {
		if allowed, errEnf := authz.Enforce(e, sub, authz.ObjFicha, act); errEnf == nil && allowed {
			return true
		}
	}
	if allowed, errEnf := authz.Enforce(e, sub, authz.ObjAsistencia, actVerAsistencia); errEnf == nil && allowed {
		return true
	}
	for _, act := range authz.PermisosVigilancia {
		if allowed, errEnf := authz.Enforce(e, sub, authz.ObjVigilancia, act); errEnf == nil && allowed {
			return true
		}
	}
	return false
}
