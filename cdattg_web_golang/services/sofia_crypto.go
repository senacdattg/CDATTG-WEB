package services

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"io"

	"github.com/sena/cdattg-web-golang/config"
)

// sofia_crypto.go
// Cifrado reversible (AES-256-GCM) para las contraseñas de SofiaPlus de cada operador.
// La clave sale de SOFIA_ENC_KEY (se deriva con SHA-256 para obtener 32 bytes exactos).
// La contraseña se descifra SOLO en memoria, justo antes de usarla en el login.

var errSinClaveCifrado = errors.New("SOFIA_ENC_KEY no está configurada: el administrador debe definirla para guardar credenciales")

func sofiaEncKey() ([]byte, error) {
	raw := config.AppConfig.Sofia.EncKey
	if raw == "" {
		return nil, errSinClaveCifrado
	}
	sum := sha256.Sum256([]byte(raw))
	return sum[:], nil
}

// cifrarSecreto cifra un texto y devuelve base64(nonce||ciphertext).
func cifrarSecreto(plano string) (string, error) {
	key, err := sofiaEncKey()
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	nonce := make([]byte, gcm.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", err
	}
	ct := gcm.Seal(nonce, nonce, []byte(plano), nil)
	return base64.StdEncoding.EncodeToString(ct), nil
}

// descifrarSecreto revierte cifrarSecreto.
func descifrarSecreto(enc string) (string, error) {
	key, err := sofiaEncKey()
	if err != nil {
		return "", err
	}
	data, err := base64.StdEncoding.DecodeString(enc)
	if err != nil {
		return "", err
	}
	block, err := aes.NewCipher(key)
	if err != nil {
		return "", err
	}
	gcm, err := cipher.NewGCM(block)
	if err != nil {
		return "", err
	}
	if len(data) < gcm.NonceSize() {
		return "", errors.New("dato cifrado inválido")
	}
	nonce, ct := data[:gcm.NonceSize()], data[gcm.NonceSize():]
	plano, err := gcm.Open(nil, nonce, ct, nil)
	if err != nil {
		return "", err
	}
	return string(plano), nil
}
