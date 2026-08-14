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
