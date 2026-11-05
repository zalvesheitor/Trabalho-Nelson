import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

// Só a sessão fica no navegador. Usuários, biblioteca e avaliações ficam no backend.
const KEY_SESSION = 'steam_clone_session';
// Favoritos ainda não existem no backend: ficam no navegador, separados por usuário.
const KEY_FAVS = 'steam_clone_favs_';
const KEY_WISH = 'steam_clone_wish_';

function lerLista(chave, userId) {
    if (userId == null) return [];
    try {
        const raw = localStorage.getItem(chave + userId);
        const l = raw ? JSON.parse(raw) : [];
        return Array.isArray(l) ? l : [];
    } catch {
        return [];
    }
}

function lerSessao() {
    try {
        const raw = localStorage.getItem(KEY_SESSION);
        const s = raw ? JSON.parse(raw) : null;
        return s && typeof s === 'object' && s.id != null ? s : null;
    } catch {
        return null;
    }
}

// Texto do front tem prioridade para os casos conhecidos; senão usa a mensagem do servidor.
function erroDe(r, mapa = {}) {
    return mapa[r.status] || r.error;
}

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    // session: { id, nome, email } do usuário logado
    const [session, setSession] = useState(lerSessao);
    // library: [{ jogoId, data, nota, texto }] vinda de GET /api/biblioteca
    const [library, setLibrary] = useState([]);
    const [bibliotecaPronta, setBibliotecaPronta] = useState(() => lerSessao() === null);
    const [favorites, setFavorites] = useState(() => {
        const s = lerSessao();
        return lerLista(KEY_FAVS, s && s.id);
    });
    const [wishlist, setWishlist] = useState(() => {
        const s = lerSessao();
        return lerLista(KEY_WISH, s && s.id);
    });

    // Troca de usuário (login, logout ou recarga da página): carrega os favoritos dele.
    useEffect(() => {
        setFavorites(lerLista(KEY_FAVS, session && session.id));
        setWishlist(lerLista(KEY_WISH, session && session.id));
    }, [session]);

    const iniciarSessao = useCallback((u) => {
        const s = { id: u.id, nome: u.nome, email: u.email };
        localStorage.setItem(KEY_SESSION, JSON.stringify(s));
        setBibliotecaPronta(false);
        setSession(s);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem(KEY_SESSION);
        setSession(null);
        setLibrary([]);
        setBibliotecaPronta(true);
    }, []);

    // Carrega a biblioteca sempre que o usuário logado muda (ou a página é recarregada).
    useEffect(() => {
        if (!session) {
            setLibrary([]);
            setBibliotecaPronta(true);
            return undefined;
        }
        let cancelado = false;
        api.biblioteca(session.id).then((r) => {
            if (cancelado) return;
            if (r.ok) setLibrary(r.data);
            else if (r.status === 401) logout(); // usuário não existe mais no backend
            setBibliotecaPronta(true);
        });
        return () => {
            cancelado = true;
        };
    }, [session, logout]);

    const recarregarBiblioteca = useCallback(async () => {
        if (!session) return;
        const r = await api.biblioteca(session.id);
        if (r.ok) setLibrary(r.data);
    }, [session]);

    const register = useCallback(
        async (nome, email, senha) => {
            if (!nome.trim() || !email.trim() || !senha) {
                return { ok: false, error: 'Preencha nome, email e senha.' };
            }
            const r = await api.registrar(nome.trim(), email.trim(), senha);
            if (!r.ok) return { ok: false, error: erroDe(r, { 409: 'Esse email já está cadastrado.' }) };
            iniciarSessao(r.data);
            return { ok: true };
        },
        [iniciarSessao]
    );

    const login = useCallback(
        async (email, senha) => {
            if (!email.trim() || !senha) return { ok: false, error: 'Preencha email e senha.' };
            const r = await api.login(email.trim(), senha);
            if (!r.ok) return { ok: false, error: erroDe(r, { 401: 'Email ou senha incorretos.' }) };
            iniciarSessao(r.data);
            return { ok: true };
        },
        [iniciarSessao]
    );

    const hasGame = useCallback((gameId) => library.some((e) => e.jogoId === gameId), [library]);

    // RF-04.3: associa o título permanentemente à conta (POST /api/biblioteca/jogos/{id}).
    const acquireGame = useCallback(
        async (game) => {
            if (!session) return { ok: false, error: 'Faça login para adquirir jogos.' };
            if (hasGame(game.id)) return { ok: false, error: 'Você já possui este jogo.' };
            const r = await api.adquirir(session.id, game.id);
            if (!r.ok) return { ok: false, error: erroDe(r, { 409: 'Você já possui este jogo.' }) };
            await recarregarBiblioteca();
            return { ok: true };
        },
        [session, hasGame, recarregarBiblioteca]
    );

    // RF-04.5: nota de 1 a 5 + texto, só para jogos da biblioteca (PUT .../avaliacao).
    const saveReview = useCallback(
        async (gameId, nota, texto) => {
            if (!session) return { ok: false, error: 'Faça login para avaliar.' };
            if (!hasGame(gameId)) return { ok: false, error: 'Você só pode avaliar jogos da sua biblioteca.' };
            const n = Number(nota);
            if (!Number.isInteger(n) || n < 1 || n > 5) return { ok: false, error: 'A nota deve ser de 1 a 5.' };
            if (!texto.trim()) return { ok: false, error: 'Escreva sua avaliação.' };
            const r = await api.avaliar(session.id, gameId, n, texto.trim());
            if (!r.ok) {
                return { ok: false, error: erroDe(r, { 403: 'Você só pode avaliar jogos da sua biblioteca.' }) };
            }
            await recarregarBiblioteca();
            return { ok: true };
        },
        [session, hasGame, recarregarBiblioteca]
    );

    const toggleFavorite = useCallback(
        (gameId) => {
            if (!session) return;
            setFavorites((atual) => {
                const next = atual.includes(gameId) ? atual.filter((id) => id !== gameId) : [...atual, gameId];
                try {
                    localStorage.setItem(KEY_FAVS + session.id, JSON.stringify(next));
                } catch {
                    /* sem armazenamento: o favorito vale só até recarregar */
                }
                return next;
            });
        },
        [session]
    );

    // Lista de desejos: jogos que o usuário quer comprar depois (também só no navegador, por enquanto).
    const toggleWishlist = useCallback(
        (gameId) => {
            if (!session) return;
            setWishlist((atual) => {
                const next = atual.includes(gameId) ? atual.filter((id) => id !== gameId) : [...atual, gameId];
                try {
                    localStorage.setItem(KEY_WISH + session.id, JSON.stringify(next));
                } catch {
                    /* sem armazenamento: vale só até recarregar */
                }
                return next;
            });
        },
        [session]
    );

    const myReview = useCallback(
        (gameId) => {
            const e = library.find((x) => x.jogoId === gameId);
            return e && e.nota != null ? { nota: e.nota, texto: e.texto || '', data: e.dataAvaliacao || e.data } : null;
        },
        [library]
    );

    const value = useMemo(
        () => ({
            user: session,
            library,
            favorites,
            wishlist,
            bibliotecaPronta,
            hasGame,
            register,
            login,
            logout,
            acquireGame,
            saveReview,
            toggleFavorite,
            toggleWishlist,
            myReview,
        }),
        [session, library, favorites, wishlist, bibliotecaPronta, hasGame, register, login, logout, acquireGame, saveReview, toggleFavorite, toggleWishlist, myReview]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}