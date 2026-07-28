package handlers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/sena/cdattg-web-golang/version"
)

// GetVersion responde la versión SemVer del monorepo (público, sin auth).
func GetVersion(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{"version": version.Version})
}
