# n8n DataTable Viewer

[![Docker Hub](https://img.shields.io/docker/pulls/kpa90/n8n-datatable-viewer?logo=docker)](https://hub.docker.com/r/kpa90/n8n-datatable-viewer)

Prosty interfejs webowy do przeglądania i edytowania DataTable w n8n.

## Funkcje

- Wybór tabeli z dropdown
- Sortowanie kolumn (klik w nagłówek)
- Filtrowanie per-kolumna (tekst lub true/false dla boolean)
- Edycja inline — klik w komórkę, Enter zatwierdza (z walidacją liczb)
- Ukrywanie/pokazywanie kolumn (przycisk "Kolumny" w toolbarze)
- Zmiana szerokości kolumn przeciągnięciem krawędzi nagłówka
- Klikalne URL-e — otwierają się w nowej karcie, edycja przez ikonę ołówka
- Toggle switch dla kolumn `boolean`
- Paginacja po stronie klienta (50 wierszy/strona)
- Optymistyczny zapis z rollbackiem przy błędzie
- Proxy backend — API key nigdy nie trafia do przeglądarki
- Healthcheck (`/healthz`) zintegrowany z Docker

## Ograniczenia

- Lista tabel ładowana jest do 250 pozycji; powyżej tej liczby pojawia się ostrzeżenie o obcięciu.
- Wiersze ładowane są w całości do przeglądarki (do 10 000 na tabelę — powyżej tego progu widok pokazuje ostrzeżenie). Sortowanie i filtry działają na załadowanym zakresie.
- Kolumny `date` z pełnym znacznikiem czasu (ISO) edytowane są jako tekst, aby uniknąć cichego gubienia czasu/strefy; czyste daty (`YYYY-MM-DD`) używają natywnego pickera.

## Uruchomienie

Obraz dostępny na [Docker Hub](https://hub.docker.com/r/kpa90/n8n-datatable-viewer) — multi-arch (`linux/arm64` + `linux/amd64`).

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

## Licencja

[MIT](LICENSE)
