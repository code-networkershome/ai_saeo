import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AuthProvider } from './contexts/AuthContext'

// GLOBAL ERROR TRAP
window.onerror = function (msg, _url, line, col, error) {
  document.body.innerHTML = `
    <div style="color: red; padding: 20px; font-size: 20px; font-family: monospace; background: white; border: 5px solid red;">
      <h1>🛑 GLOBAL ERROR</h1>
      <p>${msg}</p>
      <p>Line: ${line}, Col: ${col}</p>
      <pre>${error?.stack}</pre>
    </div>
  `;
  return false;
};

import { BrowserRouter } from 'react-router-dom'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
