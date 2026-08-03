<div align="center">

<img src="https://i.postimg.cc/s2ckXQk6/LOGO-FINAL.png" alt="GOAT Code Editor Logo" width="120" height="120" style="border-radius: 50%;" />

# GOAT Code Editor (GOAT CE)

**Real-time collaborative IDE with Monaco, Socket.io, GOAT CE AI, PostgreSQL, Cloudinary & Live execution**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](./LICENSE)
[![Code Thugs 2k26](https://img.shields.io/badge/🏆_Code_Thugs_2k26-1st_Place_National_Winner-FFD700?style=for-the-badge)]()

### 🔗 Live URL: [goatcode-editor.onrender.com](https://goatcode-editor.onrender.com)
### 👨‍💻 Developer Portfolio: [Tharunkumar Portfolio](https://tharunkumark4743.netlify.app/)

</div>

---

## 🏆 Award & Recognition

<div align="center">

| 🥇 | Code Thugs 2k26 — National Hackathon |
|:---:|---|
| **Rank** | 🥇 **1st Place — National Winner** |
| **Project** | GOAT Code Editor (GOAT CE) |
| **Highlights** | Live AST sync · Operational Transformation · Multi-user conflict resolution |

</div>

> Built **entirely during Code Thugs 2k26**, this project won **1st place nationally** for its real-time collaboration engine featuring live AST synchronisation, operational transformation, and multi-user conflict resolution — all delivered under hackathon conditions.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 🔴 **Real-time Collaboration** | Share a 4–6 digit Room ID — code syncs instantly to all users via WebSocket |
| 🎯 **Live Cursors** | See every user's cursor and text selection in real time with unique colours |
| ☀️ **Light / Dark Mode Toggle** | Seamless dynamic theme switching between VS-Dark and VS-Light with uniform panel backgrounds |
| 🤖 **GOAT CE AI** | Context-aware code explanations, refactoring, debugging, and unit test generation with instant code injection |
| ⚡ **Monaco Editor** | Full VS Code kernel — syntax highlighting, minimap, Fira Code font, smooth cursor |
| 🖥️ **Built-in Terminal** | Execute 13 languages in-browser via sandboxed Piston API + AI fallback |
| 👁️ **Live Preview** | Instant HTML/CSS render in an embedded iframe — no server round-trip |
| 💬 **Live Chat & Media Upload** | Real-time in-room messaging with Cloudinary image and file attachment support |
| 📸 **Code Timeline History** | Save code states per room and roll back instantly with snapshot history |
| 💾 **PostgreSQL Persistence** | Relational storage for room states and snapshot timelines with automatic table initialization |
| ☁️ **Cloudinary Integration** | Secure streaming media uploads directly from team chat |
| 📱 **Zero-Scroll Responsive Layout** | Clean viewport-locked landing page tailored for mobile, tablet, and desktop screens |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│                   Browser                    │
│  React 19 + Monaco Editor + Socket.io Client │
│  Light / Dark Mode + HashRouter             │
└──────────────────────┬──────────────────────┘
                       │ HTTP + WebSocket
┌──────────────────────▼──────────────────────┐
│        Express 5 Server  (server/index.cjs)  │
│  ├─ Static: serves dist/ (Vite build)       │
│  ├─ Socket.io: real-time sync + cursors     │
│  ├─ REST API: /api/upload (Cloudinary)      │
│  ├─ REST catch-all: SPA fallback            │
│  └─ Dual store: PostgreSQL + in-memory      │
└──────────┬─────────────────────┬────────────┘
           │                     │
  ┌────────▼────────┐   ┌────────▼────────────┐
  │   PostgreSQL    │   │   Piston API v2      │
  │  Rooms / Code   │   │  (sandboxed runner   │
  │  Snapshots      │   │   13 languages)      │
  └────────┬────────┘   └──────────────────────┘
           │                     │
  ┌────────▼────────┐   ┌────────▼────────────┐
  │   Cloudinary    │   │  OpenRouter API      │
  │ Media Assets &  │   │  Llama 3.1 70B       │
  │ File Uploads    │   │  • GOAT CE AI        │
  └─────────────────┘   │  • Execution fallback│
                        └─────────────────────┘
```

---

## 🗂️ Project Structure

```
goat-code-editor/
├── components/
│   ├── AIAssistant.tsx     # GOAT CE AI panel — OpenRouter, quick actions, code injection
│   ├── ChatBox.tsx         # Real-time team chat with Cloudinary file attachment support
│   ├── Terminal.tsx        # Output display (Piston + AI fallback)
│   └── TopBar.tsx          # Language selector, Light/Dark toggle, Save, Run, Share, Room ID
├── pages/
│   ├── EditorPage.tsx      # Core editor — Monaco, Socket.io, cursors, theme state, timeline
│   └── LandingPage.tsx     # Viewport-locked room join/create page (4–6 digit validation)
├── server/
│   └── index.cjs           # Express 5 + Socket.io + PostgreSQL + Cloudinary backend
├── App.tsx                 # HashRouter + route definitions
├── constants.tsx           # Circular Logo icon, COLORS[], DEFAULT_CODE per language
├── types.ts                # User, ChatMessage, RoomState, EditorLanguage enum (16 langs)
├── index.tsx               # React 19 DOM entry
├── vite.config.ts          # Vite 6 config — exposes OpenRouter env vars to browser
├── package.json            # Scripts: dev, build, server
├── run-all.bat             # Windows: launch backend + frontend simultaneously
├── run-back.bat            # Windows: launch backend server (port 5001)
└── run-front.bat           # Windows: launch Vite frontend (port 3000)
```

---

## ⚙️ Supported Languages

| Language | Syntax | Piston Execution | AI Fallback | Preview |
|---|:---:|:---:|:---:|:---:|
| JavaScript | ✅ | ✅ | ✅ | 👁️ Live |
| TypeScript | ✅ | ✅ | ✅ | — |
| Python | ✅ | ✅ | ✅ | — |
| Java | ✅ | ✅ | ✅ | — |
| C++ | ✅ | ✅ | ✅ | — |
| C# | ✅ | ✅ | ✅ | — |
| Go | ✅ | ✅ | ✅ | — |
| Rust | ✅ | ✅ | ✅ | — |
| PHP | ✅ | ✅ | ✅ | — |
| Ruby | ✅ | ✅ | ✅ | — |
| Swift | ✅ | ✅ | ✅ | — |
| Kotlin | ✅ | ✅ | ✅ | — |
| SQL | ✅ | ✅ | ✅ | — |
| HTML | ✅ | — | — | 👁️ Live |
| CSS | ✅ | — | — | 👁️ Live |
| Markdown | ✅ | — | — | — |

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+
- **PostgreSQL Database** (local or Neon / Supabase / Render Postgres)
- **Cloudinary Account** — [cloudinary.com](https://cloudinary.com)
- **OpenRouter API Key** — [openrouter.ai](https://openrouter.ai)

### 1. Clone & Install

```bash
git clone https://github.com/Tharun4743/GOAT-CE.git
cd GOAT-CE
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
PORT=5001
NODE_ENV=development
DATABASE_URL=postgresql://user:password@localhost:5432/goat_editor
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
OPENROUTER_API_KEY=your_openrouter_key
OPENROUTER_MODEL=meta-llama/llama-3.1-70b-instruct
```

### 3. Run Locally

```bash
# Terminal 1 — Backend (Express + Socket.io + PostgreSQL)
npm run server

# Terminal 2 — Frontend (Vite dev server)
npm run dev
```

| Service | URL |
|---|---|
| Frontend (Vite) | http://localhost:3000 |
| Backend (Express + Socket.io) | http://localhost:5001 |

---

## 🧰 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React + TypeScript | 19.2 / 5.8 |
| **Build Tool** | Vite | 6.2 |
| **Styling** | Tailwind CSS (CDN) | 3.x |
| **Editor** | Monaco Editor (`@monaco-editor/react`) | 4.7 |
| **Real-time** | Socket.io (WebSocket + polling fallback) | 4.8 |
| **Backend** | Express (CommonJS) | 5.2 |
| **Database** | PostgreSQL (`pg`) | 8.13 |
| **Media Storage** | Cloudinary + Multer | 2.5 / 1.4 |
| **AI Engine** | OpenRouter — Llama 3.1 70B Instruct | — |
| **Code Runner** | Piston API v2 | — |

---

## 👨‍💻 Team

<div align="center">

| Name | Role | GitHub | Portfolio |
|---|---|---|---|
| **Tharunkumar** | Full-Stack Developer · Architect | [@Tharun4743](https://github.com/Tharun4743) | [Portfolio](https://tharunkumark4743.netlify.app/) |
| **Pratap** | Full-Stack Developer · Co-Architect | [@PratapSakthivel](https://github.com/PratapSakthivel) | — |

</div>

---

## 📄 License

MIT © Tharunkumar & Pratap — Team GOAT CE
