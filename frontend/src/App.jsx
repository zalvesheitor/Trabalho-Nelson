import { Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header.jsx';
import Store from './pages/Store.jsx';
import GamePage from './pages/GamePage.jsx';
import Library from './pages/Library.jsx';
import Login from './pages/Login.jsx';
import Wishlist from './pages/Wishlist.jsx';
import ScrollToTop from './components/ScrollToTop.jsx';
import BackToTop from './components/BackToTop.jsx';
import CartDrawer from './components/CartDrawer.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import { useAuth } from './context/AuthContext.jsx';

function RequireAuth({ children }) {
    const { user } = useAuth();
    return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
    return (
        <>
            <ScrollToTop />
            <Header />
            <main className="container">
                <Routes>
                    <Route path="/" element={<Store />} />
                    <Route path="/jogo/:slug" element={<GamePage />} />
                    <Route
                        path="/biblioteca"
                        element={
                            <RequireAuth>
                                <Library />
                            </RequireAuth>
                        }
                    />
                    <Route
                        path="/lista-de-desejos"
                        element={
                            <RequireAuth>
                                <Wishlist />
                            </RequireAuth>
                        }
                    />
                    <Route path="/login" element={<Login />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            <BackToTop />
            <CartDrawer />
            <CheckoutModal />
        </>
    );
}