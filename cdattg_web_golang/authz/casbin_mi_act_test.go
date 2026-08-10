package authz_test

import (
	"testing"

	casbin "github.com/casbin/casbin/v3"
	"github.com/sena/cdattg-web-golang/authz"
)

const (
	actVerMiAgenda   = "VER MI AGENDA"
	actVerAsistencia = "VER ASISTENCIA"
)

func TestCasbinRoleAndDirectPermissions(t *testing.T) {
	e, err := casbin.NewEnforcer("model.conf")
	if err != nil {
		t.Fatal(err)
	}
	_, _ = e.AddPolicy("INSTRUCTOR", authz.ObjAsistencia, actVerMiAgenda)
	_, _ = e.AddPolicy("INSTRUCTOR", authz.ObjAsistencia, actVerAsistencia)
	_, _ = e.AddGroupingPolicy("5", "INSTRUCTOR")
	_, _ = authz.AddPermissionForUser(e, "99", authz.ObjAsistencia, actVerMiAgenda)

	for _, tc := range []struct {
		sub, obj, act string
		want          bool
	}{
		{"5", authz.ObjAsistencia, actVerMiAgenda, true},
		{"5", authz.ObjAsistencia, actVerAsistencia, true},
		{"99", authz.ObjAsistencia, actVerMiAgenda, true},
		{"99", authz.ObjAsistencia, actVerAsistencia, false},
	} {
		ok, errEnf := authz.Enforce(e, tc.sub, tc.obj, tc.act)
		if errEnf != nil {
			t.Fatalf("%s/%s/%s err=%v", tc.sub, tc.obj, tc.act, errEnf)
		}
		if ok != tc.want {
			t.Fatalf("%s/%s/%s got=%v want=%v", tc.sub, tc.obj, tc.act, ok, tc.want)
		}
	}
}
