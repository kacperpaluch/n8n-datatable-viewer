# n8n DataTable Viewer

[![Docker Hub](https://img.shields.io/docker/pulls/kpa90/n8n-datatable-viewer?logo=docker)](https://hub.docker.com/r/kpa90/n8n-datatable-viewer)

Prosty interfejs webowy do przeglądania i edytowania DataTable w n8n.

## Funkcje

- Wybór tabeli z dropdown
- Zapamiętanie ostatnio wybranej tabeli (localStorage) — otwiera się automatycznie na starcie
- Przycisk "n8n webhook" w toolbarze (opcjonalny, konfigurowalny per tabela) — wyzwala workflow n8n, po odpowiedzi tabela odświeża się sama
- Sortowanie kolumn (klik w nagłówek)
- Przycisk "Pomieszaj" — losowa kolejność wierszy (Fisher-Yates) po stronie przeglądarki, bez zapisu do n8n; działa na każdej tabeli
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
# Uzupełnij N8N_URL, N8N_API_KEY i (opcjonalnie) WEBHOOKS w .env
docker compose up -d
```

Aplikacja dostępna na **http://localhost:3000**

### Przycisk "n8n webhook" (opcjonalny)

Aby w toolbarze tabeli pojawił się przycisk wyzwalający workflow n8n przez webhook, dodaj do env var `WEBHOOKS` mapowanie: nazwa tabeli (`name` z API n8n) → ścieżka webhooka (UUID z n8n, bez domeny). Backend trzyma sekret — przeglądarka widzi tylko listę nazw.

Przykład dla tabeli `ang_anki` i webhooka n8n o ścieżce `0e0c3430-0edb-4e78-bf24-faaeb99f3b48`:

```json
WEBHOOKS={"ang_anki":"0e0c3430-0edb-4e78-bf24-faaeb99f3b48"}
```

W Portainerze: zakładka **Container → Env** → dodaj zmienną `WEBHOOKS` z wartością `{"ang_anki":"0e0c3430-..."}` (jako string). Po kliknięciu przycisku ⚡ w toolbarze dashboard woła backend, który przekazuje POST do n8n; po odpowiedzi tabela odświeża się sama.

## Zmienne środowiskowe

| Zmienna | Opis | Przykład |
|---|---|---|
| `N8N_URL` | Adres instancji n8n | `https://n8n.example.com` |
| `N8N_API_KEY` | Klucz API n8n | `eyJhbGci...` |
| `WEBHOOKS` | JSON: nazwa tabeli → ścieżka webhooka n8n (UUID). Backend trzyma sekret, przeglądarka widzi tylko listę nazw. | `{"ang_anki":"0e0c3430-..."}` |

Klucz API generujesz w n8n: **Settings → API → Create API Key**

## Stack

- **Frontend**: React + Vite + TanStack Table + Tailwind CSS
- **Backend**: Express.js (proxy do n8n API)
- **Docker**: multi-stage build, obraz `node:20-alpine`

## Licencja

[MIT](LICENSE)
