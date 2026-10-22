package com.example.loja_jogos.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@RestController
@RequestMapping("/api/jogos")
public class JogoController {

    public record JogoResumo(int id, String titulo, String genero, double preco, String capaUrl) {}
    public record JogoDetalhe(int id, String titulo, String genero, double preco,
                              String capaUrl, String sinopse, String classificacao) {}

    private final List<JogoDetalhe> jogos = List.of(
            new JogoDetalhe(1, "x", "x", 1, "/capas/1.png",
                    "x", "x"),
            new JogoDetalhe(2, "x", "x", 1, "/capas/2.png",
                    "x", "x"),
            new JogoDetalhe(3, "x", "x", 1, "/capas/3.png",
                    "x", "x")
    );

    @GetMapping
    public List<JogoResumo> listar(@RequestParam(required = false) String genero,
                                   @RequestParam(required = false) String q) {
        return jogos.stream()
                .filter(j -> genero == null || j.genero().equalsIgnoreCase(genero))
                .filter(j -> q == null || j.titulo().toLowerCase().contains(q.toLowerCase()))
                .map(j -> new JogoResumo(j.id(), j.titulo(), j.genero(), j.preco(), j.capaUrl()))
                .toList();
    }

    @GetMapping("/{id}")
    public JogoDetalhe buscar(@PathVariable int id) {
        return jogos.stream().filter(j -> j.id() == id).findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Jogo não encontrado"));
    }
}