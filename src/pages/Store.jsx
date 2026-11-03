import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import games from '../data/games.json';
import GameCard from '../components/GameCard.jsx';
import GameImage from '../components/GameImage.jsx';
import Icon from '../components/Icon.jsx';
import { PriceTag, precoFinal } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';

const POR_PAGINA = 8;

const generos = ['Todos', ...Array.from(new Set(games.map((g) => g.genero))).sort()];
const destaques = games.filter((g) => g.destaque);
const ofertas = games.filter((g) => g.desconto).sort((a, b) => b.desconto - a.desconto);

// Lançamentos agrupados pelos 5 anos mais recentes do catálogo.
const lancamentos = Array.from(new Set(games.map((g) => g.lancamento.slice(0, 4))))
  .sort()
  .slice(-5)
  .map((ano) => ({
    ano,
    jogos: games.filter((g) => g.lancamento.startsWith(ano)).sort((a, b) => b.lancamento.localeCompare(a.lancamento)),
  }));

function reduzMovimento() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function irPara(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: reduzMovimento() ? 'auto' : 'smooth', block: 'start' });
}

// Faixa horizontal com setas, como os carrosséis da loja Steam.
function Faixa({ children }) {
  const ref = useRef(null);

  function mover(sentido) {
    const el = ref.current;
    if (el) el.scrollBy({ left: sentido * el.clientWidth * 0.9, behavior: reduzMovimento() ? 'auto' : 'smooth' });
  }

  return (
    <div className="faixa-wrap">
      <button className="faixa-seta esq" onClick={() => mover(-1)} aria-label="Anterior">
        ‹
      </button>
      <div className="faixa" ref={ref}>
        {children}
      </div>
      <button className="faixa-seta dir" onClick={() => mover(1)} aria-label="Próximo">
        ›
      </button>
    </div>
  );
}

function PromoCard({ game }) {
  return (
    <Link to={`/jogo/${game.slug}`} className="promo">
      <div className="promo-img">
        <GameImage src={game.banner} title={game.titulo} id={game.id} className="promo-banner" />
        <span className="promo-tag">Oferta</span>
      </div>
      <div className="promo-foot">
        <span className="promo-name">{game.titulo}</span>
        <PriceTag game={game} />
      </div>
    </Link>
  );
}

function MiniCard({ game }) {
  return (
    <Link to={`/jogo/${game.slug}`} className="mini">
      <GameImage src={game.banner} title={game.titulo} id={game.id} className="mini-img" />
      <span className="mini-name">{game.titulo}</span>
      <span className="mini-genre">{game.genero}</span>
      <PriceTag game={game} />
    </Link>
  );
}

