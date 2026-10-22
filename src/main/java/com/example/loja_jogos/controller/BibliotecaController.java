package com.example.loja_jogos.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.*;

@RestController
@RequestMapping("/api/biblioteca")
public class BibliotecaController {

    public record Avaliacao(Integer nota, String comentario) {}
    public record ItemBiblioteca(int jogoId, Integer nota, String comentario) {}

    // usuarioId -> (jogoId -> avaliação). Fica só em memória por enquanto.
    private final Map<String, Map<Integer, Avaliacao>> dados = new HashMap<>();

    @PostMapping("/jogos/{jogoId}")
    @ResponseStatus(HttpStatus.CREATED)
    public void adquirir(@RequestHeader("X-Usuario-Id") String usuarioId, @PathVariable int jogoId) {
        Map<Integer, Avaliacao> lib = dados.computeIfAbsent(usuarioId, k -> new HashMap<>());
        if (lib.containsKey(jogoId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Você já possui este jogo");
        }
        lib.put(jogoId, new Avaliacao(null, ""));
    }

    @GetMapping
    public List<ItemBiblioteca> listar(@RequestHeader("X-Usuario-Id") String usuarioId) {
        return dados.getOrDefault(usuarioId, Map.of()).entrySet().stream()
                .map(e -> new ItemBiblioteca(e.getKey(), e.getValue().nota(), e.getValue().comentario()))
                .toList();
    }

    @PutMapping("/jogos/{jogoId}/avaliacao")
    public void avaliar(@RequestHeader("X-Usuario-Id") String usuarioId,
                        @PathVariable int jogoId, @RequestBody Avaliacao body) {
        Map<Integer, Avaliacao> lib = dados.getOrDefault(usuarioId, Map.of());
        if (!lib.containsKey(jogoId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "O jogo não está na sua biblioteca");
        }
        if (body.nota() == null || body.nota() < 1 || body.nota() > 5) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "A nota deve ser de 1 a 5");
        }
        dados.get(usuarioId).put(jogoId, body);
    }
}