import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'  // Import Tailwind styles

// ReactDOM.createRoot finds the <div id="root"> in index.html
// and mounts our entire React app inside it
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {/* StrictMode helps catch bugs by rendering twice in development */}
    <App />
  </React.StrictMode>
)