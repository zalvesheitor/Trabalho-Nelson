import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import GameImage from '../components/GameImage.jsx';
import { formatDate, SearchInput, Stars } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useGames } from '../context/GamesContext.jsx';
import { matchesSearch } from '../pricing.js';

export default function Library() {
  const { user, library, myReview, bibliotecaPronta } = useAuth();
  const { games, loading } = useGames();
  const [busca, setBusca] = useState('');

  const items = useMemo(
      () =>
          library
              .map((entry) => ({ entry, game: games.find((g) => g.id === entry.jogoId) }))
              .filter((i) => i.game)
              .sort((a, b) => a.game.titulo.localeCompare(b.game.titulo)),
      [library, games]
  );

  // Barra de pesquisa da biblioteca: filtra em tempo real por título ou gênero.
  const filtrados = useMemo(() => items.filter((i) => matchesSearch(i.game, busca)), [items, busca]);

  if (loading || !bibliotecaPronta) return <p className="empty">Carregando…</p>;

  return (
      <>
        <div className="page-head">
          <h2 className="section-title">Biblioteca de {user.nome}</h2>
          {items.length > 0 && (
              <SearchInput
                  value={busca}
                  onChange={setBusca}
                  placeholder="Buscar na biblioteca por título ou gênero"
                  className="page-search"
              />
          )}
        </div>

        {items.length === 0 ? (
            <p className="empty">
              Sua biblioteca está vazia. <Link to="/">Explore a loja</Link> e adquira seu primeiro jogo.
            </p>
        ) : filtrados.length === 0 ? (
            <p className="empty">
              Nenhum jogo da sua biblioteca corresponde a “{busca.trim()}”.{' '}
              <button type="button" className="link-btn" onClick={() => setBusca('')}>
                Limpar busca
              </button>
            </p>
        ) : (
            <>
              {busca.trim() && (
                  <p className="muted results-count">
                    {filtrados.length} de {items.length} {items.length === 1 ? 'jogo' : 'jogos'}
                  </p>
              )}
              <ul className="library">
                {filtrados.map(({ entry, game }) => {
                  const review = myReview(game.id);
                  return (
                      <li key={game.id} className="library-item">
                        <GameImage src={game.capa} title={game.titulo} id={game.id} className="library-cover" />
                        <div className="library-info">
                          <h3>{game.titulo}</h3>
                          <p className="muted">
                            {game.genero} · adquirido em {formatDate(entry.data)}
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
            </>
        )}
      </>
  );
}
