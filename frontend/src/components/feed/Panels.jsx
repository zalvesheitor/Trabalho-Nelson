import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import GameImage from '../GameImage.jsx';
import Icon from '../Icon.jsx';
import { formatDate, formatPrice } from '../ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// ---------- peças compartilhadas ----------

function Price({ game, className = '' }) {
    const { hasGame } = useAuth();
    if (hasGame(game.id)) return <span className={`owned ${className}`}>✓ Na biblioteca</span>;
    return <span className={`price ${game.preco ? '' : 'free'} ${className}`}>{formatPrice(game.preco)}</span>;
}

const ano = (iso) => new Date(iso).getFullYear();

// Cápsula 16:9 (capa larga + título + preço), o bloco básico da vitrine da Steam.
function Capsule({ game, className = '' }) {
    return (
        <Link to={`/jogo/${game.slug}`} className={`capsule ${className}`}>
            <GameImage src={game.banner} title={game.titulo} id={game.id} className="capsule-media" />
            <div className="capsule-body">
                <strong title={game.titulo}>{game.titulo}</strong>
                <small>
                    {game.genero} · {ano(game.lancamento)}
                </small>
            </div>
            <div className="capsule-foot">
                <Price game={game} />
            </div>
        </Link>
    );
}

function PanelHeader({ title, subtitle, action }) {
    return (
        <header className="panel-head">
            <div>
                <h2 className="section-title">{title}</h2>
                {subtitle && <p className="panel-sub">{subtitle}</p>}
            </div>
            {action}
        </header>
    );
}

function SeeAll({ panel, onGenre }) {
    if (!panel.genre) return null;
    return (
        <button className="btn btn-ghost btn-small" onClick={() => onGenre(panel.genre)}>
            Ver todos de {panel.genre}
        </button>
    );
}

// ---------- 1. Destaque + 4 cápsulas ----------

function Spotlight({ panel, onGenre }) {
    const [big, ...rest] = panel.games;
    if (!big) return null;
    return (
        <section className="panel panel-spotlight">
            <PanelHeader title={panel.title} subtitle={panel.subtitle} action={<SeeAll panel={panel} onGenre={onGenre} />} />
            <div className="spot-grid">
                <Link to={`/jogo/${big.slug}`} className="spot-big">
                    <GameImage src={big.banner} title={big.titulo} id={big.id} className="spot-big-img" />
                    <div className="spot-big-info">
                        <span className="tag">{big.genero}</span>
                        <h3>{big.titulo}</h3>
                        <p>{big.sinopse}</p>
                        <Price game={big} />
                    </div>
                </Link>
                {rest.map((g) => (
                    <Capsule key={g.id} game={g} className="capsule-sm" />
                ))}
            </div>
        </section>
    );
}

// ---------- 2. Carrossel horizontal ----------

function Carousel({ panel, onGenre }) {
    const track = useRef(null);
    const [edge, setEdge] = useState({ start: true, end: false });

    const update = useCallback(() => {
        const el = track.current;
        if (!el) return;
        setEdge({ start: el.scrollLeft < 4, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4 });
    }, []);

    useEffect(() => {
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, [update]);

    function go(dir) {
        const el = track.current;
        el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: 'smooth' });
    }

    return (
        <section className="panel panel-carousel">
            <PanelHeader title={panel.title} subtitle={panel.subtitle} action={<SeeAll panel={panel} onGenre={onGenre} />} />
            <div className="carousel">
                <button className="carousel-arrow left" onClick={() => go(-1)} disabled={edge.start} aria-label="Anterior">
                    <Icon name="left" size={26} />
                </button>
                <div className="carousel-track" ref={track} onScroll={update}>
                    {panel.games.map((g) => (
                        <Capsule key={g.id} game={g} className="carousel-item" />
                    ))}
                </div>
                <button className="carousel-arrow right" onClick={() => go(1)} disabled={edge.end} aria-label="Próximo">
                    <Icon name="right" size={26} />
                </button>
            </div>
        </section>
    );
}

// ---------- 3. Abas + pré-visualização ao passar o mouse ----------

