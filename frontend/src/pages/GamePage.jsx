import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import GameImage from '../components/GameImage.jsx';
import { formatDate, formatPrice, Stars } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useGames } from '../context/GamesContext.jsx';

function ReviewForm({ gameId, onSaved }) {
  const { saveReview, myReview } = useAuth();
  const existing = myReview(gameId);
  const [nota, setNota] = useState(existing?.nota || 0);
  const [texto, setTexto] = useState(existing?.texto || '');
  const [msg, setMsg] = useState(null);
  const [enviando, setEnviando] = useState(false);

  // Preenche com a avaliação já salva (que chega do backend depois que a página abre).
  useEffect(() => {
    setNota(existing?.nota || 0);
    setTexto(existing?.texto || '');
  }, [gameId, existing?.nota, existing?.texto]);

  async function submit(e) {
    e.preventDefault();
    setEnviando(true);
    const r = await saveReview(gameId, nota, texto);
    setEnviando(false);
    setMsg(r.ok ? { ok: true, text: 'Avaliação salva!' } : { ok: false, text: r.error });
    if (r.ok) onSaved();
  }

  return (
      <form className="review-form" onSubmit={submit}>
        <h3>{existing ? 'Editar sua avaliação' : 'Avalie este jogo'}</h3>
        <div className="rating-input" role="radiogroup" aria-label="Nota de 1 a 5">
          {[1, 2, 3, 4, 5].map((n) => (
              <button
                  type="button"
                  key={n}
                  className={n <= nota ? 'star on' : 'star'}
                  onClick={() => setNota(n)}
                  aria-label={`${n} estrela${n > 1 ? 's' : ''}`}
              >
                ★
              </button>
          ))}
          <span className="rating-label">{nota ? `${nota}/5` : 'Selecione uma nota'}</span>
        </div>
        <textarea
            rows={4}
            placeholder="Escreva o que você achou do jogo…"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
        />
        <button className="btn btn-blue" type="submit" disabled={enviando}>
          {enviando ? 'Salvando…' : 'Salvar avaliação'}
        </button>
        {msg && <p className={msg.ok ? 'msg ok' : 'msg err'}>{msg.text}</p>}
      </form>
  );
}

