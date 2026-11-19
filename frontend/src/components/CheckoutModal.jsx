import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { formatMoney } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

// Modal de finalização ("Comprar para a minha conta").
// O pagamento é simulado; cada jogo é de fato associado à conta pelo backend
// (POST /api/biblioteca/jogos/{id}, o mesmo fluxo do antigo botão "Adquirir").
export default function CheckoutModal() {
  const { acquireGame } = useAuth();
  const { items, totals, checkoutOpen, closeCheckout, closeCart, clear, removeMany } = useCart();
  const { removeMany: removeFromWishlist } = useWishlist();
  // fase: 'confirm' | 'processing' | 'done'
  const [fase, setFase] = useState('confirm');
  const [resumo, setResumo] = useState(null);

  useEffect(() => {
    if (checkoutOpen) {
      setFase('confirm');
      setResumo(null);
    }
  }, [checkoutOpen]);

  useEffect(() => {
    if (!checkoutOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape' && fase !== 'processing') fechar();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  if (!checkoutOpen) return null;

  function fechar() {
    closeCheckout();
    if (fase === 'done') closeCart();
  }

  async function confirmar() {
    setFase('processing');
    // Fotografa o carrinho: a biblioteca recarrega durante o loop e o carrinho
    // remove sozinho os jogos que passaram a ser do usuário.
    const pedido = [...items];
    const valorPago = totals.total;
    const comprados = [];
    const falhas = [];
    // Simula o tempo do processamento do pagamento.
    await new Promise((r) => setTimeout(r, 900));
    for (const game of pedido) {
      const r = await acquireGame(game);
      if (r.ok) comprados.push(game);
      else falhas.push({ game, error: r.error });
    }
    const idsComprados = comprados.map((g) => g.id);
    if (falhas.length === 0) clear();
    else removeMany(idsComprados);
    removeFromWishlist(idsComprados);
    setResumo({ comprados, falhas, total: valorPago });
    setFase('done');
  }

  return (
    <div className="modal-root" role="dialog" aria-modal="true" aria-labelledby="checkout-title">
      <div className="modal-overlay" onClick={fase === 'processing' ? undefined : fechar} />
      <div className="modal glass">
        {fase !== 'done' ? (
          <>
            <h2 id="checkout-title">Confirmar compra</h2>
            <p className="muted">
              Os jogos abaixo serão adicionados permanentemente à sua biblioteca.
            </p>
            <ul className="modal-list">
              {items.map((g) => (
                <li key={g.id}>
                  <span>{g.titulo}</span>
                  <span>{formatMoney(g.preco)}</span>
                </li>
              ))}
            </ul>
            <div className="modal-total">
              <span>Total</span>
              <strong>{formatMoney(totals.total)}</strong>
            </div>
            {totals.savings > 0 && (
              <p className="modal-savings">Você está economizando {formatMoney(totals.savings)} nesta compra!</p>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={fechar} disabled={fase === 'processing'}>
                Cancelar
              </button>
              <button type="button" className="btn btn-green" onClick={confirmar} disabled={fase === 'processing' || items.length === 0}>
                {fase === 'processing' ? (
                  <>
                    <span className="spinner" aria-hidden="true" /> Processando…
                  </>
                ) : (
                  'Confirmar compra'
                )}
              </button>
            </div>
          </>
        ) : (
          <>
            {resumo.comprados.length > 0 && (
              <div className="modal-success">
                <span className="modal-success-icon">
                  <Icon name="check" size={28} />
                </span>
                <h2 id="checkout-title">Obrigado pela compra!</h2>
                <p className="muted">
                  {resumo.comprados.length === 1
                    ? `${resumo.comprados[0].titulo} já está na sua biblioteca.`
                    : `${resumo.comprados.length} jogos já estão na sua biblioteca.`}
                </p>
              </div>
            )}
            {resumo.falhas.length > 0 && (
              <div className="modal-errors">
                <h3>Não foi possível concluir:</h3>
                <ul>
                  {resumo.falhas.map(({ game, error }) => (
                    <li key={game.id}>
                      <strong>{game.titulo}</strong>: {error}
                    </li>
                  ))}
                </ul>
                <p className="muted">Esses itens continuam no seu carrinho.</p>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="btn btn-ghost" onClick={fechar}>
                Continuar comprando
              </button>
              {resumo.comprados.length > 0 && (
                <Link
                  to="/biblioteca"
                  className="btn btn-green"
                  onClick={() => {
                    closeCheckout();
                    closeCart();
                  }}
                >
                  Ir para a biblioteca
                </Link>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
