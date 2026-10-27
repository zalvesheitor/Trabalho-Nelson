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
