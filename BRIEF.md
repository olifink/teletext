# Technical Specification: German Videotext / Teletext Scraping Suite & Modern Web Viewer

## 1. Project Overview & Objectives
The goal of this project is to build a modern, high-performance solution for extracting, normalizing, and displaying live German public broadcast Videotext/Teletext content (e.g., ARD Text, ZDF Text, HR Text, WDR Text). 

The solution consists of two primary components:
1. **Core Scraping & Parsing Library**: A lightweight, fast TypeScript library built for the Bun runtime.
2. **Web Viewer Application**: A modern, local-first Progressive Web Application (PWA) built with Angular 22+.

---

## 2. Component A: Core Scraping & Parsing Library

### 2.1 Technology Stack & Runtime
* **Runtime**: Bun (latest)
* **Language**: TypeScript (Strict Mode)
* **Target Environment**: Server-side / Edge Workers / CLI toolchain

### 2.2 Core Responsibilities
* **Provider Abstraction**: Standardized adapter pattern to ingest raw HTML or endpoint payloads from target German Videotext web portals (e.g., `ard-text.de`, `teletext.zdf.de`, `hr-text.de`).
* **Page Resolution**: Request pages by 3-digit number (100–899) and sub-page index where applicable.
* **Teletext Grid Data Model**:
  * Normalize raw HTML representations into a standard 40-character × 24-row text grid.
  * Preserve teletext metadata (page title, channel/broadcaster ID, header line, timestamp, sub-page counts).
  * Parse inline structural attributes: text content, background/foreground colors (standard Teletext 8-color palette), flash attributes, and block-graphics/teletext character flags where present.
  * Extract navigational links embedded in pages (e.g., references to other 3-digit page numbers).
* **Caching & Polling Management**:
  * Built-in HTTP caching headers handling (ETag / If-Modified-Since).
  * Rate-limiting and polite request throttling per broadcaster host.
* **Export & Serialization**:
  * Clean JSON output schema for consumption by API layers or client applications.
  * Standardized error handling for non-existent pages, connection timeouts, or structure changes.

---

## 3. Component B: Angular 22+ PWA Viewer Application

### 3.1 Technology Stack & Principles
* **Framework**: Angular 22+ (Signals-first, Standalone Components, Zoneless architecture)
* **UI Framework**: Material 3 Expressive UI
* **Design Philosophy**: Local-first Progressive Web App (PWA), zero user tracking, minimal external dependencies, offline-capable layout shell with intelligent offline caching for visited pages.

### 3.2 Key Features & User Interface

#### 3.2.1 Channel & Provider Selection
* Top-level selector switching between supported public channels (ARD, ZDF, HR, WDR, 3sat, etc.).
* Visual feedback showing live connection status and last update time for the current channel.

#### 3.2.2 Authenticated / Faithful Teletext Display Engine
* Pixel-perfect or font-accurate Teletext rendering viewport (using monospace grid / Teletext web fonts).
* Support for classical Teletext color schemes (Yellow, Cyan, Green, Magenta, Red, Blue, White, Black).
* Render grid cells preserving aspect ratios, headers, sub-page indicators, and fast-text navigational hints (Red/Green/Yellow/Blue quick links at the bottom).

#### 3.2.3 Interactive Navigation & Input
* **Direct Page Input**: On-screen 3-digit keypad, physical keyboard input (0–9), and page increment/decrement controls.
* **Hyperlink Support**: Clickable/tappable 3-digit page numbers inside page content and fast-text buttons to jump directly to referenced pages.
* **Sub-page Carousel / Navigation**: Manual pause and swipe/button controls for multi-page articles (sub-pages).

#### 3.2.4 Modern PWA Enhancements
* **Favorites / Bookmarks**: Pin frequently visited pages (e.g., 100 Main News, 200 Sports, 300 Weather) stored locally on device.
* **Offline Storage**: Service Worker caching enabling cached viewing of previously retrieved pages while offline.
* **Search / Indexing**: Text search across cached pages or direct index navigation.
* **Responsive Layout**: Seamless switching between a authentic retro CRT display mode on desktop/tablets and a responsive compact view on mobile devices.

---

## 4. Architecture & Data Flow

```
[ Broadcaster Portals ]  <-- (HTTP GET / HTML) --  [ Scraping Library (Bun/TS) ]
 (ARD, ZDF, HR, etc.)                                          │
                                                               ▼
                                                      [ JSON Page Data ]
                                                               │
                                                               ▼
[ Angular 22+ PWA Client ] <── (Signals State) ── [ PWA Service / Cache Layer ]
```

---

