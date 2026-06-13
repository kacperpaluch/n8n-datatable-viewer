# n8n DataTable Viewer

[![Docker Hub](https://img.shields.io/docker/pulls/kpa90/n8n-datatable-viewer?logo=docker)](https://hub.docker.com/r/kpa90/n8n-datatable-viewer)

Prosty interfejs webowy do przeglądania i edytowania DataTable w n8n.

## Funkcje

- Wybór tabeli z dropdown
- Sortowanie kolumn (klik w nagłówek)
- Filtrowanie per-kolumna (tekst lub true/false dla boolean)
- Edycja inline — klik w komórkę, Enter zatwierdza
- Toggle switch dla kolumn `boolean`
- Paginacja po stronie klienta (50 wierszy/strona)
- Proxy backend — API key nigdy nie trafia do przeglądarki

## Uruchomienie

```bash
cp .env.example .env
# Uzupełnij N8N_URL i N8N_API_KEY w .env
docker compose up -d
```

Aplikacja dostępna na **http://localhost:3000**

## Zmienne środowiskowe

| Zmienna | Opis | Przykład |
|---|---|---|
| `N8N_URL` | Adres instancji n8n | `https://n8n.example.com` |
| `N8N_API_KEY` | Klucz API n8n | `eyJhbGci...` |

Klucz API generujesz w n8n: **Settings → API → Create API Key**

## Stack

- **Frontend**: React + Vite + TanStack Table + Tailwind CSS
- **Backend**: Express.js (proxy do n8n API)
- **Docker**: multi-stage build, obraz `node:20-alpine`
