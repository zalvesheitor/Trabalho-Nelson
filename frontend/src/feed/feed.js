// Camada de dados do feed infinito da loja.
//
// Não há backend para isso: os painéis são montados no front a partir do catálogo que
// já vem de GET /api/jogos. Cada painel é determinístico (depende só do índice dele),
// então "carregar mais" nunca embaralha o que o usuário já viu e dá para reconstruir
// o feed inteiro ao voltar de outra página.
//
// Para trocar por uma API real no futuro basta reescrever `fetchPanels`.

export const LATENCY_MS = 450; // simula a ida ao servidor (mostra o skeleton)
export const PANELS_PER_BATCH = 2;
export const INITIAL_PANELS = 3;

// Padrões visuais, na ordem em que aparecem. Têm 7 itens e as fontes têm 10,
// números primos entre si: a combinação padrão + fonte só se repete a cada 70 painéis.
export const PATTERNS = ['spotlight', 'carousel', 'tabbed', 'quad', 'ratings', 'covers', 'genres'];

// ---------- utilidades ----------

function mulberry32(seed) {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

function shuffle(list, seed) {
    const rng = mulberry32(seed);
    const a = [...list];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

const byDateDesc = (a, b) => b.lancamento.localeCompare(a.lancamento);
const byDateAsc = (a, b) => a.lancamento.localeCompare(b.lancamento);
const byPriceAsc = (a, b) => a.preco - b.preco;

// Pega `n` jogos do pool começando em `offset` (com volta ao início). Se o pool for
// menor que n, completa com jogos do catálogo que ainda não estão no painel.
function take(pool, n, offset, all, seed) {
    const out = [];
    const seen = new Set();
    for (let k = 0; k < pool.length && out.length < n; k++) {
        const g = pool[(offset + k) % pool.length];
        if (!seen.has(g.id)) {
            seen.add(g.id);
            out.push(g);
        }
    }
    if (out.length < n) {
        for (const g of shuffle(all, seed)) {
            if (out.length >= n) break;
            if (!seen.has(g.id)) {
                seen.add(g.id);
                out.push(g);
            }
        }
    }
    return out;
}

function ranking(games, key, desc = false) {
    // ordena por contagem de jogos de cada valor de `key`
    const count = new Map();
    games.forEach((g) => count.set(g[key], (count.get(g[key]) || 0) + 1));
    return [...count.entries()]
        .sort((a, b) => (desc ? b[1] - a[1] : a[1] - b[1]) || String(a[0]).localeCompare(String(b[0])))
        .map(([valor, qtd]) => ({ valor, qtd }));
}

// ---------- fontes (de onde vêm os jogos de cada painel) ----------

const SOURCES = [
    { id: 'rec', title: 'Recomendados para você', subtitle: 'Uma seleção variada do catálogo' },
    { id: 'new', title: 'Lançamentos mais recentes', subtitle: 'Os jogos mais novos da loja', sort: byDateDesc },
    { id: 'cheap', title: 'Bons jogos até R$ 40', subtitle: 'Cabem em qualquer bolso', filter: (g) => g.preco > 0 && g.preco <= 40, sort: byPriceAsc },
    { id: 'genre', title: '' }, // dinâmica: gênero da vez
    { id: 'free', title: 'Gratuitos para jogar', subtitle: 'Baixe e jogue sem pagar nada', filter: (g) => g.preco === 0 },
    { id: 'classic', title: 'Clássicos que valem a pena', subtitle: 'Jogos que fizeram história', sort: byDateAsc },
    { id: 'dev', title: '' }, // dinâmica: desenvolvedora da vez
    { id: 'family', title: 'Para jogar em família', subtitle: 'Classificação Livre, 10 ou 12 anos', filter: (g) => ['Livre', '10', '12'].includes(g.classificacao) },
    { id: 'mature', title: 'Para quem já tem idade', subtitle: 'Classificação 16 ou 18 anos', filter: (g) => ['16', '18'].includes(g.classificacao) },
    { id: 'premium', title: 'Superproduções', subtitle: 'Os lançamentos mais caros da loja', filter: (g) => g.preco >= 100, sort: (a, b) => b.preco - a.preco },
];

function resolveSource(index, games) {
    const base = SOURCES[index % SOURCES.length];
    const cycle = Math.floor(index / SOURCES.length);

    if (base.id === 'genre') {
        const generos = ranking(games, 'genero', true).filter((x) => x.qtd >= 2);
        const alvo = generos.length ? generos[cycle % generos.length].valor : null;
        if (alvo) {
            return {
                title: `Mais de ${alvo}`,
                subtitle: `Jogos do gênero ${alvo}`,
                genre: alvo,
                pool: games.filter((g) => g.genero === alvo).sort(byDateDesc),
                cycle: 0,
            };
        }
    }
    if (base.id === 'dev') {
        const devs = ranking(games, 'desenvolvedora', true).filter((x) => x.qtd >= 2);
        const alvo = devs.length ? devs[cycle % devs.length].valor : null;
        if (alvo) {
            return {
                title: `Da desenvolvedora ${alvo}`,
                subtitle: 'Tudo o que ela tem na loja',
                pool: games.filter((g) => g.desenvolvedora === alvo).sort(byDateDesc),
                cycle: 0,
            };
        }
    }

    let pool = base.filter ? games.filter(base.filter) : [...games];
    if (base.sort) pool.sort(base.sort);
    else pool = shuffle(pool, index * 7919 + 13);
    if (!pool.length) pool = shuffle(games, index + 1);
    return {
        title: base.title || 'Recomendados para você',
        subtitle: base.subtitle,
        pool,
        cycle,
    };
}

// ---------- montagem de cada padrão ----------

const SIZE = { spotlight: 5, carousel: 10, tabbed: 14, quad: 4, ratings: 12, covers: 6 };

export function buildPanel(index, games) {
    const pattern = PATTERNS[index % PATTERNS.length];
    const base = { id: `painel-${index}`, index, pattern };
    if (!games.length) return { ...base, title: '', games: [] };

    // Os padrões "genres" e "ratings" não dependem de uma fonte.
    if (pattern === 'genres') {
        const generos = ranking(games, 'genero').sort((a, b) => String(a.valor).localeCompare(String(b.valor)));
        const rodada = Math.floor(index / PATTERNS.length);
        const itens = [];
        for (let k = 0; k < Math.min(6, generos.length); k++) {
            const { valor, qtd } = generos[(rodada * 6 + k) % generos.length];
            const capa = games.filter((g) => g.genero === valor).sort(byDateDesc)[0];
            itens.push({ genre: valor, count: qtd, game: capa });
        }
        return { ...base, title: 'Navegar por gênero', subtitle: 'Escolha um gênero para ver todos os jogos', genres: itens, games: [] };
    }

    if (pattern === 'ratings') {
        const grupos = [
            { label: 'Para todos', hint: 'Livre, 10 e 12 anos', test: (g) => ['Livre', '10', '12'].includes(g.classificacao) },
            { label: 'Adolescentes', hint: '14 e 16 anos', test: (g) => ['14', '16'].includes(g.classificacao) },
            { label: 'Adultos', hint: '18 anos', test: (g) => g.classificacao === '18' },
        ];
        const embaralhado = shuffle(games, index * 31 + 5);
        const columns = grupos.map((gr) => {
            const lista = embaralhado.filter(gr.test).slice(0, 4);
            return { label: gr.label, hint: gr.hint, games: lista };
        });
        return { ...base, title: 'Por classificação indicativa', subtitle: 'Encontre algo na faixa certa', columns, games: [] };
    }

    const src = resolveSource(index, games);
    const n = SIZE[pattern];
    const offset = (src.cycle * n) % Math.max(src.pool.length, 1);
    const lista = take(src.pool, n, offset, games, index + 99);
    const panel = { ...base, title: src.title, subtitle: src.subtitle, genre: src.genre, games: lista };

    if (pattern === 'tabbed') {
        panel.tabs = [
            { label: 'Novidades', games: [...lista].sort(byDateDesc).slice(0, 6) },
            { label: 'Clássicos', games: [...lista].sort(byDateAsc).slice(0, 6) },
            { label: 'Menor preço', games: [...lista].sort(byPriceAsc).slice(0, 6) },
        ];
    }
    return panel;
}

// Equivalente a "GET /painéis?inicio=&qtd=" — troque aqui por uma chamada real se um dia existir.
export function fetchPanels(start, count, games) {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve(Array.from({ length: count }, (_, k) => buildPanel(start + k, games)));
        }, LATENCY_MS);
    });
}

export function buildInitialPanels(count, games) {
    return Array.from({ length: count }, (_, i) => buildPanel(i, games));
}
