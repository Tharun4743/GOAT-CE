<div align="center">

<img src="./logo.jpeg" alt="GOAT Code Editor" width="130" height="130" style="border-radius: 50%; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);" />

# ⚡ GOAT Code Editor (GOAT CE)

### **Real-Time Collaborative IDE with WebRTC Voice Calling, Monaco Kernel, AI Assistant & Ephemeral Workspaces**

<p align="center">
  <a href="https://goatcode-editor.onrender.com"><img src="https://img.shields.io/badge/🌐_Live_Demo-goatcode--editor.onrender.com-4F46E5?style=for-the-badge&logo=render&logoColor=white" alt="Live Demo" /></a>
  <a href="https://github.com/Tharun4743/GOAT-CE"><img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub" /></a>
</p>

[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.2-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.8-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io)
[![WebRTC](https://img.shields.io/badge/WebRTC-Audio_Call-339933?style=flat-square&logo=webrtc&logoColor=white)](https://webrtc.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://www.postgresql.org)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=flat-square)](./LICENSE)

</div>

---

## 🎯 Project Overview

GOAT Code Editor (GOAT CE) is a **browser-based collaborative IDE** that lets distributed developer teams write, run, and discuss code together in real time — without any setup, accounts, or downloads. It replaces the fragmented workflow of sharing code over chat apps and jumping between separate tools for voice communication. Instead, GOAT CE provides a **single shareable workspace** with a VS Code–grade Monaco editor, live peer cursors, multi-participant WebRTC voice calling, an in-browser code runner supporting 13+ languages, and a context-aware AI assistant — all accessible via a single URL.

Deployed publicly on Render at **[goatcode-editor.onrender.com](https://goatcode-editor.onrender.com)**, the platform is open to any developer, student, or team who needs to code together without friction.

---

## 📈 Project Impact

- **Eliminated the "share-code-over-chat" bottleneck** — replaced copy-pasting snippets across Discord/Slack/WhatsApp with a synchronized multi-user editor where every keystroke is reflected in real time across all connected peers.
- **Removed tool fragmentation for remote pair programming** — voice communication, code execution, AI assistance, chat, and timeline snapshots are consolidated into one shareable room link with zero account creation required.
- **Enabled browser-native voice calling without third-party services** — built a full WebRTC signaling stack (SDP Offer/Answer + ICE) from scratch supporting both direct 1-to-1 calls and multi-participant group calls, with hardware-level echo cancellation, noise suppression, and live speaking detection.
- **Automated ephemeral workspace lifecycle** — rooms and all associated code, snapshots, chat, and voice data are automatically purged from memory and the database the moment the last participant disconnects, eliminating manual cleanup and data retention concerns.
- **Deployed and live on cloud infrastructure** — continuously deployed to Render via a declarative `render.yaml` Blueprint with auto-build on push, serving real users at a public URL.

---

## 🏆 Key Engineering Achievements

- **Built a full WebRTC mesh from first principles** — SDP Offer/Answer negotiation, ICE candidate relay, and stream management implemented in a custom `useVoiceCall` hook without any third-party RTC SDK, supporting both 1-to-1 and multi-peer group calls.
- **Race-condition-safe collaborative editing** — used a `remoteChangeDepth` integer counter (not a boolean flag) to correctly gate local vs. remote Monaco editor change events during concurrent multi-user edits, preventing edit feedback loops.
- **Dual-persistence architecture** — PostgreSQL as the primary store with a transparent in-memory `Map` fallback; the editor remains fully functional even without a database connection.
- **Synthesized telephone ringtones from Web Audio API** — dual oscillator nodes with scheduled gain envelopes produce realistic ringing with no audio files required.
- **Deployed with IaC** — `render.yaml` Blueprint enables zero-touch continuous deployment; every push to the repo rebuilds and redeploys automatically.

---

## 🌟 Core Features

<div align="center">

| Feature | Capabilities |
|:---|:---|
| 🔴 **Real-time Collaboration** | Multi-user live code synchronization with race-condition-safe counter-based edit gate and sub-pixel Monaco cursor calibration. |
| 🎯 **Live Cursors & Presence** | See peer cursors and text selections in real-time with unique developer color badges and active typing indicators. |
| 📞 **1-to-1 WebRTC Direct Voice** | Full-duplex browser audio streaming with incoming call modal, synthesized telephone ringtone, Accept/Decline actions, active speaker detection, and instant mute toggle. |
| 🎙️ **Group WebRTC Voice Mesh** | Multi-participant voice calling — any room member can call the entire room and a WebRTC peer mesh is established automatically. |
| 🔇 **Hardware Acoustic Echo Cancellation** | Browser-native AEC, Noise Suppression (NS), and Auto Gain Control (AGC) configured at the media stream level — no external audio processing service. |
| 🧹 **Ephemeral Auto-Purge Lifecycle** | All in-memory buffers, chat messages, active calls, and snapshots are strictly partitioned per room and automatically deleted from memory and database once all members exit. |
| 🔒 **Duplicate Room Protection** | Real-time `/api/room-status/:roomId` validation prevents accidental overwrite of active workspaces, seamlessly routing collaborators via **Join Room**. |
| 🤖 **GOAT CE AI Assistant** | Context-aware code explanations, refactoring, debugging, and unit test generation with instant code injection powered by Llama 3.1 70B via OpenRouter. |
| ⚡ **Monaco Editor (VS Code Kernel)** | Full VS Code kernel — syntax highlighting, minimap, Fira Code ligature font, and smooth cursor animation. |
| 🖥️ **Built-in Terminal & Runner** | Sandboxed execution for 13+ languages in-browser via Piston API v2 with AI neural execution fallback. |
| 👁️ **Live HTML/CSS Preview** | Instant visual rendering in an embedded sandbox iframe with zero server round-trip. |
| 💬 **Live Workspace Chat** | Instant real-time team messaging partitioned per room. |
| 📸 **Code Timeline Snapshots** | Save up to 20 code states per room and roll back instantly with snapshot timeline history. |
| ↕️ **Drag-Adjustable Output Console** | Resizable bottom terminal via drag handle (clamped smoothly between 120px and 85vh). |
| ☀️ **Light / Dark Mode Switcher** | Dynamic theme toggle between VS-Dark and VS-Light with matching panel styling. |
| 🚀 **Render Auto-Deploy Ready** | Includes `render.yaml` Infrastructure-as-Code for zero-touch continuous deployment. |

</div>

---

## 🏗️ System Architecture

```mermaid
graph TD
    ClientA[💻 Browser Peer A: React 19 + Monaco] <-->|WebSocket: Code Sync + Cursors| Server[⚙️ Express 5 + Socket.io Server]
    ClientB[💻 Browser Peer B: React 19 + Monaco] <-->|WebSocket: Code Sync + Cursors| Server
    ClientA <===>|WebRTC P2P Voice Stream: Audio + VAD| ClientB

    Server -->|Persist Room & Snapshots| DB[(🐘 PostgreSQL Database)]
    Server -->|In-Memory Fallback| Cache[(⚡ Ephemeral Room Cache)]
    
    ClientA -->|Code Execution| Piston[⚡ Piston API v2 Sandbox]
    ClientA -->|AI Refactor & Runner| OpenRouter[🤖 OpenRouter AI - Llama 3.1 70B]
```

---

## 📞 WebRTC Voice Calling Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Caller as 👨‍💻 Caller (Peer A)
    participant Signaling as ⚡ Socket.io Server
    actor Callee as 👩‍💻 Callee (Peer B)

    Caller->>Signaling: direct-call-initiate { toSocketId: Callee }
    Signaling->>Callee: direct-call-incoming { caller: Peer A }
    Note over Callee: Ringtone plays & Incoming Modal pops up
    alt Accepted
        Callee->>Signaling: direct-call-accept { toSocketId: Caller }
        Signaling->>Caller: direct-call-accepted
        Note over Caller,Callee: WebRTC Offer / Answer / ICE handshake (voice-signal)
        Caller<<->>Callee: 🎙️ Direct P2P Encrypted Full-Duplex Audio Stream
    else Declined
        Callee->>Signaling: direct-call-reject { toSocketId: Caller }
        Signaling->>Caller: direct-call-rejected (Ringtone stops)
    end
```

---

## 🗂️ Project Structure

```
goat-code-editor/
├── components/
│   ├── AIAssistant.tsx         # GOAT CE AI panel — OpenRouter, quick actions, code injection
│   ├── ActiveCallBar.tsx       # Live call status dock — timer, speaking pulse, mute, end call
│   ├── IncomingCallModal.tsx   # Incoming call alert dialog with audio ringtone & accept/reject
│   ├── ChatBox.tsx             # Real-time team workspace chat
│   ├── Terminal.tsx            # Theme-aware output console (Piston + AI fallback)
│   ├── TopBar.tsx              # Language selector, Light/Dark toggle, Save, Run, Share, Room ID
│   └── VoiceCallPanel.tsx      # Voice participant roster and audio controls
├── hooks/
│   └── useVoiceCall.ts         # WebRTC 1-to-1 + group call hook, ringtones & echo cancellation
├── pages/
│   ├── EditorPage.tsx          # Core editor — Monaco, Socket.io, cursors, theme, timeline, voice
│   └── LandingPage.tsx         # Glassmorphic room join/create page with duplicate-room validation
├── server/
│   └── index.cjs               # Express 5 + Socket.io + WebRTC signaling + auto-purge backend
├── App.tsx                     # HashRouter + route definitions
├── constants.tsx               # Logo, COLORS[], DEFAULT_CODE per language
├── types.ts                    # User, ChatMessage, RoomState, VoicePeer, EditorLanguage enum
├── index.tsx                   # React 19 DOM entry
├── vite.config.ts              # Vite 6 config — exposes OpenRouter env vars to browser
├── render.yaml                 # Render Blueprint IaC for auto-deploy
├── package.json                # Scripts: dev, build, start, server
└── LICENSE                     # MIT License
```

---

## ⚙️ Supported Languages

<div align="center">

| Language | Syntax Highlighting | Piston Execution | AI Fallback | Live Preview |
|:---|:---:|:---:|:---:|:---:|
| **JavaScript** | ✅ | ✅ | ✅ | 👁️ Live |
| **TypeScript** | ✅ | ✅ | ✅ | — |
| **Python** | ✅ | ✅ | ✅ | — |
| **Java** | ✅ | ✅ | ✅ | — |
| **C++** | ✅ | ✅ | ✅ | — |
| **C#** | ✅ | ✅ | ✅ | — |
| **Go** | ✅ | ✅ | ✅ | — |
| **Rust** | ✅ | ✅ | ✅ | — |
| **PHP** | ✅ | ✅ | ✅ | — |
| **Ruby** | ✅ | ✅ | ✅ | — |
| **Swift** | ✅ | ✅ | ✅ | — |
| **Kotlin** | ✅ | ✅ | ✅ | — |
| **SQL** | ✅ | ✅ | ✅ | — |
| **HTML** | ✅ | — | — | 👁️ Live |
| **CSS** | ✅ | — | — | 👁️ Live |
| **Markdown** | ✅ | — | — | — |

</div>

---

## 📡 REST API & Socket.io Events Reference

### REST Endpoints
- `GET /api/room-status/:roomId` — Check whether a Room ID is currently active with online members.
- `GET /` — Health check endpoint for Render zero-downtime deployments.

### Socket.io Events

**Room & Code Sync**
- `join-room` / `sync-state` / `user-joined` / `user-left` — Real-time user roster and code sync.
- `code-change` / `code-update` / `typing-status` / `user-typing` — Operational transformation code streaming.
- `cursor-move` / `cursor-update` — Sub-pixel remote cursor and text selection broadcasting.
- `save-snapshot` / `snapshot-saved` — Timeline snapshot capture and broadcast.
- `send-message` / `receive-message` — Workspace chat relay.

**WebRTC Voice Signaling**
- `voice-join-room` / `voice-leave-room` / `voice-room-peers` / `voice-peer-joined` / `voice-peer-left` — Group voice mesh lifecycle.
- `voice-group-call-initiate` / `voice-group-call-incoming` — Group call notification.
- `direct-call-initiate` / `direct-call-accept` / `direct-call-reject` / `direct-call-end` — 1-to-1 calling lifecycle.
- `voice-signal` — WebRTC SDP Offer / Answer & ICE Candidate relay.
- `voice-status-update` / `voice-peer-status` — Mute, deafen, and speaking state sync.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** *(Optional — falls back to zero-config in-memory store if omitted)*
- **OpenRouter API Key** *(Optional — for GOAT CE AI Assistant)*

### 1. Clone & Install
```bash
git clone https://github.com/Tharun4743/GOAT-CE.git
cd GOAT-CE
npm install
```

### 2. Environment Setup
Create a `.env` file in the project root:
```env
PORT=5001
DATABASE_URL=postgresql://user:password@localhost:5432/goat_editor   # Optional
OPENROUTER_API_KEY=your_openrouter_api_key                           # Optional
OPENROUTER_MODEL=meta-llama/llama-3.1-70b-instruct
```

### 3. Run the Application
```bash
# Option A: Single Unified Server (serves frontend & backend on port 5001)
npm run build
npm start

# Option B: Development Mode (Vite hot-reloading)
npm run server  # Backend on http://localhost:5001
npm run dev     # Frontend on http://localhost:3000
```

---

## 🧰 Tech Stack

<div align="center">

| Layer | Technologies |
|:---|:---|
| **Frontend Framework** | React 19 · TypeScript 5.8 · Vite 6 |
| **Code Editor Kernel** | Monaco Editor (`@monaco-editor/react`) · Fira Code |
| **Real-time Networking** | Socket.io 4.8 · WebSocket / Polling fallback |
| **Voice Streaming** | WebRTC `RTCPeerConnection` · Web Audio API Analyser |
| **Backend & REST API** | Express 5.2 (CommonJS) · Node.js |
| **Database & Persistence** | PostgreSQL 16 (`pg`) · In-Memory Fallback Map |
| **AI Intelligence** | OpenRouter — Llama 3.1 70B Instruct |
| **Deployment** | Render Cloud Blueprint (`render.yaml`) · Auto-deploy on push |

</div>

---

## 📄 Resume-Ready Impact

- **Built and deployed a browser-based collaborative IDE** with real-time multi-user code sync, WebRTC voice calling (1-to-1 and group mesh), and sandboxed code execution across 13+ languages — live at [goatcode-editor.onrender.com](https://goatcode-editor.onrender.com).
- **Engineered a full WebRTC signaling stack from scratch** — SDP Offer/Answer negotiation, ICE candidate relay, voice activity detection via Web Audio API AnalyserNode, and hardware-level echo cancellation without any third-party RTC SDK.
- **Designed an ephemeral workspace system** with dual-persistence (PostgreSQL + in-memory fallback), race-condition-safe collaborative editing via counter-based edit gating, and automatic room purge on disconnect — deployed via Render IaC (`render.yaml`) with continuous auto-deploy.

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.
