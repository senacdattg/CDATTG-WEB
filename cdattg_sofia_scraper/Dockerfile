FROM pyd4vinci/scrapling:0.4.13

# La imagen base instala Scrapling en /app; no sobrescribir ese directorio.
WORKDIR /srv/sofia-scraper

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/app/.venv/bin:${PATH}" \
    SOFIA_HEADLESS=false

RUN apt-get update && apt-get install -y --no-install-recommends \
        procps \
        xvfb \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /srv/sofia-scraper/storage/sofia_diagnostico /srv/sofia-scraper/storage/betowa_diagnostico

COPY requirements.txt .
RUN uv pip install --python /app/.venv/bin/python --no-cache-dir -r requirements.txt

# Instalar el binario de Chromium que espera el patchright del venv.
# La imagen base puede traer una revisión distinta (skew de versiones) y sin
# esto el scraper falla con "Executable doesn't exist at .../chromium-<rev>".
RUN /app/.venv/bin/python -m patchright install chromium

COPY app ./app
COPY entrypoint.sh ./entrypoint.sh
RUN sed -i 's/\r$//' /srv/sofia-scraper/entrypoint.sh \
    && chmod +x /srv/sofia-scraper/entrypoint.sh

EXPOSE 8090

ENTRYPOINT []
CMD ["/srv/sofia-scraper/entrypoint.sh"]
