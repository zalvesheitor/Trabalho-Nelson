export function formatPrice(preco) {
  if (!preco) return 'Gratuito';
  return preco.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR');
}

export function Stars({ value, size = 18 }) {
  return (
    <span className="stars" style={{ fontSize: size }} aria-label={`${value} de 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span key={i} className={i <= Math.round(value) ? 'star on' : 'star'}>
          ★
        </span>
      ))}
    </span>
  );
}

// Preço com desconto aplicado (em reais, 2 casas). Jogo gratuito ou sem desconto mantém o preço de tabela.
export function precoFinal(game) {
  if (!game.preco || !game.desconto) return game.preco;
  return Math.round(game.preco * (100 - game.desconto)) / 100;
}

// Etiqueta de preço no estilo Steam: com desconto mostra "-X%", preço antigo riscado e preço final.
export function PriceTag({ game, big = false }) {
  const tam = big ? ' big' : '';
  if (game.preco && game.desconto) {
    return (
      <span className={`deal${tam}`}>
        <span className="deal-pct">-{game.desconto}%</span>
        <span className="deal-prices">
          <s>{formatPrice(game.preco)}</s>
          <b>{formatPrice(precoFinal(game))}</b>
        </span>
      </span>
    );
  }
  return <span className={`price${game.preco ? '' : ' free'}${tam}`}>{formatPrice(game.preco)}</span>;
}
