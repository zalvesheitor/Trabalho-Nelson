import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { GamesProvider } from './context/GamesContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HashRouter>
            <GamesProvider>
                <AuthProvider>
                    <App />
                </AuthProvider>
            </GamesProvider>
        </HashRouter>
    </React.StrictMode>
);