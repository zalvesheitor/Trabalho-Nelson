import { Link } from 'react-router-dom';
import GameImage from './GameImage.jsx';
import { DiscountPrice, QuickActions, formatDate } from './ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// RF-04.1: capa, título, gênero e valor comercial.
// Layout de linha, no estilo dos resultados de busca da Steam,
// com selo de desconto e botões rápidos (lista de desejos / carrinho).
export default function GameCard({ game }) {
  const { hasGame } = useAuth();
  const owned = hasGame(game.id);

  return (
    <div className="card">
      <Link to={`/jogo/${game.slug}`} className="card-link">
        <GameImage src={game.capa} title={game.titulo} id={game.id} className="card-cover" />
        <div className="card-body">
          <h3 title={game.titulo}>{game.titulo}</h3>
          <div className="card-tags">
            <span className="tag">{game.genero}</span>
            <span className="tag tag-dim">{game.desenvolvedora}</span>
          </div>
        </div>
        <span className="card-date">{formatDate(game.lancamento)}</span>
        <div className="card-price">
          {owned ? <span className="owned">✓ Na biblioteca</span> : <DiscountPrice game={game} />}
        </div>
      </Link>
      <QuickActions game={game} className="card-actions" />
    </div>
  );
}
