import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './3cs-care-services.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)