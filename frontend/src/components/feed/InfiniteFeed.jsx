import { useCallback, useEffect, useRef, useState } from 'react';
import { useInfiniteScroll } from '../../hooks/useInfiniteScroll.js';
import { PANELS_PER_BATCH, INITIAL_PANELS, buildInitialPanels, fetchPanels } from '../../feed/feed.js';
import { storeMemory } from '../../feed/storeMemory.js';
import Panel, { PanelSkeleton } from './Panels.jsx';

// Feed infinito de painéis da vitrine: a cada vez que o fim da lista se aproxima da tela,
// busca mais 2 painéis (de padrões visuais diferentes) e os acrescenta.
export default function InfiniteFeed({ games, onGenre, restore }) {
    const [panels, setPanels] = useState(() =>
        buildInitialPanels(restore && storeMemory.get().paineis ? storeMemory.get().paineis : INITIAL_PANELS, games)
    );
    const [loading, setLoading] = useState(false);
    const busy = useRef(false);
    const alive = useRef(true);

    useEffect(() => {
        alive.current = true;
        return () => {
            alive.current = false;
        };
    }, []);

    useEffect(() => {
        storeMemory.patch({ paineis: panels.length });
    }, [panels.length]);

    const loadMore = useCallback(async () => {
        if (busy.current) return;
        busy.current = true;
        setLoading(true);
        const novos = await fetchPanels(panels.length, PANELS_PER_BATCH, games);
        busy.current = false;
        if (!alive.current) return;
        setPanels((atual) => [...atual, ...novos]);
        setLoading(false);
    }, [panels.length, games]);

    const sentinel = useInfiniteScroll({ onLoadMore: loadMore, loading });

    return (
        <div className="feed">
            {panels.map((p) => (
                <Panel key={p.id} panel={p} onGenre={onGenre} />
            ))}
            {loading && <PanelSkeleton />}
            <div ref={sentinel} className="sentinel" aria-hidden="true" />
        </div>
    );
}
