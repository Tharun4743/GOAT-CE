<div align="center">

<img src="./logo.jpeg" alt="GOAT Code Editor" width="130" height="130" style="border-radius: 50%; box-shadow: 0 10px 30px rgba(99, 102, 241, 0.4);" />

# ⚡ GOAT Code Editor (GOAT CE)

### **Next-Gen Real-Time Collaborative IDE with Live 1-to-1 WebRTC Voice Calling, Monaco Kernel, AI Assistant & Ephemeral Workspaces**

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
[![Cloudinary](https://img.shields.io/badge/Cloudinary-Media-3448C5?style=flat-square&logo=cloudinary&logoColor=white)](https://cloudinary.com)
[![Express](https://img.shields.io/badge/Express-5.2-000000?style=flat-square&logo=express&logoColor=white)](https://expressjs.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-F59E0B?style=flat-square)](./LICENSE)

</div>

---

## 🌟 Highlights & Core Features

<div align="center">

| Feature | Capabilities |
|:---|:---|
| 📞 **1-to-1 WebRTC Direct Voice** | Full-duplex browser audio streaming. Includes incoming call notification modal with synthetic telephone ringtone, Accept/Decline actions, active speaker detection, and instant mute toggle. |
| 🔇 **Hardware Acoustic Echo Cancellation** | Built-in Acoustic Echo Cancellation (AEC), Noise Suppression (NS), and Auto Gain Control (AGC) pipeline preventing feedback loops. |
| 🧹 **Ephemeral Auto-Purge Lifecycle** | All in-memory buffers, chat messages, active calls, and snapshots are strictly partitioned per room and automatically deleted from memory and database once all room members exit. |
| 🔴 **Real-time Collaboration** | Multi-user live code synchronization with operational transformation and sub-pixel Monaco cursor calibration. |
| 🎯 **Live Cursors & Presence** | See peer cursors and text selections in real-time with unique developer color badges and active typing indicators. |
| 🔒 **Duplicate Room Protection** | Real-time `/api/room-status/:roomId` validation prevents accidental overwrite of active workspaces, seamlessly routing collaborators via **Join Room**. |
| ☀️ **Light / Dark Mode Switcher** | Dynamic theme toggle between VS-Dark and VS-Light with matching panel styling across the entire editor and terminal. |
| 🤖 **GOAT CE AI Assistant** | Context-aware code explanations, refactoring, debugging, and unit test generation with instant code injection powered by Llama 3.1 70B. |
| ⚡ **Monaco Editor (VS Code Kernel)** | Full VS Code kernel — syntax highlighting, minimap, Fira Code ligature font, and smooth cursor animation. |
| ↕️ **Drag-Adjustable Output Console** | Resizable bottom terminal and visual preview panel via drag handle (clamped smoothly between 120px and 85vh). |
| 🖥️ **Built-in Terminal & Runner** | Sandboxed execution for 13+ languages in-browser via Piston API v2 + AI neural execution fallback. |
| 👁️ **Live HTML/CSS Preview** | Instant visual rendering in an embedded sandbox iframe with zero server round-trip. |
| 💬 **Live Chat & Cloudinary Media** | In-room messaging with file and image attachment uploads powered by Cloudinary. |
| 📸 **Code Timeline Snapshots** | Save code states per room and roll back instantly with snapshot timeline history. |
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
    Server -->|In-Memory Buffer| Cache[(⚡ Ephemeral Room Cache)]
    Server -->|Media Storage| Cloudinary[(☁️ Cloudinary Media)]
    
    ClientA -->|Code Execution| Piston[⚡ Piston API v2 Sandbox]
    ClientA -->|AI Refactor & Runner| OpenRouter[🤖 OpenRouter AI - Llama 3.1 70B]
```

---

## 📞 1-to-1 WebRTC Direct Voice Calling Workflow

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
│   ├── ChatBox.tsx             # Real-time team chat with Cloudinary file attachment support
│   ├── Terminal.tsx            # Theme-aware output console (Piston + AI fallback)
│   ├── TopBar.tsx              # Language selector, Light/Dark toggle, Save, Run, Share, Room ID
│   └── VoiceCallPanel.tsx      # Voice participant roster and audio controls
├── hooks/
│   └── useVoiceCall.ts         # WebRTC 1-to-1 direct call hook, ringtones & echo cancellation
├── pages/
│   ├── EditorPage.tsx          # Core editor — Monaco, Socket.io, cursors, theme, timeline, voice
│   └── LandingPage.tsx         # Modern glassmorphic room join/create page with URL parser
├── server/
│   └── index.cjs               # Express 5 + Socket.io + WebRTC signaling + auto-purge backend
├── App.tsx                     # HashRouter + route definitions
├── constants.tsx               # Circular Logo icon, COLORS[], DEFAULT_CODE per language
├── types.ts                    # User, ChatMessage, RoomState, VoicePeer, EditorLanguage enum
├── index.tsx                   # React 19 DOM entry
├── vite.config.ts              # Vite 6 config — exposes OpenRouter env vars to browser
├── render.yaml                 # Render Blueprint configuration for auto-deploy
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
- `POST /api/upload` — Upload images or attachments for team chat via Cloudinary.
- `GET /` — Health check endpoint for Render zero-downtime deployments.

### Socket.io Events
- `join-room` / `sync-state` / `user-joined` / `user-left` — Real-time user roster and code sync.
- `code-change` / `code-update` / `typing-status` — Operational transformation code streaming.
- `cursor-move` / `cursor-update` — Sub-pixel remote cursor and text selection broadcasting.
- `direct-call-initiate` / `direct-call-accept` / `direct-call-reject` / `direct-call-end` — WebRTC 1-to-1 calling lifecycle.
- `voice-signal` — WebRTC SDP Offer / Answer & ICE Candidate exchange.

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** 18+
- **PostgreSQL** *(Optional — falls back to zero-config in-memory store if omitted)*
- **Cloudinary Account** *(Optional — for chat image uploads)*
- **OpenRouter API Key** *(Optional — for GOAT CE AI Assistant)*

### 1. Clone & Install
```bash
git clone https://github.com/Tharun4743/GOAT-CE.git
cd GOAT-CE
npm install
```

### 2. Configure Environment Variables
Create a `.env` file in the root directory:
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

### 3. Run the Application
```bash
# Option A: Single Unified Production Server (serves frontend & backend on port 5001)
npm run build
npm start

# Option B: Development Mode (Vite hot-reloading)
npm run server  # Backend on http://localhost:5001
npm run dev     # Frontend on http://localhost:3000
```

---

## 🧰 Tech Stack Summary

<div align="center">

| Layer | Technologies |
|:---|:---|
| **Frontend Framework** | React 19 · TypeScript 5.8 · Vite 6 |
| **Code Editor Kernel** | Monaco Editor (`@monaco-editor/react`) · Fira Code |
| **Real-time Networking** | Socket.io 4.8 · WebSocket / Polling fallback |
| **Voice Streaming** | WebRTC `RTCPeerConnection` · Web Audio API Analyser |
| **Backend & REST API** | Express 5.2 (CommonJS) · Node.js |
| **Database & Persistence** | PostgreSQL (`pg`) · In-Memory Fallback Map |
| **Cloud Storage** | Cloudinary API v2 · Multer Memory Engine |
| **AI Intelligence** | OpenRouter — Llama 3.1 70B Instruct |
| **Deployment Engine** | Render Cloud Blueprint (`render.yaml`) |

</div>

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](./LICENSE) for details.
