import { Link } from 'react-router-dom';
import games from '../data/games.json';
import GameImage from '../components/GameImage.jsx';
import { formatDate, Stars } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// RF-04.4: exibe apenas os jogos adquiridos pelo usuário autenticado.
export default function Library() {
  const { user, library, myReview } = useAuth();

  const items = library
    .map((entry) => ({ entry, game: games.find((g) => g.id === entry.gameId) }))
    .filter((i) => i.game)
    .sort((a, b) => a.game.titulo.localeCompare(b.game.titulo));

  return (
    <>
      <h2 className="section-title">Biblioteca de {user}</h2>
      {items.length === 0 ? (
        <p className="empty">
          Sua biblioteca está vazia. <Link to="/">Explore a loja</Link> e adquira seu primeiro jogo.
        </p>
      ) : (
        <ul className="library">
          {items.map(({ entry, game }) => {
            const review = myReview(game.id);
            return (
              <li key={game.id} className="library-item">
                <GameImage src={game.capa} title={game.titulo} id={game.id} className="library-cover" />
                <div className="library-info">
                  <h3>{game.titulo}</h3>
                  <p className="muted">
                    {game.genero} · adquirido em {formatDate(entry.acquiredAt)}
                  </p>
                  {review ? (
                    <div>
                      <Stars value={review.nota} size={15} />
                      <p className="review-snippet">“{review.texto}”</p>
                    </div>
                  ) : (
                    <p className="muted">Você ainda não avaliou este jogo.</p>
                  )}
                </div>
                <Link to={`/jogo/${game.slug}`} className="btn btn-blue">
                  {review ? 'Editar avaliação' : 'Avaliar'}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
