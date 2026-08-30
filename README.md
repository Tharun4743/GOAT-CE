<div align="center">

<img src="https://i.postimg.cc/s2ckXQk6/LOGO-FINAL.png" alt="GOAT Code Editor Logo" width="120" height="120" style="border-radius: 50%;" />

# GOAT Code Editor (GOAT CE)

**Real-time collaborative IDE with Monaco, Socket.io, WebRTC 1-to-1 Voice Calling, GOAT CE AI, PostgreSQL & Live execution**

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![WebRTC](https://img.shields.io/badge/WebRTC-Audio_Call-339933?style=for-the-badge&logo=webrtc&logoColor=white)](https://webrtc.org)
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
| **Highlights** | Live AST sync · Operational Transformation · Multi-user conflict resolution · Real-time Voice Link |

</div>

> Built **entirely during Code Thugs 2k26**, this project won **1st place nationally** for its real-time collaboration engine featuring live AST synchronisation, operational transformation, and multi-user conflict resolution — all delivered under hackathon conditions.

---

## ✨ Key Features

| Feature | Description |
|---|---|
| 📞 **1-to-1 Direct Voice Calling** | Initiate direct calls with room collaborators via WebRTC. Features incoming call alert modal with audio ringtone, Accept/Decline actions, mute controls, and live active speaker volume detection. |
| 🔇 **Acoustic Echo Elimination** | Hardware-level echo cancellation, noise suppression, and single-channel audio pipeline preventing feedback loops. |
| 🧹 **Ephemeral Auto-Purge Lifecycle** | All code, chat messages, active calls, and snapshots are strictly partitioned per room and automatically purged from memory/DB when the room closes. |
| 🔴 **Real-time Collaboration** | Share a 4–6 digit Room ID — code syncs instantly to all users via WebSocket. |
| 🎯 **Live Cursors & Presence** | See every user's cursor position and text selection in real time with distinctive colors and typing indicators. |
| ☀️ **Light / Dark Mode Toggle** | Seamless dynamic theme switching between VS-Dark and VS-Light with matching panel backgrounds. |
| 🤖 **GOAT CE AI** | Context-aware code explanations, refactoring, debugging, and unit test generation with instant code injection. |
| ⚡ **Monaco Editor** | Full VS Code kernel — syntax highlighting, minimap, Fira Code font, and smooth cursor animation. |
| ↕️ **Drag-Adjustable Output Console** | Smoothly resize the bottom terminal and visual preview panel by dragging the resize handle (120px to 85vh). |
| 🖥️ **Built-in Terminal** | Execute 13 languages in-browser via sandboxed Piston API + AI fallback execution. |
| 👁️ **Live HTML/CSS Preview** | Instant HTML/CSS render in an embedded sandbox iframe without server round-trips. |
| 💬 **Live Chat & Media Upload** | Real-time in-room messaging with Cloudinary image and file attachment support. |
| 📸 **Code Timeline History** | Save code states per room and roll back instantly with snapshot history. |
| 💾 **Dual Storage Engine** | Relational PostgreSQL persistence with fallback to zero-config in-memory room store. |
| 🚀 **Render Auto-Deploy Ready** | Includes `render.yaml` Infrastructure-as-Code for zero-touch continuous deployment. |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                         Browser                         │
│  React 19 + Monaco Editor + Socket.io + WebRTC Voice    │
│  Light / Dark Mode + Dynamic Drag-Adjustable Console    │
└────────────────────────────┬────────────────────────────┘
                             │ HTTP + WebSocket + WebRTC
┌────────────────────────────▼────────────────────────────┐
│          Express 5 Server (server/index.cjs)            │
│  ├─ Static: serves dist/ (Vite build)                   │
│  ├─ Socket.io: real-time code sync + cursors + chat     │
│  ├─ WebRTC Signaling: 1-to-1 direct voice call routing  │
│  ├─ Auto-Purge: ephemeral room data cleanup on close    │
│  ├─ REST API: /api/upload (Cloudinary)                  │
│  └─ Dual store: PostgreSQL + In-Memory Store            │
└──────────┬───────────────────────────┬──────────────────┘
           │                           │
  ┌────────▼────────┐         ┌────────▼────────────┐
  │   PostgreSQL    │         │    Piston API v2    │
  │  Rooms / Code   │         │  (sandboxed runner  │
  │  Snapshots      │         │   13 languages)     │
  └────────┬────────┘         └─────────────────────┘
           │                           │
  ┌────────▼────────┐         ┌────────▼────────────┐
  │   Cloudinary    │         │    OpenRouter API   │
  │ Media Assets &  │         │    Llama 3.1 70B    │
  │ File Uploads    │         │    • GOAT CE AI     │
  └─────────────────┘         │    • AI Runner      │
                              └─────────────────────┘
```

---

## 🗂️ Project Structure

```
goat-code-editor/
├── components/
│   ├── AIAssistant.tsx         # GOAT CE AI panel — OpenRouter, quick actions, code injection
│   ├── ActiveCallBar.tsx       # Live call status dock — timer, speaking pulse, mute, end call
│   ├── IncomingCallModal.tsx   # Incoming call alert dialog with audio ringtone & accept/reject
│   ├── ChatBox.tsx             # Real-time team chat with Cloudinary file attachment support
│   ├── Terminal.tsx            # Output display (Piston + AI fallback)
│   ├── TopBar.tsx              # Language selector, Light/Dark toggle, Save, Run, Share, Room ID
│   └── VoiceCallPanel.tsx      # Voice participant roster and audio controls
├── hooks/
│   └── useVoiceCall.ts         # WebRTC 1-to-1 direct call hook, ringtones & echo cancellation
├── pages/
│   ├── EditorPage.tsx          # Core editor — Monaco, Socket.io, cursors, theme, timeline, voice
│   └── LandingPage.tsx         # Viewport-locked room join/create page (4–6 digit validation)
├── server/
│   └── index.cjs               # Express 5 + Socket.io + WebRTC signaling + auto-purge backend
├── App.tsx                     # HashRouter + route definitions
├── constants.tsx               # Circular Logo icon, COLORS[], DEFAULT_CODE per language
├── types.ts                    # User, ChatMessage, RoomState, VoicePeer, EditorLanguage enum
├── index.tsx                   # React 19 DOM entry
├── vite.config.ts              # Vite 6 config — exposes OpenRouter env vars to browser
├── render.yaml                 # Render Blueprint configuration for auto-deploy
├── package.json                # Scripts: dev, build, start, server
├── run-all.bat                 # Windows: launch backend + frontend simultaneously
├── run-back.bat                # Windows: launch backend server (port 5001)
└── run-front.bat               # Windows: launch Vite frontend (port 3000)
```

---

## 🔧 Technical Stability & Editor Calibration

- **Web Font Remeasuring:** Monaco font measuring recalibrates automatically on `document.fonts.ready` and on initial editor focus to avoid sub-pixel character drift with `Fira Code`.
- **Clamped Document Sync:** Incoming code updates clamp cursor markers to the boundary of the updated document to prevent cursor jumps.
- **Hardware Echo Cancellation:** WebRTC audio streams enforce browser acoustic echo cancellation, noise suppression, and mono channel constraint to eliminate acoustic feedback.
- **Automatic Room Cleanup:** When the last user exits a room, `purgeRoomIfEmpty` deletes all room buffers, snapshots, chat history, and voice sessions.

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
- **PostgreSQL Database** *(Optional — in-memory store runs automatically if not configured)*
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
# Option A: Run single unified production server (serves frontend + backend on port 5001)
npm run build
npm start

# Option B: Run separate dev servers
npm run server  # Backend on http://localhost:5001
npm run dev     # Frontend on http://localhost:3000
```

---

## 🧰 Tech Stack

| Layer | Technology | Version |
|---|---|---|
| **Frontend** | React + TypeScript | 19.2 / 5.8 |
| **Build Tool** | Vite | 6.2 |
| **Styling** | Tailwind CSS (CDN) | 3.x |
| **Editor** | Monaco Editor (`@monaco-editor/react`) | 4.7 |
| **Real-time** | Socket.io (WebSocket) | 4.8 |
| **Voice Calling** | WebRTC (PeerConnection + Web Audio API) | Native |
| **Backend** | Express (CommonJS) | 5.2 |
| **Database** | PostgreSQL (`pg`) + In-Memory Fallback | 8.22 |
| **Media Storage** | Cloudinary + Multer | 2.10 / 2.2 |
| **AI Engine** | OpenRouter — Llama 3.1 70B Instruct | — |
| **Deployment** | Render Blueprint (`render.yaml`) | Node Web Service |

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
