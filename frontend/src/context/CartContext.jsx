import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext.jsx';
import { useGames } from './GamesContext.jsx';
import { useToast } from './ToastContext.jsx';
import { lerIds, salvarIds } from './storage.js';
import { getPricing } from '../pricing.js';

// Carrinho de compras: ids dos jogos no localStorage + estado do drawer e do checkout.
const KEY_CART = 'steam_clone_cart';

const CartContext = createContext(null);

export function CartProvider({ children }) {
    const { games } = useGames();
    const { hasGame, bibliotecaPronta } = useAuth();
    const { show } = useToast();
    const [ids, setIds] = useState(() => lerIds(KEY_CART));
    const [open, setOpen] = useState(false);
    const [checkoutOpen, setCheckoutOpen] = useState(false);

    useEffect(() => {
        salvarIds(KEY_CART, ids);
    }, [ids]);

    useEffect(() => {
        const onStorage = (e) => {
            if (e.key === KEY_CART) setIds(lerIds(KEY_CART));
        };
        window.addEventListener('storage', onStorage);
        return () => window.removeEventListener('storage', onStorage);
    }, []);

    // Jogos que já estão na biblioteca não podem ficar no carrinho
    // (ex.: o usuário entrou numa conta que já possui o jogo).
    useEffect(() => {
        if (!bibliotecaPronta) return;
        setIds((atual) => {
            const filtrado = atual.filter((id) => !hasGame(id));
            return filtrado.length === atual.length ? atual : filtrado;
        });
    }, [bibliotecaPronta, hasGame]);

    const inCart = useCallback((gameId) => ids.includes(gameId), [ids]);

    const add = useCallback(
        (game, { openDrawer = false, silent = false } = {}) => {
            if (hasGame(game.id)) {
                show('Você já possui este jogo.', 'error');
                return false;
            }
            setIds((atual) => (atual.includes(game.id) ? atual : [...atual, game.id]));
            if (!silent) show(`${game.titulo} foi adicionado ao carrinho.`, 'success');
            if (openDrawer) setOpen(true);
            return true;
        },
        [hasGame, show]
    );

    const remove = useCallback((game) => {
        setIds((atual) => atual.filter((id) => id !== game.id));
    }, []);

    const removeMany = useCallback((gameIds) => {
        setIds((atual) => atual.filter((id) => !gameIds.includes(id)));
    }, []);

    const clear = useCallback(() => setIds([]), []);

    const items = useMemo(
        () => ids.map((id) => games.find((g) => g.id === id)).filter(Boolean),
        [ids, games]
    );

    // Resumo financeiro: subtotal (preço cheio), economia nos descontos e total.
    const totals = useMemo(() => {
        let subtotal = 0;
        let total = 0;
        for (const g of items) {
            const p = getPricing(g);
            subtotal += p.original;
            total += p.final;
        }
        subtotal = Math.round(subtotal * 100) / 100;
        total = Math.round(total * 100) / 100;
        return { subtotal, savings: Math.round((subtotal - total) * 100) / 100, total };
    }, [items]);

    const openCart = useCallback(() => setOpen(true), []);
    const closeCart = useCallback(() => setOpen(false), []);
    const openCheckout = useCallback(() => setCheckoutOpen(true), []);
    const closeCheckout = useCallback(() => setCheckoutOpen(false), []);

    const value = useMemo(
        () => ({
            ids,
            items,
            count: items.length,
            totals,
            inCart,
            add,
            remove,
            removeMany,
            clear,
            open,
            openCart,
            closeCart,
            checkoutOpen,
            openCheckout,
            closeCheckout,
        }),
        [ids, items, totals, inCart, add, remove, removeMany, clear, open, openCart, closeCart, checkoutOpen, openCheckout, closeCheckout]
    );

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
    return useContext(CartContext);
}
