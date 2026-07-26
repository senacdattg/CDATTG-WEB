#!/bin/sh
set -e
mkdir -p /app/storage/asistencia_pdfs /app/storage/sofia_diagnostico
exec /app/cdattg-api
