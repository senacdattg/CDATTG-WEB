// Comando interno de diagnóstico del scraper SofíaPlus.
//
// Descifra la credencial guardada del operador (AES-256-GCM con SOFIA_ENC_KEY,
// nunca se imprime) y ejecuta una verificación real de documentos contra el
// microservicio scraper, imprimiendo solo el resumen de resultados.
//
// Uso:
//
//	go run ./cmd/sofia-debug [usuarioID] doc1 tipo1 [doc2 tipo2 ...]
//
// Ejemplo:
//
//	go run ./cmd/sofia-debug 2 1120571336 TI 1133929271 CC
//
// Para ver la captura de red (cómo envía la info JOSSO/A4J), activar en el
// scraper SOFIA_DEBUG_RED=true y revisar sus logs (docker logs cdattg-sofia-scraper).
package main

import (
	"fmt"
	"log"
	"os"
	"strconv"
	"strings"

	"github.com/sena/cdattg-web-golang/config"
	"github.com/sena/cdattg-web-golang/database"
	"github.com/sena/cdattg-web-golang/dto"
	"github.com/sena/cdattg-web-golang/repositories"
	"github.com/sena/cdattg-web-golang/services"
)

func main() {
	config.LoadConfig()
	if err := database.Initialize(); err != nil {
		log.Fatal("Error inicializando base de datos:", err)
	}

	args := os.Args[1:]
	usuarioID := uint(2)
	if len(args) > 0 {
		if id, err := strconv.ParseUint(args[0], 10, 32); err == nil {
			usuarioID = uint(id)
			args = args[1:]
		}
	}
	if len(args) == 0 || len(args)%2 != 0 {
		log.Fatal("Uso: go run ./cmd/sofia-debug [usuarioID] doc tipo [doc tipo ...]")
	}

	repo := repositories.NewSofiaCredencialRepository()
	credencial, err := repo.FindByUsuarioID(usuarioID)
	if err != nil {
		log.Fatalf("No hay credencial SofiaPlus para el usuario %d: %v", usuarioID, err)
	}
	password, err := services.DescifrarSofiaPassword(credencial.PasswordCifrada)
	if err != nil {
		log.Fatal("No se pudo descifrar la credencial:", err)
	}

	cred := services.SofiaCredenciales{
		Usuario:       credencial.Usuario,
		Password:      password,
		TipoDocumento: credencial.TipoDocumento,
		Rol:           "Encargado de ingreso centro formación",
	}

	docs := make([]dto.LoteDocumento, 0, len(args)/2)
	for i := 0; i < len(args); i += 2 {
		docs = append(docs, dto.LoteDocumento{NumeroDocumento: args[i], TipoDocumento: args[i+1]})
	}

	fmt.Printf("Operador: %s (usuario %d) | docs: %d\n", credencial.Usuario, usuarioID, len(docs))
	scraper := services.NewSofiaScraper()
	resultados := scraper.VerificarLote(cred, docs, "sofia-debug")

	for _, r := range resultados {
		fmt.Printf("  %s | %s | tipo=%s | %s %s | %s\n",
			r.NumeroDocumento, r.Estado, or(r.TipoEncontrado, "-"),
			or(r.Nombres, ""), or(r.PrimerApellido, ""),
			or(r.Mensaje, or(r.Detalle, "")))
	}
}

func or(a, b string) string {
	if strings.TrimSpace(a) != "" {
		return a
	}
	return b
}
