import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api.js';

const GamesContext = createContext({ games: [], loading: true, error: '' });

// Busca o catálogo uma vez (GET /api/jogos) e o compartilha com todas as telas.
export function GamesProvider({ children }) {
    const [state, setState] = useState({ games: [], loading: true, error: '' });

    useEffect(() => {
        let cancelado = false;
        api.jogos().then((r) => {
            if (cancelado) return;
            setState(
                r.ok
                    ? { games: r.data, loading: false, error: '' }
                    : { games: [], loading: false, error: r.error }
            );
        });
        return () => {
            cancelado = true;
        };
    }, []);

    return <GamesContext.Provider value={state}>{children}</GamesContext.Provider>;
}

export function useGames() {
    return useContext(GamesContext);
}