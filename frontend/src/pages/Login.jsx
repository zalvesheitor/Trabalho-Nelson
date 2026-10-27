import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
    const { login, register } = useAuth();
    const navigate = useNavigate();
    const [modo, setModo] = useState('login');
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [enviando, setEnviando] = useState(false);

    async function submit(e) {
        e.preventDefault();
        setErro('');
        setEnviando(true);
        const r = modo === 'login' ? await login(email, senha) : await register(nome, email, senha);
        setEnviando(false);
        if (r.ok) navigate('/');
        else setErro(r.error);
    }

    return (
        <form className="login" onSubmit={submit}>
            <h2>{modo === 'login' ? 'Entrar' : 'Criar conta'}</h2>
            {modo === 'cadastro' && (
                <label>
                    Nome
                    <input value={nome} onChange={(e) => setNome(e.target.value)} autoFocus />
                </label>
            )}
            <label>
                Email
                <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoFocus={modo === 'login'}
                />
            </label>
            <label>
                Senha
                <input type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
            </label>
            {erro && <p className="msg err">{erro}</p>}
            <button className="btn btn-steam" type="submit" disabled={enviando}>
                {enviando ? 'Aguarde…' : modo === 'login' ? 'Entrar' : 'Cadastrar'}
            </button>
            <button
                type="button"
                className="btn btn-ghost"
                onClick={() => {
                    setModo(modo === 'login' ? 'cadastro' : 'login');
                    setErro('');
                }}
            >
                {modo === 'login' ? 'Não tenho conta' : 'Já tenho conta'}
            </button>
        </form>
    );
}