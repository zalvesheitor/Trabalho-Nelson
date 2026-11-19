// Leitura/escrita segura de listas de ids no localStorage
// (o navegador pode bloquear o storage em janela anônima ou com cookies desligados).

export function lerIds(chave) {
    try {
        const raw = localStorage.getItem(chave);
        const lista = raw ? JSON.parse(raw) : [];
        return Array.isArray(lista) ? lista.filter((x) => Number.isFinite(x)) : [];
    } catch {
        return [];
    }
}

export function salvarIds(chave, ids) {
    try {
        localStorage.setItem(chave, JSON.stringify(ids));
    } catch {
        // sem storage: a lista continua funcionando só nesta aba
    }
}
