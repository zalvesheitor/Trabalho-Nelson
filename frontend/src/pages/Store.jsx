import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import games from '../data/games.json';
import GameCard from '../components/GameCard.jsx';
import GameImage from '../components/GameImage.jsx';
import { formatPrice } from '../components/ui.jsx';

const generos = ['Todos', ...Array.from(new Set(games.map((g) => g.genero))).sort()];
const destaques = games.filter((g) => g.destaque);

export default function Store() {
  const [busca, setBusca] = useState('');
  const [genero, setGenero] = useState('Todos');
  const [ordem, setOrdem] = useState('titulo');
  const [destaqueIdx, setDestaqueIdx] = useState(0);
  const [pausado, setPausado] = useState(false);

  // Rotação automática dos destaques, como na vitrine da Steam (pausa ao passar o mouse).
  useEffect(() => {
    if (pausado || destaques.length < 2) return undefined;
    const t = setInterval(() => setDestaqueIdx((i) => (i + 1) % destaques.length), 6000);
    return () => clearInterval(t);
  }, [pausado]);

  const lista = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    const filtrados = games.filter(
      (g) => (genero === 'Todos' || g.genero === genero) && g.titulo.toLowerCase().includes(termo)
    );
    const cmp = {
      titulo: (a, b) => a.titulo.localeCompare(b.titulo),
      menor: (a, b) => a.preco - b.preco,
      maior: (a, b) => b.preco - a.preco,
    }[ordem];
    return [...filtrados].sort(cmp);
  }, [busca, genero, ordem]);

  const destaque = destaques[destaqueIdx % destaques.length];

  return (
    <>
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

      <div className="store-layout">
        <div className="store-main">
          <section className="filters">
            <input
              type="search"
              placeholder="Buscar jogo pelo título…"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
            <select value={ordem} onChange={(e) => setOrdem(e.target.value)}>
              <option value="titulo">Ordem alfabética</option>
              <option value="menor">Menor preço</option>
              <option value="maior">Maior preço</option>
            </select>
          </section>

          <h2 className="section-title">
            {genero === 'Todos' ? 'Catálogo' : genero} ({lista.length})
          </h2>
          {lista.length === 0 ? (
            <p className="empty">Nenhum jogo encontrado.</p>
          ) : (
            <div className="grid">
              {lista.map((g) => (
                <GameCard key={g.id} game={g} />
              ))}
            </div>
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
