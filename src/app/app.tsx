import { BrowserRouter, Route, Routes } from 'react-router';
import { EditorPage } from '@/pages/editor';
import { HomePage } from '@/pages/home';
import { HostPage } from '@/pages/host';
import { PlayPage } from '@/pages/play';
import { PreviewPage } from '@/pages/preview';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/host" element={<HostPage />} />
        <Route path="/editor" element={<EditorPage />} />
        <Route path="/preview" element={<PreviewPage />} />
        <Route path="/play/:role" element={<PlayPage />} />
      </Routes>
    </BrowserRouter>
  );
}
