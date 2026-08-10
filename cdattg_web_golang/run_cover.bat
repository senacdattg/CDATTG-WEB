@echo off
setlocal
cd /d C:\laragon\www\cdattg_go\cdattg_web_golang

REM Preferir Go oficial (Cmder/Laragon a veces deja GOROOT incompleto → "no such tool vet")
if exist "C:\Program Files\Go\bin\go.exe" (
  set "GOROOT=C:\Program Files\Go"
  set "PATH=C:\Program Files\Go\bin;%PATH%"
)

go version
if errorlevel 1 (
  echo ERROR: go no esta en PATH. Instala Go o agrega "C:\Program Files\Go\bin" al PATH.
  exit /b 1
)

REM -vet=off evita fallar si esa shell no resuelve el tool vet
go test ./services/ -count=1 -vet=off -coverprofile=coverage.out -covermode=atomic -run "TestCobertura|TestNormalizeHoraMM|TestValidarHorarioJornadaModelAt|TestHoraFinEfectiva"
if errorlevel 1 exit /b 1

go tool cover -func=coverage.out | findstr /i "programa_formacion_import.go jornada_validation.go persona_import_service.go orden_service.go total:"

REM Sonar necesita rutas relativas al monorepo (no el module path de Go)
powershell -NoProfile -Command "(Get-Content coverage.out -Raw) -replace 'github.com/sena/cdattg-web-golang/','cdattg_web_golang/' | Set-Content coverage.sonar.out -NoNewline"
echo OK: coverage.out + coverage.sonar.out generados
endlocal
