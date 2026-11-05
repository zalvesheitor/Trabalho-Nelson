# Contrato da API

Servidor: http://localhost:8080
Usuário autenticado: enviar o cabeçalho `X-Usuario-Id` (id devolvido no login) nas rotas de biblioteca.

| Rota | Descrição | Resposta |
|---|---|---|
| POST /api/registro | Cadastro. Corpo: {nome, email, senha} | {id, nome, email}; 409 se o email já existe |
| POST /api/login | Login. Corpo: {email, senha} | {id, nome, email}; 401 se inválido |
| GET /api/jogos?genero=&q= | Catálogo (RF-04.1) e ficha (RF-04.2) | [{id, slug, titulo, genero, preco, desconto, classificacao, desenvolvedora, lancamento, destaque, sinopse, capa, banner}]. `desconto` é o percentual (ex.: 60) ou ausente |
| GET /api/jogos/{id} | Um jogo | mesmo formato; 404 se não existe |
| POST /api/biblioteca/jogos/{jogoId} | Adquirir jogo (RF-04.3). O servidor calcula e grava o valor pago (preço com desconto) | 201; 409 se já possui; 404 se o jogo não existe |
| GET /api/biblioteca | Jogos do usuário (RF-04.4) | [{jogoId, data, nota, texto, dataAvaliacao, valorPago}] |
| PUT /api/biblioteca/jogos/{jogoId}/avaliacao | Avaliar (RF-04.5). Corpo: {nota, texto} | 200; 400 se nota fora de 1 a 5 ou texto vazio; 403 se não possui o jogo |
| GET /api/jogos/{id}/avaliacoes | Avaliações de todos os usuários | [{usuario, nota, texto, data}] |
