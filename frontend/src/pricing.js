// Promoções da loja (somente no front).
//
// O backend não tem campo de desconto: `preco` é o valor que o usuário paga hoje.
// Para exibir o selo "-XX%" e o preço original riscado, alguns jogos recebem uma
// promoção determinística (depende só do id), então o valor nunca muda entre telas
// ou recarregamentos e o total do carrinho bate com o que foi mostrado no card.

const PERCENTUAIS = [10, 15, 20, 25, 33, 40, 50, 60, 75];

export function getPricing(game) {
    const final = Number(game?.preco) || 0;
    const id = Number(game?.id) || 0;
    const emPromocao = final > 0 && (id * 7) % 3 === 0;

    if (!emPromocao) {
        return { final, original: final, discount: 0, savings: 0, onSale: false };
    }

    const pct = PERCENTUAIS[(id * 5) % PERCENTUAIS.length];
    // Preço "cheio" arredondado para terminar em ,99 (como nas lojas de verdade).
    const original = Math.floor(final / (1 - pct / 100)) + 0.99;
    const discount = Math.round((1 - final / original) * 100);
    return {
        final,
        original,
        discount,
        savings: Math.round((original - final) * 100) / 100,
        onSale: discount > 0,
    };
}

// Busca case-insensitive por título ou categoria (gênero).
export function matchesSearch(game, termo) {
    const t = termo.trim().toLowerCase();
    if (!t) return true;
    return game.titulo.toLowerCase().includes(t) || String(game.genero).toLowerCase().includes(t);
}
