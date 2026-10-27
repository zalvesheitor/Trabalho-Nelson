import { Link } from 'react-router-dom';
import GameImage from './GameImage.jsx';
import { formatDate, formatPrice } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// RF-04.1: capa, título, gênero e valor comercial.
// Layout de linha, no estilo dos resultados de busca da Steam.
export default function GameCard({ game }) {
  const { hasGame } = useAuth();
  const owned = hasGame(game.id);

  return (
    <Link to={`/jogo/${game.slug}`} className="card">
      <GameImage src={game.capa} title={game.titulo} id={game.id} className="card-cover" />
      <div className="card-body">
        <h3 title={game.titulo}>{game.titulo}</h3>
        <span className="tag">{game.genero}</span>
      </div>
      <span className="card-date">{formatDate(game.lancamento)}</span>
      <div className="card-price">
        {owned ? (
          <span className="owned">✓ Na biblioteca</span>
        ) : (
          <span className={game.preco ? 'price' : 'price free'}>{formatPrice(game.preco)}</span>
        )}
      </div>
    </Link>
  );
}
