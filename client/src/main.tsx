import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'leaflet/dist/leaflet.css';
import '../index.css'
import App from './App.tsx'
import { AppProvider } from './contexts/AppContext.tsx';
import { InViewProvider } from './contexts/InViewContext.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppProvider>
      <InViewProvider>
        <App />
      </InViewProvider>
    </AppProvider>
  </StrictMode>,
)
