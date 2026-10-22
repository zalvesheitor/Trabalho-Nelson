package com.example.loja_jogos.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.loja_jogos.model.Jogo;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;

@Service
public class JogoService {

    private List<Jogo> jogos = new ArrayList<>();

    @PostConstruct
    public void carregarDadosDoJson() {
        try {
            ObjectMapper mapper = new ObjectMapper();
            InputStream inputStream = getClass().getResourceAsStream("/games.json");

            if (inputStream != null) {
                jogos = mapper.readValue(inputStream, new TypeReference<List<Jogo>>() {});
                System.out.println("Catálogo carregado com sucesso! Total de jogos: " + jogos.size());
            } else {
                System.err.println("Ficheiro games.json não encontrado na pasta resources.");
            }
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    public List<Jogo> listarTodos() {
        return jogos;
    }
}