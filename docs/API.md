# Contrato da API

Servidor: http://localhost:8080
Usuário autenticado: enviar o cabeçalho `X-Usuario-Id` nas rotas de biblioteca.

| Rota | Descrição | Resposta |
|---|---|---|
| GET /api/jogos?genero=&q= | Catálogo (RF-04.1) | [{id, titulo, genero, preco, capaUrl}] |
| GET /api/jogos/{id} | Ficha do jogo (RF-04.2) | {id, titulo, genero, preco, capaUrl, sinopse, classificacao} |
| POST /api/biblioteca/jogos/{jogoId} | Adquirir jogo (RF-04.3) | 201, ou 409 se já possui |
| GET /api/biblioteca | Jogos do usuário (RF-04.4) | [{jogoId, nota, comentario}] |
| PUT /api/biblioteca/jogos/{jogoId}/avaliacao | Avaliar (RF-04.5). Corpo: {nota, comentario} | 200, 400 se nota fora de 1 a 5, 403 se não possui o jogo |