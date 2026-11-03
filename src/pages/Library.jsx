import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import games from '../data/games.json';
import GameImage from '../components/GameImage.jsx';
import Icon from '../components/Icon.jsx';
import { formatDate, formatPrice, Stars } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

// "Hoje" para eventos do dia; senão, a data completa.
function rotuloDia(iso) {
  return new Date(iso).toDateString() === new Date().toDateString() ? 'Hoje' : formatDate(iso);
}

// Formulário de avaliação (nota 1–5 + texto), aberto na própria biblioteca.
function ReviewForm({ game, review, onClose }) {
  const { saveReview } = useAuth();
  const [nota, setNota] = useState(review ? review.nota : 0);
  const [texto, setTexto] = useState(review ? review.texto : '');
  const [erro, setErro] = useState('');

  function enviar(e) {
    e.preventDefault();
    const r = saveReview(game.id, nota, texto);
    if (r.ok) onClose();
    else setErro(r.error);
  }

  return (
    <form className="lib-form" onSubmit={enviar}>
      <p className="lib-lead">{review ? 'Editar sua avaliação' : `Avalie ${game.titulo}`}</p>
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
      {erro && <p className="msg err">{erro}</p>}
      <div className="lib-form-actions">
        <button className="btn btn-blue" type="submit">
          Salvar avaliação
        </button>
        <button className="btn btn-ghost" type="button" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

// RF-04.4: exibe apenas os jogos adquiridos pelo usuário autenticado.
// Layout no estilo da biblioteca do cliente Steam: lista à esquerda, detalhes do jogo à direita.
export default function Library() {
  const { user, library, favorites, toggleFavorite, myReview, reviewsOf } = useAuth();
  const [busca, setBusca] = useState('');
  const [ordem, setOrdem] = useState('titulo');
  const [inverter, setInverter] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [aba, setAba] = useState('geral');
  const [editando, setEditando] = useState(false);

  const items = useMemo(
    () =>
      library
        .map((entry) => ({ entry, game: games.find((g) => g.id === entry.gameId) }))
        .filter((i) => i.game),
    [library]
  );

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = items.filter((i) => i.game.titulo.toLowerCase().includes(termo));
    if (ordem === 'recentes') {
      filtrados.sort((a, b) => b.entry.acquiredAt.localeCompare(a.entry.acquiredAt));
    } else {
      filtrados.sort((a, b) => a.game.titulo.localeCompare(b.game.titulo));
    }
    return inverter ? filtrados.reverse() : filtrados;
  }, [items, busca, ordem, inverter]);

  if (items.length === 0) {
    return (
      <div className="container lib-empty">
        <p className="empty">
          Sua biblioteca está vazia. <Link to="/">Explore a loja</Link> e adquira seu primeiro jogo.
        </p>
      </div>
    );
  }

  const favoritos = lista.filter((i) => favorites.includes(i.game.id));
  const demais = lista.filter((i) => !favorites.includes(i.game.id));

  const atual = items.find((i) => i.game.id === selecionado) || lista[0] || items[0];
  const { game, entry } = atual;
  const review = myReview(game.id);
  const favorito = favorites.includes(game.id);
  const classificacao = /^\d+$/.test(game.classificacao) ? `${game.classificacao} anos` : game.classificacao;

  const avaliacoes = reviewsOf(game.id);
  const media = avaliacoes.length ? avaliacoes.reduce((s, r) => s + r.nota, 0) / avaliacoes.length : 0;

  const totalGasto = items.reduce((s, i) => s + (i.entry.pricePaid || 0), 0);

  // Linha do tempo do jogo: aquisição e avaliação, do mais recente para o mais antigo.
  const eventos = [{ tipo: 'compra', data: entry.acquiredAt }];
  if (review) eventos.push({ tipo: 'avaliacao', data: review.data });
  eventos.sort((a, b) => b.data.localeCompare(a.data));
  const dias = [];
  eventos.forEach((ev) => {
    const rotulo = rotuloDia(ev.data);
    const ultimo = dias[dias.length - 1];
    if (ultimo && ultimo.rotulo === rotulo) ultimo.eventos.push(ev);
    else dias.push({ rotulo, eventos: [ev] });
  });

  function escolher(id) {
    setSelecionado(id);
    setEditando(false);
  }

  function abrirAvaliacao() {
    setAba('geral');
    setEditando(true);
    setTimeout(() => {
      const el = document.getElementById('lib-avaliacao');
      if (el) el.scrollIntoView({ block: 'center' });
    }, 0);
  }

  function renderItem({ game: g }) {
    const on = g.id === game.id;
    return (
      <li key={g.id}>
        <button
          className={on ? 'lib-item on' : 'lib-item'}
          aria-current={on ? 'true' : undefined}
          onClick={() => escolher(g.id)}
        >
          <GameImage src={g.capa} title={g.titulo} id={g.id} className="lib-icon" />
          <span>{g.titulo}</span>
        </button>
      </li>
    );
  }

  return (
    <div className="lib">
      <aside className="lib-side">
        <div className="lib-home">
          <Icon name="grid" size={16} />
          <span>Biblioteca de {user}</span>
        </div>

        <div className="lib-tools">
          <select value={ordem} onChange={(e) => setOrdem(e.target.value)} aria-label="Ordenar jogos">
            <option value="titulo">Ordem alfabética</option>
            <option value="recentes">Adquiridos recentemente</option>
          </select>
          <button
            className={inverter ? 'lib-tool on' : 'lib-tool'}
            onClick={() => setInverter(!inverter)}
            aria-pressed={inverter}
            aria-label="Inverter a ordem"
            title="Inverter a ordem"
          >
            <Icon name={inverter ? 'down' : 'up'} size={16} />
          </button>
        </div>

        <label className="lib-searchbox">
          <Icon name="search" size={16} />
          <input
            type="search"
            placeholder="Buscar na biblioteca"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>

        <div className="lib-scroll">
          {favoritos.length > 0 && (
            <>
              <p className="lib-count">Favoritos ({favoritos.length})</p>
              <ul className="lib-list">{favoritos.map(renderItem)}</ul>
            </>
          )}
          <p className="lib-count">Jogos ({demais.length})</p>
          <ul className="lib-list">{demais.map(renderItem)}</ul>
          {lista.length === 0 && <p className="lib-none">Nenhum jogo encontrado.</p>}
        </div>
      </aside>

      <section className="lib-main">
        <div className="lib-hero">
          <GameImage src={game.banner} title={game.titulo} id={game.id} className="lib-hero-img" />
          <h2>{game.titulo}</h2>
        </div>

        <div className="lib-actions" style={{ '--banner': `url(${game.banner})` }}>
          <button className="lib-play" onClick={abrirAvaliacao}>
            {review ? 'Editar avaliação' : 'Avaliar'}
          </button>

          <dl className="lib-stats">
            <div>
              <Icon name="calendar" size={26} />
              <dt>Adquirido em</dt>
              <dd>{formatDate(entry.acquiredAt)}</dd>
            </div>
            <div>
              <Icon name="tag" size={26} />
              <dt>Preço pago</dt>
              <dd>{formatPrice(entry.pricePaid)}</dd>
            </div>
            <div>
              <Icon name="code" size={26} />
              <dt>Desenvolvedora</dt>
              <dd>{game.desenvolvedora}</dd>
            </div>
            <div>
              <Icon name="star" size={26} />
              <dt>Avaliações</dt>
              <dd>
                {avaliacoes.length > 0 ? `${avaliacoes.length} · média ${media.toFixed(1)}/5` : 'Nenhuma ainda'}
                <span className="lib-bar" aria-hidden="true">
                  <span style={{ width: `${(media / 5) * 100}%` }} />
                </span>
              </dd>
            </div>
          </dl>

          <div className="lib-icons">
            <button
              className={favorito ? 'lib-iconbtn on' : 'lib-iconbtn'}
              onClick={() => toggleFavorite(game.id)}
              aria-pressed={favorito}
              aria-label={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
              title={favorito ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
            >
              <Icon name="heart" size={20} filled={favorito} />
            </button>
            <Link
              to={`/jogo/${game.slug}`}
              className="lib-iconbtn"
              aria-label="Abrir a página na loja"
              title="Abrir a página na loja"
            >
              <Icon name="info" size={20} />
            </Link>
          </div>
        </div>

        <nav className="lib-tabs" aria-label="Seções do jogo">
          <button className={aba === 'geral' ? 'on' : ''} onClick={() => setAba('geral')}>
            Visão geral
          </button>
          <button className={aba === 'avaliacoes' ? 'on' : ''} onClick={() => setAba('avaliacoes')}>
            Avaliações ({avaliacoes.length})
          </button>
          <Link to={`/jogo/${game.slug}`}>Página na loja</Link>
        </nav>

        {aba === 'geral' ? (
          <div className="lib-body">
            <div className="lib-col">
              <div id="lib-avaliacao" className="lib-review">
                {editando ? (
                  <ReviewForm
                    key={game.id}
                    game={game}
                    review={review}
                    onClose={() => setEditando(false)}
                  />
                ) : review ? (
                  <>
                    <p className="lib-lead">Sua avaliação de {game.titulo}</p>
                    <Stars value={review.nota} size={20} />
                    <p className="lib-review-text">“{review.texto}”</p>
                    <div className="lib-review-foot">
                      <button className="lib-answer" onClick={() => setEditando(true)}>
                        Editar avaliação
                      </button>
                      <small>Avaliado em {formatDate(review.data)}</small>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="lib-lead">Você tem {game.titulo} desde {formatDate(entry.acquiredAt)}</p>
                    <p className="lib-question">O que você achou do jogo? Sua opinião ajuda outros jogadores.</p>
                    <div className="lib-review-foot">
                      <button className="lib-answer" onClick={() => setEditando(true)}>
                        Avaliar agora
                      </button>
                    </div>
                  </>
                )}
              </div>

              <h3 className="lib-h">Atividade</h3>
              {dias.map((dia) => (
                <div key={dia.rotulo}>
                  <p className="lib-day">{dia.rotulo}</p>
                  {dia.eventos.map((ev) => (
                    <article key={ev.tipo} className="lib-event">
                      <GameImage src={game.banner} title={game.titulo} id={game.id} className="lib-event-img" />
                      <div>
                        {ev.tipo === 'compra' ? (
                          <>
                            <h4>Você adquiriu {game.titulo}</h4>
                            <p>Valor pago: {formatPrice(entry.pricePaid)}. O jogo agora faz parte da sua conta.</p>
                          </>
                        ) : (
                          <>
                            <h4>Você avaliou {game.titulo}</h4>
                            <Stars value={review.nota} size={14} />
                            <p>“{review.texto}”</p>
                          </>
                        )}
                      </div>
                    </article>
                  ))}
                </div>
              ))}
            </div>

            <div className="lib-col">
              <h3 className="lib-h">Avaliações dos usuários</h3>
              <div className="lib-box">
                {avaliacoes.length > 0 ? (
                  <>
                    <p className="lib-summary">
                      <Stars value={media} size={16} /> <strong>{media.toFixed(1)}</strong> de 5
                    </p>
                    <p className="lib-count-text">
                      {avaliacoes.length} {avaliacoes.length === 1 ? 'avaliação' : 'avaliações'} ({Math.round((media / 5) * 100)}%)
                    </p>
                    <span className="lib-bar wide" aria-hidden="true">
                      <span style={{ width: `${(media / 5) * 100}%` }} />
                    </span>
                    <button className="lib-link" onClick={() => setAba('avaliacoes')}>
                      Ver todas as avaliações
                    </button>
                  </>
                ) : (
                  <p className="muted">Ninguém avaliou este jogo ainda.</p>
                )}
              </div>

              <h3 className="lib-h">Sobre o jogo</h3>
              <div className="lib-box">
                <p className="lib-synopsis">{game.sinopse}</p>
                <dl className="lib-facts">
                  <dt>Gênero</dt>
                  <dd>{game.genero}</dd>
                  <dt>Lançamento</dt>
                  <dd>{formatDate(game.lancamento)}</dd>
                  <dt>Classificação</dt>
                  <dd>{classificacao}</dd>
                </dl>
              </div>
            </div>
          </div>
        ) : (
          <div className="lib-body single">
            <div className="lib-col">
              <h3 className="lib-h">Avaliações de {game.titulo}</h3>
              {avaliacoes.length === 0 ? (
                <p className="empty">Ainda não há avaliações para este jogo.</p>
              ) : (
                <ul className="reviews">
                  {avaliacoes.map((r) => (
                    <li key={r.username}>
                      <div className="review-head">
                        <strong>{r.username}</strong>
                        <Stars value={r.nota} size={15} />
                        <small>{formatDate(r.data)}</small>
                      </div>
                      <p>{r.texto}</p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <footer className="lib-bottom">
        <Link to="/" className="lib-add">
          <Icon name="plus" size={18} />
          <span>Adicionar jogo</span>
        </Link>
        <span>
          {items.length} {items.length === 1 ? 'jogo' : 'jogos'} · {totalGasto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} em compras
        </span>
      </footer>
    </div>
  );
}
