import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import GameImage from './GameImage.jsx';
import Icon from './Icon.jsx';
import { DiscountPrice, SearchInput } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useGames } from '../context/GamesContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';
import { matchesSearch } from '../pricing.js';

// Busca global da sub-barra da loja: sugestões em tempo real (título/gênero)
// e Enter leva para a loja com o filtro aplicado.
function GlobalSearch() {
  const { games } = useGames();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [termo, setTermo] = useState('');
  const [aberto, setAberto] = useState(false);
  const [ativo, setAtivo] = useState(-1);
  const boxRef = useRef(null);

  const sugestoes = useMemo(() => {
    if (!termo.trim()) return [];
    return games.filter((g) => matchesSearch(g, termo)).slice(0, 6);
  }, [games, termo]);

  // Fecha ao trocar de página ou clicar fora.
  useEffect(() => {
    setAberto(false);
    setAtivo(-1);
  }, [pathname]);

  useEffect(() => {
    const onClick = (e) => {
      if (boxRef.current && !boxRef.current.contains(e.target)) setAberto(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function buscarNaLoja() {
    const t = termo.trim();
    if (!t) return;
    setAberto(false);
    navigate(`/?q=${encodeURIComponent(t)}`);
  }

  function onKeyDown(e) {
    if (e.key === 'ArrowDown' && sugestoes.length) {
      e.preventDefault();
      setAberto(true);
      setAtivo((i) => (i + 1) % sugestoes.length);
    } else if (e.key === 'ArrowUp' && sugestoes.length) {
      e.preventDefault();
      setAtivo((i) => (i <= 0 ? sugestoes.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setAberto(false);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (aberto && ativo >= 0 && sugestoes[ativo]) {
        navigate(`/jogo/${sugestoes[ativo].slug}`);
        setTermo('');
      } else {
        buscarNaLoja();
      }
    }
  }

  return (
    <div className="global-search" ref={boxRef}>
      <SearchInput
        value={termo}
        onChange={(v) => {
          setTermo(v);
          setAberto(true);
          setAtivo(-1);
        }}
        onFocus={() => setAberto(true)}
        onKeyDown={onKeyDown}
        placeholder="buscar na loja"
        ariaLabel="Buscar jogos na loja por título ou gênero"
        role="combobox"
        aria-expanded={aberto && sugestoes.length > 0}
        aria-autocomplete="list"
      />
      {aberto && termo.trim() && (
        <div className="search-pop glass" role="listbox">
          {sugestoes.length === 0 ? (
            <p className="search-pop-empty">Nenhum jogo encontrado para “{termo.trim()}”.</p>
          ) : (
            <>
              {sugestoes.map((g, i) => (
                <Link
                  key={g.id}
                  to={`/jogo/${g.slug}`}
                  className={i === ativo ? 'search-pop-item on' : 'search-pop-item'}
                  role="option"
                  aria-selected={i === ativo}
                  onMouseEnter={() => setAtivo(i)}
                  onClick={() => setTermo('')}
                >
                  <GameImage src={g.banner} title={g.titulo} id={g.id} className="search-pop-thumb" />
                  <span className="search-pop-name">
                    <strong>{g.titulo}</strong>
                    <small>{g.genero}</small>
                  </span>
                  <DiscountPrice game={g} size="sm" />
                </Link>
              ))}
              <button type="button" className="search-pop-all" onClick={buscarNaLoja}>
                Ver todos os resultados para “{termo.trim()}”
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function Header() {
  const { user, library, logout } = useAuth();
  const { count: wishCount } = useWishlist();
  const { count: cartCount, openCart } = useCart();
  const navigate = useNavigate();

  return (
    <>
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
            <NavLink to="/lista-de-desejos" className="nav-hide-sm">
              Lista de desejos
            </NavLink>
          </nav>
          <div className="header-user">
            {user ? (
              <>
                <span className="header-name">
                  Olá, <strong>{user.nome}</strong>
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

      <div className="store-nav-wrap">
        <div className="container">
          <div className="store-quick">
            <Link to="/lista-de-desejos" className="wish-pill">
              Lista de Desejos ({wishCount})
            </Link>
            <button type="button" className="cart-pill" onClick={openCart}>
              <Icon name="cart" size={14} /> Carrinho ({cartCount})
            </button>
          </div>
          <div className="store-nav">
            <nav className="store-nav-links" aria-label="Navegação da loja">
              <NavLink to="/" end>
                Sua loja
              </NavLink>
              <NavLink to="/lista-de-desejos">Lista de desejos</NavLink>
              {user ? <NavLink to="/biblioteca">Biblioteca</NavLink> : <NavLink to="/login">Entrar</NavLink>}
            </nav>
            <GlobalSearch />
          </div>
        </div>
      </div>
    </>
  );
}
