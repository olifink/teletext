# German Videotext / Teletext Scraping Suite & Modern Web Viewer

A modern, high-performance solution for extracting, normalizing, and faithfully rendering live German public broadcast Videotext/Teletext content (ARD Text, ZDF Text, 3sat Text, WDR Text, and HR Text).

![Angular 22+](https://img.shields.io/badge/Angular-22+-DD0031?logo=angular&logoColor=white)
![Bun Runtime](https://img.shields.io/badge/Bun-1.3+-FBF0DF?logo=bun&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?logo=typescript&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Offline--Ready-5A0FC8?logo=pwa&logoColor=white)

---

## 🚀 Features

### 📺 Core Scraping & Parsing Engine (`@teletext/core`)
* **Standard 40×24 Teletext Grid**: Normalizes heterogeneous broadcast markup into standard Level 1/1.5 teletext cell matrices.
* **Standard 8-Color Palette**: Teletext color mapping (`black`, `red`, `green`, `yellow`, `blue`, `magenta`, `cyan`, `white`).
* **Block Graphics / Mosaic G1 Decoder**: Converts broadcast mosaic sub-pixels and line-draw fonts into Unicode 13.0 legacy computing block characters.
* **Link Extraction & Fast-Text**: Auto-detects embedded 3-digit page numbers (100–899) and extracts bottom Red, Green, Yellow, Blue navigation links.
* **Multi-Channel Provider Adapter Suite**:
  * **ARD Text** (`ard`): Das Erste news, tagesschau, sports, weather
  * **ZDF Text** (`zdf`): ZDF Heute, sports, program guide, lotto
  * **3sat Text** (`3sat`): Culture, science (nano, Kulturzeit), D-A-CH weather
  * **WDR Text** (`wdr`): NRW regional news, traffic/congestion alerts, weather
  * **HR Text** (`hr`): Hessischer Rundfunk regional news, Hessen sport, bioweather
* **In-Memory Cache & Polite Throttler**: TTL-based cache with request coalescing to prevent redundant network fetches.
* **ANSI Terminal CLI & Bun HTTP API**: Instant colored terminal viewer and JSON REST API.

### 🌐 Angular 22+ PWA Web Viewer (`packages/viewer`)
* **Zoneless & Signals-first**: Modern Angular 22 standalone architecture with reactive signal stores.
* **Authentic CRT Viewport Engine**:
  * Retro CRT television mode with scanlines, tube vignette curvature, phosphor glow, and flicker.
  * Modern pixel-sharp clean mode.
* **📺 Full-Screen TV-Only Mode**:
  * Minimalist edge-to-edge television view hiding all chrome controls (`[T]` or `Esc`).
* **Interactive Navigation & Remote**:
  * Physical keyboard input (type `1`, `0`, `0` to jump; `R`, `G`, `Y`, `B` for Fast-Text; `T` for TV-mode; `M` for CRT mode; `F` for bookmark; `S` for search).
  * On-screen retro TV remote numpad (0–9, DEL, CLR, Page ▲/▼, Sub ◀/▶).
  * Direct clickable 3-digit page links within page text.
* **Sub-page Carousel**: Manual stepping, numbered pill buttons, and auto-rotation with an animated progress bar.
* **Local-first Bookmarks & Search**: Pin favorite pages to local storage; search across featured indices and cached pages.
* **PWA & Offline Ready**: Service Worker caching, manifest, and multi-resolution adaptive app icons.
* **Web Audio Sound Effects**: Subtle mechanical remote clicks, frequency jump beeps, and CRT toggle chirps.

---

## 🐳 How to Run (Docker)

The application includes a unified multi-stage Docker container that runs both the backend scraper API and the Angular PWA Web Viewer on a single port.

### Option 1: Docker Compose (Recommended)
```bash
# Start container in detached mode
docker compose up -d

# View container logs
docker compose logs -f

# Stop container
docker compose down
```

### Option 2: Docker CLI
```bash
# Build local image
docker build -t teletext-suite .

# Run container on port 3000
docker run -d -p 3000:3000 --name teletext-app --restart unless-stopped teletext-suite
```

### Option 3: Pre-built GitHub Container Registry Image
```bash
docker run -d -p 3000:3000 --name teletext-app ghcr.io/<owner>/teletext:latest
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🛠️ Local Development

### 1. Prerequisites
* [Bun](https://bun.sh/) (v1.3+)
* [Node.js](https://nodejs.org/) (v22+)

### 2. Install Dependencies & Build
```bash
# Install workspace dependencies
bun install

# Build all packages (Core library + Angular Viewer)
bun run build
```

### 3. Run the CLI Tool
Fetch and render any page directly in your terminal with colored ANSI output:
```bash
# ARD Text Page 100
bun cli ard 100

# ZDF Text Page 112 (News overview)
bun cli zdf 112

# 3sat Text Page 100
bun cli 3sat 100

# WDR Text Page 100
bun cli wdr 100

# HR Text Page 100
bun cli hr 100

# Output as raw JSON
bun cli zdf 100 --json

# List supported broadcasters and featured pages
bun cli --channels
```

### 4. Start the Unified Server Locally
```bash
# Serves both the REST API (/api/*) and the compiled PWA web viewer
bun server
```
Then visit [http://localhost:3000](http://localhost:3000).

For hot-reloading Angular development:
```bash
# Terminal 1: Backend API
bun server

# Terminal 2: Angular Dev Server
cd packages/viewer && bun start
```

### 5. Running Tests
```bash
# Run unit & parser test suite
bun run test
```

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `0` – `9` | Type 3-digit page number (e.g. `100`, `200`) |
| `▲` / `▼` or `PgUp` / `PgDn` | Previous / Next Page |
| `Shift + ◀` / `Shift + ▶` | Previous / Next Sub-page |
| `R`, `G`, `Y`, `B` | FastText Red, Green, Yellow, Blue color jump |
| `T` | Toggle **Full-Screen TV-Only Mode** |
| `M` | Toggle **CRT Scanline / Pixel-Sharp Mode** |
| `F` | Toggle Bookmark / Favorite for current page |
| `S` or `/` | Open Search & Index Dialog |
| `Esc` | Clear keypad buffer / Exit TV mode / Close search |

---

## 📡 REST API Reference

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health status |
| `GET` | `/api/channels` | List supported broadcaster metadata and featured pages |
| `GET` | `/api/page/:channel/:pageNumber` | Get normalized 40×24 Teletext page JSON |
| `GET` | `/api/page/:channel/:pageNumber?sub=2` | Get specific subpage index |
| `GET` | `/api/page/:channel/:pageNumber?refresh=1` | Force bypass cache |

---

## 📂 Project Structure

```
teletext/
├── .github/
│   └── workflows/
│       └── docker-publish.yml # Automated CI & GHCR Docker publish workflow
├── Dockerfile                 # Multi-stage container build (Node 22 + Bun)
├── docker-compose.yml         # Container orchestration setup
├── BRIEF.md                   # Technical specification & broadcaster list
├── package.json               # Root monorepo workspace configuration
├── packages/
│   ├── core/                  # Bun / TypeScript Scraping & Parsing Library
│   │   ├── src/
│   │   │   ├── models/        # Cell, Colors, Page, Provider models
│   │   │   ├── parser/        # Grid, HTML sanitizer, Mosaic G1, Link extractor
│   │   │   ├── cache/         # MemoryCache, CacheManager, Throttler
│   │   │   ├── providers/     # ARD, ZDF, 3sat, WDR, HR provider adapters
│   │   │   ├── cli/           # Terminal ANSI renderer & CLI binary
│   │   │   └── server/        # Bun HTTP REST API & static file server
│   │   └── test/              # Bun unit test suite
│   │
│   └── viewer/                # Angular 22+ Standalone PWA
│       ├── public/            # PWA manifest, service worker config & icon assets
│       └── src/app/
│           ├── core/          # Signals state, Audio synthesizer, Keypad & Storage
│           └── components/    # TeletextScreen (CRT), Toolbar, FastText, Keypad, Bookmarks, Search
```
