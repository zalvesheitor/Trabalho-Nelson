import { Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Header from './components/Header.jsx';
import Store from './pages/Store.jsx';
import GamePage from './pages/GamePage.jsx';
import Library from './pages/Library.jsx';
import Login from './pages/Login.jsx';
import { useAuth } from './context/AuthContext.jsx';

function RequireAuth({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

// Páginas comuns ficam dentro do container central; a biblioteca ocupa a tela toda, como no cliente Steam.
function PageLayout() {
  return (
    <main className="container">
      <Outlet />
    </main>
  );
}

export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route element={<PageLayout />}>
          <Route path="/" element={<Store />} />
          <Route path="/jogo/:slug" element={<GamePage />} />
          <Route path="/login" element={<Login />} />
        </Route>
        <Route
          path="/biblioteca"
          element={
            <RequireAuth>
              <Library />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
