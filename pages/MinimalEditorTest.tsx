import React, { useState } from 'react';
import MonacoEditor from '@monaco-editor/react';

const MinimalEditorTest: React.FC = () => {
  const [code, setCode] = useState("Hello World");
  return (
    <div style={{ height: '100vh', width: '100vw', padding: '20px', boxSizing: 'border-box', background: '#1e1e1e', color: '#fff' }}>
      <h3>Minimal Monaco Editor Test</h3>
      <div style={{ height: '500px', border: '1px solid #444' }}>
        <MonacoEditor
          height="100%"
          width="100%"
          language="plaintext"
          theme="vs-dark"
          defaultValue="Hello World"
          onChange={(val) => setCode(val || '')}
        />
      </div>
    </div>
  );
};

export default MinimalEditorTest;
