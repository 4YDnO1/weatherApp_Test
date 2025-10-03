import React from 'react'
import ReactDOM from 'react-dom/client'
import App  from './ui/App'
import './styles/globals.css'
import './styles/components.css'
import './styles/language-switcher.css'
// Import i18n configuration
import './i18n'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
) 
