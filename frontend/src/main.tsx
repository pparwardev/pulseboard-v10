import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './global-width.css'
import './clouds.css'
import './night-theme.css'
import './theme.css'
import App from './App'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
