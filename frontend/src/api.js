
const BASE = '/api';

const MENSAGEM_PADRAO = {
    400: 'Dados inválidos.',
    401: 'Não autorizado.',
    403: 'Ação não permitida.',
    404: 'Não encontrado.',
    409: 'Esse item já existe.',
};

async function request(method, path, { body, usuarioId } = {}) {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (usuarioId != null) headers['X-Usuario-Id'] = String(usuarioId);

    try {
        const resp = await fetch(BASE + path, {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
        });

        let data = null;
        const texto = await resp.text();
        if (texto) {
            try {
                data = JSON.parse(texto);
            } catch {
                data = null;
            }
        }

        if (!resp.ok) {
            const error = (data && data.message) || MENSAGEM_PADRAO[resp.status] || 'Erro no servidor.';
            return { ok: false, status: resp.status, data: null, error };
        }
        return { ok: true, status: resp.status, data, error: '' };
    } catch {
        return {
            ok: false,
            status: 0,
            data: null,
            error: 'Não foi possível conectar ao servidor. O backend está rodando?',
        };
    }
}

export const api = {
    // Catálogo e ficha (RF-04.1 e RF-04.2)
    jogos: () => request('GET', '/jogos'),
    avaliacoesDoJogo: (jogoId) => request('GET', `/jogos/${jogoId}/avaliacoes`),

    // Conta
    registrar: (nome, email, senha) => request('POST', '/registro', { body: { nome, email, senha } }),
    login: (email, senha) => request('POST', '/login', { body: { email, senha } }),

    // Biblioteca (RF-04.3, RF-04.4 e RF-04.5): sempre com o X-Usuario-Id do usuário logado
    biblioteca: (usuarioId) => request('GET', '/biblioteca', { usuarioId }),
    adquirir: (usuarioId, jogoId) => request('POST', `/biblioteca/jogos/${jogoId}`, { usuarioId }),
    avaliar: (usuarioId, jogoId, nota, texto) =>
        request('PUT', `/biblioteca/jogos/${jogoId}/avaliacao`, { usuarioId, body: { nota, texto } }),
};