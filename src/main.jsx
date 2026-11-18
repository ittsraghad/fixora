import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import Splash from './Splash'
import { AuthProvider } from './auth'
import './index.css'
createRoot(document.getElementById('root')).render(<BrowserRouter><AuthProvider><Splash><App/></Splash></AuthProvider></BrowserRouter>)
