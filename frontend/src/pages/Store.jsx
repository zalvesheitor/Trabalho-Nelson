import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigationType } from 'react-router-dom';
import GameCard from '../components/GameCard.jsx';
import GameImage from '../components/GameImage.jsx';
import { formatPrice } from '../components/ui.jsx';
import InfiniteFeed from '../components/feed/InfiniteFeed.jsx';
import InfiniteList from '../components/feed/InfiniteList.jsx';
import { storeMemory } from '../feed/storeMemory.js';
import { useGames } from '../context/GamesContext.jsx';

const ORDENS = {
  feed: (a, b) => b.lancamento.localeCompare(a.lancamento), // "Vitrine": no modo lista, mais recentes primeiro
  titulo: (a, b) => a.titulo.localeCompare(b.titulo),
  menor: (a, b) => a.preco - b.preco,
  maior: (a, b) => b.preco - a.preco,
};

export default function Store() {
  const { games, loading, error } = useGames();
  const navType = useNavigationType();

  // Voltar (POP) devolve a loja exatamente como estava; entrar por um link começa do zero.
  // O reset é idempotente, então pode ficar no inicializador (StrictMode o executa duas vezes).
  const [restore, setRestore] = useState(() => {
    const voltando = navType === 'POP' && storeMemory.get().valido;
    if (!voltando) storeMemory.reset();
    return voltando;
  });
  const [busca, setBusca] = useState(() => (restore ? storeMemory.get().busca : ''));
  const [genero, setGenero] = useState(() => (restore ? storeMemory.get().genero : 'Todos'));
  const [ordem, setOrdem] = useState(() => (restore ? storeMemory.get().ordem : 'feed'));
  const [destaqueIdx, setDestaqueIdx] = useState(0);
  const [pausado, setPausado] = useState(false);
  const layoutRef = useRef(null);

  // Qualquer mudança de filtro descarta a restauração (a lista recomeça do primeiro lote).
  function filtrar({ busca: b = busca, genero: g = genero, ordem: o = ordem }) {
    setRestore(false);
    storeMemory.patch({ busca: b, genero: g, ordem: o, paineis: 0, visiveis: 0 });
    setBusca(b);
    setGenero(g);
    setOrdem(o);
  }

  const filtrando = busca.trim() !== '' || genero !== 'Todos' || ordem !== 'feed';

  const generos = useMemo(
      () => ['Todos', ...Array.from(new Set(games.map((g) => g.genero))).sort()],
      [games]
  );
  const destaques = useMemo(() => games.filter((g) => g.destaque), [games]);

  // Rotação automática dos destaques, como na vitrine da Steam (pausa ao passar o mouse).
  useEffect(() => {
    if (pausado || destaques.length < 2) return undefined;
    const t = setInterval(() => setDestaqueIdx((i) => (i + 1) % destaques.length), 6000);
    return () => clearInterval(t);
  }, [pausado, destaques.length]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = games.filter(
        (g) => (genero === 'Todos' || g.genero === genero) && g.titulo.toLowerCase().includes(termo)
    );
    return [...filtrados].sort(ORDENS[ordem]);
  }, [games, busca, genero, ordem]);

  // Guarda a posição da rolagem enquanto a loja está na tela.
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => storeMemory.patch({ scrollY: window.scrollY }));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  // Restaura a rolagem quando o catálogo já está montado. As imagens têm proporção fixa,
  // mas tentamos por alguns quadros até a página ficar alta o bastante.
  useLayoutEffect(() => {
    if (loading || !restore) return undefined;
    const alvo = storeMemory.get().scrollY;
    if (!alvo) return undefined;
    let tentativas = 0;
    let raf = 0;
    const tentar = () => {
      window.scrollTo(0, alvo);
      if (Math.abs(window.scrollY - alvo) > 2 && tentativas++ < 30) raf = requestAnimationFrame(tentar);
    };
    tentar();
    return () => cancelAnimationFrame(raf);
    // só na montagem
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading]);

  function abrirGenero(g) {
    filtrar({ genero: g, busca: '' });
    requestAnimationFrame(() => layoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  if (loading) return <p className="empty">Carregando jogos…</p>;
  if (error) return <p className="msg err">{error}</p>;

  const destaque = destaques.length ? destaques[destaqueIdx % destaques.length] : null;

  return (
      <>
        {destaque && (
            <section
                className="hero"
                onMouseEnter={() => setPausado(true)}
                onMouseLeave={() => setPausado(false)}
            >
              <h2 className="section-title">Destaques e recomendados</h2>
              <div className="hero-main">
                <Link to={`/jogo/${destaque.slug}`} className="hero-link">
                  <GameImage src={destaque.banner} title={destaque.titulo} id={destaque.id} className="hero-img" />
                  <div className="hero-info">
                    <span className="tag">Destaque</span>
                    <h2>{destaque.titulo}</h2>
                    <p>{destaque.sinopse}</p>
                    <strong className="hero-price">{formatPrice(destaque.preco)}</strong>
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
        )}

        <div className="store-layout" ref={layoutRef}>
          <div className="store-main">
            <section className="filters">
              <input
                  type="search"
                  placeholder="Buscar jogo pelo título…"
                  value={busca}
                  onChange={(e) => filtrar({ busca: e.target.value })}
              />
              <select value={ordem} onChange={(e) => filtrar({ ordem: e.target.value })}>
                <option value="feed">Vitrine (recomendados)</option>
                <option value="titulo">Ordem alfabética</option>
                <option value="menor">Menor preço</option>
                <option value="maior">Maior preço</option>
              </select>
            </section>

            {filtrando ? (
                <>
                  <div className="results-head">
                    <h2 className="section-title">
                      {genero === 'Todos' ? 'Catálogo' : genero} ({lista.length})
                    </h2>
                    <button className="btn btn-ghost btn-small" onClick={() => filtrar({ busca: '', genero: 'Todos', ordem: 'feed' })}>
                      ← Voltar à vitrine
                    </button>
                  </div>
                  {lista.length === 0 ? (
                      <p className="empty">Nenhum jogo encontrado.</p>
                  ) : (
                      <InfiniteList key={`${busca}|${genero}|${ordem}`} items={lista} restore={restore} />
                  )}
                </>
            ) : (
                <InfiniteFeed games={games} onGenre={abrirGenero} restore={restore} />
            )}
          </div>

          <aside className="store-side">
            <h3>Navegar por gênero</h3>
            <ul>
              {generos.map((g) => (
                  <li key={g}>
                    <button className={g === genero ? 'genre on' : 'genre'} onClick={() => filtrar({ genero: g })}>
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