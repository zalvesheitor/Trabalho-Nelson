import { useState } from 'react';

const PALETTES = [
  ['#1b2838', '#2a475e'],
  ['#2d1b38', '#5e2a55'],
  ['#1b3832', '#2a5e4a'],
  ['#38291b', '#5e442a'],
  ['#1b2c38', '#2a3f5e'],
];

// Mostra a imagem do JSON; se o arquivo ainda não existir, exibe um placeholder com o título.
export default function GameImage({ src, title, id = 0, className = '' }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    const [a, b] = PALETTES[id % PALETTES.length];
    return (
      <div
        className={`img-placeholder ${className}`}
        style={{ background: `linear-gradient(135deg, ${a}, ${b})` }}
        role="img"
        aria-label={title}
      >
        <span>{title}</span>
      </div>
    );
  }

  return <img className={className} src={src} alt={title} loading="lazy" onError={() => setFailed(true)} />;
}
