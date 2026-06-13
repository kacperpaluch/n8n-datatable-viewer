## n8n DataTable Viewer

Interfejs webowy do przeglądania i edytowania tabel DataTable w n8n. Obsługuje sortowanie, filtrowanie per-kolumna (w tym tryb `true/false` dla boolean), edycję inline i paginację.

## Szybki start

```bash
docker run -d \
  -p 3000:3000 \
  -e N8N_URL=https://twoj-n8n.example.com \
  -e N8N_API_KEY=twoj-klucz-api \
  kpa90/n8n-datatable-viewer:latest
```

Lub z `docker-compose.yml`:

```yaml
services:
  datatable-viewer:
    image: kpa90/n8n-datatable-viewer:latest
    ports:
      - "3000:3000"
    environment:
      N8N_URL: https://twoj-n8n.example.com
      N8N_API_KEY: twoj-klucz-api
    restart: unless-stopped
```

Klucz API generujesz w n8n: **Settings → API → Create API Key**

## Bezpieczeństwo

Backend działa jako proxy — API key nigdy nie trafia do przeglądarki. Przeglądarka komunikuje się wyłącznie z lokalnym serwerem (ten sam origin = brak CORS).

## Kod źródłowy

[github.com/kacperpaluch/n8n-datatable-viewer](https://github.com/kacperpaluch/n8n-datatable-viewer)
