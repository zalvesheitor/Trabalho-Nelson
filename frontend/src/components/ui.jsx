import Icon from './Icon.jsx';
import { getPricing } from '../pricing.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

export function formatPrice(preco) {
  if (!preco) return 'Gratuito';
  return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatMoney(valor) {
  return (valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function Stars({ value, size = 18 }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? 'star on' : 'star'}>
          ★
        </span>
      ))}
    </span>
  );
}

// Preço no padrão Steam: selo verde "-XX%" + preço original riscado + preço final.
// Sem promoção, mostra só o preço (ou "Gratuito").
export function DiscountPrice({ game, size = '', className = '' }) {
  const p = getPricing(game);
  if (!p.onSale) {
    return <span className={`price ${p.final ? '' : 'free'} ${size} ${className}`}>{formatPrice(p.final)}</span>;
  }
  return (
    <span className={`dprice ${size} ${className}`} aria-label={`De ${formatMoney(p.original)} por ${formatMoney(p.final)}`}>
      <span className="dprice-pct">-{p.discount}%</span>
      <span className="dprice-vals">
        <s>{formatMoney(p.original)}</s>
        <b>{formatMoney(p.final)}</b>
      </span>
    </span>
  );
}

// Botões rápidos (lista de desejos + carrinho) usados nos cards da loja.
// Ficam fora de links, mas por segurança impedem a navegação do elemento pai.
export function QuickActions({ game, className = '' }) {
  const { hasGame } = useAuth();
  const { isWished, toggle } = useWishlist();
  const { inCart, add, openCart } = useCart();

  if (hasGame(game.id)) return null;

  const wished = isWished(game.id);
  const noCarrinho = inCart(game.id);

  const parar = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div className={`quick-actions ${className}`}>
      <button
        type="button"
        className={wished ? 'qa-btn qa-wish on' : 'qa-btn qa-wish'}
        onClick={(e) => {
          parar(e);
          toggle(game);
        }}
        aria-pressed={wished}
        aria-label={wished ? 'Remover da lista de desejos' : 'Adicionar à lista de desejos'}
        title={wished ? 'Na lista de desejos' : 'Adicionar à lista de desejos'}
      >
        <Icon name="heart" size={15} filled={wished} />
      </button>
      <button
        type="button"
        className={noCarrinho ? 'qa-btn qa-cart on' : 'qa-btn qa-cart'}
        onClick={(e) => {
          parar(e);
          if (noCarrinho) openCart();
          else add(game);
        }}
        aria-label={noCarrinho ? 'No carrinho — abrir carrinho' : 'Adicionar ao carrinho'}
        title={noCarrinho ? 'No carrinho' : 'Adicionar ao carrinho'}
      >
        <Icon name={noCarrinho ? 'check' : 'cart'} size={15} />
      </button>
    </div>
  );
}

// Botão "Adicionar ao carrinho" / "No Carrinho" (página do jogo e lista de desejos).
export function CartButton({ game, className = '', onAdded }) {
  const { inCart, add, openCart } = useCart();
  const noCarrinho = inCart(game.id);
  if (noCarrinho) {
    return (
      <button type="button" className={`btn btn-green btn-incart ${className}`} onClick={openCart}>
        <Icon name="check" size={14} /> No Carrinho
      </button>
    );
  }
  return (
    <button
      type="button"
      className={`btn btn-green ${className}`}
      onClick={() => {
        if (add(game) && onAdded) onAdded();
      }}
    >
      {game.preco ? 'Adicionar ao carrinho' : 'Adicionar à conta'}
    </button>
  );
}

// Campo de busca no tema Steam (fundo #316282 com lupa).
export function SearchInput({ value, onChange, placeholder, className = '', ariaLabel, ...rest }) {
  return (
    <div className={`steam-search ${className}`}>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={ariaLabel || placeholder}
        {...rest}
      />
      <span className="steam-search-icon" aria-hidden="true">
        <Icon name="search" size={16} />
      </span>
    </div>
  );
}
