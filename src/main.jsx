import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import StudentApp from './views/StudentApp'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <StudentApp />
  </StrictMode>,
)
