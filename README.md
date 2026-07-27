# Knowledge Vault — Hybrid Personal Knowledge Management (PKM)

A modern, local-first Personal Knowledge Management workspace combining **Notesnook** (UI, Security & Rich Formatting), **Obsidian** (Markdown, [[WikiLinks]], Graph View, & Vault Sync), and **AFFiNE** (2D Visual Canvas).

---

## 🚀 Key Features

- **Notesnook Rich UI & Security**:
  - Exact Notesnook rich formatting toolbar (Bold, Italic, Underline, Strikethrough, Text Highlights, Font Family/Size, Lists, Callouts).
  - Inline "Add a tag..." input & document outline map (`¶`).
  - Client-side **AES-256 GCM** password-encrypted vaults.
  - Multi-language localization (**RU, EN, DE, ES, FR**).

- **Obsidian Core Engine & Vault Sync**:
  - Plain `.md` Markdown files & bi-directional `[[wiki-links]]`.
  - Interactive 2D Graph view.
  - **Obsidian Vault Import & Export**: One-click export and import of Obsidian `.md` vault files.

- **AFFiNE Visual Canvas**:
  - Interactive 2D whiteboard canvas with draggable cards, arrows, and node connections.

- **AI Copilot & Audio Notes**:
  - **Free AI Copilot Assistant**: Integrated Google Gemini 1.5 Flash API (100% free tier) + offline local prompt assistant.
  - **Voice Notes Recorder**: Record HTML5 audio notes directly inside Markdown notes.
  - **PDF & Standalone HTML Export**: One-click document printing/exporting.

---

## 💻 Running Locally

### 1. Web Application
```bash
npm run dev
```
Open `http://localhost:3000` in your browser.

### 2. Self-Hosted Sync Server
```bash
npm run server
```
Runs REST API on `http://localhost:4000` and WebSocket listener on `ws://localhost:8080`.

---

## 📦 Building Executable Packages (.exe & .apk)

### Windows Executable (.exe)
```bash
npm run build:exe
```

### Android Application (.apk)
```bash
npm run build:apk
```
