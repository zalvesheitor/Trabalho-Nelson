# Contrato da API

Servidor: http://localhost:8080
Usuário autenticado: enviar o cabeçalho `X-Usuario-Id` nas rotas de biblioteca.

| Rota | Descrição | Resposta |
|---|---|---|
| POST /api/registro | Criar conta. Corpo: {nome, email, senha} | {id, nome, email}; 400 campos vazios; 409 email já cadastrado |
| POST /api/login | Entrar. Corpo: {email, senha} | {id, nome, email}; 401 inválido |
| GET /api/jogos?genero=&q= | Catálogo (RF-04.1) | [{id, slug, titulo, genero, preco, capa, banner, ...}] |
| GET /api/jogos/{id} | Ficha do jogo (RF-04.2) | Jogo completo; 404 se não existe |
| GET /api/jogos/{id}/avaliacoes | Avaliações de todos os usuários | [{usuario, nota, texto, data}] |
| POST /api/biblioteca/jogos/{jogoId} | Adquirir jogo (RF-04.3) | 201; 409 se já possui; 404 jogo inexistente |
| GET /api/biblioteca | Jogos do usuário (RF-04.4) | [{jogoId, data, nota, texto}] |
| PUT /api/biblioteca/jogos/{jogoId}/avaliacao | Avaliar (RF-04.5). Corpo: {nota, texto} | 200; 400 nota fora de 1 a 5 ou texto vazio; 403 não possui o jogo |