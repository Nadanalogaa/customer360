import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import AppShell from './shell/AppShell';
import Dashboard from './pages/Dashboard';
import ImageStudio from './pages/ImageStudio';
import WebsiteBuilder from './pages/WebsiteBuilder';
import Scheduler from './pages/Scheduler';
import Connections from './pages/Connections';
import Analytics from './pages/Analytics';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}> 
          <Route path="/" element={<Dashboard />} />
          <Route path="/studio" element={<ImageStudio />} />
          <Route path="/website" element={<WebsiteBuilder />} />
          <Route path="/scheduler" element={<Scheduler />} />
          <Route path="/connections" element={<Connections />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
