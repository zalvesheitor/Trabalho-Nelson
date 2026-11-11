import { useEffect, useRef } from 'react';

// Devolve uma ref para um "sentinela" colocado no fim da lista.
// Quando ele chega perto da área visível (rootMargin), chama onLoadMore.
// Enquanto `loading` for true (ou `hasMore` false) o observador fica desligado;
// ao religar, o IntersectionObserver dispara de novo se o sentinela ainda estiver
// visível, então a lista continua carregando até preencher a tela.
export function useInfiniteScroll({ onLoadMore, hasMore = true, loading = false, rootMargin = '500px 0px' }) {
    const sentinelRef = useRef(null);
    const callbackRef = useRef(onLoadMore);
    callbackRef.current = onLoadMore;

    useEffect(() => {
        const el = sentinelRef.current;
        if (!el || !hasMore || loading) return undefined;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) callbackRef.current();
            },
            { rootMargin }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [hasMore, loading, rootMargin]);

    return sentinelRef;
}
