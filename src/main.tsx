import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx'
import Note from './Notes.tsx'

import Authentication from './Authentication.tsx'
import Home from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="note" element={<Note />} />
        <Route path="auth" element={<Authentication />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
