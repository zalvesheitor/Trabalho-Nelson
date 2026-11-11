import { useEffect } from 'react';
import GameImage from './GameImage.jsx';
import { formatPrice } from './ui.jsx';

// Carrinho lateral (estilo Steam): abre ao clicar em "Adquirir" na página do jogo.
export default function CartDrawer({ open, game, busy = false, onClose, onCheckout }) {
  // Fecha com a tecla Esc.
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, busy, onClose]);

  return (
    <div className={open ? 'cart-root open' : 'cart-root'} aria-hidden={!open}>
      <div className="cart-overlay" onClick={busy ? undefined : onClose} />
      <aside className="cart-drawer" role="dialog" aria-modal="true" aria-label="Carrinho de compras">
        <header className="cart-head">
          <h2>Seu carrinho</h2>
          <button className="cart-close" onClick={onClose} disabled={busy} aria-label="Fechar carrinho">
            ×
          </button>
        </header>

        <p className="cart-added">✓ Adicionado ao seu carrinho!</p>

        <ul className="cart-items">
          <li className="cart-item">
            <GameImage src={game.capa} title={game.titulo} id={game.id} className="cart-thumb" />
            <div className="cart-item-info">
              <strong title={game.titulo}>{game.titulo}</strong>
              <span className="tag">{game.genero}</span>
            </div>
            <span className={game.preco ? 'price' : 'price free'}>{formatPrice(game.preco)}</span>
          </li>
        </ul>

        <footer className="cart-foot">
          <div className="cart-total">
            <span>Total estimado</span>
            <strong>{formatPrice(game.preco)}</strong>
          </div>
          <button className="btn btn-green cart-btn" onClick={onCheckout} disabled={busy}>
            {busy ? 'Aguarde…' : 'Finalizar compra'}
          </button>
          <button className="btn btn-ghost cart-btn" onClick={onClose} disabled={busy}>
            Continuar comprando
          </button>
        </footer>
      </aside>
    </div>
  );
}
