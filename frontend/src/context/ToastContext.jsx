import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../components/Icon.jsx';

// Avisos discretos no canto da tela ("Adicionado à lista de desejos", etc.).
const ToastContext = createContext({ show: () => {} });

const DURACAO_MS = 2600;
let proximoId = 1;

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());

    const dismiss = useCallback((id) => {
        clearTimeout(timers.current.get(id));
        timers.current.delete(id);
        setToasts((lista) => lista.filter((t) => t.id !== id));
    }, []);

    // type: 'info' | 'success' | 'wish' | 'error'
    const show = useCallback(
        (text, type = 'info') => {
            const id = proximoId++;
            setToasts((lista) => [...lista.slice(-3), { id, text, type }]);
            timers.current.set(
                id,
                setTimeout(() => dismiss(id), DURACAO_MS)
            );
        },
        [dismiss]
    );

    useEffect(() => {
        const mapa = timers.current;
        return () => mapa.forEach((t) => clearTimeout(t));
    }, []);

    const value = useMemo(() => ({ show }), [show]);

    const icone = { success: 'check', wish: 'heart', error: 'info', info: 'info' };

    return (
        <ToastContext.Provider value={value}>
            {children}
            <div className="toasts" role="status" aria-live="polite">
                {toasts.map((t) => (
                    <div key={t.id} className={`toast toast-${t.type}`}>
                        <span className="toast-icon">
                            <Icon name={icone[t.type] || 'info'} size={16} filled={t.type === 'wish'} />
                        </span>
                        <span className="toast-text">{t.text}</span>
                        <button className="toast-close" onClick={() => dismiss(t.id)} aria-label="Fechar aviso">
                            <Icon name="x" size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
