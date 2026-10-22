import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Header() {
  const { user, library, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="header">
      <div className="container header-inner">
        <Link to="/" className="logo">
          STEAM<span>CLONE</span>
        </Link>
        <nav>
          <NavLink to="/" end>
            Loja
          </NavLink>
          {user && (
            <NavLink to="/biblioteca">
              Biblioteca <small>({library.length})</small>
            </NavLink>
          )}
        </nav>
        <div className="header-user">
          {user ? (
            <>
              <span className="header-name">
                Olá, <strong>{user}</strong>
              </span>
              <button
                className="header-link"
                onClick={() => {
                  logout();
                  navigate('/');
                }}
              >
                Sair
              </button>
            </>
          ) : (
            <Link to="/login" className="header-link">
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