## 5. Non-Functional & Quality Requirements
* **Privacy & Security**: Zero telemetry, no third-party tracking scripts, local storage only.
* **Performance**: Sub-100ms render pipeline for parsed page signals into the Angular Signal grid state.
* **Resilience**: Graceful fallbacks when a broadcaster web portal modifies its markup structure or experiences downtime.

---

Here is the curated list of target German Videotext services and their public URLs to include in the agent’s configuration or target provider registry.

---

## 1. National Broadcasters (Primary Targets)

### **ARD Text (Das Erste)**

* **Desktop / Web Endpoint:** `[https://www.ard-text.de/](https://www.ard-text.de/)`
* **Mobile / Lightweight Portal:** `[https://www.ard-text.de/mobil](https://www.ard-text.de/mobil)`
* **URL Structure Pattern:**
* `[https://www.ard-text.de/index.php?page=100](https://www.ard-text.de/index.php?page=100)` (Page 100 Main News)
* `[https://www.ard-text.de/index.php?page=100&sub=1](https://www.ard-text.de/index.php?page=100&sub=1)` (Sub-pages)



### **ZDF Text**

* **Desktop / Web Endpoint:** `[https://teletext.zdf.de/](https://teletext.zdf.de/)`
* **URL Structure Pattern:**
* `[https://teletext.zdf.de/teletext/zdf/seiten/100.html](https://teletext.zdf.de/teletext/zdf/seiten/100.html)`
* `[https://teletext.zdf.de/teletext/zdf/seiten/100_1.html](https://teletext.zdf.de/teletext/zdf/seiten/100_1.html)` (Sub-page format)



---

## 2. Regional Public Broadcasters (Third Programs / ARD Network)

### **HR Text (Hessischer Rundfunk)**

* **Web Portal:** `[https://www.hr-text.de/](https://www.hr-text.de/)`
* **URL Pattern:** `[https://www.hr-text.de/index.php?page=100](https://www.hr-text.de/index.php?page=100)`

### **WDR Text (Westdeutscher Rundfunk)**

* **Web Portal:** `[https://www.wdrtext.de/](https://www.wdrtext.de/)`
* **Mobile / Clean HTML Endpoint:** `[https://mobiltext.wdr.de/](https://mobiltext.wdr.de/)`
* **URL Pattern:** `[https://mobiltext.wdr.de/100.html](https://mobiltext.wdr.de/100.html)`

### **NDR Text (Norddeutscher Rundfunk)**

* **Web Portal:** `[https://www.ndr.de/fernsehen/teletext/](https://www.ndr.de/fernsehen/teletext/)`
* **Mobile / Clean Endpoint:** `[https://mobiltext.ndr.de/](https://mobiltext.ndr.de/)`
* **URL Pattern:** `[https://mobiltext.ndr.de/100.html](https://mobiltext.ndr.de/100.html)`

### **SWR Text (Südwestrundfunk)**

* **Web Portal:** `[https://www.swrtext.de/](https://www.swrtext.de/)`
* **URL Pattern:** `[https://www.swrtext.de/index.php?page=100](https://www.swrtext.de/index.php?page=100)`

### **MDR Text (Mitteldeutscher Rundfunk)**

* **Web Portal:** `[https://www.mdr.de/teletext/](https://www.mdr.de/teletext/)`
* **URL Pattern:** `[https://www.mdr.de/teletext/pages/100.html](https://www.mdr.de/teletext/pages/100.html)`

---

## 3. Cultural & Joint Public Broadcasters

### **3sat Text**

* **Web Portal:** `[https://teletext.3sat.de/](https://teletext.3sat.de/)`
* **URL Pattern:** `[https://teletext.3sat.de/teletext/3sat/seiten/100.html](https://teletext.3sat.de/teletext/3sat/seiten/100.html)`

---

## 4. Commercial Broadcasters (Alternative Endpoints)

### **n-tv Text (Private News Channel)**

* **Direct JSON API Endpoint:** `[https://www.n-tv.de/mediathek/teletext/](https://www.n-tv.de/mediathek/teletext/)`
* **URL Pattern:** `[https://www.n-tv.de/mediathek/teletext/page/100](https://www.n-tv.de/mediathek/teletext/page/100)` *(Returns raw JSON structures directly without needing heavy HTML scraping)*

---

## Agent Strategy Recommendation

* **Primary Target Candidates for MVP:** `ARD Text` and `ZDF Text` (highest availability, structured page hierarchies).
* **Cleanest Parsing Target:** Mobile endpoints like `ard-text.de/mobil` or `mobiltext.wdr.de` serve pre-rendered HTML grids with minimal JS overhead, making them ideal targets for fast `Bun`-based scrapers.
