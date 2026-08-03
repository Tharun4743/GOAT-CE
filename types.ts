
export interface User {
  id: string;
  username: string;
  color: string;
  cursorPos?: {
    lineNumber: number;
    column: number;
  };
}

export interface ChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  color: string;
}

export interface RoomState {
  roomId: string;
  code: string;
  language: string;
  users: User[];
  messages: ChatMessage[];
}

export enum EditorLanguage {
  JAVASCRIPT = 'javascript',
  TYPESCRIPT = 'typescript',
  PYTHON = 'python',
  JAVA = 'java',
  CPP = 'cpp',
  CSHARP = 'csharp',
  GO = 'go',
  RUST = 'rust',
  PHP = 'php',
  RUBY = 'ruby',
  SWIFT = 'swift',
  KOTLIN = 'kotlin',
  SQL = 'sql',
  MARKDOWN = 'markdown',
  HTML = 'html',
  CSS = 'css'
}

