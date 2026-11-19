import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import GameImage from './GameImage.jsx';
import Icon from './Icon.jsx';
import { formatMoney, formatPrice } from './ui.jsx';
import { getPricing } from '../pricing.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

// Carrinho lateral (estilo Steam), global: abre pelo botão "Carrinho (X)" do topo
// ou ao clicar em "No Carrinho" em qualquer card/página.
export default function CartDrawer() {
  const { user } = useAuth();
  const { items, totals, remove, clear, open, closeCart, openCheckout, checkoutOpen } = useCart();
  const { show } = useToast();
  const navigate = useNavigate();

  // Fecha com a tecla Esc (se o modal de compra não estiver por cima).
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !checkoutOpen) closeCart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, checkoutOpen, closeCart]);

  function comprar() {
    if (!user) {
      closeCart();
      show('Entre na sua conta para concluir a compra. Seu carrinho foi mantido.', 'info');
      navigate('/login');
      return;
    }
    openCheckout();
  }

  return (
    <div className={open ? 'cart-root open' : 'cart-root'} aria-hidden={!open}>
      <div className="cart-overlay" onClick={closeCart} />
      <aside className="cart-drawer glass" role="dialog" aria-modal="true" aria-label="Carrinho de compras">
        <header className="cart-head">
          <h2>
            Seu carrinho <small>({items.length})</small>
          </h2>
          <button type="button" className="cart-close" onClick={closeCart} aria-label="Fechar carrinho">
            <Icon name="x" size={22} />
          </button>
        </header>

        {items.length === 0 ? (
          <div className="cart-empty">
            <Icon name="cart" size={42} />
            <p>Seu carrinho está vazio.</p>
            <button type="button" className="btn btn-ghost" onClick={closeCart}>
              Continuar comprando
            </button>
          </div>
        ) : (
          <>
            <ul className="cart-items">
              {items.map((game) => {
                const p = getPricing(game);
                return (
                  <li className="cart-item" key={game.id}>
                    <Link to={`/jogo/${game.slug}`} onClick={closeCart} className="cart-thumb-link">
                      <GameImage src={game.banner} title={game.titulo} id={game.id} className="cart-thumb" />
                    </Link>
                    <div className="cart-item-info">
                      <Link to={`/jogo/${game.slug}`} onClick={closeCart} className="cart-item-title" title={game.titulo}>
                        {game.titulo}
                      </Link>
                      <div className="cart-item-meta">
                        <span className="tag">{game.genero}</span>
                        {p.onSale && <span className="cart-item-off">-{p.discount}%</span>}
                      </div>
                      <button type="button" className="cart-remove" onClick={() => remove(game)}>
                        Remover
                      </button>
                    </div>
                    <div className="cart-item-price">
                      {p.onSale && <s>{formatMoney(p.original)}</s>}
                      <strong className={p.final ? '' : 'free'}>{formatPrice(p.final)}</strong>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="cart-clear-row">
              <button type="button" className="cart-clear" onClick={clear}>
                <Icon name="trash" size={13} /> Remover todos os itens
              </button>
            </div>
          </>
        )}

        <footer className="cart-foot">
          <dl className="cart-summary">
            <dt>Subtotal</dt>
            <dd>{formatMoney(totals.subtotal)}</dd>
            <dt>Descontos</dt>
            <dd className={totals.savings > 0 ? 'cart-savings' : ''}>
              {totals.savings > 0 ? `- ${formatMoney(totals.savings)}` : formatMoney(0)}
            </dd>
          </dl>
          <div className="cart-total">
            <span>Valor total</span>
            <strong>{formatMoney(totals.total)}</strong>
          </div>
          <button type="button" className="btn btn-green cart-btn" onClick={comprar} disabled={items.length === 0}>
            Comprar para a minha conta
          </button>
          <button type="button" className="btn btn-ghost cart-btn" onClick={closeCart}>
            Continuar comprando
          </button>
          {!user && items.length > 0 && <p className="hint cart-hint">Você precisará entrar na sua conta para finalizar.</p>}
        </footer>
      </aside>
    </div>
  );
}
