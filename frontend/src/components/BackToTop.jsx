import { useEffect, useState } from 'react';
import Icon from './Icon.jsx';

// Botão flutuante que aparece depois de rolar bastante (útil em um feed infinito).
export default function BackToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 1200);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!show) return null;
  return (
    <button className="back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Voltar ao topo">
      <Icon name="up" size={20} />
    </button>
  );
}
