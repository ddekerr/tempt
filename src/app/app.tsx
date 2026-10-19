import { BrowserRouter, Route, Routes } from 'react-router';
import { EditorPage } from '@/pages/editor';
import { HomePage } from '@/pages/home';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/editor" element={<EditorPage />} />
      </Routes>
    </BrowserRouter>
  );
}
