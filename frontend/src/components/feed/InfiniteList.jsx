import { useCallback, useEffect, useRef, useState } from 'react';
import GameCard from '../GameCard.jsx';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll.js';
import { storeMemory } from '../../feed/storeMemory.js';
import { PanelSkeleton } from './Panels.jsx';

const BATCH = 8;
const LATENCY_MS = 350;

// Resultados de busca/filtro: lista de linhas que cresce conforme a rolagem
// (como a página de busca da Steam, que carrega os resultados em lotes).
export default function InfiniteList({ items, restore }) {
    const [visible, setVisible] = useState(() => {
        const salvo = storeMemory.get().visiveis;
        return restore && salvo ? Math.max(salvo, BATCH) : BATCH;
    });
    const [loading, setLoading] = useState(false);
    const timer = useRef(null);

    useEffect(() => () => clearTimeout(timer.current), []);
    useEffect(() => {
        storeMemory.patch({ visiveis: visible });
    }, [visible]);

    const hasMore = visible < items.length;

    const loadMore = useCallback(() => {
        setLoading(true);
        timer.current = setTimeout(() => {
            setVisible((v) => v + BATCH);
            setLoading(false);
        }, LATENCY_MS);
    }, []);

    const sentinel = useInfiniteScroll({ onLoadMore: loadMore, hasMore, loading, rootMargin: '300px 0px' });

    return (
        <>
            <div className="grid">
                {items.slice(0, visible).map((g) => (
                    <GameCard key={g.id} game={g} />
                ))}
            </div>
            {loading && <PanelSkeleton />}
            <div ref={sentinel} className="sentinel" aria-hidden="true" />
            {!hasMore && items.length > BATCH && <p className="feed-end">Você chegou ao fim dos resultados.</p>}
        </>
    );
}