export default function GamePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { games, loading } = useGames();
  const { user, hasGame, acquireGame, bibliotecaPronta } = useAuth();
  const [confirmando, setConfirmando] = useState(false);
  const [adquirindo, setAdquirindo] = useState(false);
  const [erro, setErro] = useState('');
  const [reviews, setReviews] = useState([]);
  const [versao, setVersao] = useState(0);

  const game = games.find((g) => g.slug === slug);
  const gameId = game ? game.id : null;

  // Avaliações de todos os usuários para este jogo (GET /api/jogos/{id}/avaliacoes).
  useEffect(() => {
    if (gameId == null) return undefined;
    let cancelado = false;
    api.avaliacoesDoJogo(gameId).then((r) => {
      if (!cancelado) setReviews(r.ok ? r.data : []);
    });
    return () => {
      cancelado = true;
    };
  }, [gameId, versao]);

  if (loading) return <p className="empty">Carregando…</p>;
  if (!game) {
    return (
        <p className="empty">
          Jogo não encontrado. <Link to="/">Voltar para a loja</Link>
        </p>
    );
  }

  const owned = hasGame(game.id);
  const media = reviews.length ? reviews.reduce((s, r) => s + r.nota, 0) / reviews.length : 0;

  async function adquirir() {
    if (!user) {
      navigate('/login');
      return;
    }
    setAdquirindo(true);
    const r = await acquireGame(game);
    setAdquirindo(false);
    setConfirmando(false);
    setErro(r.ok ? '' : r.error);
  }

  return (
      <article className="game">
        <div className="breadcrumb">
          <Link to="/">Todos os jogos</Link> &gt; <span>{game.genero}</span> &gt; <span>{game.titulo}</span>
        </div>
        <h1 className="game-title">{game.titulo}</h1>

        <div className="game-top">
          <div className="game-banner">
            <GameImage src={game.banner} title={game.titulo} id={game.id} className="game-banner-img" />
          </div>

          <aside className="game-side">
            <GameImage src={game.capa} title={game.titulo} id={game.id} className="side-cover" />
            <dl>
              <dt>Avaliações</dt>
              <dd>
                {reviews.length > 0 ? (
                    <>
                      <Stars value={media} size={14} /> <small>({reviews.length})</small>
                    </>
                ) : (
                    <small>Sem avaliações</small>
                )}
              </dd>
              <dt>Lançamento</dt>
              <dd>{formatDate(game.lancamento)}</dd>
              <dt>Desenvolvedora</dt>
              <dd>{game.desenvolvedora}</dd>
              <dt>Gênero</dt>
              <dd>
                <span className="tag">{game.genero}</span>
              </dd>
              <dt>Classificação</dt>
              <dd>
                <span className={`classind c-${game.classificacao}`}>{game.classificacao}</span>
              </dd>
            </dl>
          </aside>
        </div>

        <div className="purchase">
          {!bibliotecaPronta ? (
              <p className="hint">Carregando sua biblioteca…</p>
          ) : owned ? (
              <>
                <h2>{game.titulo}</h2>
                <div className="purchase-action">
                  <p className="owned big">✓ Este jogo está na sua biblioteca</p>
                  <Link to="/biblioteca" className="btn btn-green">
                    Ir para a biblioteca
                  </Link>
                </div>
              </>
          ) : (
              <>
                <h2>{game.preco ? `Comprar ${game.titulo}` : `Jogar ${game.titulo}`}</h2>
                <div className="purchase-action">
                  <p className={game.preco ? 'price big' : 'price free big'}>{formatPrice(game.preco)}</p>
                  {!confirmando && (
                      <button className="btn btn-green" onClick={() => setConfirmando(true)}>
                        {game.preco ? 'Adquirir' : 'Adicionar à biblioteca'}
                      </button>
                  )}
                </div>
                {confirmando && (
                    <div className="confirm">
                      <p>
                        Confirmar a aquisição de <strong>{game.titulo}</strong> por {formatPrice(game.preco)}? (simulado)
                      </p>
                      <button className="btn btn-green" onClick={adquirir} disabled={adquirindo}>
                        {adquirindo ? 'Aguarde…' : 'Confirmar'}
                      </button>
                      <button className="btn btn-ghost" onClick={() => setConfirmando(false)} disabled={adquirindo}>
                        Cancelar
                      </button>
                    </div>
                )}
                {!user && <p className="hint">Você precisará entrar na sua conta para adquirir.</p>}
                {erro && <p className="msg err">{erro}</p>}
              </>
          )}
        </div>

        <div className="game-main">
          <h2>Sobre o jogo</h2>
          <p className="sinopse">{game.sinopse}</p>

          <h2>Avaliações {reviews.length > 0 && <small>({reviews.length})</small>}</h2>
          {reviews.length > 0 && (
              <p className="media">
                <Stars value={media} /> <span>{media.toFixed(1)} de 5</span>
              </p>
          )}

          {!bibliotecaPronta ? null : owned ? (
              <ReviewForm gameId={game.id} onSaved={() => setVersao((v) => v + 1)} />
          ) : (
              <p className="hint">Somente quem possui o jogo na biblioteca pode avaliá-lo.</p>
          )}

          {reviews.length === 0 ? (
              <p className="empty">Ainda não há avaliações.</p>
          ) : (
              <ul className="reviews">
                {reviews.map((r, i) => (
                    <li key={`${r.usuario}-${r.data}-${i}`}>
                      <div className="review-head">
                        <strong>{r.usuario}</strong>
                        <Stars value={r.nota} size={15} />
                        <small>{formatDate(r.data)}</small>
                      </div>
                      <p>{r.texto}</p>
                    </li>
                ))}
              </ul>
          )}
        </div>
      </article>
  );
}