import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { GamesProvider } from './context/GamesContext.jsx';
import { ToastProvider } from './context/ToastContext.jsx';
import { WishlistProvider } from './context/WishlistContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import './styles.css';
import './feed.css';
import './shop.css';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HashRouter>
            <GamesProvider>
                <AuthProvider>
                    <ToastProvider>
                        <WishlistProvider>
                            <CartProvider>
                                <App />
                            </CartProvider>
                        </WishlistProvider>
                    </ToastProvider>
                </AuthProvider>
            </GamesProvider>
        </HashRouter>
    </React.StrictMode>
);
