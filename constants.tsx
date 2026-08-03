
import React from 'react';
import { 
  Users, 
  MessageSquare, 
  History, 
  Settings, 
  Play, 
  Save, 
  Share2,
  ChevronDown,
  Terminal as TerminalIcon,
  Layers,
  Copy,
  CheckCircle2,
  // Added Sparkles for the AI icon
  Sparkles
} from 'lucide-react';

export const COLORS = [
  '#F87171', '#FB923C', '#FBBF24', '#34D399', 
  '#60A5FA', '#818CF8', '#A78BFA', '#F472B6'
];

export const ICONS = {
  // Official GOAT Logo from user-provided source
  Logo: (
    <div className="relative w-full h-full flex items-center justify-center">
      <img 
        src="https://i.postimg.cc/s2ckXQk6/LOGO-FINAL.png" 
        alt="GOAT Logo" 
        className="w-full h-full object-contain rounded-full"
        onError={(e) => {
          (e.target as HTMLImageElement).style.display = 'none';
          const sibling = (e.target as HTMLImageElement).nextElementSibling as HTMLElement;
          if (sibling) sibling.style.display = 'flex';
        }}
      />
      <div className="hidden w-full h-full bg-indigo-600 rounded-full items-center justify-center font-black text-white text-xs tracking-tighter">
        GOAT
      </div>
    </div>
  ),
  Users: <Users className="w-5 h-5" />,
  Chat: <MessageSquare className="w-5 h-5" />,
  History: <History className="w-5 h-5" />,
  Settings: <Settings className="w-5 h-5" />,
  Play: <Play className="w-4 h-4" />,
  Save: <Save className="w-4 h-4" />,
  Share: <Share2 className="w-4 h-4" />,
  Down: <ChevronDown className="w-4 h-4" />,
  Terminal: <TerminalIcon className="w-5 h-5" />,
  Layers: <Layers className="w-5 h-5" />,
  Copy: <Copy className="w-4 h-4" />,
  Check: <CheckCircle2 className="w-4 h-4 text-green-500" />,
  // Fix: Added AI icon referenced in AIAssistant component
  AI: <Sparkles className="w-4 h-4" />
};

export const DEFAULT_CODE: Record<string, string> = {
  javascript: `// GOAT Editor - JavaScript\nfunction greet(name) {\n  console.log("Hello, " + name + "!");\n}\n\ngreet("Goat Developer");`,
  typescript: `// GOAT Editor - TypeScript\ninterface User {\n  name: string;\n}\n\nconst user: User = { name: "Goat Developer" };\nconsole.log(\`Hello, \${user.name}!\`);`,
  python: `# GOAT Editor - Python\ndef greet(name):\n    print(f"Hello, {name}!")\n\ngreet("Goat Developer")`,
  java: `// GOAT Editor - Java\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, Goat Developer!");\n    }\n}`,
  cpp: `// GOAT Editor - C++\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello, Goat Developer!" << endl;\n    return 0;\n}`,
  csharp: `// GOAT Editor - C#\nusing System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello, Goat Developer!");\n    }\n}`,
  go: `// GOAT Editor - Go\npackage main\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello, Goat Developer!")\n}`,
  rust: `// GOAT Editor - Rust\nfn main() {\n    println!("Hello, Goat Developer!");\n}`,
  php: `<?php\n// GOAT Editor - PHP\necho "Hello, Goat Developer!";\n?>`,
  ruby: `# GOAT Editor - Ruby\nputs "Hello, Goat Developer!"`,
  swift: `// GOAT Editor - Swift\nprint("Hello, Goat Developer!")`,
  kotlin: `// GOAT Editor - Kotlin\nfun main() {\n    println("Hello, Goat Developer!")\n}`,
  sql: `-- GOAT Editor - SQL\nSELECT 'Hello, Goat Developer!' AS message;`,
  markdown: `# Welcome to GOAT Editor\n\n- Collaborative\n- Fast\n- Reliable`,
  html: `<!-- GOAT Editor - HTML -->\n<!DOCTYPE html>\n<html>\n<body>\n  <h1>Hello, Goat Developer!</h1>\n</body>\n</html>`,
  css: `/* GOAT Editor - CSS */\nbody {\n  background: #0d1117;\n  color: #c9d1d9;\n}`
};
