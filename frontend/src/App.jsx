import { useEffect, useState } from 'react'

export default function App() {
  const [jogos, setJogos] = useState([])

  useEffect(() => {
    fetch('/api/jogos').then(r => r.json()).then(setJogos)
  }, [])

  return (
      <div>
        <h1>Loja de jogos</h1>
        <ul>
          {jogos.map(j => <li key={j.id}>{j.titulo} — {j.genero}</li>)}
        </ul>
      </div>
  )
}