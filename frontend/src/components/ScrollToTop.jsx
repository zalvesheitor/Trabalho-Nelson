import { useLayoutEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Ao trocar de página, volta ao topo (a loja restaura a própria posição ao "voltar").
export default function ScrollToTop() {
  const { pathname } = useLocation();
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