export default function Store() {
  const navigate = useNavigate();
  const { user, library, hasGame, wishlist } = useAuth();
  const [busca, setBusca] = useState('');
  const [genero, setGenero] = useState('Todos');
  const [ordem, setOrdem] = useState('titulo');
  const [soOfertas, setSoOfertas] = useState(false);
  const [soDesejos, setSoDesejos] = useState(false);
  const [destaqueIdx, setDestaqueIdx] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [visiveis, setVisiveis] = useState(POR_PAGINA);
  const sentinela = useRef(null);

  // Rotação automática dos destaques, como na vitrine da Steam (pausa ao passar o mouse).
  useEffect(() => {
    if (pausado || destaques.length < 2) return undefined;
    const t = setInterval(() => setDestaqueIdx((i) => (i + 1) % destaques.length), 6000);
    return () => clearInterval(t);
  }, [pausado]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = games.filter(
      (g) =>
        (genero === 'Todos' || g.genero === genero) &&
        g.titulo.toLowerCase().includes(termo) &&
        (!soOfertas || g.desconto) &&
        (!soDesejos || wishlist.includes(g.id))
    );
    const cmp = {
      titulo: (a, b) => a.titulo.localeCompare(b.titulo),
      menor: (a, b) => precoFinal(a) - precoFinal(b),
      maior: (a, b) => precoFinal(b) - precoFinal(a),
    }[ordem];
    return filtrados.sort(cmp);
  }, [busca, genero, ordem, soOfertas, soDesejos, wishlist]);

  // Rolagem infinita: volta ao começo quando um filtro muda e carrega mais jogos ao chegar no fim da lista.
  useEffect(() => {
    setVisiveis(POR_PAGINA);
  }, [busca, genero, ordem, soOfertas, soDesejos]);

  useEffect(() => {
    const el = sentinela.current;
    if (!el) return undefined;
    const io = new IntersectionObserver(
      (entradas) => {
        if (entradas[0].isIntersecting) setVisiveis((v) => v + POR_PAGINA);
      },
      { rootMargin: '200px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visiveis, lista.length]);

  // Recomendações: jogos que o usuário não tem, nos gêneros da biblioteca dele (ou os mais novos da loja).
  const recomendados = useMemo(() => {
    const generosDoUsuario = new Set(
      library.map((e) => games.find((g) => g.id === e.gameId)).filter(Boolean).map((g) => g.genero)
    );
    const naoTem = games.filter((g) => !hasGame(g.id));
    const porGenero = naoTem.filter((g) => generosDoUsuario.has(g.genero));
    const personalizado = porGenero.length >= 4;
    const base = personalizado ? porGenero : naoTem;
    return {
      personalizado,
      jogos: [...base].sort((a, b) => b.lancamento.localeCompare(a.lancamento)).slice(0, 10),
    };
  }, [library, hasGame]);

  const destaque = destaques[destaqueIdx % destaques.length];

  function alternarDesejos() {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!soDesejos) setTimeout(() => irPara('catalogo'), 0);
    setSoDesejos(!soDesejos);
  }

  function verOfertas() {
    setSoOfertas(true);
    setTimeout(() => irPara('catalogo'), 0);
  }

  return (
    <>
      <nav className="store-nav" aria-label="Navegação da loja">
        <div className="store-links">
          <button onClick={() => irPara('destaques')}>Destaques</button>
          {ofertas.length > 0 && <button onClick={() => irPara('descontos')}>Descontos</button>}
          <button onClick={() => irPara('lancamentos')}>Lançamentos</button>
          <button onClick={() => irPara('recomendados')}>Recomendados</button>
          <button onClick={() => irPara('catalogo')}>Catálogo</button>
        </div>
        <form
          className="store-search"
          role="search"
          onSubmit={(e) => {
            e.preventDefault();
            irPara('catalogo');
          }}
        >
          <input
            type="search"
            placeholder="Buscar na loja"
            aria-label="Buscar na loja"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <button type="submit" aria-label="Buscar">
            <Icon name="search" size={18} />
          </button>
        </form>
        <button className={soDesejos ? 'store-wish on' : 'store-wish'} onClick={alternarDesejos} aria-pressed={soDesejos}>
          <Icon name="heart" size={16} filled={soDesejos} />
          Lista de desejos <span>{wishlist.length}</span>
        </button>
      </nav>

      <section
        id="destaques"
        className="hero"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
      >
        <div className="bloco-head">
          <h2>Destaques e recomendados</h2>
        </div>
        <div className="hero-main">
          <Link to={`/jogo/${destaque.slug}`} className="hero-link">
            <GameImage src={destaque.banner} title={destaque.titulo} id={destaque.id} className="hero-img" />
            <div className="hero-info">
              <span className="tag">Destaque</span>
              <h2>{destaque.titulo}</h2>
              <p>{destaque.sinopse}</p>
              <div className="hero-price">
                <PriceTag game={destaque} />
              </div>
            </div>
          </Link>
          <ul className="hero-list">
            {destaques.map((d, i) => (
              <li key={d.id}>
                <button
                  className={i === destaqueIdx % destaques.length ? 'hero-item on' : 'hero-item'}
                  onMouseEnter={() => setDestaqueIdx(i)}
                  onClick={() => setDestaqueIdx(i)}
                >
                  <GameImage src={d.capa} title={d.titulo} id={d.id} className="hero-item-cover" />
                  <span>{d.titulo}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div className="hero-dots">
          {destaques.map((d, i) => (
            <button
              key={d.id}
              className={i === destaqueIdx % destaques.length ? 'dot on' : 'dot'}
              onClick={() => setDestaqueIdx(i)}
              aria-label={`Destaque ${d.titulo}`}
            />
          ))}
        </div>
      </section>

      {ofertas.length > 0 && (
        <section id="descontos" className="loja-bloco">
          <div className="bloco-head">
            <h2>Descontos e ofertas</h2>
            <button className="btn-mais" onClick={verOfertas}>
              Ver mais
            </button>
          </div>
          <div className="bloco-painel">
            <Faixa>
              {ofertas.map((g) => (
                <PromoCard key={g.id} game={g} />
              ))}
            </Faixa>
          </div>
        </section>
      )}

      <section id="lancamentos" className="loja-bloco">
        <div className="bloco-head">
          <div>
            <h2>Lançamentos por ano</h2>
            <p className="bloco-sub">Os jogos do catálogo agrupados pelo ano em que foram lançados.</p>
          </div>
        </div>
        <div className="cal">
          {lancamentos.map((col, i) => (
            <div key={col.ano} className={i === lancamentos.length - 1 ? 'cal-col last' : 'cal-col'}>
              <h3>{col.ano}</h3>
              {col.jogos.slice(0, 2).map((g) => (
                <Link key={g.id} to={`/jogo/${g.slug}`} className="cal-item">
                  <GameImage src={g.banner} title={g.titulo} id={g.id} className="cal-img" />
                  <span>{g.titulo}</span>
                </Link>
              ))}
              {col.jogos.length > 2 && <span className="cal-more">e mais {col.jogos.length - 2}</span>}
            </div>
          ))}
        </div>
      </section>

      {recomendados.jogos.length > 0 && (
        <section id="recomendados" className="loja-bloco">
          <div className="bloco-head">
            <div>
              <h2>{recomendados.personalizado ? 'Recomendado baseado nos jogos da sua biblioteca' : 'Novidades da loja'}</h2>
              {!recomendados.personalizado && (
                <p className="bloco-sub">Os lançamentos mais recentes do catálogo. Adquira jogos para ver recomendações personalizadas.</p>
              )}
            </div>
          </div>
          <Faixa>
            {recomendados.jogos.map((g) => (
              <MiniCard key={g.id} game={g} />
            ))}
          </Faixa>
        </section>
      )}

      <div id="catalogo" className="store-layout">
        <div className="store-main">
          <div className="bloco-head">
            <h2>
              {soDesejos ? 'Sua lista de desejos' : genero === 'Todos' ? 'Todos os jogos' : genero} ({lista.length})
            </h2>
          </div>

          <section className="filters">
            <select value={ordem} onChange={(e) => setOrdem(e.target.value)} aria-label="Ordenar jogos">
              <option value="titulo">Ordem alfabética</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
            </select>
            <button className={soOfertas ? 'chip on' : 'chip'} onClick={() => setSoOfertas(!soOfertas)} aria-pressed={soOfertas}>
              Em oferta
            </button>
            {(busca || soDesejos) && (
              <span className="filters-note">
                {busca && `Busca: “${busca}”`} {soDesejos && 'Só lista de desejos'}
              </span>
            )}
          </section>

          {lista.length === 0 ? (
            <p className="empty">
              {soDesejos
                ? 'Sua lista de desejos está vazia para este filtro. Abra a página de um jogo e adicione à lista.'
                : 'Nenhum jogo encontrado.'}
            </p>
          ) : (
            <>
              <div className="grid">
                {lista.slice(0, visiveis).map((g) => (
                  <GameCard key={g.id} game={g} />
                ))}
              </div>
              {visiveis < lista.length ? (
                <div ref={sentinela} className="scroll-more" role="status">
                  Carregando mais jogos…
                </div>
              ) : (
                <p className="scroll-end">Você chegou ao fim: {lista.length} {lista.length === 1 ? 'jogo' : 'jogos'}.</p>
              )}
            </>
          )}
        </div>

        <aside className="store-side">
          <h3>Navegar por gênero</h3>
          <ul>
            {generos.map((g) => (
              <li key={g}>
                <button className={g === genero ? 'genre on' : 'genre'} onClick={() => setGenero(g)}>
                  {g}
                  <small>{g === 'Todos' ? games.length : games.filter((x) => x.genero === g).length}</small>
                </button>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </>
  );
}
