// Este archivo impide que una persona sea aprendiz e instructor de la misma ficha.
// Lo hice porque el LMS tomaba la asignación de instructor aunque la persona
// ya estaba matriculada como aprendiz. Lo usan ficha, aprendiz y el acceso LMS.
//
// @author Cristian Deysdayr Jiménez
package services

import (
	"errors"

	"github.com/sena/cdattg-web-golang/models"
	"github.com/sena/cdattg-web-golang/repositories"
)

// ErrAprendizEInstructorMismaFicha al querer asignar instructor a quien ya es aprendiz.
var ErrAprendizEInstructorMismaFicha = errors.New(
	"esta persona ya es aprendiz de esta ficha; no puede ser instructor",
)

// ErrInstructorEAprendizMismaFicha al querer matricular aprendiz a quien ya es instructor.
var ErrInstructorEAprendizMismaFicha = errors.New(
	"esta persona ya es instructor de esta ficha; no puede ser aprendiz",
)

// aprendizActivoDeFicha true si la matrícula existe y está activa.
func aprendizActivoDeFicha(ap *models.Aprendiz) bool {
	return ap != nil && ap.Estado
}

// errSiAprendizQuiereSerInstructor bloquea el cruce de roles en la misma ficha.
func errSiAprendizQuiereSerInstructor(ap *models.Aprendiz) error {
	if aprendizActivoDeFicha(ap) {
		return ErrAprendizEInstructorMismaFicha
	}
	return nil
}

// errSiInstructorQuiereSerAprendiz bloquea matricular a quien ya está asignado como instructor.
func errSiInstructorQuiereSerAprendiz(asignadoComoInstructor bool) error {
	if asignadoComoInstructor {
		return ErrInstructorEAprendizMismaFicha
	}
	return nil
}

// puedeSerInstructorDeFicha false si ya es aprendiz activo de esa ficha.
func puedeSerInstructorDeFicha(ap *models.Aprendiz, asignadoComoInstructor bool) bool {
	return asignadoComoInstructor && !aprendizActivoDeFicha(ap)
}

// exigirInstructorIDNoAprendizDeFicha valida al asignar un instructor a la ficha.
func exigirInstructorIDNoAprendizDeFicha(
	instructorID, fichaID uint,
	instRepo repositories.InstructorRepository,
	aprendices repositories.AprendizRepository,
) error {
	inst, err := instRepo.FindByID(instructorID)
	if err != nil {
		return errors.New("instructor no encontrado")
	}
	ap, _ := aprendices.FindByPersonaIDAndFichaID(inst.PersonaID, fichaID)
	return errSiAprendizQuiereSerInstructor(ap)
}

// exigirPersonaNoInstructorDeFicha valida al matricular un aprendiz en la ficha.
func exigirPersonaNoInstructorDeFicha(
	personaID, fichaID uint,
	instRepo repositories.InstructorRepository,
	instFichaRepo repositories.InstructorFichaRepository,
) error {
	inst, err := instRepo.FindByPersonaID(personaID)
	if err != nil || inst == nil {
		return nil
	}
	_, err = instFichaRepo.FindByFichaIDAndInstructorID(fichaID, inst.ID)
	return errSiInstructorQuiereSerAprendiz(err == nil)
}
