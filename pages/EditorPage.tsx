
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import MonacoEditor, { OnMount } from '@monaco-editor/react';
import { io, Socket } from 'socket.io-client';
import { User, ChatMessage, EditorLanguage } from '../types';
import { ICONS, DEFAULT_CODE, COLORS } from '../constants';
import TopBar from '../components/TopBar';
import ChatBox from '../components/ChatBox';
import Terminal from '../components/Terminal';
import AIAssistant, { AIAssistantRef } from '../components/AIAssistant';
import { useVoiceCall } from '../hooks/useVoiceCall';
import IncomingCallModal from '../components/IncomingCallModal';
import ActiveCallBar from '../components/ActiveCallBar';

interface EditorPageProps {
  currentUser: User | null;
}

interface Snapshot {
  code: string;
  language: string;
  timestamp: string | Date;
}

interface UserWithPresence extends User {
  isTyping?: boolean;
  lastActive?: number;
}

const PISTON_LANG_MAP: Record<string, { lang: string; version: string }> = {
  javascript: { lang: 'javascript', version: '18.15.0' },
  typescript: { lang: 'typescript', version: '1.3.2' },
  python: { lang: 'python', version: '3.10.0' },
  java: { lang: 'java', version: '15.0.2' },
  cpp: { lang: 'cpp', version: '10.2.0' },
  csharp: { lang: 'csharp', version: '6.12.0' },
  go: { lang: 'go', version: '1.16.2' },
  rust: { lang: 'rust', version: '1.68.2' },
  php: { lang: 'php', version: '8.2.3' },
  ruby: { lang: 'ruby', version: '3.0.1' },
  swift: { lang: 'swift', version: '5.3.3' },
  kotlin: { lang: 'kotlin', version: '1.8.20' },
  sql: { lang: 'sqlite3', version: '3.36.0' },
};

// ── Runtime Instrumentation (remove after diagnosis) ────────────────────────
let __editorRenderCount = 0;
let __editorMountCount = 0;
let __editorInstanceCounter = 0;
let __modelInstanceCounter = 0;
let __recursiveCheck = 0;

// Log history buffer for state transition printout
const __logHistory: Array<{ tag: string; ts: string; data: any; stack?: string }> = [];
(window as any).__goatLogHistory = __logHistory;

const __log = (tag: string, data: Record<string, unknown>, includeStack = false) => {
  const ts = performance.now().toFixed(1) + 'ms';
  const stack = includeStack ? new Error().stack : undefined;
  const entry = { tag, ts, data, stack };
  __logHistory.push(entry);
  if (__logHistory.length > 100) __logHistory.shift();

  console.log(`%c[GOAT][${tag}]`, 'color:#4ec9b0;font-weight:bold', { ts, ...data });
  if (includeStack) {
    console.trace(`[GOAT][${tag}] stack trace`);
  }
};

const triggerStateTransition = (reason: string, details: any) => {
  console.error(`%c[GOAT][STATE TRANSITION DETECTED] %c${reason}`, 'color:#ff5f56;font-weight:bold;font-size:14px;', 'color:#fff;font-weight:bold;background:#ff5f56;padding:2px 6px;border-radius:3px;', details);
  console.log('%cLast 20 events prior to transition:', 'color:#ffbd2e;font-weight:bold;');
  __logHistory.slice(-20).forEach((entry, idx) => {
    console.log(`${idx + 1}. [${entry.ts}] [${entry.tag}]`, entry.data);
    if (entry.stack) {
      console.log('   Stack:', entry.stack);
    }
  });
};
// ─────────────────────────────────────────────────────────────────────────────