function Tabbed({ panel, onGenre }) {
    const [tab, setTab] = useState(0);
    const [hover, setHover] = useState(0);
    const list = panel.tabs[tab].games;
    const active = list[Math.min(hover, list.length - 1)];
    if (!active) return null;

    return (
        <section className="panel panel-tabbed">
            <PanelHeader title={panel.title} subtitle={panel.subtitle} action={<SeeAll panel={panel} onGenre={onGenre} />} />
            <div className="tabs" role="tablist">
                {panel.tabs.map((t, i) => (
                    <button
                        key={t.label}
                        role="tab"
                        aria-selected={i === tab}
                        className={i === tab ? 'tab on' : 'tab'}
                        onClick={() => {
                            setTab(i);
                            setHover(0);
                        }}
                    >
                        {t.label}
                    </button>
                ))}
            </div>
            <div className="tabbed-body">
                <ul className="tabbed-list">
                    {list.map((g, i) => (
                        <li key={g.id}>
                            <Link
                                to={`/jogo/${g.slug}`}
                                className={i === hover ? 'tabbed-row on' : 'tabbed-row'}
                                onMouseEnter={() => setHover(i)}
                                onFocus={() => setHover(i)}
                            >
                                <GameImage src={g.banner} title={g.titulo} id={g.id} className="tabbed-thumb" />
                                <span className="tabbed-name">
                                    <strong title={g.titulo}>{g.titulo}</strong>
                                    <small>{g.genero}</small>
                                </span>
                                <Price game={g} />
                            </Link>
                        </li>
                    ))}
                </ul>
                <Link to={`/jogo/${active.slug}`} className="tabbed-preview" key={active.id}>
                    <GameImage src={active.banner} title={active.titulo} id={active.id} className="tabbed-preview-img" />
                    <div className="tabbed-preview-info">
                        <h3>{active.titulo}</h3>
                        <div className="tabbed-preview-tags">
                            <span className="tag">{active.genero}</span>
                            <span className={`classind c-${active.classificacao}`}>{active.classificacao}</span>
                        </div>
                        <p>{active.sinopse}</p>
                        <small>
                            {active.desenvolvedora} · Lançado em {formatDate(active.lancamento)}
                        </small>
                    </div>
                </Link>
            </div>
        </section>
    );
}

// ---------- 4. Quatro cápsulas em linha ----------

function Quad({ panel, onGenre }) {
    return (
        <section className="panel panel-quad">
            <PanelHeader title={panel.title} subtitle={panel.subtitle} action={<SeeAll panel={panel} onGenre={onGenre} />} />
            <div className="quad-grid">
                {panel.games.map((g) => (
                    <Capsule key={g.id} game={g} />
                ))}
            </div>
        </section>
    );
}

// ---------- 5. Três colunas de listas compactas ----------

function Ratings({ panel }) {
    return (
        <section className="panel panel-ratings">
            <PanelHeader title={panel.title} subtitle={panel.subtitle} />
            <div className="ratings-grid">
                {panel.columns.map((col) => (
                    <div className="ratings-col" key={col.label}>
                        <h3>
                            {col.label} <small>{col.hint}</small>
                        </h3>
                        <ol>
                            {col.games.length === 0 && <li className="ratings-empty">Nada por aqui ainda</li>}
                            {col.games.map((g, i) => (
                                <li key={g.id}>
                                    <Link to={`/jogo/${g.slug}`} className="ratings-row">
                                        <span className="ratings-pos">{i + 1}</span>
                                        <GameImage src={g.capa} title={g.titulo} id={g.id} className="ratings-cover" />
                                        <span className="ratings-name">
                                            <strong title={g.titulo}>{g.titulo}</strong>
                                            <small>{g.genero}</small>
                                        </span>
                                        <Price game={g} />
                                    </Link>
                                </li>
                            ))}
                        </ol>
                    </div>
                ))}
            </div>
        </section>
    );
}

// ---------- 6. Fileira de capas verticais ----------

function Covers({ panel, onGenre }) {
    return (
        <section className="panel panel-covers">
            <PanelHeader title={panel.title} subtitle={panel.subtitle} action={<SeeAll panel={panel} onGenre={onGenre} />} />
            <div className="covers-grid">
                {panel.games.map((g) => (
                    <Link to={`/jogo/${g.slug}`} className="cover-item" key={g.id} title={g.titulo}>
                        <GameImage src={g.capa} title={g.titulo} id={g.id} className="cover-img" />
                        <div className="cover-price">
                            <Price game={g} />
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    );
}

// ---------- 7. Ladrilhos de gêneros ----------

function Genres({ panel, onGenre }) {
    return (
        <section className="panel panel-genres">
            <PanelHeader title={panel.title} subtitle={panel.subtitle} />
            <div className="genres-grid">
                {panel.genres.map((x) => (
                    <button className="genre-tile" key={x.genre} onClick={() => onGenre(x.genre)}>
                        <GameImage src={x.game.banner} title="" id={x.game.id} className="genre-tile-img" />
                        <span className="genre-tile-label">
                            <strong>{x.genre}</strong>
                            <small>
                                {x.count} {x.count === 1 ? 'jogo' : 'jogos'}
                            </small>
                        </span>
                    </button>
                ))}
            </div>
        </section>
    );
}

const COMPONENTS = {
    spotlight: Spotlight,
    carousel: Carousel,
    tabbed: Tabbed,
    quad: Quad,
    ratings: Ratings,
    covers: Covers,
    genres: Genres,
};

export default function Panel({ panel, onGenre }) {
    const Component = COMPONENTS[panel.pattern];
    return Component ? <Component panel={panel} onGenre={onGenre} /> : null;
}

// Esqueleto exibido enquanto o próximo lote carrega.
export function PanelSkeleton({ rows = 1 }) {
    return (
        <div className="panel skeleton" aria-hidden="true">
            {Array.from({ length: rows }, (_, r) => (
                <div key={r}>
                    <div className="sk sk-title" />
                    <div className="sk-row">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className="sk sk-capsule" />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
