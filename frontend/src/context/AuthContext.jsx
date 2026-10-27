import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const KEY_USERS = 'steam_clone_users';
const KEY_SESSION = 'steam_clone_session';

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function write(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

const SEM_FAVORITOS = [];

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // users: { [username]: { password, library: [{gameId, acquiredAt, pricePaid}], reviews: { [gameId]: {nota, texto, data} }, favorites: [gameId] } }
  const [users, setUsers] = useState(() => read(KEY_USERS, {}));
  const [session, setSession] = useState(() => read(KEY_SESSION, null));

  const persistUsers = useCallback((next) => {
    setUsers(next);
    write(KEY_USERS, next);
  }, []);

  const register = useCallback(
    (username, password) => {
      const name = username.trim();
      if (!name || !password) return { ok: false, error: 'Preencha usuário e senha.' };
      if (users[name]) return { ok: false, error: 'Esse usuário já existe.' };
      persistUsers({ ...users, [name]: { password, library: [], reviews: {}, favorites: [] } });
      setSession(name);
      write(KEY_SESSION, name);
      return { ok: true };
    },
    [users, persistUsers]
  );

  const login = useCallback(
    (username, password) => {
      const name = username.trim();
      const u = users[name];
      if (!u || u.password !== password) return { ok: false, error: 'Usuário ou senha incorretos.' };
      setSession(name);
      write(KEY_SESSION, name);
      return { ok: true };
    },
    [users]
  );

  const logout = useCallback(() => {
    setSession(null);
    localStorage.removeItem(KEY_SESSION);
  }, []);

  const current = session ? users[session] : null;
  const user = current ? session : null;
  const library = current ? current.library : [];

  // Contas criadas antes desta função não têm o campo "favorites".
  const favorites = current && current.favorites ? current.favorites : SEM_FAVORITOS;

  const hasGame = useCallback((gameId) => library.some((e) => e.gameId === gameId), [library]);

  // RF-04.3: associa o título permanentemente à conta (não existe função de remoção).
  const acquireGame = useCallback(
    (game) => {
      if (!user) return { ok: false, error: 'Faça login para adquirir jogos.' };
      if (hasGame(game.id)) return { ok: false, error: 'Você já possui este jogo.' };
      const entry = { gameId: game.id, acquiredAt: new Date().toISOString(), pricePaid: game.preco };
      persistUsers({
        ...users,
        [user]: { ...users[user], library: [...users[user].library, entry] },
      });
      return { ok: true };
    },
    [user, users, hasGame, persistUsers]
  );

  // RF-04.5: só permite avaliar jogos presentes na biblioteca, nota de 1 a 5 + texto.
  const saveReview = useCallback(
    (gameId, nota, texto) => {
      if (!user) return { ok: false, error: 'Faça login para avaliar.' };
      if (!hasGame(gameId)) return { ok: false, error: 'Você só pode avaliar jogos da sua biblioteca.' };
      const n = Number(nota);
      if (!Number.isInteger(n) || n < 1 || n > 5) return { ok: false, error: 'A nota deve ser de 1 a 5.' };
      if (!texto.trim()) return { ok: false, error: 'Escreva sua avaliação.' };
      const review = { nota: n, texto: texto.trim(), data: new Date().toISOString() };
      persistUsers({
        ...users,
        [user]: { ...users[user], reviews: { ...users[user].reviews, [gameId]: review } },
      });
      return { ok: true };
    },
    [user, users, hasGame, persistUsers]
  );

  // Favoritos aparecem em um grupo próprio no topo da biblioteca.
  const toggleFavorite = useCallback(
    (gameId) => {
      if (!user) return;
      const atual = users[user].favorites || [];
      const next = atual.includes(gameId) ? atual.filter((id) => id !== gameId) : [...atual, gameId];
      persistUsers({ ...users, [user]: { ...users[user], favorites: next } });
    },
    [user, users, persistUsers]
  );

  const myReview = useCallback((gameId) => (current ? current.reviews[gameId] || null : null), [current]);

  // Todas as avaliações de um jogo (de todos os usuários), mais recentes primeiro.
  const reviewsOf = useCallback(
    (gameId) =>
      Object.entries(users)
        .filter(([, u]) => u.reviews[gameId])
        .map(([username, u]) => ({ username, ...u.reviews[gameId] }))
        .sort((a, b) => b.data.localeCompare(a.data)),
    [users]
  );

  const value = useMemo(
    () => ({
      user,
      library,
      favorites,
      hasGame,
      register,
      login,
      logout,
      acquireGame,
      saveReview,
      toggleFavorite,
      myReview,
      reviewsOf,
    }),
    [user, library, favorites, hasGame, register, login, logout, acquireGame, saveReview, toggleFavorite, myReview, reviewsOf]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