const EditorPage: React.FC<EditorPageProps> = ({ currentUser: propUser }) => {
  __editorRenderCount++;
  __log('RENDER', { count: __editorRenderCount, reason: 'EditorPage re-rendered' });
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<User | null>(propUser);
  const [language, setLanguage] = useState<EditorLanguage>(EditorLanguage.JAVASCRIPT);
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserWithPresence[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'chat' | 'history' | 'ai'>('users');
  const [isOffline, setIsOffline] = useState(false);
  const [activeSocket, setActiveSocket] = useState<Socket | null>(null);
  const voiceCall = useVoiceCall(activeSocket, roomId, currentUser);

  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewCode, setPreviewCode] = useState('');
  const [bottomTab, setBottomTab] = useState<'terminal' | 'preview'>('terminal');
  const [terminalHeight, setTerminalHeight] = useState(280);
  const isDraggingTerminalRef = useRef(false);
  const startDragYRef = useRef(0);
  const startHeightRef = useRef(280);

  const handleTerminalResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDraggingTerminalRef.current = true;
    startDragYRef.current = e.clientY;
    startHeightRef.current = terminalHeight;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      if (!isDraggingTerminalRef.current) return;
      const deltaY = startDragYRef.current - moveEvent.clientY;
      const minHeight = 120;
      const maxHeight = Math.floor(window.innerHeight * 0.85);
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, minHeight), maxHeight);
      setTerminalHeight(newHeight);
    };

    const handleMouseUp = () => {
      isDraggingTerminalRef.current = false;
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [terminalHeight]);
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('goat_theme') as 'dark' | 'light') || 'dark';
  });

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('goat_theme', newTheme);
      return newTheme;
    });
  };

  const editorRef = useRef<any>(null);
  const codeValueRef = useRef<string>('');
  const monacoRef = useRef<any>(null);
  const socketRef = useRef<Socket | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cursorThrottleRef = useRef<number>(0);
  const decorationsRef = useRef<string[]>([]);
  const remoteCursors = useRef<Map<string, { position: any; selection: any; username: string; color: string; lastSeen: number }>>(new Map());

  // Counter (not bool) so synchronous executeEdits + onChange flush never races.
  // Increment before edit, decrement synchronously after — no setTimeout needed.
  const remoteChangeDepth = useRef(0);
  const activeUsersRef = useRef<UserWithPresence[]>([]);
  // Refs so callbacks can always read current values without being in dep arrays
  const languageRef = useRef<EditorLanguage>(EditorLanguage.JAVASCRIPT);
  const roomIdRef = useRef<string | undefined>(roomId);

  useEffect(() => { languageRef.current = language; }, [language]);
  useEffect(() => { roomIdRef.current = roomId; }, [roomId]);

  useEffect(() => {
    activeUsersRef.current = activeUsers;
  }, [activeUsers]);

  useEffect(() => {
    __log('LIFECYCLE_MOUNT', { msg: 'EditorPage mounted' });
    return () => {
      __log('LIFECYCLE_UNMOUNT', { msg: 'EditorPage unmounted' });
    };
  }, []);

  useEffect(() => {
    const styleId = 'monaco-cursor-styles';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }
    
    // 1. Static selection and cursor fallback styles
    const staticRules = COLORS.map((color) => {
      const colorNoHash = color.replace('#', '');
      return `
        .remote-selection-${colorNoHash} { background-color: ${color}33 !important; pointer-events: none !important; }
        .remote-cursor-fallback-${colorNoHash} { border-left: 2px solid ${color} !important; margin-left: -1px !important; z-index: 50; pointer-events: none !important; }
      `;
    }).join('\n');

    // 2. Dynamic active cursors with pseudo-elements for active usernames (reserves 0px layout space in Monaco)
    const dynamicRules = activeUsers.map((user) => {
      const color = user.color || '#818CF8';
      const escapedUsername = (user.username || 'Anonymous').replace(/"/g, '\\"');
      const safeClassId = user.id.replace(/[^a-zA-Z0-9_-]/g, '_');
      return `
        .remote-cursor-${safeClassId} {
          border-left: 2px solid ${color} !important;
          margin-left: -1px !important;
          z-index: 50;
          pointer-events: none !important;
          position: relative;
        }
        .remote-cursor-${safeClassId}::before {
          content: "${escapedUsername}";
          background-color: ${color};
          color: #fff;
          font-family: 'Inter', sans-serif;
          font-size: 10px;
          font-weight: 800;
          padding: 1px 5px;
          border-radius: 3px;
          position: absolute;
          top: -20px;
          left: 0;
          white-space: nowrap;
          z-index: 100;
          pointer-events: none !important;
          user-select: none !important;
          box-shadow: 0 2px 6px rgba(0,0,0,0.4);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
      `;
    }).join('\n');

    styleTag.innerHTML = `${staticRules}\n${dynamicRules}\n.cursor-stale::before { opacity: 0.4; }`;
  }, [activeUsers]);

  const updateDecorations = useCallback(() => {
    if (!editorRef.current || !monacoRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;

    const maxLines = model.getLineCount();
    const newDecorations: any[] = [];
    const now = Date.now();
    const validSocketIds = new Set(activeUsersRef.current.map(u => u.id));

    remoteCursors.current.forEach((data, socketId) => {
      if (socketId === socketRef.current?.id || !validSocketIds.has(socketId) || (now - data.lastSeen > 15000)) {
        remoteCursors.current.delete(socketId);
        return;
      }
      if (!data.position || typeof data.position.lineNumber !== 'number' || typeof data.position.column !== 'number') return;

      const colorNoHash = data.color.replace('#', '');
      const isStale = (now - data.lastSeen) > 4000;

      const lineNum = Math.min(Math.max(1, data.position.lineNumber), maxLines);
      const lineMaxCol = model.getLineMaxColumn(lineNum);
      const colNum = Math.min(Math.max(1, data.position.column), lineMaxCol);

      if (data.selection && (data.selection.startLineNumber !== data.selection.endLineNumber || data.selection.startColumn !== data.selection.endColumn)) {
        const sStartLine = Math.min(Math.max(1, data.selection.startLineNumber), maxLines);
        const sEndLine = Math.min(Math.max(1, data.selection.endLineNumber), maxLines);
        const sStartCol = Math.min(Math.max(1, data.selection.startColumn), model.getLineMaxColumn(sStartLine));
        const sEndCol = Math.min(Math.max(1, data.selection.endColumn), model.getLineMaxColumn(sEndLine));

        newDecorations.push({
          range: new monacoRef.current.Range(sStartLine, sStartCol, sEndLine, sEndCol),
          options: { className: `remote-selection-${colorNoHash}`, stickiness: monacoRef.current.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges }
        });
      }

      const safeClassId = socketId.replace(/[^a-zA-Z0-9_-]/g, '_');
      newDecorations.push({
        range: new monacoRef.current.Range(lineNum, colNum, lineNum, colNum),
        options: {
          className: `remote-cursor-${safeClassId} remote-cursor-fallback-${colorNoHash} ${isStale ? 'cursor-stale' : ''}`,
          stickiness: monacoRef.current.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges
        },
      });
    });
    decorationsRef.current = editorRef.current.deltaDecorations(decorationsRef.current, newDecorations);
  }, []);

  const syncedCodeRef = useRef<string | null>(null);

  const applyCodeToEditor = useCallback((newCode: string) => {
    // ── DIAGNOSTIC: print a full call stack every time this runs ──────────────
    // Open DevTools → Console. If this stack trace appears while you are typing,
    // then the cursor-restore logic is the root cause.
    // If it does NOT appear during the failing keystroke, the bug is elsewhere.
    console.trace('[GOAT] applyCodeToEditor fired');
    // ──────────────────────────────────────────────────────────────────────────
    syncedCodeRef.current = newCode;
    codeValueRef.current = newCode;

    if (!editorRef.current) return;
    const model = editorRef.current.getModel();
    if (!model) return;
    if (model.getValue() === newCode) return;

    const posBefore = editorRef.current.getPosition();
    const vBefore = model.getAlternativeVersionId();
    __log('EXECUTE_EDITS', {
      caller: 'applyCodeToEditor',
      posBefore: posBefore ? `L${posBefore.lineNumber}:C${posBefore.column}` : null,
      vBefore,
      textLen: newCode.length,
    });

    remoteChangeDepth.current++;
    // forceMoveMarkers:true lets Monaco track the cursor through the replacement
    // so we never hold a stale column reference from the old document.
    editorRef.current.executeEdits('remote-sync', [
      { range: model.getFullModelRange(), text: newCode, forceMoveMarkers: true }
    ]);
    remoteChangeDepth.current--;

    // Clamp the saved position to the bounds of the NEW document and restore.
    // Do NOT use the raw posBefore directly — the new text may be shorter.
    if (posBefore) {
      const newLineCount = model.getLineCount();
      const restoredLine = Math.min(posBefore.lineNumber, newLineCount);
      const restoredCol = Math.min(posBefore.column, model.getLineMaxColumn(restoredLine));
      editorRef.current.setPosition({ lineNumber: restoredLine, column: restoredCol });
    }

    const posAfter = editorRef.current.getPosition();
    __log('EXECUTE_EDITS_DONE', {
      caller: 'applyCodeToEditor',
      posAfter: posAfter ? `L${posAfter.lineNumber}:C${posAfter.column}` : null,
      vAfter: model.getAlternativeVersionId(),
      cursorMoved: JSON.stringify(posBefore) !== JSON.stringify(posAfter),
    });
  }, []);

  (window as any).__goatApplyCode = applyCodeToEditor;

  useEffect(() => {
    let username = currentUser?.username;
    let color = currentUser?.color;
    if (!username) {
      const savedUser = sessionStorage.getItem('goat_username');
      if (savedUser) {
        username = savedUser;
        color = COLORS[Math.floor(Math.random() * COLORS.length)];
        setCurrentUser({ id: Math.random().toString(36).substr(2, 9), username, color });
      } else {
        username = `Dev-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        color = COLORS[Math.floor(Math.random() * COLORS.length)];
        sessionStorage.setItem('goat_username', username);
        setCurrentUser({ id: Math.random().toString(36).substr(2, 9), username, color });
      }
    }

    const isDevPort = window.location.port === '3000' || window.location.port === '5173';
    const socketUrl = isDevPort
      ? `${window.location.protocol}//${window.location.hostname}:5001`
      : window.location.origin;

    const socket = io(socketUrl, {
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      timeout: 15000,
      transports: ['websocket', 'polling']
    });

    socketRef.current = socket;

    // Instrument socket emit/receive
    const origEmit = socket.emit.bind(socket);
    socket.emit = (event: string, ...args: any[]) => {
      __log('SOCKET_SEND', {
        event,
        payload: args[0],
      });
      return origEmit(event, ...args);
    };

    const origOn = socket.on.bind(socket);
    socket.on = (event: string, fn: (...args: any[]) => void) => {
      return origOn(event, (...args: any[]) => {
        __log('SOCKET_RECEIVE', {
          event,
          payload: args[0],
        });
        return fn(...args);
      });
    };

    socket.on('connect', () => {
      setIsOffline(false);
      setActiveSocket(socket);
      socket.emit('join-room', { roomId, username, color });
    });

    socket.on('connect_error', () => setIsOffline(true));
    socket.on('disconnect', () => {
      setIsOffline(true);
      setActiveSocket(null);
    });

    socket.on('sync-state', ({ code: sCode, language: sLang, snapshots: sSnaps, users: sUsers }) => {
      if (sCode !== undefined) {
        applyCodeToEditor(sCode);
      }
      if (sLang) setLanguage(sLang as EditorLanguage);
      setSnapshots(sSnaps || []);
      setActiveUsers((sUsers || []).map((u: any) => ({ ...u, lastActive: Date.now() })));
    });

    socket.on('user-typing', ({ socketId, isTyping }) => {
      setActiveUsers(prev => prev.map(u => u.id === socketId ? { ...u, isTyping, lastActive: Date.now() } : u));
    });

    socket.on('snapshot-saved', (updatedSnapshots) => {
      setSnapshots(updatedSnapshots);
    });

    socket.on('user-joined', (user) => {
      setActiveUsers(prev => [...prev.filter(u => u.id !== user.id), { ...user, lastActive: Date.now() }]);
      setMessages(prev => [...prev, { id: `sys-${Date.now()}`, sender: 'System', text: `${user.username} joined`, timestamp: Date.now(), color: '#818CF8' }]);
    });

    socket.on('user-left', ({ socketId }) => {
      setActiveUsers(prev => prev.filter(u => u.id !== socketId));
      remoteCursors.current.delete(socketId);
      updateDecorations();
    });

    socket.on('code-update', ({ code: updatedCode, language: updatedLang }) => {
      if (updatedCode !== undefined) {
        applyCodeToEditor(updatedCode);
      }
      if (updatedLang !== undefined) setLanguage(updatedLang as EditorLanguage);
    });

    socket.on('cursor-update', ({ socketId, position, selection }) => {
      if (socketId === socketRef.current?.id) return;
      const user = activeUsersRef.current.find(u => u.id === socketId);
      if (user) {
        remoteCursors.current.set(socketId, { position, selection, username: user.username, color: user.color, lastSeen: Date.now() });
        // DO NOT call setActiveUsers here — it triggers a full React re-render
        // on every remote cursor move, which causes MonacoEditor to see new props
        // and interferes with the local cursor. Decorations are enough.
        updateDecorations();
      }
    });

    socket.on('receive-message', (msg) => {
      setMessages(prev => [...prev, msg]);
      setActiveUsers(prev => prev.map(u => u.username === msg.sender ? { ...u, lastActive: Date.now() } : u));
    });

    const interval = setInterval(updateDecorations, 1000);
    return () => {
      setActiveSocket(null);
      socket.disconnect();
      clearInterval(interval);
    };
  }, [roomId, navigate, updateDecorations, applyCodeToEditor]);

  const handleEditorMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const editorId = ++__editorInstanceCounter;
    __editorMountCount++;
    (window as any).__goatAliveEditors = ((window as any).__goatAliveEditors || 0) + 1;

    __log('MONACO_MOUNT', {
      msg: 'Monaco Editor onMount called',
      editorId,
      aliveCount: (window as any).__goatAliveEditors,
      mountCount: __editorMountCount
    }, true);

    console.log("Resolved insertSpaces value in Monaco:", editor.getOptions().get(monaco.editor.EditorOption.insertSpaces));

    // Instrument updateOptions
    const origUpdateOptions = editor.updateOptions.bind(editor);
    editor.updateOptions = (newOpts: any) => {
      const prevOpts = {
        cursorStyle: editor.getOption(monaco.editor.EditorOption.cursorStyle),
        readOnly: editor.getOption(monaco.editor.EditorOption.readOnly),
      };
      __log('UPDATE_OPTIONS_CALL', { editorId, prevOpts, newOpts }, true);
      const res = origUpdateOptions(newOpts);
      const postOpts = {
        cursorStyle: editor.getOption(monaco.editor.EditorOption.cursorStyle),
        readOnly: editor.getOption(monaco.editor.EditorOption.readOnly),
      };
      __log('UPDATE_OPTIONS_DONE', { editorId, postOpts });
      return res;
    };

    // Instrument executeEdits
    const origExecuteEdits = editor.executeEdits.bind(editor);
    editor.executeEdits = (source: string, edits: any[], endCursorState?: any) => {
      const posBefore = editor.getPosition();
      const selBefore = editor.getSelection();
      const model = editor.getModel();
      const uri = model?.uri.toString();
      const versionBefore = model?.getAlternativeVersionId();

      __log('EXECUTE_EDITS_CALL', {
        editorId,
        modelId: (model as any)?.__goatModelId,
        uri,
        modelVerBefore: versionBefore,
        source,
        editsCount: edits?.length,
        posBefore: posBefore ? `L${posBefore.lineNumber}:C${posBefore.column}` : null,
        selBefore: selBefore ? `L${selBefore.startLineNumber}:C${selBefore.startColumn}→L${selBefore.endLineNumber}:C${selBefore.endColumn}` : null,
        edits: edits?.map((e: any) => ({
          range: `L${e.range.startLineNumber}:C${e.range.startColumn}→L${e.range.endLineNumber}:C${e.range.endColumn}`,
          textLength: e.text?.length,
          forceMoveMarkers: e.forceMoveMarkers,
        }))
      }, true); // include stack trace

      __recursiveCheck++;
      const res = origExecuteEdits(source, edits, endCursorState);
      __recursiveCheck--;

      const posAfter = editor.getPosition();
      const selAfter = editor.getSelection();
      __log('EXECUTE_EDITS_DONE', {
        editorId,
        modelVerAfter: model?.getAlternativeVersionId(),
        posAfter: posAfter ? `L${posAfter.lineNumber}:C${posAfter.column}` : null,
        selAfter: selAfter ? `L${selAfter.startLineNumber}:C${selAfter.startColumn}→L${selAfter.endLineNumber}:C${selAfter.endColumn}` : null,
      });

      return res;
    };

    // Instrument setModel
    const origSetModel = editor.setModel.bind(editor);
    editor.setModel = (newModel: any) => {
      const prevModel = editor.getModel();
      __log('SET_MODEL_CALL', {
        editorId,
        prevModelUri: prevModel?.uri.toString(),
        newModelUri: newModel?.uri.toString(),
        newModelId: newModel?.__goatModelId,
      }, true);
      
      if (newModel) {
        newModel.updateOptions({
          insertSpaces: false,
          tabSize: 4,
        });

        // If new model is not wrapped, wrap its setValue
        if (!newModel.__goatModelId) {
          const modelId = ++__modelInstanceCounter;
          newModel.__goatModelId = modelId;
          const origSetValue = newModel.setValue.bind(newModel);
          newModel.setValue = (value: string) => {
            __log('MODEL_SET_VALUE_CALL', {
              modelId,
              uri: newModel.uri.toString(),
              oldLength: newModel.getValue().length,
              newLength: value.length,
            }, true);
            return origSetValue(value);
          };
        }
      }
      return origSetModel(newModel);
    };

    // Instrument dispose
    const origDispose = editor.dispose.bind(editor);
    editor.dispose = () => {
      (window as any).__goatAliveEditors = Math.max(0, ((window as any).__goatAliveEditors || 0) - 1);
      __log('DISPOSE_CALL', {
        editorId,
        aliveCount: (window as any).__goatAliveEditors,
      }, true);
      return origDispose();
    };

    // Listen to all keydown/keyup events
    editor.onKeyDown((e: any) => {
      console.log("Key pressed in Monaco:", e.browserEvent.key);
      __log('KEY_DOWN_EVENT', {
        editorId,
        key: e.browserEvent.key,
        code: e.browserEvent.code,
        keyCode: e.keyCode,
        shift: e.shiftKey,
        ctrl: e.ctrlKey,
        alt: e.altKey,
        meta: e.metaKey,
      });
    });

    editor.onKeyUp((e: any) => {
      __log('KEY_UP_EVENT', {
        editorId,
        key: e.browserEvent.key,
        code: e.browserEvent.code,
        keyCode: e.keyCode,
      });
    });

    let prevCursorStyle = editor.getOption(monaco.editor.EditorOption.cursorStyle);
    editor.onDidChangeConfiguration((e: any) => {
      const newCursorStyle = editor.getOption(monaco.editor.EditorOption.cursorStyle);
      const readOnly = editor.getOption(monaco.editor.EditorOption.readOnly);
      __log('CONFIGURATION_CHANGED', {
        editorId,
        cursorStyle: newCursorStyle,
        readOnly,
      });
      if (newCursorStyle !== prevCursorStyle) {
        const oldStyle = prevCursorStyle;
        prevCursorStyle = newCursorStyle;
        if (newCursorStyle !== 1) { // 1 is Line cursor style
          triggerStateTransition('BLOCK_CURSOR_DETECTED', {
            editorId,
            oldStyle,
            newStyle: newCursorStyle,
          });
        }
      }
    });

    editor.onDidChangeCursorPosition((e: any) => {
      __log('CURSOR_POSITION_CHANGED', {
        editorId,
        reason: e.reason,
        position: `L${e.position.lineNumber}:C${e.position.column}`,
        source: e.source,
      });
    });

    editor.onDidChangeCursorSelection((e: any) => {
      __log('CURSOR_SELECTION_CHANGED', {
        editorId,
        selection: `L${e.selection.startLineNumber}:C${e.selection.startColumn}→L${e.selection.endLineNumber}:C${e.selection.endColumn}`,
        source: e.source,
      });
    });

    // Wrap initial model
    const initialModel = editor.getModel();
    if (initialModel) {
      console.log("Initial Monaco model options:", {
        insertSpaces: initialModel.getOptions().insertSpaces,
        tabSize: initialModel.getOptions().tabSize,
        indentSize: initialModel.getOptions().indentSize,
      });

      // Force tab configuration on model level to prevent it from overriding editor options
      initialModel.updateOptions({
        insertSpaces: false,
        tabSize: 4,
      });

      console.log("Forced Monaco model options:", {
        insertSpaces: initialModel.getOptions().insertSpaces,
        tabSize: initialModel.getOptions().tabSize,
        indentSize: initialModel.getOptions().indentSize,
      });

      if (!initialModel.__goatModelId) {
        const modelId = ++__modelInstanceCounter;
        initialModel.__goatModelId = modelId;
        const origSetValue = initialModel.setValue.bind(initialModel);
        initialModel.setValue = (value: string) => {
          __log('MODEL_SET_VALUE_CALL', {
            modelId,
            uri: initialModel.uri.toString(),
            oldLength: initialModel.getValue().length,
            newLength: value.length,
          }, true);
          return origSetValue(value);
        };

      initialModel.onDidChangeContent((e: any) => {
        if (remoteChangeDepth.current > 0) return; // skip remote changes
        
        // Loop recursion detection
        if (__recursiveCheck > 0) {
          __log('RECURSIVE_UPDATE_DETECTED', {
            editorId,
            modelId: initialModel.__goatModelId,
            recursionDepth: __recursiveCheck,
            source: e.isFlush ? 'flush' : 'edit'
          });
        }

        // Overwrite mode detection: local change replacing characters when no selection was active
        const sel = editor.getSelection();
        const selectionIsEmpty = sel ? sel.isEmpty() : true;
        const change = e.changes?.[0];
        if (change && selectionIsEmpty && change.rangeLength > 0) {
          triggerStateTransition('OVERWRITE_MODE_TYPING_DETECTED', {
            editorId,
            modelId: initialModel.__goatModelId,
            changeText: JSON.stringify(change.text),
            rangeLength: change.rangeLength,
            cursor: editor.getPosition(),
          });
        }

        __log('MODEL_CHANGE_LOCAL', {
          editorId,
          modelId: initialModel.__goatModelId,
          changes: e.changes?.length,
          // KEY DIAGNOSTIC: if rangeLength > 0 with no selection it means Monaco
          // is replacing (not just inserting) — that IS the overwrite symptom.
          firstChangeRangeLength: e.changes?.[0]?.rangeLength,
          firstChangeText: JSON.stringify(e.changes?.[0]?.text),
          firstChangeRange: e.changes?.[0]
            ? `L${e.changes[0].range.startLineNumber}:C${e.changes[0].range.startColumn}`
            + `→L${e.changes[0].range.endLineNumber}:C${e.changes[0].range.endColumn}`
            : null,
          versionId: initialModel.getAlternativeVersionId(),
          pos: editor.getPosition(),
        });
      });
    }
  }

    const initialCode = syncedCodeRef.current !== null ? syncedCodeRef.current : (DEFAULT_CODE[language] || '');
    if (editor.getValue() !== initialCode) {
      const model = editor.getModel();
      remoteChangeDepth.current++;
      if (model) {
        // forceMoveMarkers:true — Monaco tracks cursor through the replacement.
        // After init we explicitly reset to L1:C1 so the cursor starts at a
        // guaranteed-valid position in the new document (not wherever executeEdits
        // happened to leave it, which could be the end of the old empty buffer).
        editor.executeEdits('init', [{ range: model.getFullModelRange(), text: initialCode, forceMoveMarkers: true }]);
        editor.setPosition({ lineNumber: 1, column: 1 });
      } else {
        editor.setValue(initialCode);
        editor.setPosition({ lineNumber: 1, column: 1 });
      }
      remoteChangeDepth.current--;
      codeValueRef.current = initialCode;
    } else {
      codeValueRef.current = editor.getValue();
    }



    editor.onDidChangeCursorSelection((e: any) => {
      if (remoteChangeDepth.current > 0) return;
      const now = Date.now();
      if (now - cursorThrottleRef.current < 40) return;
      cursorThrottleRef.current = now;

      if (socketRef.current?.connected) {
        socketRef.current.emit('cursor-move', {
          roomId,
          position: { lineNumber: e.selection.positionLineNumber, column: e.selection.positionColumn },
          selection: {
            startLineNumber: e.selection.startLineNumber,
            startColumn: e.selection.startColumn,
            endLineNumber: e.selection.endLineNumber,
            endColumn: e.selection.endColumn
          }
        });
      }
    });
    document.fonts.ready.then(() => {
      try {
        // remeasureFonts() forces Monaco to recalculate character widths
        // using the NOW-ACTIVE web font (Fira Code at 8.4px).
        // Without this, Monaco keeps its initial measurement made during mount
        // when only the fallback system font (Consolas at 7.7px) was active.
        // That 0.7px/char difference causes click-to-column mapping to drift
        // by ~4 columns over 40 chars, making typed characters insert at the
        // wrong position (the 'Deveploper' bug).
        if (monacoRef.current) {
          monacoRef.current.editor.remeasureFonts();
        }
        if (editorRef.current) {
          editorRef.current.layout();
        }
      } catch (e) {
        console.warn('Failed to remeasure monaco fonts on fonts ready:', e);
      }
    });

    // CURSOR-SYNC FIX: remeasure on first focus too.
    // document.fonts.ready can fire slightly before the browser fully activates
    // the web font for Monaco's specific size/weight. The first focus guarantees
    // Fira Code is 100% active and remeasureFonts() will produce the correct widths.
    let remeasuredOnFocus = false;
    const focusDisposable = editor.onDidFocusEditorText(() => {
      if (remeasuredOnFocus) return;
      remeasuredOnFocus = true;
      try {
        if (monacoRef.current) monacoRef.current.editor.remeasureFonts();
        if (editorRef.current) editorRef.current.layout();
      } catch (_) { /* ignore */ }
      focusDisposable.dispose();
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCodeChange = useCallback((value: string | undefined) => {
    if (value === undefined) return;
    if (remoteChangeDepth.current > 0) {
      __log('CODE_CHANGE_SKIP', { reason: 'remoteChangeDepth > 0', depth: remoteChangeDepth.current });
      return;
    }
    if (value === codeValueRef.current) {
      __log('CODE_CHANGE_SKIP', { reason: 'value unchanged' });
      return;
    }

    __log('CODE_CHANGE_EMIT', { len: value.length, delta: value.length - codeValueRef.current.length });
    codeValueRef.current = value;
    syncedCodeRef.current = value;

    if (socketRef.current?.connected) {
      socketRef.current.emit('code-change', { roomId: roomIdRef.current, code: value, language: languageRef.current });
      socketRef.current.emit('typing-status', { roomId: roomIdRef.current, isTyping: true });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socketRef.current?.emit('typing-status', { roomId: roomIdRef.current, isTyping: false });
      }, 2500);
    }
  }, []); // empty deps — fully stable, never recreated

  const handleSendMessage = (text: string) => {
    if (!currentUser) return;
    const msg: ChatMessage = { id: Date.now().toString(), sender: currentUser.username, text, timestamp: Date.now(), color: currentUser.color };
    setMessages(prev => [...prev, msg]);
    if (socketRef.current?.connected) socketRef.current.emit('send-message', { roomId, message: msg });
  };

  const handleLanguageChange = (newLang: EditorLanguage) => {
    setLanguage(newLang);
    const newTemplate = DEFAULT_CODE[newLang] || '';
    if (editorRef.current && monacoRef.current) {
      const model = editorRef.current.getModel();
      if (model) {
        monacoRef.current.editor.setModelLanguage(model, newLang);
        remoteChangeDepth.current++;
        editorRef.current.executeEdits('lang-change', [
          { range: model.getFullModelRange(), text: newTemplate, forceMoveMarkers: false }
        ]);
        remoteChangeDepth.current--;
      }
      codeValueRef.current = newTemplate;
      syncedCodeRef.current = newTemplate;
    }
    if (socketRef.current?.connected) socketRef.current.emit('code-change', { roomId, code: newTemplate, language: newLang });
  };

  const simulateExecutionWithAI = async (code: string, lang: string) => {
    try {
      setTerminalOutput(prev => [...prev, "[System] Piston Node Whitelist Active. Engaging Neural Simulation...", "[System] Analyzing logic flux..."]);

      const apiKey = process.env.OPENROUTER_API_KEY;
      const modelId = process.env.OPENROUTER_MODEL || 'meta-llama/llama-3.1-70b-instruct';

      if (!apiKey) throw new Error("AI Credentials not found.");

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin,
          'X-Title': 'GOAT Neural Runtime'
        },
        body: JSON.stringify({
          model: modelId,
          messages: [
            {
              role: 'system',
              content: 'You are a precise code execution engine. Simulate the output of the provided code. Response MUST follow this format exactly:\nSTDOUT: [output]\nSTDERR: [errors]\nDo not explain anything else.'
            },
            { role: 'user', content: `Language: ${lang}\nCode:\n${code}` }
          ]
        })
      });

      const data = await response.json();
      const result = data?.choices?.[0]?.message?.content || '';

      const stdout = result.match(/STDOUT:([\s\S]*?)(?=STDERR:|$)/i)?.[1]?.trim() || '';
      const stderr = result.match(/STDERR:([\s\S]*?)$/i)?.[1]?.trim() || '';

      const out = [];
      if (stderr) out.push(`[Runtime Error]\n${stderr}`);
      if (stdout) out.push(stdout);
      if (!stdout && !stderr) out.push('[System] Execution finished (No output)');

      setTerminalOutput([`GOAT Code Runtime (${language.toUpperCase()})`, ...out.join('\n').split('\n')]);
    } catch (err) {
      setTerminalOutput(prev => [...prev, `[Critical Error] Runtime kernel failed: ${err}`]);
    }
  };

  const handleRun = async () => {
    if (!editorRef.current) return;
    const code = editorRef.current.getValue();
    setIsTerminalOpen(true);
    setIsExecuting(true);
    setTerminalOutput([`Initializing runtime for ${language.toUpperCase()}...`]);

    const pistonConfig = PISTON_LANG_MAP[language];
    if (['html', 'css', 'javascript'].includes(language)) {
      setIsExecuting(false);
      setPreviewCode(code);

      // Changed: Only open Visual Preview for HTML, others go to Output Logs (terminal)
      if (language === 'html') {
        setBottomTab('preview');
      } else {
        setBottomTab('terminal');
      }

      setIsTerminalOpen(true);
      setTerminalOutput([`$ Launching Visual Sandbox...`, '[System] DOM node hydrated.', '[System] Graphics pipeline ready.', '[System] Rendered successfully.']);
      return;
    }

    if (!pistonConfig) {
      setIsExecuting(false);
      setTerminalOutput([`[Error] Execution not supported for ${language}.`]);
      return;
    }

    try {
      const response = await fetch('https://emkc.org/api/v2/piston/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: pistonConfig.lang,
          version: pistonConfig.version,
          files: [{ content: code }],
          args: []
        }),
      });
      const data = await response.json();

      // Check for Piston API Whitelist Error
      if (!response.ok || (data.message && data.message.includes('whitelist'))) {
        await simulateExecutionWithAI(code, language);
        return;
      }

      if (data.run) {
        const out = [];
        if (data.compile?.stderr) out.push(`[Compile Error]\n${data.compile.stderr}`);
        if (data.run.stdout) out.push(data.run.stdout);
        if (data.run.stderr) out.push(`[Runtime Error]\n${data.run.stderr}`);
        if (out.length === 0) out.push('[System] Process finished with code 0');
        setTerminalOutput([`$ ${pistonConfig.lang} v${pistonConfig.version}`, ...out.join('\n').split('\n')]);
      } else {
        setTerminalOutput([`[Error] Execution failed: ${data.message || 'Unknown server error'}`]);
      }
    } catch (err) {
      console.warn("Piston Core unreachable, falling back to Neural Simulation.");
      await simulateExecutionWithAI(code, language);
    } finally {
      setIsExecuting(false);
    }
  };

  const getUserStatus = (user: UserWithPresence) => {
    const diff = Date.now() - (user.lastActive || 0);
    if (user.isTyping) return { label: 'TYPING', color: 'text-indigo-400', dot: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]' };
    if (diff < 20000) return { label: 'ACTIVE', color: 'text-emerald-400', dot: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' };
    return { label: 'IDLE', color: 'text-gray-600', dot: 'bg-gray-700' };
  };

  const handleApplyAI = (code: string) => {
    applyCodeToEditor(code);
    if (socketRef.current?.connected) {
      socketRef.current.emit('code-change', { roomId, code, language });
    }
  };

  // BUG 2 FIX: Memoize the computed theme string so @monaco-editor/react does NOT
  // call monaco.editor.setTheme() on every re-render caused by user-typing events.
  const monacoTheme = useMemo(() => theme === 'dark' ? 'vs-dark' : 'vs', [theme]);

  // Stable options object — useMemo prevents a new reference every render,
  // which would cause @monaco-editor/react to re-call editor.updateOptions()
  // mid-keystroke and reset indentation/cursor state.
  const editorOptions = useMemo(() => ({
    fontSize: 14,
    fontFamily: "'Fira Code', monospace",
    // CURSOR-SYNC FIX: Disable font ligatures.
    // Fira Code renders sequences like -> == != as single combined glyphs.
    // Monaco measures individual character widths to map pixel X → model column.
    // When ligatures collapse multiple characters into one narrower glyph,
    // the pixel-to-column math is wrong and clicks register at the wrong column.
    // Result: typing inserts at a different column than where you clicked.
    fontLigatures: false,
    // CURSOR-SYNC FIX: Force letter-spacing to 0.
    // Tailwind CDN (loaded in index.html) applies CSS resets via * selector.
    // Any non-zero letter-spacing on Monaco's container throws off its
    // internal character-width measurement, causing the same click desync.
    letterSpacing: 0,
    minimap: { enabled: true },
    automaticLayout: true,
    padding: { top: 16 },
    scrollBeyondLastLine: false,
    wordWrap: 'off' as const,
    smoothScrolling: true,
    renderLineHighlight: 'all' as const,
    scrollbar: { verticalScrollbarSize: 8, horizontalScrollbarSize: 8 },
    tabSize: 4,
    insertSpaces: true,
    detectIndentation: false,
    autoIndent: 'none' as const,
    autoClosingBrackets: 'never' as const,
    autoClosingQuotes: 'never' as const,
    autoSurround: 'never' as const,
    formatOnPaste: false,
    formatOnType: false,
    quickSuggestions: false,
    suggestOnTriggerCharacters: false,
    wordBasedSuggestions: 'off' as const,
    snippetSuggestions: 'none' as const,
    linkedEditing: false,
    stickyTabStops: false,
    acceptSuggestionOnCommitCharacter: false,
    acceptSuggestionOnEnter: 'off' as const,
    suggest: { enabled: false },
    parameterHints: { enabled: false },
    hover: { enabled: false },
    codeLens: false,
    folding: false,
    foldingHighlight: false,
    showFoldingControls: 'never' as const,
    occurrencesHighlight: 'off' as const,
    selectionHighlight: false,
    matchBrackets: 'never' as const,
  }), []);


  return (
    <div className={`flex flex-col h-screen overflow-hidden ${theme === 'dark' ? 'bg-[#0d1117] text-white' : 'bg-slate-100 text-gray-900'}`}>
      <TopBar
        roomId={roomId || ''}
        language={language}
        onLanguageChange={handleLanguageChange}
        onSave={() => socketRef.current?.emit('save-snapshot', { roomId, code: codeValueRef.current, language })}
        onRun={handleRun}
        toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        theme={theme}
        onToggleTheme={toggleTheme}
        isVoiceActive={voiceCall.callStatus === 'connected'}
      />

      {/* Active Call Bar (Persistent during incoming/active call) */}
      {voiceCall.callStatus !== 'idle' && (
        <ActiveCallBar
          callStatus={voiceCall.callStatus}
          activePeer={voiceCall.activePeer}
          isMuted={voiceCall.isMuted}
          localIsSpeaking={voiceCall.localIsSpeaking}
          peerIsSpeaking={voiceCall.peerIsSpeaking}
          callDuration={voiceCall.callDuration}
          onToggleMute={voiceCall.toggleMute}
          onEndCall={voiceCall.endActiveCall}
          theme={theme}
        />
      )}

      <div className="flex flex-1 overflow-hidden relative">
        <div className={`fixed inset-y-0 left-0 z-50 md:relative md:z-20 ${isSidebarOpen ? 'w-80 translate-x-0' : 'w-0 -translate-x-full md:w-16 md:translate-x-0'} transition-all duration-300 border-r flex flex-col shrink-0 ${
          theme === 'dark' ? 'border-gray-800 bg-[#0d1117] text-gray-300' : 'border-indigo-100/80 bg-gradient-to-b from-indigo-50/50 via-white to-indigo-50/30 text-slate-800'
        }`}>
          <div className={`flex border-b shrink-0 h-11 ${theme === 'dark' ? 'border-gray-800' : 'border-indigo-100/80'}`}>
            {[
              { id: 'users', icon: ICONS.Users, title: 'Team Engine' },
              { id: 'chat', icon: ICONS.Chat, title: 'Workspace Chat' },
              { id: 'ai', icon: ICONS.AI, title: 'GOAT CE AI' },
              { id: 'history', icon: ICONS.History, title: 'Code Timeline' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setIsSidebarOpen(true); setActiveTab(tab.id as any); }}
                title={tab.title}
                className={`flex-1 h-full flex justify-center items-center transition-all relative ${
                  activeTab === tab.id && isSidebarOpen
                    ? 'bg-indigo-500/10 text-indigo-500 border-b-2 border-indigo-500 font-bold'
                    : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-slate-400 hover:text-slate-700'
                }`}
              >
                {tab.icon}
                {tab.id === 'chat' && voiceCall.callStatus === 'connected' && (
                  <span className="absolute top-2.5 right-3 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-emerald-500/40 animate-pulse" />
                )}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-hidden p-3 flex flex-col min-h-0">
            {isSidebarOpen && (
              <div className="h-full flex flex-col min-h-0">
                {activeTab === 'users' && (
                  <div className="flex flex-col h-full bg-transparent min-h-0">
                    <div className={`shrink-0 px-3 py-2.5 border-b mb-3 flex items-center justify-between ${theme === 'dark' ? 'border-gray-800' : 'border-indigo-100'}`}>
                      <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>
                        {ICONS.Users} Team Engine
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        theme === 'dark' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border-indigo-200'
                      }`}>
                        {activeUsers.length} Online
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1 min-h-0 pb-3">
                      {activeUsers.map(user => {
                        const status = getUserStatus(user);
                        const isSelf = user.id === currentUser?.id || 
                                       (Boolean(socketRef.current?.id) && user.id === socketRef.current?.id) || 
                                       user.username === currentUser?.username;
                        const isThisUserInCallWithMe = !isSelf && (voiceCall.callStatus === 'connected' || voiceCall.callStatus === 'calling') && voiceCall.activePeer?.socketId === user.id;
                        return (
                          <div key={user.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-colors ${
                            theme === 'dark' ? 'bg-[#161b22] border-gray-800 hover:border-gray-700' : 'bg-white border-indigo-100 shadow-sm hover:border-indigo-200'
                          }`}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-white shadow-lg shrink-0 relative" style={{ backgroundColor: user.color }}>
                              {user.username.charAt(0).toUpperCase()}
                              {isThisUserInCallWithMe && voiceCall.peerIsSpeaking && (
                                <span className="absolute -inset-0.5 rounded-lg border-2 border-emerald-400 animate-ping opacity-75 pointer-events-none"></span>
                              )}
                              {isSelf && voiceCall.callStatus === 'connected' && voiceCall.localIsSpeaking && (
                                <span className="absolute -inset-0.5 rounded-lg border-2 border-emerald-400 animate-ping opacity-75 pointer-events-none"></span>
                              )}
                            </div>
                            <div className="flex flex-col min-w-0 flex-1">
                              <div className="flex items-center justify-between gap-1">
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <span className={`text-xs font-extrabold truncate ${theme === 'dark' ? 'text-gray-200' : 'text-gray-900'}`}>{user.username}</span>
                                  {isSelf && (
                                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                
                                {!isSelf && (
                                  <div>
                                    {voiceCall.callStatus === 'connected' && voiceCall.activePeer?.socketId === user.id ? (
                                      <span className="flex items-center gap-1 text-[8px] font-black text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/30">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                                        Connected
                                      </span>
                                    ) : voiceCall.callStatus === 'calling' && voiceCall.activePeer?.socketId === user.id ? (
                                      <span className="flex items-center gap-1 text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded-full border border-indigo-500/30 animate-pulse">
                                        Calling...
                                      </span>
                                    ) : (
                                      <button
                                        onClick={() => voiceCall.initiateCall(user.id, user)}
                                        disabled={voiceCall.callStatus !== 'idle'}
                                        className="py-1 px-2.5 rounded-lg text-[9px] font-extrabold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 transition-all flex items-center gap-1 shadow-sm disabled:opacity-30"
                                        title={`Direct call ${user.username}`}
                                      >
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                        </svg>
                                        <span>Call</span>
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <div className={`w-1.5 h-1.5 rounded-full ${status.dot}`}></div>
                                <span className={`text-[9px] font-black tracking-wider uppercase ${status.color}`}>{status.label}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {activeTab === 'chat' && <ChatBox messages={messages} onSendMessage={handleSendMessage} theme={theme} voiceCall={voiceCall} currentUser={currentUser} />}
                {activeTab === 'ai' && <AIAssistant currentCode={codeValueRef.current} language={language} onApplyCode={handleApplyAI} theme={theme} />}

                {activeTab === 'history' && (
                  <div className="flex flex-col h-full bg-transparent min-h-0">
                    <div className={`shrink-0 px-3 py-2.5 border-b mb-3 flex items-center justify-between ${theme === 'dark' ? 'border-gray-800' : 'border-indigo-100'}`}>
                      <h3 className={`text-xs font-black uppercase tracking-wider flex items-center gap-2 ${theme === 'dark' ? 'text-gray-200' : 'text-slate-700'}`}>
                        {ICONS.History} Code Timeline
                      </h3>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        theme === 'dark' ? 'bg-gray-800/60 text-gray-400 border-gray-700/60' : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {snapshots.length} {snapshots.length === 1 ? 'Snapshot' : 'Snapshots'}
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-2.5 custom-scrollbar pr-1 min-h-0 pb-3">
                      {snapshots.length === 0 ? (
                        <div className={`text-xs font-medium italic p-4 rounded-xl border text-center ${theme === 'dark' ? 'text-gray-500 border-gray-800 bg-[#161b22]' : 'text-slate-500 border-indigo-100 bg-white shadow-sm'}`}>
                          No snapshots captured yet.
                        </div>
                      ) : (
                        snapshots.map((snap, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              applyCodeToEditor(snap.code);
                              if (socketRef.current?.connected) socketRef.current.emit('code-change', { roomId, code: snap.code, language: snap.language });
                            }}
                            className={`w-full text-left p-3 border rounded-xl hover:border-indigo-500 transition-all group shadow-sm ${
                              theme === 'dark' ? 'bg-[#161b22] border-gray-800 text-gray-200 hover:bg-gray-800/50' : 'bg-white border-indigo-100 text-gray-900 hover:shadow-md'
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs mb-1 font-mono font-bold">
                              <span className="text-indigo-400 uppercase">{snap.language}</span>
                              <span className={`text-[10px] font-semibold ${theme === 'dark' ? 'text-gray-400' : 'text-slate-500'}`}>
                                {new Date(snap.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className="text-[10px] font-bold tracking-wider uppercase flex items-center gap-1 text-indigo-400 group-hover:text-indigo-300">
                              <span>↩</span> Rollback Context
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className={`flex-1 flex flex-col min-w-0 ${theme === 'dark' ? 'bg-[#0d1117]' : 'bg-white'}`}>
          <div className="flex-1 relative overflow-hidden min-w-0 min-h-0">
            <MonacoEditor
              height="100%"
              width="100%"
              language={language}
              theme={monacoTheme}
              onChange={handleCodeChange}
              onMount={handleEditorMount}
              options={editorOptions}
            />
          </div>

          {/* Unified Bottom Engine Console with Drag-Adjustable Height */}
          {isTerminalOpen && (
            <div
              style={{ height: `${terminalHeight}px` }}
              className={`border-t flex flex-col font-mono text-sm shadow-[0_-10px_30px_rgba(0,0,0,0.15)] z-40 relative shrink-0 min-h-[120px] max-h-[85vh] ${
                theme === 'dark' ? 'bg-[#0d1117] border-gray-800' : 'bg-white border-slate-200'
              }`}
            >
              {/* Drag Resize Handle Bar */}
              <div
                onMouseDown={handleTerminalResizeStart}
                className={`h-2 w-full cursor-row-resize transition-colors flex items-center justify-center shrink-0 group select-none border-b ${
                  theme === 'dark' ? 'bg-[#161b22] hover:bg-indigo-600/30 border-gray-800/80' : 'bg-slate-100 hover:bg-indigo-100 border-slate-200'
                }`}
                title="Drag up or down to adjust panel height"
              >
                <div className={`w-12 h-1 rounded-full transition-colors ${
                  theme === 'dark' ? 'bg-gray-600 group-hover:bg-indigo-400' : 'bg-slate-400 group-hover:bg-indigo-500'
                }`} />
              </div>

              <div className={`flex items-center justify-between px-4 py-1.5 border-b shrink-0 ${
                theme === 'dark' ? 'bg-[#161b22] border-gray-800' : 'bg-slate-100 border-slate-200'
              }`}>
                <div className="flex items-center gap-6">
                  <div className="flex gap-2">
                    <button
                      onClick={() => setBottomTab('terminal')}
                      className={`text-[10px] font-black uppercase tracking-wider py-1 transition-all ${
                        bottomTab === 'terminal' 
                          ? 'text-indigo-500 border-b-2 border-indigo-500' 
                          : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Output Logs
                    </button>
                    <button
                      onClick={() => setBottomTab('preview')}
                      className={`text-[10px] font-black uppercase tracking-wider py-1 transition-all ${
                        bottomTab === 'preview' 
                          ? 'text-indigo-500 border-b-2 border-indigo-500' 
                          : theme === 'dark' ? 'text-gray-500 hover:text-gray-300' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Visual Preview
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-[#ff5f56]/80"></div>
                    <div className="w-2 h-2 rounded-full bg-[#ffbd2e]/80"></div>
                    <div className="w-2 h-2 rounded-full bg-[#27c93f]/80"></div>
                  </div>
                  <button 
                    onClick={() => setIsTerminalOpen(false)} 
                    className={`transition-colors text-xs font-bold p-1 ${
                      theme === 'dark' ? 'text-gray-500 hover:text-white' : 'text-slate-400 hover:text-slate-800'
                    }`}
                  >
                    ✕
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-hidden relative">
                {bottomTab === 'terminal' ? (
                  <div className="absolute inset-0 overflow-hidden">
                    <Terminal output={terminalOutput} isOpen={true} onClose={() => setIsTerminalOpen(false)} isLoading={isExecuting} hideHeader={true} theme={theme} />
                  </div>
                ) : (
                  <div className="absolute inset-0 bg-white">
                    <iframe
                      title="BottomPreview"
                      className="w-full h-full border-none"
                      srcDoc={
                        language === 'html' ? previewCode :
                          language === 'css' ? `<html><head><style>${previewCode}</style></head><body style="padding: 2rem; font-family: sans-serif; background: #f8fafc;"><h2>CSS Logic Mask</h2><p>Styles are active in the lower engine.</p></body></html>` :
                            `<html><body style="padding: 2rem; font-family: sans-serif; background: #f8fafc;"><h2>Script Terminal</h2><p>Check the system logs for runtime details.</p><script>${previewCode}</script></body></html>`
                      }
                      sandbox="allow-scripts"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Incoming Call Modal Overlay */}
      {voiceCall.incomingCall && (
        <IncomingCallModal
          caller={voiceCall.incomingCall.caller}
          onAccept={voiceCall.acceptIncomingCall}
          onReject={voiceCall.rejectIncomingCall}
          theme={theme}
        />
      )}
    </div>
  );
};

export default EditorPage;
