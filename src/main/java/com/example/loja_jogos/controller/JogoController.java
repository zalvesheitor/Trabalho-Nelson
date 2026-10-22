package com.example.loja_jogos.controller;

import com.example.loja_jogos.model.Jogo;
import com.example.loja_jogos.service.JogoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/jogos")
public class JogoController {

    @Autowired
    private JogoService jogoService;

    @GetMapping
    public List<Jogo> listar(@RequestParam(required = false) String genero, @RequestParam(required = false) String q) {
        List<Jogo> jogos = jogoService.listarTodos();

        return jogos.stream()
                .filter(j -> genero == null || j.getGenero().equalsIgnoreCase(genero))
                .filter(j -> q == null || j.getTitulo().toLowerCase().contains(q.toLowerCase()))
                .collect(Collectors.toList());
    }

    @GetMapping("/{id}")
    public Jogo buscar(@PathVariable int id) {
        return jogoService.listarTodos().stream()
                .filter(j -> j.getId() == id)
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Jogo não encontrado"));
    }
}