import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';

// Só a sessão fica no navegador. Usuários, biblioteca e avaliações ficam no backend.
const KEY_SESSION = 'steam_clone_session';

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

    const myReview = useCallback(
        (gameId) => {
            const e = library.find((x) => x.jogoId === gameId);
            return e && e.nota != null ? { nota: e.nota, texto: e.texto || '' } : null;
        },
        [library]
    );

    const value = useMemo(
        () => ({
            user: session,
            library,
            bibliotecaPronta,
            hasGame,
            register,
            login,
            logout,
            acquireGame,
            saveReview,
            myReview,
        }),
        [session, library, bibliotecaPronta, hasGame, register, login, logout, acquireGame, saveReview, myReview]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    return useContext(AuthContext);
}