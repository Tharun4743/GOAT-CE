
import React, { useState } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import EditorPage from './pages/EditorPage';
import LandingPage from './pages/LandingPage';
import MinimalEditorTest from './pages/MinimalEditorTest';
import { User } from './types';
import { COLORS } from './constants';

const AppContent: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const handleJoin = (username: string, roomId: string) => {
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username,
      color: randomColor
    };
    setCurrentUser(newUser);
  };

  return (
    <div className="h-screen w-full flex flex-col">
      <div className="flex-1 overflow-auto">
        <Routes>
          <Route path="/" element={<LandingPage onJoin={handleJoin} />} />
          <Route path="/editor/:roomId" element={<EditorPage currentUser={currentUser} />} />
          <Route path="/test-editor" element={<MinimalEditorTest />} />
        </Routes>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;
