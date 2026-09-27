/**
 * Compruebo que al borrar el stub también se va la carpeta LMS.
 *
 * @author Cristian Deysdayr Jiménez
 */
package repositories

import (
	"testing"

	"github.com/glebarez/sqlite"
	"github.com/sena/cdattg-web-golang/models"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

func TestHardDeleteQuitaCarpetaLms(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("sqlite: %v", err)
	}
	if err := db.AutoMigrate(&models.Persona{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	if err := db.Exec(`CREATE TABLE lms_carpetas_persona (id INTEGER PRIMARY KEY, persona_id INTEGER NOT NULL)`).Error; err != nil {
		t.Fatalf("lms: %v", err)
	}
	p := models.Persona{NumeroDocumento: "9"}
	if err := db.Create(&p).Error; err != nil {
		t.Fatalf("persona: %v", err)
	}
	if err := db.Exec(`INSERT INTO lms_carpetas_persona (persona_id) VALUES (?)`, p.ID).Error; err != nil {
		t.Fatalf("insert lms: %v", err)
	}
	r := &personaRepository{db: db}
	if err := r.HardDelete(p.ID); err != nil {
		t.Fatalf("hard: %v", err)
	}
	var n int64
	db.Raw(`SELECT count(*) FROM lms_carpetas_persona`).Scan(&n)
	if n != 0 {
		t.Fatalf("lms quedó %d", n)
	}
	if err := db.Unscoped().First(&models.Persona{}, p.ID).Error; err == nil {
		t.Fatal("la persona debía desaparecer")
	}
}

func TestHardDeleteSinTablaLms(t *testing.T) {
	db, err := gorm.Open(sqlite.Open("file:"+t.Name()+"?mode=memory&cache=shared"), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		t.Fatalf("sqlite: %v", err)
	}
	if err := db.AutoMigrate(&models.Persona{}); err != nil {
		t.Fatalf("migrate: %v", err)
	}
	p := models.Persona{NumeroDocumento: "8"}
	if err := db.Create(&p).Error; err != nil {
		t.Fatalf("persona: %v", err)
	}
	r := &personaRepository{db: db}
	if err := r.HardDelete(p.ID); err != nil {
		t.Fatalf("hard: %v", err)
	}
}
