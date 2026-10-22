import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Login() {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [erro, setErro] = useState('');

  function submit(e) {
    e.preventDefault();
    const r = modo === 'login' ? login(username, password) : register(username, password);
    if (r.ok) navigate('/');
    else setErro(r.error);
  }

  return (
    <form className="login" onSubmit={submit}>
      <h2>{modo === 'login' ? 'Entrar' : 'Criar conta'}</h2>
      <label>
        Usuário
        <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus />
      </label>
      <label>
        Senha
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </label>
      {erro && <p className="msg err">{erro}</p>}
      <button className="btn btn-steam" type="submit">
        {modo === 'login' ? 'Entrar' : 'Cadastrar'}
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
