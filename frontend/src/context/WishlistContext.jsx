import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useGames } from './GamesContext.jsx';
import { useToast } from './ToastContext.jsx';
import { lerIds, salvarIds } from './storage.js';

// Lista de desejos: só os ids dos jogos, salvos no localStorage.
const KEY_WISHLIST = 'steam_clone_wishlist';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
    const { games } = useGames();
    const { show } = useToast();
    const [ids, setIds] = useState(() => lerIds(KEY_WISHLIST));

    // Persiste a cada mudança.
    useEffect(() => {
        salvarIds(KEY_WISHLIST, ids);
    }, [ids]);

    // Sincroniza entre abas abertas da loja.
    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === KEY_WISHLIST) setIds(lerIds(KEY_WISHLIST));
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    const isWished = useCallback((gameId) => ids.includes(gameId), [ids]);

    const add = useCallback(
        (game, { silent = false } = {}) => {
            setIds((atual) => (atual.includes(game.id) ? atual : [...atual, game.id]));
            if (!silent) show(`${game.titulo} foi adicionado à sua lista de desejos.`, 'wish');
        },
        [show]
    );

    const remove = useCallback(
        (game, { silent = false } = {}) => {
            setIds((atual) => atual.filter((id) => id !== game.id));
            if (!silent) show(`${game.titulo} foi removido da sua lista de desejos.`, 'info');
        },
        [show]
    );

    const removeMany = useCallback((gameIds) => {
        setIds((atual) => atual.filter((id) => !gameIds.includes(id)));
    }, []);

    const toggle = useCallback(
        (game) => {
            if (ids.includes(game.id)) remove(game);
            else add(game);
        },
        [ids, add, remove]
    );

    // Jogos completos, na ordem em que foram adicionados (ignora ids que saíram do catálogo).
    const items = useMemo(
        () => ids.map((id) => games.find((g) => g.id === id)).filter(Boolean),
        [ids, games]
    );

    const value = useMemo(
        () => ({ ids, items, count: items.length, isWished, add, remove, removeMany, toggle }),
        [ids, items, isWished, add, remove, removeMany, toggle]
    );

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
    return useContext(WishlistContext);
}
