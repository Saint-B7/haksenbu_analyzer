import React from 'react';
import ReactDOM from 'react-dom/client';
import HaksenbuAnalyzer from './HaksenbuAnalyzer.jsx';
import { ThemeProvider } from './contexts/ThemeContext.jsx';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <HaksenbuAnalyzer />
    </ThemeProvider>
  </React.StrictMode>
);
