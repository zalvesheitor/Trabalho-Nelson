package com.example.loja_jogos.controller;

import com.example.loja_jogos.model.Aquisicao;
import com.example.loja_jogos.model.Usuario;
import com.example.loja_jogos.repository.BibliotecaJsonRepository;
import com.example.loja_jogos.repository.UsuarioJsonRepository;
import com.example.loja_jogos.service.JogoService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api")
public class BibliotecaController {

    public record AvaliacaoEntrada(Integer nota, String texto) {}
    public record ItemBiblioteca(int jogoId, String data, Integer nota, String texto) {}
    public record AvaliacaoSaida(String usuario, int nota, String texto, String data) {}

    private final BibliotecaJsonRepository repo;
    private final UsuarioJsonRepository usuarios;
    private final JogoService jogoService;

    public BibliotecaController(BibliotecaJsonRepository repo, UsuarioJsonRepository usuarios,
                                JogoService jogoService) {
        this.repo = repo;
        this.usuarios = usuarios;
        this.jogoService = jogoService;
    }

    // RF-04.3: a aquisição fica gravada para sempre (não existe rota de remoção).
    @PostMapping("/biblioteca/jogos/{jogoId}")
    @ResponseStatus(HttpStatus.CREATED)
    public synchronized void adquirir(@RequestHeader("X-Usuario-Id") Long usuarioId, @PathVariable int jogoId) {
        exigirUsuario(usuarioId);
        if (jogoService.listarTodos().stream().noneMatch(j -> j.getId() == jogoId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Jogo não encontrado");
        }
        List<Aquisicao> todas = repo.listar();
        if (buscar(todas, usuarioId, jogoId).isPresent()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Você já possui este jogo");
        }
        Aquisicao a = new Aquisicao();
        a.setUsuarioId(usuarioId);
        a.setJogoId(jogoId);
        a.setData(Instant.now().toString());
        todas.add(a);
        repo.salvarTodos(todas);
    }

    // RF-04.4: só os jogos do usuário informado.
    @GetMapping("/biblioteca")
    public List<ItemBiblioteca> listar(@RequestHeader("X-Usuario-Id") Long usuarioId) {
        exigirUsuario(usuarioId);
        return repo.listar().stream()
                .filter(a -> a.getUsuarioId().equals(usuarioId))
                .map(a -> new ItemBiblioteca(a.getJogoId(), a.getData(), a.getNota(), a.getTexto()))
                .toList();
    }

    // RF-04.5: nota de 1 a 5 + texto, só para jogos da biblioteca. Reenviar atualiza a avaliação.
    @PutMapping("/biblioteca/jogos/{jogoId}/avaliacao")
    public synchronized void avaliar(@RequestHeader("X-Usuario-Id") Long usuarioId, @PathVariable int jogoId,
                                     @RequestBody AvaliacaoEntrada body) {
        exigirUsuario(usuarioId);
        List<Aquisicao> todas = repo.listar();
        Aquisicao a = buscar(todas, usuarioId, jogoId).orElseThrow(() ->
                new ResponseStatusException(HttpStatus.FORBIDDEN, "O jogo não está na sua biblioteca"));
        if (body.nota() == null || body.nota() < 1 || body.nota() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A nota deve ser de 1 a 5");
        }
        if (body.texto() == null || body.texto().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Escreva sua avaliação");
        }
        a.setNota(body.nota());
        a.setTexto(body.texto().trim());
        a.setDataAvaliacao(Instant.now().toString());
        repo.salvarTodos(todas);
    }

    // Avaliações de todos os usuários para um jogo, da mais recente para a mais antiga.
    @GetMapping("/jogos/{jogoId}/avaliacoes")
    public List<AvaliacaoSaida> avaliacoes(@PathVariable int jogoId) {
        return repo.listar().stream()
                .filter(a -> a.getJogoId() == jogoId && a.getNota() != null)
                .map(a -> new AvaliacaoSaida(nomeDe(a.getUsuarioId()), a.getNota(), a.getTexto(),
                        a.getDataAvaliacao()))
                .sorted(Comparator.comparing(AvaliacaoSaida::data).reversed())
                .toList();
    }

    private Optional<Aquisicao> buscar(List<Aquisicao> lista, Long usuarioId, int jogoId) {
        return lista.stream()
                .filter(a -> a.getUsuarioId().equals(usuarioId) && a.getJogoId() == jogoId)
                .findFirst();
    }

    private void exigirUsuario(Long usuarioId) {
        if (usuarios.buscarPorId(usuarioId).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuário inválido");
        }
    }

    private String nomeDe(Long usuarioId) {
        return usuarios.buscarPorId(usuarioId).map(Usuario::getNome).orElse("Usuário");
    }
}