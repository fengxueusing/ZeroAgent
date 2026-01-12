import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout';
import { Dashboard } from './pages/Dashboard';
import { Hunter } from './pages/Hunter';
import { Editor } from './pages/Editor';
import { Settings } from './pages/Settings';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="hunter" element={<Hunter />} />
          <Route path="editor" element={<Editor />} />
          <Route path="memory" element={<div className="text-zinc-500">Memory Core - Coming Soon</div>} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
