package services

import "github.com/sena/cdattg-web-golang/models"

func (s *lmsAulaService) nombresCreadores(list []models.LmsActividad) map[uint]string {
	ids := make([]uint, 0, len(list))
	seen := map[uint]bool{}
	for i := range list {
		if list[i].UserCreateID == nil || seen[*list[i].UserCreateID] {
			continue
		}
		seen[*list[i].UserCreateID] = true
		ids = append(ids, *list[i].UserCreateID)
	}
	out := map[uint]string{}
	users, err := s.users.FindByIDs(ids)
	if err != nil {
		return out
	}
	for i := range users {
		out[users[i].ID] = nombrePersonaUsuario(&users[i])
	}
	return out
}

func nombrePersonaUsuario(u *models.User) string {
	if u == nil {
		return ""
	}
	if u.Persona != nil {
		return u.Persona.GetFullName()
	}
	return u.Email
}
