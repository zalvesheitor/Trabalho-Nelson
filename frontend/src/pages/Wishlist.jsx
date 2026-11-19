import { Link } from 'react-router-dom';
import GameImage from '../components/GameImage.jsx';
import Icon from '../components/Icon.jsx';
import { DiscountPrice, formatDate } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useGames } from '../context/GamesContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import { useWishlist } from '../context/WishlistContext.jsx';

// Lista de desejos: jogos favoritados (localStorage), com atalho para o carrinho.
export default function Wishlist() {
  const { user, hasGame } = useAuth();
  const { loading } = useGames();
  const { items, remove } = useWishlist();
  const { inCart, add, openCart } = useCart();
  const { show } = useToast();

  if (loading) return <p className="empty">Carregando…</p>;

  function moverParaCarrinho(game) {
    if (add(game, { silent: true })) {
      remove(game, { silent: true });
      show(`${game.titulo} foi movido para o carrinho.`, 'success');
    }
  }

  return (
      <>
        <div className="page-head">
          <h2 className="section-title">
            {user ? `Lista de desejos de ${user.nome}` : 'Sua lista de desejos'} <small>({items.length})</small>
          </h2>
        </div>

        {items.length === 0 ? (
            <div className="wish-empty">
              <Icon name="heart" size={40} />
              <p>Sua lista de desejos está vazia.</p>
              <p className="muted">
                Clique no coração dos jogos da loja para acompanhá-los aqui.
              </p>
              <Link to="/" className="btn btn-ghost">
                Explorar a loja
              </Link>
            </div>
        ) : (
            <ul className="wishlist">
              {items.map((game, i) => {
                const owned = hasGame(game.id);
                const noCarrinho = inCart(game.id);
                return (
                    <li key={game.id} className="wish-item">
                      <span className="wish-rank">{i + 1}</span>
                      <Link to={`/jogo/${game.slug}`} className="wish-cover-link">
                        <GameImage src={game.banner} title={game.titulo} id={game.id} className="wish-cover" />
                      </Link>
                      <div className="wish-info">
                        <Link to={`/jogo/${game.slug}`} className="wish-title">
                          {game.titulo}
                        </Link>
                        <div className="card-tags">
                          <span className="tag">{game.genero}</span>
                          <span className="tag tag-dim">{game.desenvolvedora}</span>
                        </div>
                        <small className="muted">Lançamento: {formatDate(game.lancamento)}</small>
                      </div>
                      <div className="wish-buy">
                        {owned ? (
                            <span className="owned">✓ Na biblioteca</span>
                        ) : (
                            <div className="purchase-action">
                              <DiscountPrice game={game} />
                              {noCarrinho ? (
                                  <button type="button" className="btn btn-green btn-incart" onClick={openCart}>
                                    <Icon name="check" size={14} /> No Carrinho
                                  </button>
                              ) : (
                                  <button type="button" className="btn btn-green" onClick={() => moverParaCarrinho(game)}>
                                    Mover para o carrinho
                                  </button>
                              )}
                            </div>
                        )}
                        <button type="button" className="wish-remove" onClick={() => remove(game)}>
                          <Icon name="trash" size={13} /> Remover
                        </button>
                      </div>
                    </li>
                );
              })}
            </ul>
        )}
      </>
  );
}
